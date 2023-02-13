import * as cdk from 'aws-cdk-lib';

export interface StackProps extends cdk.StackProps {
  app: string
}