import { log } from '../common/logger';

export const handler = (event: AWSLambda.SNSEvent) => {
  try {
    for (const record of event.Records) {
      const data = JSON.parse(record.Sns.Message);
      log.info({ subject: record.Sns.Subject, data }, 'Event record');
    }
  } catch (err) {
    log.error(err);
  }
};
