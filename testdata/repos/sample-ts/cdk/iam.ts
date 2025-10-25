import * as cdk from 'aws-cdk-lib';
import * as iam from 'aws-cdk-lib/aws-iam';

export type CreateIAMPolicyParams = {
  actions: string[];
  effect?: iam.Effect;
  policyName: string;
  resourceNames: string[];
  stack: cdk.Stack;
};

export function createDynamoDbTableIAMPolicy(params: CreateIAMPolicyParams) {
  return createServiceIAMPolicy({
    ...params,
    service: 'dynamodb',
    resourceType: 'table/',
  });
}

// sns use only topic name
export function createSnsIAMPolicy(params: CreateIAMPolicyParams) {
  return createServiceIAMPolicy({
    ...params,
    service: 'sns',
    resourceType: '',
  });
}

function createServiceIAMPolicy(
  params: CreateIAMPolicyParams & { resourceType: string; service: string },
) {
  const { stack, policyName, actions, resourceNames, resourceType } = params;
  const region = stack.region;
  const accountId = stack.account;

  const statement = new iam.PolicyStatement({
    actions,
    resources: resourceNames.map(
      (name: string) =>
        `arn:aws:${params.service}:${region}:${accountId}:${resourceType}${name}`,
    ),
    effect: params.effect || iam.Effect.ALLOW,
  });

  return new iam.Policy(stack, policyName, { statements: [statement] });
}
