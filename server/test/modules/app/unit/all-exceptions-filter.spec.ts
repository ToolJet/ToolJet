import { ArgumentsHost } from '@nestjs/common';
import { Logger } from 'nestjs-pino';
import { QueryFailedError } from 'typeorm';
import { AllExceptionsFilter } from '@modules/app/filters/all-exceptions-filter';

const databaseError = (code: string, message: string) =>
  Object.assign(new QueryFailedError('UPDATE ...', [], new Error(message)), { code });

function respond(exception: unknown) {
  const response = { status: jest.fn(), json: jest.fn() };
  response.status.mockReturnValue(response);
  const host = {
    switchToHttp: () => ({
      getResponse: () => response,
      getRequest: () => ({ method: 'PUT', url: '/x', headers: {} }),
    }),
  } as unknown as ArgumentsHost;
  new AllExceptionsFilter({ error: jest.fn() } as unknown as Logger).catch(exception, host);
  return response.json.mock.calls[0][0];
}

describe('AllExceptionsFilter | database errors', () => {
  // Two writers that lock the same rows in a different order (e.g. a git pull and an edit): Postgres aborts one.
  it('should answer a deadlock with a retryable 409', () => {
    expect(respond(databaseError('40P01', 'deadlock detected'))).toMatchObject({
      statusCode: 409,
      message: 'This was changed by someone else at the same time. Try again.',
    });
  });

  it('should keep other database errors as 422', () => {
    expect(respond(databaseError('23505', 'duplicate key'))).toMatchObject({
      statusCode: 422,
      message: 'Already exists!',
    });
  });
});
