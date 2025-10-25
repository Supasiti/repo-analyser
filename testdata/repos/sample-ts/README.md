# prac-express-aws

This a simple CRUD application as my practice to deploy serverless application to AWS using CDK.

## Set up 

Assumptions
- You have NodeJS environment set up. Version 18.16.0 is used here
- You have AWS SSO set up. To see how to set up see [here](https://docs.aws.amazon.com/singlesignon/latest/userguide/getting-started.html)
- You have set up AWS cli tools. See [here](https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html)

To install all dependencies:
```bash
npm i 
```

To Set up DynamoDB locally, you need to install Docker locally.
- To install Docker with Docker Desktop, run 
```bash
brew install docker 
brew install docker-compose
```
- To set up Docker with Colima, see [here](https://github.com/abiosoft/colima)
- To start DynamoDB locally, run
```
docker-compose up -d
```

To create table and seed users, run
```bash
aws dynamodb create-table --cli-input-json file://dynamodb/create_user_table_local.json --endpoint-url  http://localhost:8000

aws dynamodb batch-write-item --request-items file://dynamodb/users_data.json  --endpoint-url http://localhost:8000
```

To delete table
```bash
aws dynamodb delete-table --table-name Users --endpoint-url http://localhost:8000
```

## Deployment

This project uses AWS_PROFILE to handle deployment of Application. Assume that SSO has already been set up, run

```bash
export AWS_PROFILE=<Your Profile Name>
aws sso login
```

To see if it works
```bash
aws sts get-caller-identity
```
You should get something like:
```
{
    "UserId": "String....",
    "Account": <12 digit number>,
    "Arn": "arn:aws:sts::<account id>:assumed-role/..."
}
```

There are two stacks, Resource and Function stacks. Most of the times, you would not need to redeploy the resource stack. All stacks have similar patterns:
```
[Project]-[Service]-[Env]-api
[Project]-[Service]-[Env]-resources
```

To deploy all stacks
```
cdk deploy 
```

To deploy specific stack
```
cdk deploy pas-user-thara-api
```

To delete all the stacks
```
cdk destroy --all
```
or specific stack
```
cdk destroy pas-user-thara-api
```

## Sign up user process

Sign up a user 
```
aws cognito-idp sign-up \
  --client-id <client id> \
  --username "test@test.com" \
  --password "Password123" 
```

admin verify 
```
aws cognito-idp admin-confirm-sign-up \
  --user-pool-id <user pool id> \
  --username "test@test.com"
```

user login
```
aws cognito-idp initiate-auth \
  --auth-flow USER_PASSWORD_AUTH \
  --client-id <client id> \
  --auth-parameters USERNAME=test@test.com,PASSWORD=<password>
```

It should return something like:
```
{
    "ChallengeParameters": {},
    "AuthenticationResult": {
        "AccessToken": ..., 
        "ExpiresIn": 3600,
        "TokenType": "Bearer",
        "RefreshToken": ...,
        "IdToken": ..., 
    }
}
```

Use `IdToken` as a bearer token in header.
