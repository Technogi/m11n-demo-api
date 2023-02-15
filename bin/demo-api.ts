#!/usr/bin/env node
import 'source-map-support/register';
import { config } from 'dotenv'
import * as cdk from 'aws-cdk-lib';
import { SalesServiceStack } from '../lib/sales-service/sales-service-stack';
import { ApiStack } from '../lib/api/api-stack';
import { ForecastServiceStack } from '../lib/forecast-service/forecast-service-stack';
import { AuthStack } from '../lib/auth/auth-stack';
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

const salesService = new SalesServiceStack(app, 'SalesServiceStack', { ...props, });

const forecastService = new ForecastServiceStack(app, 'ForecastServiceStack', { ...props })

const auth = new AuthStack(app, 'AuthStack', { ...props })
const api = new ApiStack(app, 'ApiServiceStack', { ...props })

api.node.addDependency(salesService)
api.node.addDependency(forecastService)

