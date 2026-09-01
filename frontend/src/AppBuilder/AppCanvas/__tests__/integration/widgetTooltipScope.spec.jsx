/**
 * ModalV2's tooltip used to fire on hovering anywhere in the widget
 * (RenderWidget wrapped the whole output in WidgetTooltip, and React events
 * bubble the portaled modal content back up through it). Fix scopes the
 * tooltip to just the trigger button via RenderWidget's
 * WIDGETS_WITH_PORTALED_CONTENT + ModalV2's own WidgetTooltip.
 *
 * Modal stays closed throughout — opening it needs react-dnd's DndProvider,
 * which this harness doesn't have (see modal.spec.jsx). `data-state`, set by
 * Radix's TooltipTrigger the instant it mounts, marks which node is the
 * actual trigger without needing to simulate hover for every check.
 */
import React from 'react';
import { act, fireEvent, screen, waitFor } from '@testing-library/react';
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

describe('Modal v2 tooltip is scoped to its trigger button', () => {
  let session;
  beforeEach(() => {
    session = new AppBuilderTestSession({ scenario });
  });

  test('data-state (the Radix tooltip trigger marker) lands on the launch button, not the widget wrapper', async () => {
    renderWidget(session, {
      id: 'modal1',
      name: 'modal1',
      type: 'ModalV2',
      properties: {
        tooltip: { value: TOOLTIP_TEXT },
        useDefaultButton: { value: true },
        visibility: { value: true },
      },
    });

    const launchButton = await waitFor(() => {
      const el = document.querySelector('[data-cy="modal1-launch-button"]');
      expect(el).toBeInTheDocument();
      return el;
    });
    const widgetWrapper = document.querySelector('[data-cy="draggable-widget-modal1"]');

    expect(widgetWrapper).toBeInTheDocument();
    expect(widgetWrapper).not.toHaveAttribute('data-state'); // bug: wrapper used to be the trigger
    expect(launchButton).toHaveAttribute('data-state'); // fix: only the button is
  });

  test('hovering the launch button shows the tooltip; hovering elsewhere in the widget does not', async () => {
    renderWidget(session, {
      id: 'modal1',
      name: 'modal1',
      type: 'ModalV2',
      properties: {
        tooltip: { value: TOOLTIP_TEXT },
        useDefaultButton: { value: true },
        visibility: { value: true },
      },
    });

    const launchButton = await waitFor(() => {
      const el = document.querySelector('[data-cy="modal1-launch-button"]');
      expect(el).toBeInTheDocument();
      return el;
    });
    const widgetWrapper = document.querySelector('[data-cy="draggable-widget-modal1"]');

    // stand-in for hovering the open (portaled) modal body — the actual bug
    await act(async () => {
      fireEvent.pointerMove(widgetWrapper);
    });
    await new Promise((resolve) => setTimeout(resolve, 700)); // past Radix's 500ms open delay
    expect(screen.queryByText(TOOLTIP_TEXT)).not.toBeInTheDocument();

    await act(async () => {
      fireEvent.pointerMove(launchButton);
    });
    // Radix duplicates the text (visible + visually-hidden a11y span) — assert by data-cy, not text
    await waitFor(() => expect(document.querySelector('[data-cy="widget-tooltip"]')).toHaveTextContent(TOOLTIP_TEXT), {
      timeout: 2000,
    });
  });
});

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
