import * as nodeLambda from 'aws-cdk-lib/aws-lambda-nodejs';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import { Construct } from 'constructs';

type CreateLambdaProps = nodeLambda.NodejsFunctionProps & {
  id: string;
  fnName: string;
};

export function createLambda(scope: Construct, props: CreateLambdaProps) {
  const { id, fnName, ...fnProps } = props;

  const fn = new nodeLambda.NodejsFunction(scope, fnName, {
    ...fnProps,
    runtime: lambda.Runtime.NODEJS_18_X,
    entry: `./src/handlers/${fnName}.ts`,
    handler: 'handler',
    functionName: `${id}-${fnName}`,
    bundling: {
      target: 'es2020',
      format: nodeLambda.OutputFormat.ESM,
      sourceMap: true,
      // This banner is required to load the node specific libs like "os" dynamically
      // From: https://github.com/evanw/esbuild/issues/1921#issuecomment-1152887672
      banner:
        "import { createRequire } from 'module';const require = createRequire(import.meta.url);",
      ...fnProps.bundling,
    },
  });

  return fn;
}
