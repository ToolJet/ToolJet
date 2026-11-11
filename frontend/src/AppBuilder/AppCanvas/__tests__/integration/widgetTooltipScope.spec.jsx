/**
 * The ModalV2-specific tooltip-scoping tests that used to live here were
 * migrated to src/AppBuilder/Widgets/ModalV2/__tests__/integration/ModalV2.spec.jsx
 * as [ModalV2-TOOLTIP-001]/[002], per that widget's approved testing contract
 * (frontend/ee/test/app-builder/widgets/ModalV2/TESTING.md) — widget-specific
 * tests belong under the widget's own runtime directory, not this shared one.
 *
 * This file keeps only the regression guard for a non-portaled widget
 * (Button), confirming RenderWidget's generic tooltip wrapping still applies
 * to widgets outside `WIDGETS_WITH_PORTALED_CONTENT`.
 */
import React from 'react';
import { screen } from '@testing-library/react';
import RenderWidget from '@/AppBuilder/AppCanvas/RenderWidget';
import useStore from '@/AppBuilder/_stores/store';
import { AppBuilderTestSession, defineAppBuilderScenario, seedApp, componentDefinition } from '@/test/app-builder';

const MODULE_ID = 'canvas';

const scenario = defineAppBuilderScenario({
  id: 'widget-tooltip-scope',
  name: 'Widget tooltip scope',
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

const TOOLTIP_TEXT = 'Helpful info';

describe('Regression guard: a non-portaled widget keeps the generic whole-widget tooltip', () => {
  let session;
  beforeEach(() => {
    session = new AppBuilderTestSession({ scenario });
  });

  test('Button (not in WIDGETS_WITH_PORTALED_CONTENT) is still wrapped by RenderWidget’s tooltip', async () => {
    renderWidget(session, {
      id: 'btn1',
      name: 'button1',
      type: 'Button',
      properties: { text: { value: 'Click me' }, tooltip: { value: TOOLTIP_TEXT } },
    });

    await screen.findByText('Click me');
    const widgetWrapper = document.querySelector('[data-cy="draggable-widget-button1"]');

    expect(widgetWrapper).toBeInTheDocument();
    expect(widgetWrapper).toHaveAttribute('data-state');
  });
});
