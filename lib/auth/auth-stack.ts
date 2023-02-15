import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as cognito from 'aws-cdk-lib/aws-cognito';
import { StackProps } from '../commons';
// import * as sqs from 'aws-cdk-lib/aws-sqs';

export class AuthStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: StackProps) {
    super(scope, id, props);

    const userPool = new cognito.UserPool(this, 'UserPool', {
      userPoolName: props.app,
      selfSignUpEnabled: true,
      autoVerify: {
        email: true,
      },
      passwordPolicy: {
        minLength: 6,
        requireDigits: false,
        requireLowercase: false,
        requireSymbols: false,
        requireUppercase: false,
      }
    })

    const client = userPool.addClient('UserPoolClient', {
      userPoolClientName: `${props.app}-web-client`
    })

    new cdk.CfnOutput(this, 'UserPoolId', {
      value: userPool.userPoolId
    })

    new cdk.CfnOutput(this, 'UserPoolClientId', {
      value: client.userPoolClientId
    })
  }
}
