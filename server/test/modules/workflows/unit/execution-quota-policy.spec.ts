import { quotaPeriods, quotaLimitsFromPlan } from '@modules/workflows/admission/execution-quota.policy';
import { DEFAULT_WORKFLOW_LIMITS, resolveWorkflowLimits } from '@modules/workflows/limits/workflow-limits';

/**
 * @group workflows
 */
describe('Execution quota policy', () => {
  describe('quotaPeriods | UTC day and month', () => {
    it('should cut days and months at 00:00 UTC', () => {
      const periods = quotaPeriods(new Date('2026-11-30T23:59:59.999Z'));

      expect(periods.day).toEqual({
        id: '2026-11-30',
        start: new Date('2026-11-30T00:00:00.000Z'),
        end: new Date('2026-12-01T00:00:00.000Z'),
      });
      expect(periods.month).toEqual({
        id: '2026-11',
        start: new Date('2026-11-01T00:00:00.000Z'),
        end: new Date('2026-12-01T00:00:00.000Z'),
      });
    });

    it('should roll the month over at a year boundary', () => {
      expect(quotaPeriods(new Date('2026-12-31T12:00:00Z')).month.end).toEqual(new Date('2027-01-01T00:00:00Z'));
    });
  });

  describe('quotaLimitsFromPlan | which limits apply', () => {
    const limits = DEFAULT_WORKFLOW_LIMITS;

    it('should use the numbers the plan sets', () => {
      expect(
        quotaLimitsFromPlan(
          {
            workspace: { daily_executions: 100, monthly_executions: '2000' },
            instance: { daily_executions: 300, monthly_executions: 4000 },
          },
          limits
        )
      ).toEqual({ workspaceDaily: 100, workspaceMonthly: 2000, instanceDaily: 300, instanceMonthly: 4000 });
    });

    it('should apply no limit where the plan says UNLIMITED', () => {
      expect(
        quotaLimitsFromPlan(
          { workspace: { daily_executions: 'UNLIMITED', monthly_executions: 'UNLIMITED' }, instance: {} },
          limits
        )
      ).toMatchObject({ workspaceDaily: null, workspaceMonthly: null });
    });

    it.each([
      ['empty', ''],
      ['null', null],
      ['missing', undefined],
      ['zero', 0],
      ['not a number', 'lots'],
    ])('should use the default cap where the plan value is %s (decision D17)', (_label, value) => {
      expect(
        quotaLimitsFromPlan(
          {
            workspace: { daily_executions: value, monthly_executions: value },
            instance: { daily_executions: value, monthly_executions: value },
          },
          limits
        )
      ).toEqual({ workspaceDaily: 500, workspaceMonthly: 10000, instanceDaily: 25000, instanceMonthly: 50000 });
    });

    it('should apply no instance limits when the plan has no instance section, and the same for workspace', () => {
      expect(quotaLimitsFromPlan({ workspace: { daily_executions: 5, monthly_executions: 50 } }, limits)).toEqual({
        workspaceDaily: 5,
        workspaceMonthly: 50,
        instanceDaily: null,
        instanceMonthly: null,
      });
    });

    it('should take the default caps from the limits policy, so env can change them', () => {
      const tuned = resolveWorkflowLimits({ WORKFLOW_LIMIT_DEFAULT_WORKSPACE_DAILY_EXECUTIONS: '42' });

      expect(quotaLimitsFromPlan({ workspace: { daily_executions: '' } }, tuned).workspaceDaily).toBe(42);
    });
  });
});
