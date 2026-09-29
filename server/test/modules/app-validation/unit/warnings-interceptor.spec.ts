import { lastValueFrom, of } from 'rxjs';
import { ValidationWarningsInterceptor } from '@modules/app-validation/warnings.interceptor';
import { VALIDATION_WARNINGS_LOCALS_KEY } from '@modules/app-validation/constants';

const warning = {
  code: 'COMPONENT_UNKNOWN_SETTING',
  severity: 'medium',
  confidence: 'certain',
  path: 'x',
  message: 'x',
};

function run(body: unknown, warnings?: unknown[]) {
  const res = {
    locals: warnings ? { [VALIDATION_WARNINGS_LOCALS_KEY]: warnings } : {},
    headersSent: false,
    setHeader: jest.fn(),
  };
  const context: any = { getType: () => 'http', switchToHttp: () => ({ getResponse: () => res }) };
  const result = lastValueFrom(new ValidationWarningsInterceptor().intercept(context, { handle: () => of(body) }));
  return { res, result };
}

describe('ValidationWarningsInterceptor', () => {
  it('leaves the response untouched when there are no warnings', async () => {
    const body = { id: 1 };
    const { res, result } = run(body);
    await expect(result).resolves.toBe(body);
    expect(res.setHeader).not.toHaveBeenCalled();
  });

  it('adds warnings to an object body and sets the count header', async () => {
    const { res, result } = run({ id: 1 }, [warning]);
    await expect(result).resolves.toEqual({ id: 1, validationWarnings: [warning] });
    expect(res.setHeader).toHaveBeenCalledWith('x-tooljet-validation-warnings', '1');
  });

  it('returns warnings when the route has no body', async () => {
    await expect(run(undefined, [warning]).result).resolves.toEqual({ validationWarnings: [warning] });
  });

  it('only sets the header for arrays', async () => {
    const { res, result } = run([1, 2], [warning]);
    await expect(result).resolves.toEqual([1, 2]);
    expect(res.setHeader).toHaveBeenCalledWith('x-tooljet-validation-warnings', '1');
  });
});
