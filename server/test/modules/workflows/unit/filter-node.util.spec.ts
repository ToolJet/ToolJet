/** @group workflows */

import {
  FILTER_CHECKPOINT_INTERVAL,
  filterNodeValues,
  validateFilterInputConnection,
} from '@ee/workflows/services/filter-node.util';

describe('filterNodeValues', () => {
  it('should require exactly one upstream input connection', () => {
    expect(() => validateFilterInputConnection(0)).toThrow('Filter requires one upstream input connection');
    expect(() => validateFilterInputConnection(2)).toThrow('Filter accepts exactly one upstream input connection');
    expect(() => validateFilterInputConnection(1)).not.toThrow();
  });

  it('should retain values whose predicate expression is truthy', async () => {
    const evaluate = jest
      .fn()
      .mockResolvedValueOnce([1, 2, 3, 4])
      .mockImplementation(async (_expression, variables) => Number(variables.value) % 2 === 0);

    await expect(
      filterNodeValues({ inputExpression: 'query1.data', predicateExpression: 'value % 2 === 0' }, evaluate)
    ).resolves.toEqual([2, 4]);
    expect(evaluate).toHaveBeenNthCalledWith(2, 'value % 2 === 0', { value: 1, index: 0 });
  });

  it('should use JavaScript truthiness for predicate results', async () => {
    const evaluate = jest
      .fn()
      .mockResolvedValueOnce(['keep', 'discard'])
      .mockResolvedValueOnce({ matched: true })
      .mockResolvedValueOnce(0);

    await expect(filterNodeValues({ predicateExpression: 'value' }, evaluate)).resolves.toEqual(['keep']);
  });

  it.each([null, undefined, {}, 'value', 1, true, () => []])('should reject non-filterable input %p', async (input) => {
    const evaluate = jest.fn().mockResolvedValue(input);

    await expect(filterNodeValues({ inputExpression: 'query1.data' }, evaluate)).rejects.toThrow(
      'Filter input must resolve to an array'
    );
  });

  it('should propagate predicate evaluation errors', async () => {
    const evaluate = jest.fn().mockResolvedValueOnce([1]).mockRejectedValueOnce(new Error('Invalid predicate'));

    await expect(filterNodeValues({ predicateExpression: 'invalid' }, evaluate)).rejects.toThrow('Invalid predicate');
  });

  it('should stop filtering after the first predicate evaluation error', async () => {
    const evaluate = jest.fn().mockResolvedValueOnce([1, 2]).mockRejectedValueOnce(new Error('Invalid predicate'));

    await expect(filterNodeValues({ predicateExpression: 'invalid' }, evaluate)).rejects.toThrow('Invalid predicate');
    expect(evaluate).toHaveBeenCalledTimes(2);
  });

  it('should run the checkpoint before the first item and then once per interval', async () => {
    const values = Array.from({ length: FILTER_CHECKPOINT_INTERVAL * 2 + 1 }, (_, index) => index);
    const evaluate = jest.fn().mockResolvedValueOnce(values).mockResolvedValue(true);
    const checkpoint = jest.fn().mockResolvedValue(undefined);

    await expect(filterNodeValues({ predicateExpression: 'true' }, evaluate, checkpoint)).resolves.toHaveLength(
      values.length
    );
    expect(checkpoint).toHaveBeenCalledTimes(3);
  });

  it('should stop filtering when the checkpoint throws', async () => {
    const values = Array.from({ length: FILTER_CHECKPOINT_INTERVAL * 3 }, (_, index) => index);
    const evaluate = jest.fn().mockResolvedValueOnce(values).mockResolvedValue(true);
    const checkpoint = jest
      .fn()
      .mockResolvedValueOnce(undefined)
      .mockRejectedValueOnce(new Error('Workflow execution terminated'));

    await expect(filterNodeValues({ predicateExpression: 'true' }, evaluate, checkpoint)).rejects.toThrow(
      'Workflow execution terminated'
    );
    // The input plus one interval of predicates; nothing after the failed checkpoint.
    expect(evaluate).toHaveBeenCalledTimes(1 + FILTER_CHECKPOINT_INTERVAL);
  });
});
