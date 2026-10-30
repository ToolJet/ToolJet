/**
 * Bug: a binding onto another widget's value reads empty on a fresh page load
 * whenever that widget's configured value happens to equal the value its
 * registration seeds into the exposed-value store.
 *
 * Reported as: a Star Rating with "Default no of selected stars" set to 0, and
 * a Text bound to `{{components.starrating1.value}}`. The rating shows 0, but
 * the Text renders empty and its `text` variable is "". Setting the rating to
 * any other number works, which is what makes it look like a Star Rating bug.
 *
 * It is neither widget's bug. `initDependencyGraph` (componentsSlice) resolved
 * every component's bindings BEFORE seeding the registered `exposedVariables`
 * defaults, so the Text resolved `components.<rating>.value` while that entry
 * did not exist yet — `resolveCode` throws on the missing reference and returns
 * its `''` initial value, which the string schema then accepts verbatim.
 *
 * Normally the widget's own mount publish repairs that: it writes a different
 * value, the dependency cascade runs, and the Text re-resolves. But
 * `setExposedValue` skips a write that deep-equals what is already stored
 * (resolvedSlice), and the skip takes the dependency update with it. When the
 * configured value equals the seeded default the publish is exactly such a
 * no-op, so nothing ever corrects the stale resolution.
 *
 * The fix seeds the defaults before the bindings are resolved, so the stale
 * read never happens. StarRating and NumberInput both seed `value: 0`, so both
 * collide whenever the field is configured to 0.
 *
 * Checkbox and ToggleSwitchV2 seed `false` and look like the same case, but a
 * Text bound to them reads "" even with this fix, for an unrelated reason: the
 * Text's string schema coerces only numbers, so a boolean fails validation and
 * falls back to ''. That is the Text contract's own recorded finding and is
 * deliberately not covered here.
 */
import React from 'react';
import { waitFor } from '@testing-library/react';
import RenderWidget from '@/AppBuilder/AppCanvas/RenderWidget';
import useStore from '@/AppBuilder/_stores/store';
import {
  AppBuilderTestSession,
  defineAppBuilderScenario,
  seedApp,
  componentDefinition,
  binding,
} from '@/test/app-builder';

const MODULE_ID = 'canvas';
const SOURCE = 'src1';
const TEXT = 'txt1';

const scenario = defineAppBuilderScenario({
  id: 'default-exposed-value-resolved-on-load',
  name: 'A binding reads a seeded default on first load',
  primarySeam: 'rtl',
  surface: 'app-editor',
  edition: 'ce',
  environment: 'development',
  layout: 'desktop',
  version: 'draft',
  transferPath: 'not-applicable',
  access: 'authenticated',
  capabilities: { observers: true, media: { matches: false } },
});

const store = () => useStore.getState();
const widgetProps = (id, componentType) => ({
  id,
  componentType,
  moduleId: MODULE_ID,
  currentMode: 'edit',
  currentLayout: 'desktop',
  widgetHeight: 40,
  widgetWidth: 200,
  inCanvas: true,
  darkMode: false,
  onOptionChange: () => {},
  onOptionsChange: () => {},
});

let session;

function renderPair({ sourceType, sourceHandle, sourceProps }) {
  const source = componentDefinition(SOURCE, sourceHandle, sourceType, {
    ...sourceProps,
    visibility: binding('{{true}}'),
    loadingState: binding('{{false}}'),
    disabledState: binding('{{false}}'),
  });
  const text = componentDefinition(TEXT, 'text1', 'Text', {
    text: binding(`{{components.${sourceHandle}.value}}`),
    textFormat: binding('html'),
    visibility: binding('{{true}}'),
    loadingState: binding('{{false}}'),
    disabledState: binding('{{false}}'),
  });

  seedApp({ [SOURCE]: source, [TEXT]: text }, { moduleId: MODULE_ID });
  store().setEditorLoading(false, MODULE_ID);
  store().setCurrentMode('edit', MODULE_ID);

  return session.render(
    <>
      <RenderWidget {...widgetProps(SOURCE, sourceType)} />
      <RenderWidget {...widgetProps(TEXT, 'Text')} />
    </>
  );
}

const exposed = (id) => store().getExposedValueOfComponent(id, MODULE_ID);

describe('a binding resolves against seeded defaults on first load', () => {
  beforeEach(() => {
    session = new AppBuilderTestSession({ scenario });
  });
  afterEach(() => session?.teardown?.());

  test('a Text bound to a Star Rating left at 0 reads 0, not empty', async () => {
    // Break this catches: resolving bindings before the registered defaults are
    // seeded. The Text would resolve a missing reference to '' and never be told
    // to try again, because the rating's own publish of 0 deep-equals the seed
    // and is skipped along with its dependency update.
    renderPair({
      sourceType: 'StarRating',
      sourceHandle: 'starrating1',
      sourceProps: { maxRating: binding('{{5}}'), defaultSelected: binding('{{0}}') },
    });

    await waitFor(() => expect(exposed(SOURCE).value).toBe(0));
    await waitFor(() => expect(exposed(TEXT).text).toBe('0'));
  });

  test('a non-colliding value still works, so the fix did not trade one case for the other', async () => {
    renderPair({
      sourceType: 'StarRating',
      sourceHandle: 'starrating1',
      sourceProps: { maxRating: binding('{{5}}'), defaultSelected: binding('{{3}}') },
    });

    await waitFor(() => expect(exposed(SOURCE).value).toBe(3));
    await waitFor(() => expect(exposed(TEXT).text).toBe('3'));
  });

  test('a Text bound to a Number Input defaulting to 0 reads 0, not empty', async () => {
    // The same collision in a second widget: NumberInput also seeds `value: 0`,
    // so a field defaulting to 0 publishes a no-op over the seed. This is why
    // the fix belongs in the load path rather than in any one widget.
    renderPair({
      sourceType: 'NumberInput',
      sourceHandle: 'numberinput1',
      sourceProps: { label: binding('Qty'), value: binding('{{0}}') },
    });

    await waitFor(() => expect(exposed(SOURCE).value).toBe(0));
    await waitFor(() => expect(exposed(TEXT).text).toBe('0'));
  });
});
