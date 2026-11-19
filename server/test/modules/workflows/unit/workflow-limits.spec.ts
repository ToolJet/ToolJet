import {
  DEFAULT_WORKFLOW_LIMITS,
  WORKFLOW_LIMIT_ENV_VARS,
  positiveOr,
  resolveWorkflowLimits,
} from '@modules/workflows/limits/workflow-limits';

/**
 * @group workflows
 */
describe('Workflow limits policy', () => {
  describe('positiveOr', () => {
    it.each([
      ['a positive number', 5, 5],
      ['a numeric string', '7', 7],
      ['zero', 0, 60],
      ['an empty string', '', 60],
      ['undefined', undefined, 60],
      ['null', null, 60],
      ['a negative number', -3, 60],
      ['not a number', 'abc', 60],
      ['infinity', Infinity, 60],
    ])('should treat %s as %s', (_label, value, expected) => {
      expect(positiveOr(value, 60)).toBe(expected);
    });
  });

  describe('resolveWorkflowLimits', () => {
    it('should return the built-in defaults with no env and no plan', () => {
      expect(resolveWorkflowLimits({})).toEqual(DEFAULT_WORKFLOW_LIMITS);
    });

    it('should use the agreed starting defaults', () => {
      expect(DEFAULT_WORKFLOW_LIMITS).toMatchObject({
        run: {
          timeoutSeconds: 60,
          maxNodes: 1000,
          maxDepth: 5,
          maxChildren: 50,
          maxLoopIterations: 1000,
          maxFilterItems: 10000,
          maxLogEntries: 1000,
          maxLogBytes: 1024 * 1024,
          maxNodeResultBytes: 5 * 1024 * 1024,
          maxStateBytes: 20 * 1024 * 1024,
          stepTimeoutMs: 0,
        },
        trigger: { maxPayloadBytes: 1024 * 1024 },
        ratesPerMinute: {
          anonymousPerWorkflow: 30,
          anonymousPerWorkspace: 120,
          anonymousPerIp: 20,
          appPerUserPerWorkflow: 60,
          webhookPerWorkflow: 100,
          editorPerUser: 60,
        },
        concurrency: {
          activeRunsPerWorkspace: 10,
          queuedRunsPerWorkspace: 200,
          waitingSyncRequestsPerPod: 100,
          pythonProcessesPerPod: 4,
          bundleBuildsPerPod: 2,
        },
        waiting: { maxWaitingRunsPerWorkspace: 500 },
        schedules: { maxPerWorkflow: 20, maxPerWorkspace: 200, jitterMaxSeconds: 30 },
        quotaDefaults: {
          workspaceDailyExecutions: 500,
          workspaceMonthlyExecutions: 10000,
          instanceDailyExecutions: 25000,
          instanceMonthlyExecutions: 50000,
        },
      });
    });

    it('should let an env var override a default, and ignore invalid values', () => {
      const limits = resolveWorkflowLimits({
        [WORKFLOW_LIMIT_ENV_VARS['run.maxDepth']]: '3',
        [WORKFLOW_LIMIT_ENV_VARS['concurrency.activeRunsPerWorkspace']]: '0',
        [WORKFLOW_LIMIT_ENV_VARS['ratesPerMinute.anonymousPerIp']]: 'lots',
      });

      expect(limits.run.maxDepth).toBe(3);
      expect(limits.concurrency.activeRunsPerWorkspace).toBe(10);
      expect(limits.ratesPerMinute.anonymousPerIp).toBe(20);
    });

    it('should keep WORKFLOW_TIMEOUT_SECONDS above the plan, and the plan above the default', () => {
      expect(resolveWorkflowLimits({}, { executionTimeoutSeconds: 120 }).run.timeoutSeconds).toBe(120);
      expect(
        resolveWorkflowLimits({ WORKFLOW_TIMEOUT_SECONDS: '30' }, { executionTimeoutSeconds: 120 }).run.timeoutSeconds
      ).toBe(30);
    });

    it.each([
      ['0', 0],
      ["''", ''],
      ['missing', undefined],
    ])('should treat a plan timeout of %s as the 60 s default', (_label, planTimeout) => {
      expect(resolveWorkflowLimits({}, { executionTimeoutSeconds: planTimeout }).run.timeoutSeconds).toBe(60);
    });

    it('should name one env var per limit, all under WORKFLOW_LIMIT_', () => {
      const names = Object.values(WORKFLOW_LIMIT_ENV_VARS);
      expect(new Set(names).size).toBe(names.length);
      for (const [path, name] of Object.entries(WORKFLOW_LIMIT_ENV_VARS)) {
        if (path === 'run.timeoutSeconds') expect(name).toBe('WORKFLOW_TIMEOUT_SECONDS');
        else expect(name).toMatch(/^WORKFLOW_LIMIT_[A-Z_]+$/);
      }
    });
  });
});
