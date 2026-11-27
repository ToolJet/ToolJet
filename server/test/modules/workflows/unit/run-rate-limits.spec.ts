import { runRateBuckets } from '@modules/workflows/admission/run-rate-limits';
import { resolveWorkflowLimits } from '@modules/workflows/limits/workflow-limits';

const limits = resolveWorkflowLimits({});

/**
 * Which per-minute counters each workflow run start is charged to.
 *
 * @group workflows
 */
describe('runRateBuckets', () => {
  describe('editor Run and node preview | signed-in builder', () => {
    it('should limit each per user, in separate counters', () => {
      expect(runRateBuckets('editor', { userId: 'u1' }, limits)).toEqual([{ key: 'editor:user:u1', limit: 60 }]);
      expect(runRateBuckets('preview', { userId: 'u1' }, limits)).toEqual([{ key: 'preview:user:u1', limit: 60 }]);
    });
  });

  describe('app trigger | signed-in end user', () => {
    it('should limit per user per workflow', () => {
      expect(runRateBuckets('app', { userId: 'u1', workflowId: 'wf1', ip: '1.2.3.4' }, limits)).toEqual([
        { key: 'app:user:u1:wf:wf1', limit: 60 },
      ]);
    });
  });

  describe('app trigger | anonymous public-app visitor', () => {
    it('should limit per workflow, per workspace and per IP', () => {
      expect(runRateBuckets('app', { workflowId: 'wf1', organizationId: 'ws1', ip: '1.2.3.4' }, limits)).toEqual([
        { key: 'anon:wf:wf1', limit: 30 },
        { key: 'anon:ws:ws1', limit: 120 },
        { key: 'anon:ip:1.2.3.4', limit: 20 },
      ]);
    });

    it('should charge an unresolved scope to one shared counter rather than skip it', () => {
      expect(runRateBuckets('app', {}, limits).map((bucket) => bucket.key)).toEqual([
        'anon:wf:unknown',
        'anon:ws:unknown',
        'anon:ip:unknown',
      ]);
    });
  });

  describe('webhook trigger', () => {
    it('should limit per workflow', () => {
      expect(runRateBuckets('webhook', { workflowId: 'wf1', ip: '1.2.3.4' }, limits)).toEqual([
        { key: 'webhook:wf:wf1', limit: 100 },
      ]);
    });
  });

  it('should take the numbers from the env overrides', () => {
    const tight = resolveWorkflowLimits({ WORKFLOW_LIMIT_ANONYMOUS_RUNS_PER_IP_PER_MINUTE: '5' });
    expect(runRateBuckets('app', { ip: '1.2.3.4' }, tight)[2]).toEqual({ key: 'anon:ip:1.2.3.4', limit: 5 });
  });
});
