import {
  ActionTypes,
  getAvailableActionTypes,
  getDisplayedActionId,
  getEventActionId,
  getEventActionChanges,
  normalizeEventAction,
} from '../ActionTypes';

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

  // Break this catches: a Table button labelled "Refresh Query Cache" reaching executeAction with an id it has no case for.
  it('turns the alias id into a refreshing query run', () => {
    expect(normalizeEventAction({ actionId: 'refresh-query-cache', queryId: 'q1', parameters: { a: 1 } })).toEqual({
      actionId: 'run-query',
      refreshCache: true,
      queryId: 'q1',
      parameters: { a: 1 },
    });
  });

  it('leaves every other event untouched', () => {
    const run = { actionId: 'run-query', queryId: 'q1' };
    const alert = { actionId: 'show-alert', message: 'hi' };
    expect(normalizeEventAction(run)).toBe(run);
    expect(normalizeEventAction(alert)).toBe(alert);
    expect(normalizeEventAction(undefined)).toBeUndefined();
  });
});

describe('Refresh Query Cache availability', () => {
  const ids = (actions) => actions.map((action) => action.id);

  // Break this catches: offering Refresh Query Cache without the license or a query with caching on.
  it('leaves the action out when refresh is unavailable', () => {
    expect(ids(getAvailableActionTypes(false))).not.toContain('refresh-query-cache');
    expect(ids(getAvailableActionTypes(false))).toContain('run-query');
    expect(ids(getAvailableActionTypes(true))).toContain('refresh-query-cache');
  });

  // Break this catches: a saved refresh event showing a blank action once refresh is unavailable.
  it('shows a saved refresh event as Run query when refresh is unavailable', () => {
    for (const event of [{ actionId: 'run-query', refreshCache: true }, { actionId: 'refresh-query-cache' }]) {
      expect(getDisplayedActionId(event, false)).toBe('run-query');
      expect(getDisplayedActionId(event, true)).toBe('refresh-query-cache');
    }
    expect(getDisplayedActionId({ actionId: 'show-alert' }, false)).toBe('show-alert');
  });
});
