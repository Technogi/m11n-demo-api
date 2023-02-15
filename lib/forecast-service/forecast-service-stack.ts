import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';

import * as s3 from 'aws-cdk-lib/aws-s3';
import * as forecast from 'aws-cdk-lib/aws-forecast';
import * as nodejs from 'aws-cdk-lib/aws-lambda-nodejs';
import { resolve } from 'path';
import { StackProps } from '../commons';
import { Effect, PolicyStatement } from 'aws-cdk-lib/aws-iam';

export class ForecastServiceStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: StackProps) {
    super(scope, id, props);

    const forecastBucket = new s3.Bucket(this, 'Bucket', {
      bucketName: `${props.app}-forecasts`
    })

    new cdk.CfnOutput(this, 'BucketName', {
      value: forecastBucket.bucketName
    })

    const forecastLambda = new nodejs.NodejsFunction(this, 'ForecastLambda', {
      functionName: `${props.app}-sales-forecast`,
      entry: resolve(__dirname, 'lambdas/sales-forecast.ts'),
      environment: {
        DAILY_FORECAST_ARN: `arn:aws:forecast:${this.region}:${this.account}:forecast/${process.env.DAILY_SALES_FORECAST_NAME}`,
        MONTHLY_FORECAST_ARN: `arn:aws:forecast:${this.region}:${this.account}:forecast/${process.env.MONTHLY_SALES_FORECAST_NAME}`
      }
    })

    forecastLambda.addToRolePolicy(new PolicyStatement({
      effect: Effect.ALLOW,
      resources: [
        `arn:aws:forecast:${this.region}:${this.account}:forecast/${process.env.DAILY_SALES_FORECAST_NAME}`,
        `arn:aws:forecast:${this.region}:${this.account}:forecast/${process.env.MONTHLY_SALES_FORECAST_NAME}`
      ],
      actions: ['forecast:QueryForecast']
    }))

  }
}
