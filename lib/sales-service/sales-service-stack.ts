import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as events from 'aws-cdk-lib/aws-events';
import * as targets from 'aws-cdk-lib/aws-events-targets';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as nodejs from 'aws-cdk-lib/aws-lambda-nodejs';
import { Provider } from 'aws-cdk-lib/custom-resources';
import { resolve } from 'path';
import { StackProps } from '../commons';

export class SalesServiceStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: StackProps) {
    super(scope, id, props);

    const salesTable = new dynamodb.Table(this, 'SalesTable', {
      tableName: `${props.app}-sales`,
      partitionKey: {
        name: 'product-id',
        type: dynamodb.AttributeType.NUMBER
      },
      removalPolicy: cdk.RemovalPolicy.DESTROY
    })

    const salesTableInitializerLambda = new nodejs.NodejsFunction(this, 'SalesDbInitializerLambda', {
      functionName: `${props.app}-sales-init`,
      entry: resolve(__dirname, 'lambdas/init-db-lambda.ts'),
      environment: {
        TABLE_NAME: salesTable.tableName
      }
    })
    salesTable.grantWriteData(salesTableInitializerLambda)

    new cdk.CustomResource(this, 'SalesInitResource', {
      serviceToken: new Provider(this, 'SalesInitProvider', { onEventHandler: salesTableInitializerLambda }).serviceToken,
      properties: {
        //customResourceNumber: props.customResourceNumber,
      },
    });

    const salesProjectionLambda = new nodejs.NodejsFunction(this, 'SalesProjectionLambda', {
      functionName: `${props.app}-sales-projection`,
      entry: resolve(__dirname, 'lambdas/sales-projection-lambda.ts'),
      environment: {
        TABLE_NAME: salesTable.tableName
      }
    })
    salesTable.grantReadWriteData(salesProjectionLambda)

    new cdk.CfnOutput(this, 'ProjectionLogGroup', {
      value: salesProjectionLambda.logGroup.logGroupName
    })

    const integrationEventBus = events.EventBus.fromEventBusArn(
      this, 'EventBus', `arn:aws:events:${this.region}:${this.account}:event-bus/m11n-hermes`)

    new events.Rule(this, 'SalesProjectionRule', {
      eventBus: integrationEventBus,
      ruleName: 'SalesProjections',
      targets: [new targets.LambdaFunction(salesProjectionLambda)],
      eventPattern: {
        detailType: ['NewSale'],
        source: ['pos:m11n', 'pos:*'],
      }
    })

  }
}
