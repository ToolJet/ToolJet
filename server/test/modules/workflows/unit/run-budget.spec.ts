import { RunBudget, RunBudgetExceededError } from '@modules/workflows/run-budget/run-budget';
import { DEFAULT_WORKFLOW_LIMITS, WorkflowLimits } from '@modules/workflows/limits/workflow-limits';

const limits = (overrides: Partial<WorkflowLimits['run']> = {}): WorkflowLimits['run'] => ({
  ...DEFAULT_WORKFLOW_LIMITS.run,
  ...overrides,
});

const exceeded = (limit: string) => expect.objectContaining({ name: 'RunBudgetExceededError', limit });

/**
 * The budget a run tree (a run and all its child runs) is held to.
 *
 * @group workflows
 */
describe('RunBudget', () => {
  describe('chargeNode | Nodes executed', () => {
    it('should allow up to the cap, shared by the whole run tree', () => {
      const root = RunBudget.forRoot(limits({ maxNodes: 3 }), 'root');
      const child = root.startChild();

      root.chargeNode();
      child.chargeNode();
      root.chargeNode();

      expect(() => child.chargeNode()).toThrow(exceeded('maxNodes'));
    });

    it('should name the limit and its env var in the message', () => {
      const budget = RunBudget.forRoot(limits({ maxNodes: 0 }), 'root');

      expect(() => budget.chargeNode()).toThrow(
        'This run stopped: it exceeded the limit of 0 nodes executed (WORKFLOW_LIMIT_MAX_NODES)'
      );
    });
  });

  describe('startChild | Child workflow runs', () => {
    it('should refuse a child deeper than the depth cap, which stops a workflow that calls itself', () => {
      let budget = RunBudget.forRoot(limits({ maxDepth: 2 }), 'root');
      budget = budget.startChild().startChild();

      expect(() => budget.startChild()).toThrow(exceeded('maxDepth'));
    });

    it('should count child runs across the whole tree', () => {
      const root = RunBudget.forRoot(limits({ maxChildren: 2 }), 'root');
      root.startChild().startChild();

      expect(() => root.startChild()).toThrow(exceeded('maxChildren'));
    });

    it('should keep the root run id for termination checks', () => {
      expect(RunBudget.forRoot(limits(), 'root').startChild().startChild().rootExecutionId).toBe('root');
    });
  });

  describe('loops and filters', () => {
    it('should cap loop iterations and filter items per node', () => {
      const budget = RunBudget.forRoot(limits({ maxLoopIterations: 10, maxFilterItems: 20 }), 'root');

      expect(() => budget.checkLoopIterations(10)).not.toThrow();
      expect(() => budget.checkLoopIterations(11)).toThrow(exceeded('maxLoopIterations'));
      expect(() => budget.checkFilterItems(21)).toThrow(exceeded('maxFilterItems'));
    });
  });

  describe('checkState | Sizes', () => {
    it('should refuse a state with one node result over the per-result cap', () => {
      const budget = RunBudget.forRoot(limits({ maxNodeResultBytes: 100 }), 'root');

      expect(() => budget.checkState({ small: 'x', big: 'y'.repeat(200) })).toThrow(exceeded('maxNodeResultBytes'));
    });

    it('should refuse a state over the total cap even when each result fits', () => {
      const budget = RunBudget.forRoot(limits({ maxNodeResultBytes: 100, maxStateBytes: 150 }), 'root');

      expect(() => budget.checkState({ a: 'x'.repeat(80), b: 'y'.repeat(80) })).toThrow(exceeded('maxStateBytes'));
    });

    it('should ignore values that are not stored, such as functions', () => {
      const budget = RunBudget.forRoot(limits({ maxStateBytes: 10 }), 'root');

      expect(() => budget.checkState({ helper: () => 'x'.repeat(100) })).not.toThrow();
    });
  });

  describe('logGate | Log size', () => {
    it('should keep entries up to the cap, then ask for one limit entry, then drop', () => {
      const gate = RunBudget.forRoot(limits({ maxLogEntries: 3 }), 'root').logGate();

      expect(['a', 'b', 'c', 'd'].map((entry) => gate.admit(entry))).toEqual(['keep', 'keep', 'cap', 'drop']);
    });

    it('should cap by bytes too', () => {
      const gate = RunBudget.forRoot(limits({ maxLogBytes: 50 }), 'root').logGate();

      expect(gate.admit('x'.repeat(30))).toBe('keep');
      expect(gate.admit('y'.repeat(30))).toBe('cap');
    });
  });

  it('should throw a RunBudgetExceededError the engine can recognise', () => {
    expect(() => RunBudget.forRoot(limits({ maxNodes: 0 }), 'root').chargeNode()).toThrow(RunBudgetExceededError);
  });
});
