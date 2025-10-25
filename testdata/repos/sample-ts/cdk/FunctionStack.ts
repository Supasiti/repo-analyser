import { Construct } from 'constructs';
import * as cdk from 'aws-cdk-lib';
import * as apigw from 'aws-cdk-lib/aws-apigateway';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as eventSources from 'aws-cdk-lib/aws-lambda-event-sources';
import * as cognito from 'aws-cdk-lib/aws-cognito';

import dotenv from 'dotenv';
import path from 'path';

import { createDynamoDbTableIAMPolicy, createSnsIAMPolicy } from './iam.js';
import { createLambda } from './Lambda.js';

dotenv.config({ path: path.join(process.cwd(), 'config/dev.env') });

const REGION = process.env.AWS_REGION || '';

type FunctionStackProps = cdk.StackProps & {
  userTableName: string;
  userPoolName: string;
};

export class FunctionStack extends cdk.Stack {
  private readonly api: apigw.RestApi;
  private readonly userPath: apigw.Resource;
  private readonly userTablePolicy: iam.Policy;
  private readonly userTopic: sns.ITopic;
  private readonly userTopicPolicy: iam.Policy;
  private readonly apiAuthorizer: apigw.CfnAuthorizer;

  constructor(scope: Construct, id: string, props: FunctionStackProps) {
    super(scope, id, props);

    this.api = new apigw.RestApi(this, id, {
      ...props,
      restApiName: 'User Service',
    });
    this.userPath = this.api.root.addResource('users');

    this.userTablePolicy = createDynamoDbTableIAMPolicy({
      actions: ['dynamodb:GetItem', 'dynamodb:PutItem'],
      policyName: `${id}-dynamodb-policy`,
      resourceNames: [props.userTableName],
      stack: this,
    });

    // create user sns topic
    this.userTopic = this.addUserTopic(id);
    this.userTopicPolicy = createSnsIAMPolicy({
      actions: ['sns:Publish'],
      policyName: `${id}-topic-policy`,
      resourceNames: [this.userTopic.topicName],
      stack: this,
    });

    // create user pool for authorizer
    // import userPoolId from the value that is exported by ResourceStack
    const userPoolId = cdk.Fn.importValue(props.userPoolName);
    const userPool = cognito.UserPool.fromUserPoolId(
      this,
      props.userPoolName,
      userPoolId,
    );
    this.apiAuthorizer = this.addAuthorizer(id, userPool);

    // lambdas
    this.addGetUserApi(id, props);
    this.addCreateUserApi(id, props);
    this.addMessageLogger(id);
  }

  addUserTopic(id: string) {
    const snsTopic = `${id}-user-topic`;

    return new sns.Topic(this, snsTopic, { topicName: snsTopic });
  }

  addAuthorizer(id: string, userPool: cognito.IUserPool) {
    const authId = `${id}-authorizer`;

    return new apigw.CfnAuthorizer(this, authId, {
      restApiId: this.api.restApiId,
      name: authId,
      type: 'COGNITO_USER_POOLS',
      identitySource: 'method.request.header.Authorization',
      providerArns: [userPool.userPoolArn],
    });
  }

  addGetUserApi(id: string, props: FunctionStackProps) {
    const { userTableName } = props;
    const fnName = 'getUser';

    const fn = createLambda(this, {
      id,
      fnName,
      description: 'get user details by id',
      environment: {
        USER_TABLE_NAME: userTableName,
        REGION: REGION,
      },
    });

    fn.role?.attachInlinePolicy(this.userTablePolicy);

    const apiIntegration = new apigw.LambdaIntegration(fn, {
      requestTemplates: { 'application/json': '{ "statusCode": "200" }' },
    });

    // get user by id
    this.userPath.addResource('{userID}').addMethod('GET', apiIntegration, {
      requestParameters: {
        'method.request.path.userID': true,
      },
      authorizationType: apigw.AuthorizationType.COGNITO,
      authorizer: {
        authorizerId: this.apiAuthorizer.ref,
      },
    });
  }

  addCreateUserApi(id: string, props: FunctionStackProps) {
    const { userTableName } = props;
    const fnName = 'createUser';

    const fn = createLambda(this, {
      id,
      fnName,
      description: 'create new user',
      environment: {
        USER_TABLE_NAME: userTableName,
        REGION: REGION,
        SNS_TOPIC: this.userTopic.topicArn,
      },
    });

    fn.role?.attachInlinePolicy(this.userTablePolicy);
    fn.role?.attachInlinePolicy(this.userTopicPolicy);

    const apiIntegration = new apigw.LambdaIntegration(fn, {
      requestTemplates: { 'application/json': '{ "statusCode": "200" }' },
    });

    // attach post method
    // We prefer to validate request body ourselves
    this.userPath.addMethod('POST', apiIntegration);
  }

  addMessageLogger(id: string) {
    const fnName = 'messageLogger';

    const fn = createLambda(this, {
      id,
      fnName,
      description: 'log sns message',
    });

    fn.addEventSource(new eventSources.SnsEventSource(this.userTopic));
  }
}
