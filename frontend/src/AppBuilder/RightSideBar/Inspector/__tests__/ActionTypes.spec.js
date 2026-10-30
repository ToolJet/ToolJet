import { ActionTypes, getEventActionId, getEventActionChanges } from '../ActionTypes';

describe('Refresh Query Cache event selection', () => {
  it('offers refresh alongside Run query', () => {
    expect(ActionTypes.find((action) => action.id === 'refresh-query-cache')).toMatchObject({
      name: 'Refresh Query Cache',
      group: 'run-action',
      options: [{ queryId: '' }],
    });
  });

  it('uses the existing run-query execution contract', () => {
    expect(getEventActionChanges('refresh-query-cache')).toEqual({ actionId: 'run-query', refreshCache: true });
  });

  it('recognizes existing saved refresh events', () => {
    expect(getEventActionId({ actionId: 'run-query', refreshCache: true })).toBe('refresh-query-cache');
    expect(getEventActionId({ actionId: 'run-query' })).toBe('run-query');
  });

  it('clears refresh when switching to a normal query or another action', () => {
    for (const actionId of ['run-query', 'show-alert', 'reset-query']) {
      expect(getEventActionChanges(actionId)).toEqual({ actionId, refreshCache: undefined });
    }
  });

  it('does not relabel other actions carrying a legacy refresh flag', () => {
    expect(getEventActionId({ actionId: 'reset-query', refreshCache: true })).toBe('reset-query');
  });
});
