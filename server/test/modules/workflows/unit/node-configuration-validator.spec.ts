/** @group workflows */

import {
  validateReachedNodeConfiguration,
  WorkflowNodeConfigurationError,
} from '@modules/workflows/helpers/node-configuration-validator';

describe('validateReachedNodeConfiguration', () => {
  it.each([
    [{ type: 'if-condition', definition: { conditions: [] } }, 'If requires at least one condition'],
    [
      { type: 'if-condition', definition: { conditions: [{ id: 'a', label: 'If', code: '   ' }] } },
      'If condition "If" cannot be empty',
    ],
    [{ type: 'if-condition', definition: { code: '   ' } }, 'If condition "If" cannot be empty'],
    [
      // Saved before branch names were renumbered: the survivor of a removed middle Else if still says "Else if 2".
      {
        type: 'if-condition',
        definition: {
          conditions: [
            { id: 'true', label: 'If', code: '1 === 2' },
            { id: 'else-if-2', label: 'Else if 2', code: '  ' },
          ],
        },
      },
      'If condition "Else if 1" cannot be empty',
    ],
    [
      {
        type: 'filter',
        definition: { inputExpression: 'items.data', predicateExpression: 'value' },
        incomingEdgeCount: 0,
      },
      'Filter requires one upstream input connection',
    ],
    [
      {
        type: 'filter',
        definition: { inputExpression: 'items.data', predicateExpression: 'value' },
        incomingEdgeCount: 2,
      },
      'Filter accepts exactly one upstream input connection',
    ],
    [
      { type: 'filter', definition: { inputExpression: '', predicateExpression: 'value' }, incomingEdgeCount: 1 },
      'Filter input expression cannot be empty',
    ],
    [
      { type: 'filter', definition: { inputExpression: 'items.data', predicateExpression: '' }, incomingEdgeCount: 1 },
      'Filter condition cannot be empty',
    ],
    [{ type: 'wait', definition: { durationSeconds: 0 } }, 'Wait duration must be between 1 second and 30 days'],
    [
      { type: 'wait', definition: { durationSeconds: 2_592_001 } },
      'Wait duration must be between 1 second and 30 days',
    ],
    [
      { type: 'wait', definition: { durationSeconds: Number.NaN } },
      'Wait duration must be between 1 second and 30 days',
    ],
    [
      { type: 'human', definition: { approvers: { tokenBypass: false }, outcomes: [{ key: 'yes' }] } },
      'Human approval requires at least one approver when token bypass is disabled',
    ],
    [
      { type: 'human', definition: { approvers: { tokenBypass: true }, outcomes: [] } },
      'Human approval requires at least one outcome',
    ],
    [
      { type: 'query', definition: { looped: true, iterationValuesCode: ' ' } },
      'Loop array expression cannot be empty',
    ],
  ] as const)('rejects %j with %s', (input, message) => {
    expect(() => validateReachedNodeConfiguration(input)).toThrow(message);
  });

  it.each([
    { type: 'if-condition', definition: { code: '2 > 1' } },
    { type: 'if-condition', definition: { conditions: [{ id: 'a', label: 'If', code: '2 > 1' }] } },
    {
      type: 'filter',
      definition: { inputExpression: 'items.data', predicateExpression: 'value' },
      incomingEdgeCount: 1,
    },
    { type: 'wait', definition: { durationSeconds: 1 } },
    { type: 'wait', definition: { durationSeconds: 2_592_000 } },
    { type: 'human', definition: { approvers: { tokenBypass: true }, outcomes: [{ key: 'yes' }] } },
    {
      type: 'human',
      definition: { approvers: { tokenBypass: false, dynamic: '{{ manager }}' }, outcomes: [{ key: 'yes' }] },
    },
    { type: 'human', definition: { approvers: { tokenBypass: false, users: ['person'] }, outcomes: [{ key: 'yes' }] } },
    { type: 'human', definition: { approvers: { tokenBypass: false, groups: ['group'] }, outcomes: [{ key: 'yes' }] } },
    { type: 'query', definition: { looped: true, iterationValuesCode: 'return [1];' } },
    { type: 'query', definition: { looped: false, iterationValuesCode: '' } },
    { type: 'output', definition: { code: '', statusCode: { value: '' } } },
    { type: 'response', definition: { code: '', statusCode: { value: '' } } },
    { type: 'wait', definition: { durationSeconds: 0 }, isResume: true },
    { type: 'human', definition: { approvers: { tokenBypass: false }, outcomes: [] }, isResume: true },
  ])('accepts %j', (input) => {
    expect(() => validateReachedNodeConfiguration(input)).not.toThrow();
  });

  it.each([
    [
      'human',
      { outcomes: [{ key: 'yes' }] },
      'Human nodes are not supported in workflows called from another workflow',
    ],
    ['wait', { durationSeconds: 5 }, 'Wait nodes are not supported in workflows called from another workflow'],
  ])('rejects a valid %s node in a workflow called from another workflow', (type, definition, message) => {
    expect(() => validateReachedNodeConfiguration({ type, definition, calledFromWorkflow: true })).toThrow(message);
  });

  it.each([['human'], ['wait']])('accepts a %s node in a workflow run directly', (type) => {
    const definition = type === 'human' ? { outcomes: [{ key: 'yes' }] } : { durationSeconds: 5 };

    expect(() => validateReachedNodeConfiguration({ type, definition, calledFromWorkflow: false })).not.toThrow();
  });

  it('uses a distinct error type for missing configuration', () => {
    expect(() => validateReachedNodeConfiguration({ type: 'wait', definition: { durationSeconds: 0 } })).toThrow(
      WorkflowNodeConfigurationError
    );
  });
});
