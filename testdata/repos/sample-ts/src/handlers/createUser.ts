import { log } from '../common/logger';
import { ValidationError } from '../common/error';
import { error, success } from '../common/jsonResponse';
import * as userDaoMod from '../dao/userDao';
import * as snsPublisher from '../sns/publisher';
import { CreateUserParams } from 'src/models/types';

type HandlerDeps = {
  userDao: typeof userDaoMod;
  sns: typeof snsPublisher;
};

export async function handler(
  event: AWSLambda.APIGatewayEvent,
  _ctx: Partial<AWSLambda.Context>,
  _deps?: HandlerDeps,
) {
  log.info(event, 'createUser event');

  // istanbul ignore next
  const { userDao = userDaoMod, sns = snsPublisher } = _deps || {};

  try {
    // istanbul ignore next
    const { body: reqBody } = event || {};

    const createUserParams = validateRequest(reqBody);

    const user = await userDao.createUser(createUserParams);

    log.info(user, 'createUser response data');

    await sns.publish({ subject: 'New user', message: user });

    return success({ data: user });
  } catch (err: any) {
    log.error(err);
    return error(err as Error);
  }
}

function validateRequest(reqBody?: string | null): CreateUserParams {
  if (!reqBody) {
    throw ValidationError('missing user details');
  }

  const parsed = JSON.parse(reqBody);

  if (!parsed.name) {
    throw ValidationError('missing name');
  }

  if (!parsed.email) {
    throw ValidationError('missing email');
  }

  if (!parsed.balance) {
    throw ValidationError('missing balance');
  }

  return parsed;
}
