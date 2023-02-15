import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as cognito from 'aws-cdk-lib/aws-cognito';
import * as codebuild from 'aws-cdk-lib/aws-codebuild'
import * as amplify from '@aws-cdk/aws-amplify-alpha'

import { StackProps } from '../commons';
import { ManagedPolicy, Role, ServicePrincipal } from 'aws-cdk-lib/aws-iam';
import { buildSpec } from './build-spec';
// import * as sqs from 'aws-cdk-lib/aws-sqs';

export class webAppStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: StackProps) {
    super(scope, id, props);

    const role = new Role(this, 'AmplifyRoleWebApp', {
      assumedBy: new ServicePrincipal('amplify.amazonaws.com'),
      description: 'Custom role permitting resources creation from Amplify',
      managedPolicies: [ManagedPolicy.fromAwsManagedPolicyName('AdministratorAccess-Amplify')],
    });

    const app = new amplify.App(this, 'NextJsApp', {
      appName: `${props.app}-webapp`,
      description: `Technogi's M11n Demo WebApp`,
      role,
      buildSpec: codebuild.BuildSpec.fromObject(buildSpec),
      sourceCodeProvider: new amplify.GitHubSourceCodeProvider({
        owner: '',
        repository: '',
        oauthToken: cdk.SecretValue.secretsManager("", {
          jsonField: ""
        })
      }),
      environmentVariables: {
        NEXT_PUBLIC_API_URL: 'https://api-m11n-demo.io.technogi.com.mx/sales/',
        NEXT_PUBLIC_AWS_COGNITO_REGION: this.region,
        NEXT_PUBLIC_AWS_COGNITO_POOL_ID: 'us-east-1_6hFveu8qJ',
        NEXT_PUBLIC_AWS_COGNITO_WEB_CLIENT_ID: '4734a5q071v1dkulnnaj1nvntt',
      }
    })

    app.addBranch('main')
  }
}
