import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as apiGw from 'aws-cdk-lib/aws-apigateway';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as route53 from 'aws-cdk-lib/aws-route53';
import * as targets from 'aws-cdk-lib/aws-route53-targets';
import * as cert from 'aws-cdk-lib/aws-certificatemanager';
import { Effect, Policy, PolicyStatement, Role, ServicePrincipal } from 'aws-cdk-lib/aws-iam';
import { StackProps } from '../commons';
import { readFileSync } from 'fs';
import { join } from 'path';

export class ApiStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: StackProps) {
    super(scope, id, props);

    const getPolicy = new Policy(this, 'GetPolicy', {
      policyName: `${props.app}-get-policy`,
      statements: [new PolicyStatement({
        actions: ['dynamodb:GetItem', 'dynamodb:Scan'],
        effect: Effect.ALLOW,
        resources: [`arn:aws:dynamodb:${this.region}:${this.account}:table/${props.app}-sales`]
      })]
    })

    const getRole = new Role(this, 'GetRole', {
      roleName: `${props.app}-api-roles`,
      assumedBy: new ServicePrincipal('apigateway.amazonaws.com'),
    });
    getRole.attachInlinePolicy(getPolicy);


    const api = new apiGw.RestApi(this, 'RestApi', {
      restApiName: `${props.app}-api`,
      defaultCorsPreflightOptions: {
        allowOrigins: apiGw.Cors.ALL_ORIGINS,
        allowMethods: apiGw.Cors.ALL_METHODS,
        allowHeaders: apiGw.Cors.DEFAULT_HEADERS,
      },
      domainName: {
        domainName: `api-${props.app}.${process.env.DOMAIN}`,
        certificate: cert.Certificate.fromCertificateArn(this, 'ApiCert', process.env.CERT_ARN || '')
      }
    })

    new cdk.CfnOutput(this, 'ApiUrl', {
      value: `api-${props.app}.${process.env.DOMAIN}`
    })

    const zone = route53.HostedZone.fromLookup(this, 'Zone', {
      domainName: process.env.DOMAIN || '',
    })

    new route53.ARecord(this, 'ARecord', {
      recordName: `api-${props.app}`,
      target: route53.RecordTarget.fromAlias(new targets.ApiGateway(api)),
      zone,
    })

    const errorResponses: cdk.aws_apigateway.IntegrationResponse[] = [
      {
        selectionPattern: '400',
        statusCode: '400',
        responseTemplates: { 'application/json': `{ "error": "Bad input!" }` },
      },
      {
        selectionPattern: '5\\d{2}',
        statusCode: '500',
        responseTemplates: { 'application/json': `{"error": "Internal Service Error!"}` },
      },
    ];

    const getByIdIntegrationResponses = [{
      statusCode: '200',
      responseTemplates: {
        "application/json": readFileSync(join(__dirname, 'get-by-id-response-template.vtl'), { encoding: 'utf8', flag: 'r' })
      }
    },
    ...errorResponses]

    const getAllIntegrationResponses: cdk.aws_apigateway.IntegrationResponse[] = [
      {
        statusCode: '200',
        responseTemplates: {
          "application/json": readFileSync(join(__dirname, 'get-all-response-template.vtl'), { encoding: 'utf8', flag: 'r' })
        }
      },
      ...errorResponses,
    ];

    const salesResource = api.root.addResource('sales');

    const salesByIdResource = salesResource.addResource('{id}');

    const getAllIntegration = new apiGw.AwsIntegration({
      action: 'Scan',
      options: {
        credentialsRole: getRole,
        integrationResponses: getAllIntegrationResponses,
        requestTemplates: {
          'application/json': `{
              "TableName": "${props.app}-sales"
            }`,
        },
      },
      service: 'dynamodb',
    });

    const getIntegration = new apiGw.AwsIntegration({
      action: 'GetItem',
      options: {
        credentialsRole: getRole,
        integrationResponses: getByIdIntegrationResponses,
        requestTemplates: {
          'application/json': `{
              "Key": {
                "product-id": {
                  "N": "$method.request.path.id"
                }
              },
              "TableName": "${props.app}-sales"
            }`,
        },
      },
      service: 'dynamodb',
    });

    const methodOptions = { methodResponses: [{ statusCode: '200' }, { statusCode: '400' }, { statusCode: '500' }] };

    salesResource.addMethod('GET', getAllIntegration, methodOptions);
    salesByIdResource.addMethod('GET', getIntegration, methodOptions);

    const salesForecastResource = salesByIdResource.addResource('forecast')
    const forecastLambda = lambda.Function.fromFunctionName(this, 'ForecastLambdaRef', `${props.app}-sales-forecast`)
    salesForecastResource.addMethod('GET', new apiGw.LambdaIntegration(forecastLambda, { proxy: true }), {
      operationName: 'get-sales-forecast',
    })
  }
}
