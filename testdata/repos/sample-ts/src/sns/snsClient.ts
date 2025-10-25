import { SNSClient, SNSClientConfig } from '@aws-sdk/client-sns';

let _snsClient: SNSClient;

// The AWS Region can be provided here using the `region` property. If you leave it blank
// the SDK will default to the region set in your AWS config.

export function getSnsClient(
  options?: SNSClientConfig,
  useCache = true,
): SNSClient {
  if (useCache && _snsClient) {
    return _snsClient;
  }
  _snsClient = new SNSClient(options || {});
  return _snsClient;
}
