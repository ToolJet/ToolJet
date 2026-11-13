/** @group workflows */

import { triggerRouteType } from '@modules/workflows/helpers/trigger-route-type';

describe('triggerRouteType', () => {
  it('records a workflow editor run (pinned version, no saved query) as manual', () => {
    expect(triggerRouteType({ executeUsing: 'version', hasSavedQuery: false })).toBe('manual');
  });

  it.each([
    ['an app builder query on the released workflow', { executeUsing: 'app', hasSavedQuery: true }],
    ['an app builder query pinned to a workflow version', { executeUsing: 'version', hasSavedQuery: true }],
    ['an app call without a saved query', { executeUsing: 'app', hasSavedQuery: false }],
  ])('records %s as app', (_label, input) => {
    expect(triggerRouteType(input)).toBe('app');
  });
});
