import { Construct } from 'constructs';
import * as cdk from 'aws-cdk-lib';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as cognito from 'aws-cdk-lib/aws-cognito';

type ResourceStackProps = cdk.StackProps & {
  tableName: string;
  userPoolName: string;
};

export class ResourceStack extends cdk.Stack {
  readonly userTable: dynamodb.Table;
  readonly userPool: cognito.UserPool;

  constructor(scope: Construct, id: string, props: ResourceStackProps) {
    super(scope, id, props);

    this.userTable = this.addUserTable(id, props);
    this.userPool = this.addUserPool(id, props);

    // export the userpool id
    new cdk.CfnOutput(this, `${props.userPoolName}-id`, {
      value: this.userPool.userPoolId,
      description: 'user pool ID',
      exportName: props.userPoolName,
    });
  }

  addUserTable(id: string, props: ResourceStackProps) {
    const { tableName } = props;

    const table = new dynamodb.Table(this, `${id}-user`, {
      tableName,
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      partitionKey: {
        name: '$pk',
        type: dynamodb.AttributeType.STRING,
      },
      sortKey: {
        name: '$sk',
        type: dynamodb.AttributeType.STRING,
      },
    });

    return table;
  }

  addUserPool(id: string, props: ResourceStackProps) {
    const { userPoolName } = props;

    const userPool = new cognito.UserPool(this, userPoolName, {
      userPoolName: userPoolName,
      selfSignUpEnabled: true, //     allow user to sign up as well as admin sign up
      signInAliases: { email: true },
      autoVerify: { email: true }, // use email for sign in
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // add app client
    // - restrict each client in a user pool to perform certain actions
    const clientId = `${userPoolName}-sign-in-client`;
    userPool.addClient(clientId, {
      userPoolClientName: clientId,
      authFlows: {
        userPassword: true, // allow user to login with username + password
        custom: true,
        userSrp: true,
      },
    });

    return userPool;
  }
}
