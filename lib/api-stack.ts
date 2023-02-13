import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as apiGw from 'aws-cdk-lib/aws-apigateway';
import * as route53 from 'aws-cdk-lib/aws-route53';
import * as targets from 'aws-cdk-lib/aws-route53-targets';
import * as cert from 'aws-cdk-lib/aws-certificatemanager';
import { Effect, Policy, PolicyStatement, Role, ServicePrincipal } from 'aws-cdk-lib/aws-iam';
import { StackProps } from './commons';

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
      },
      domainName: {
        domainName: `api-${props.app}.${process.env.DOMAIN}`,
        certificate: cert.Certificate.fromCertificateArn(this, 'ApiCert', process.env.CERT_ARN || '')
      }
    })

    const zone = route53.HostedZone.fromLookup(this, 'Zone', {
      domainName: process.env.DOMAIN || '',
    })

    new route53.ARecord(this, 'ARecord', {
      recordName: `api-${props.app}`,
      target: route53.RecordTarget.fromAlias(new targets.ApiGateway(api)),
      zone,
    })

    const errorResponses = [
      {
        selectionPattern: '400',
        statusCode: '400',
        responseTemplates: {
          'application/json': `{
            "error": "Bad input!"
          }`,
        },
      },
      {
        selectionPattern: '5\\d{2}',
        statusCode: '500',
        responseTemplates: {
          'application/json': `{
            "error": "Internal Service Error!"
          }`,
        },
      },
    ];

    const integrationResponses = [
      {
        statusCode: '200',
      },
      ...errorResponses,
    ];

    const sales = api.root.addResource('sales');

    const salesById = sales.addResource('{id}');

    const getAllIntegration = new apiGw.AwsIntegration({
      action: 'Scan',
      options: {
        credentialsRole: getRole,
        integrationResponses,
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
        integrationResponses,
        requestTemplates: {
          'application/json': `{
              "Key": {
                "product_id": {
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

    sales.addMethod('GET', getAllIntegration, methodOptions);
    salesById.addMethod('GET', getIntegration, methodOptions);
  }
}
