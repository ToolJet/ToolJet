import { RequestContext } from '@modules/request-context/service';
import { AppValidationService } from '@modules/app-validation/service';
import { AppValidationException } from '@modules/app-validation/exception';
import { VALIDATION_WARNINGS_LOCALS_KEY } from '@modules/app-validation/constants';
import { isBlocking, runRules } from '@modules/app-validation/runner';
import { Issue, Rule, ValidationMode, WriteSource } from '@modules/app-validation/types';
import { VersionIndex } from '@modules/app-validation/version-index';

const issue = (overrides: Partial<Issue> = {}): Issue => ({
  code: 'TEST_PROBLEM',
  severity: 'critical',
  confidence: 'certain',
  path: 'button1.properties.text',
  message: 'button1 → Text: wrong',
  ...overrides,
});

const ruleReturning = (...issues: Issue[]): Rule<unknown> => ({
  id: 'returns-issues',
  description: 'test rule',
  check: () => issues,
});

const crashingRule: Rule<unknown> = {
  id: 'crashes',
  description: 'test rule that throws',
  check: () => {
    throw new Error('bug in a rule');
  },
};

// Runs `fn` inside a fake request so recorded warnings and the request's source can be observed.
async function inRequest<T>(req: Record<string, any>, fn: (res: any) => Promise<T>): Promise<T> {
  const res = { locals: {} };
  return RequestContext.cls.run(new RequestContext(req as any, res as any), () => fn(res));
}

describe('app-validation runner', () => {
  it('blocks only certain + critical/high problems', () => {
    expect(isBlocking({ severity: 'critical', confidence: 'certain' })).toBe(true);
    expect(isBlocking({ severity: 'high', confidence: 'certain' })).toBe(true);
    expect(isBlocking({ severity: 'critical', confidence: 'heuristic' })).toBe(false);
    expect(isBlocking({ severity: 'medium', confidence: 'certain' })).toBe(false);
  });

  it('treats a crashing rule as no findings and keeps running the rest', async () => {
    const onCrash = jest.fn();
    const ctx = { appVersionId: 'v1', source: 'ui' as const, index: async () => VersionIndex.fromData({}) };
    const result = await runRules([crashingRule, ruleReturning(issue())], [{}], ctx, onCrash);
    expect(onCrash).toHaveBeenCalledWith('crashes', expect.any(Error));
    expect(result.errors).toHaveLength(1);
  });
});

describe('AppValidationService', () => {
  let logger: { warn: jest.Mock; error: jest.Mock };
  let service: AppValidationService;

  beforeEach(() => {
    logger = { warn: jest.fn(), error: jest.fn() };
    service = new AppValidationService(logger as any);
  });

  const setMode = (mode: ValidationMode | ((source: WriteSource) => ValidationMode)) =>
    jest.spyOn(service as any, 'modeFor').mockImplementation(typeof mode === 'function' ? mode : () => mode);

  const check = (rules: Rule<unknown>[], source?: any) =>
    service.check('components', [{}], { appVersionId: 'v1', source, rules, index: VersionIndex.fromData({}) });

  it('report mode: never throws, logs what would block, and returns it to the client as a warning', async () => {
    setMode('report');
    await inRequest({}, async (res) => {
      await expect(check([ruleReturning(issue())], 'pat')).resolves.toMatchObject({ errors: [issue()] });
      expect(logger.warn).toHaveBeenCalledTimes(1);
      expect(res.locals[VALIDATION_WARNINGS_LOCALS_KEY]).toEqual([issue()]);
    });
  });

  it('enforce mode: throws with every blocking problem and the warnings', async () => {
    setMode('enforce');
    const warning = issue({ code: 'TEST_WARNING', severity: 'medium' });
    const error = await check([ruleReturning(issue(), warning)], 'pat').catch((e) => e);
    expect(error).toBeInstanceOf(AppValidationException);
    expect(error.getStatus()).toBe(400);
    expect(error.getResponse()).toMatchObject({
      code: 'APP_VALIDATION_FAILED',
      issues: [issue()],
      warnings: [warning],
    });
  });

  it('enforce mode: non-blocking problems are recorded as warnings, not thrown', async () => {
    setMode('enforce');
    const heuristic = issue({ confidence: 'heuristic' });
    await inRequest({}, async (res) => {
      await expect(check([ruleReturning(heuristic)], 'pat')).resolves.toBeDefined();
      expect(res.locals[VALIDATION_WARNINGS_LOCALS_KEY]).toEqual([heuristic]);
    });
  });

  it('a crashing rule never blocks the write, even in enforce mode', async () => {
    setMode('enforce');
    await expect(check([crashingRule], 'pat')).resolves.toEqual({ errors: [], warnings: [] });
    expect(logger.error).toHaveBeenCalledTimes(1);
  });

  it('off mode: rules are not run at all', async () => {
    setMode('off');
    const rule = { ...ruleReturning(issue()), check: jest.fn(() => [issue()]) };
    await check([rule], 'pat');
    expect(rule.check).not.toHaveBeenCalled();
  });

  it('returns a fresh result each time, so callers cannot affect later checks', async () => {
    setMode('off');
    const first = await check([ruleReturning(issue())], 'pat');
    first.errors.push(issue());
    await expect(check([ruleReturning(issue())], 'pat')).resolves.toEqual({ errors: [], warnings: [] });
  });

  it('uses the request to pick the mode when no source is passed', async () => {
    setMode((source) => (source === 'pat' ? 'enforce' : 'report'));
    await inRequest({ user: { tjApiSource: 'personal_access_token' }, originalUrl: '/api/v2/apps/1' }, async () => {
      await expect(check([ruleReturning(issue())])).rejects.toBeInstanceOf(AppValidationException);
    });
    await inRequest({ originalUrl: '/api/v2/apps/1' }, async () => {
      await expect(check([ruleReturning(issue())])).resolves.toBeDefined();
    });
  });

  it('gives rules the provided lookup without touching the database', async () => {
    setMode('report');
    const index = VersionIndex.fromData({
      components: [{ id: 'c1', name: 'b1', type: 'Button', parent: null, pageId: 'p1' }],
    });
    const seen: string[] = [];
    const rule: Rule<unknown> = {
      id: 'reads-index',
      description: 'test',
      check: async (_input, ctx) => {
        seen.push((await ctx.index()).component('c1')?.type);
        return [];
      },
    };
    await service.check('components', [{}, {}], { appVersionId: 'v1', source: 'ui', rules: [rule], index });
    expect(seen).toEqual(['Button', 'Button']);
  });
});
