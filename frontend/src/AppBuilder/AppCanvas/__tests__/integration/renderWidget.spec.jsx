/**
 * CANARY for the RTL seam.
 *
 * This is the one spec whose only job is to fail loudly if jest can no longer
 * render a REAL App Builder widget. It is not a behaviour test for any widget —
 * it asserts that the whole chain is intact:
 *
 *   real composed store  ->  seeded page + real dependency graph
 *   real RenderWidget    ->  real widget module (nothing about the widget is mocked)
 *   real resolver        ->  visible text in the DOM
 *
 * If this file breaks, do NOT work around it inside a widget spec. Fix
 * jest.config.js / src/test/setupGlobals.js — every widget spec is downstream
 * of this one.
 *
 * Why it lives in __tests__/integration/: it imports @/AppBuilder/_stores/store.
 * See scripts/validate-test-layout.js.
 *
 * Three things here are load-bearing and non-obvious:
 *
 * 1. The two no-op callbacks. RenderWidget's setExposedVariable /
 *    setExposedVariables call onOptionChange / onOptionsChange whenever they are
 *    not exactly `null` (RenderWidget.jsx:245, :260) — `undefined` passes that
 *    check and then throws "onOptionsChange is not a function". In the app,
 *    AppCanvas/Container always supplies them.
 *
 * 2. `capabilities: { observers: true }`. Many widgets (Checkbox, MultiselectV2,
 *    ToggleSwitchV2, RichTextEditor, ...) mount a ResizeObserver, which jsdom
 *    does not implement. The harness installs the stub only when the scenario
 *    asks for it, so any widget spec doing more than plain Text/Button wants
 *    this capability. It is not a global default on purpose — a spec that means
 *    to assert on resize behaviour should own its own observer.
 *
 * 3. The Table case. Table (like Chart, Icon, Image, CodeEditor, ...) is a
 *    React.lazy import in editorHelpers.js, so it renders through
 *    TrackedSuspense. Keeping one lazy widget here means the canary covers the
 *    dynamic-import half of the seam, not only the eager half.
 */
import React from 'react';
import { screen, waitFor } from '@testing-library/react';
import RenderWidget from '@/AppBuilder/AppCanvas/RenderWidget';
import useStore from '@/AppBuilder/_stores/store';
import { AppBuilderTestSession, defineAppBuilderScenario, seedApp, componentDefinition } from '@/test/app-builder';

const MODULE_ID = 'canvas';

const scenario = defineAppBuilderScenario({
  id: 'rtl-seam-canary',
  name: 'RTL seam canary',
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

/** The props AppCanvas/Container passes down, minus its editor-only extras. */
function widgetProps(id, componentType) {
  return {
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
  };
}

function renderWidget(session, { id, name, type, properties = {} }) {
  seedApp({ [id]: componentDefinition(id, name, type, properties) }, { moduleId: MODULE_ID });
  const state = useStore.getState();
  state.setEditorLoading(false, MODULE_ID);
  state.setCurrentMode('edit', MODULE_ID);
  return session.render(<RenderWidget {...widgetProps(id, type)} />);
}

describe('RTL seam: real App Builder widgets render under jest', () => {
  let session;
  beforeEach(() => {
    session = new AppBuilderTestSession({ scenario });
  });

  test('a real Text widget puts its text in the DOM', async () => {
    renderWidget(session, {
      id: 'txt1',
      name: 'text1',
      type: 'Text',
      properties: { text: { value: 'seam is open' } },
    });

    expect(await screen.findByText('seam is open')).toBeInTheDocument();
  });

  test('a real Button widget puts its label in the DOM', async () => {
    renderWidget(session, {
      id: 'btn1',
      name: 'button1',
      type: 'Button',
      properties: { text: { value: 'Click me' } },
    });

    expect(await screen.findByText('Click me')).toBeInTheDocument();
  });

  test('a real TextInput widget renders an input carrying its default value', async () => {
    const { container } = renderWidget(session, {
      id: 'inp1',
      name: 'textinput1',
      type: 'TextInput',
      properties: { value: { value: 'typed already' }, placeholder: { value: 'enter text' } },
    });

    await waitFor(() => expect(container.querySelector('input')).toBeInTheDocument());
    expect(container.querySelector('input')).toHaveValue('typed already');
  });

  test('a `{{ }}` binding — not just a literal — is resolved before it reaches the DOM', async () => {
    // This is the half of the seam that React alone cannot prove: the value has
    // to travel through the real resolver and dependency graph to get here.
    renderWidget(session, {
      id: 'txt2',
      name: 'text1',
      type: 'Text',
      properties: { text: { value: '{{ "resolved" + "-" + "value" }}' } },
    });

    expect(await screen.findByText('resolved-value')).toBeInTheDocument();
  });

  test('a React.lazy widget (Table) resolves through TrackedSuspense and mounts for real', async () => {
    const { container } = renderWidget(session, {
      id: 'tbl1',
      name: 'table1',
      type: 'Table',
      properties: {
        data: { value: '{{ [{ "name": "Ada" }, { "name": "Grace" }] }}' },
        columns: {
          value: [
            { name: 'name', key: 'name', columnType: 'string', id: 'col-name', columnSize: 100, isEditable: false },
          ],
        },
      },
    });

    // The real NewTable/Table module — not a stub — is what produces these.
    // ToolJet marks test hooks with data-cy, not RTL's default data-testid.
    // The generous timeout is not padding: on a cold jest cache the lazy
    // import() has to Babel-transform the whole Table chunk before it resolves,
    // which reliably overruns RTL's 1s default and made this flake.
    await waitFor(
      () => {
        expect(container.querySelector('.jet-table')).toBeInTheDocument();
        expect(container.querySelector('[data-cy="table1-filter-button"]')).toBeInTheDocument();
      },
      { timeout: 15000 }
    );

    // Deliberately NOT asserting on 'Ada'/'Grace'. Table's header and body are
    // virtualized off the measured container height, and jsdom reports every
    // element as 0x0 (the ResizeObserver stub emits no entries either), so zero
    // rows are windowed in. That is a jsdom geometry limit, not a seam failure:
    // a spec that needs real rows must stub the height source, e.g. with the
    // session's `geometry` capability, or assert against the store instead.
  });
});
