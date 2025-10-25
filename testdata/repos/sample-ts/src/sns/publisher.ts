import { PublishCommand, PublishCommandInput } from '@aws-sdk/client-sns';
import { getSnsClient } from './snsClient';
import { log } from '../common/logger';

const SNS_TOPIC = process.env.SNS_TOPIC;

export type PublishParams = {
  subject: string;
  message: Record<string, unknown>;
};

export async function publish(params: PublishParams) {
  const cmdParams: PublishCommandInput = {
    TopicArn: SNS_TOPIC,
    Subject: params.subject,
    Message: JSON.stringify(params.message),
  };

  const resp = await getSnsClient().send(new PublishCommand(cmdParams));
  log.info(params, 'Successfully publish message');

  return resp;
}
