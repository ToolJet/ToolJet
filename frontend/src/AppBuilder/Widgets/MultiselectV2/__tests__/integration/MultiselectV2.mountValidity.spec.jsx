/**
 * MultiselectV2 — `isValid` right after mount matches the selection the widget starts with.
 *
 * The defaults effects select the default options and expose their validity; the mount effect then exposed `isValid`
 * from the first render, before anything was selected. A mandatory field with default selections exposed false.
 */
import { binding, drain } from '@/AppBuilder/Widgets/__tests__/integration/widgetHarness';
import { createMultiselectHarness } from './multiselectV2Harness';

const harness = createMultiselectHarness();
const MANDATORY = { mandatory: binding(true) };

describe('MultiselectV2: isValid on mount', () => {
  beforeEach(harness.setup);
  afterEach(harness.teardown);

  test('a mandatory field with default selections is valid', async () => {
    harness.render({ properties: { values: binding("{{['1','2']}}") }, validation: MANDATORY });
    await drain();

    expect(harness.exposed().values).toEqual(['1', '2']);
    expect(harness.exposed().isValid).toBe(true);
  });

  test('a mandatory field with nothing selected is invalid, as before', async () => {
    harness.render({ properties: { values: binding('{{[]}}') }, validation: MANDATORY });
    await drain();

    expect(harness.exposed().values).toEqual([]);
    expect(harness.exposed().isValid).toBe(false);
  });

  test('advanced mode: a mandatory field with a default option is valid', async () => {
    harness.render({ properties: { advanced: binding('{{true}}') }, validation: MANDATORY });
    await drain();

    expect(harness.exposed().values).toEqual([1]);
    expect(harness.exposed().isValid).toBe(true);
  });
});
