import { BadRequestException } from '@nestjs/common';
import { AllExceptionsFilter } from '@modules/app/filters/all-exceptions-filter';
import { AppValidationException } from '@modules/app-validation/exception';
import { Issue } from '@modules/app-validation/types';

function hostFor(response: { status: jest.Mock; json: jest.Mock }) {
  return {
    switchToHttp: () => ({
      getResponse: () => response,
      getRequest: () => ({ method: 'PUT', url: '/api/v2/apps/1/versions/2/components', headers: {} }),
    }),
  } as any;
}

describe('AllExceptionsFilter with app validation errors', () => {
  const logger = { error: jest.fn() } as any;
  const filter = new AllExceptionsFilter(logger);
  let response: { status: jest.Mock; json: jest.Mock };

  beforeEach(() => {
    response = { status: jest.fn(), json: jest.fn() };
    response.status.mockReturnValue(response);
  });

  it('passes the problem list and warnings through to the client', () => {
    const problem: Issue = {
      code: 'COMPONENT_UNKNOWN_TYPE',
      severity: 'critical',
      confidence: 'certain',
      path: 'button1.type',
      message: 'button1 → type: "Buttonn" is not a registered widget',
    };
    const warning: Issue = { ...problem, code: 'COMPONENT_UNKNOWN_SETTING', severity: 'medium' };

    filter.catch(new AppValidationException([problem], [warning], 'components'), hostFor(response));

    expect(response.status).toHaveBeenCalledWith(400);
    expect(response.json).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: 400,
        code: 'APP_VALIDATION_FAILED',
        message: '1 validation problem in components: button1 → type: "Buttonn" is not a registered widget',
        issues: [problem],
        warnings: [warning],
      })
    );
  });

  it('leaves other errors unchanged', () => {
    filter.catch(new BadRequestException('Page not found'), hostFor(response));
    const body = response.json.mock.calls[0][0];
    expect(body).toMatchObject({ statusCode: 400, message: 'Page not found' });
    expect(body).not.toHaveProperty('issues');
    expect(body).not.toHaveProperty('warnings');
  });
});
