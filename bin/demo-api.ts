#!/usr/bin/env node
import 'source-map-support/register';
import { config } from 'dotenv'
import * as cdk from 'aws-cdk-lib';
import { SalesServiceStack } from '../lib/sales-service-stack';
import { ApiStack } from '../lib/api-stack';
config()

const props = {
  app: 'm11n-demo',
  tags: { Application: 'm11n-demo', Company: 'Technogi', Consultant: 'Bryan Technogi' },
  env: {
    region: process.env.AWS_REGION,
    account: process.env.AWS_ACCOUNT
  }
}

const app = new cdk.App();
new SalesServiceStack(app, 'SalesServiceStack', { ...props, });

new ApiStack(app, 'ApiServiceStack', { ...props })