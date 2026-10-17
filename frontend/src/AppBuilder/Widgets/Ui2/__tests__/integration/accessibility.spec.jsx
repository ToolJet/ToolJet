/**
 * axe-core over every UI 2.0 widget: its defaults, disabled, in its error state (mandatory and empty after a form's
 * submit attempt, for the widgets with validation), and with its overlay open. jsdom has no layout, so colour contrast
 * is checked in browsers (npm run test:ui2-browsers), not here; `region` is a page rule (landmarks), not a widget's.
 */
import { createWidgetHarness, measureChartsAt } from '@/AppBuilder/Widgets/Ui2/__tests__/ui2Harness';
import React from 'react';
import { act, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { configureAxe } from 'jest-axe';
import RenderWidget from '@/AppBuilder/AppCanvas/RenderWidget';
import FormSignalContext from '@/AppBuilder/Widgets/Form/FormSignalContext';
import { binding, widgetProps } from '@/AppBuilder/Widgets/__tests__/integration/widgetHarness';
import {
  CONFIGS,
  OPENS,
  OVERLAY,
  TYPES,
  addPageCanvas,
  boxOf,
  openOverlay,
} from '@/AppBuilder/Widgets/Ui2/__tests__/packPage';

measureChartsAt(400, 200);

const axe = configureAxe({ rules: { 'color-contrast': { enabled: false }, region: { enabled: false } } });
const VALIDATED = TYPES.filter((type) => 'mandatory' in (CONFIGS[type].validation || {}));

/** axe's violations as one readable line each: rule, impact and the first few nodes it found. */
const violations = async (node) =>
  (await axe(node)).violations.map(
    (v) =>
      `${v.id} (${v.impact}): ${v.nodes
        .slice(0, 3)
        .map((n) => n.target.join(' '))
        .join(' | ')}`
  );

// What opens a widget's overlay: a trigger button, a combobox, or the Dialog's button.
const TRIGGER = '[aria-haspopup], [role="combobox"], button';
const settle = () => act(() => new Promise((r) => setTimeout(r, 30)));

describe.each(TYPES)('%s accessibility', (type) => {
  const box = boxOf(type);
  const widget = createWidgetHarness({
    componentType: type,
    handle: 'a11y1',
    id: 'a11y1',
    widgetWidth: box.width,
    widgetHeight: box.height,
    capabilities: { dnd: true },
  });
  const mount = async (options = {}) => {
    const view = widget.render({ currentMode: 'view', ...options });
    await waitFor(() => expect(view.container.querySelector('.tj-shadcn, .modal-trigger, button')).toBeTruthy());
    await settle();
    return view;
  };
  let removeCanvas;
  beforeEach(() => {
    removeCanvas = addPageCanvas();
    return widget.setup();
  });
  afterEach(() => {
    widget.teardown();
    removeCanvas();
  });

  test(`[${type}-A11Y-001] its defaults have no axe violations`, async () => {
    await mount();
    expect(await violations(document.body)).toEqual([]);
  });

  test(`[${type}-A11Y-002] disabled, it has no axe violations`, async () => {
    await mount({ properties: { disabledState: binding('{{true}}') } });
    expect(await violations(document.body)).toEqual([]);
  });

  if (VALIDATED.includes(type))
    test(`[${type}-A11Y-003] in its error state it has no axe violations, and its control is invalid and described by the error`, async () => {
      await mount({ validation: { mandatory: binding('{{true}}') }, properties: { defaultValue: binding('') } });
      // As a form shows it after a submit attempt.
      act(() =>
        widget.session.render(
          <FormSignalContext.Provider value={{ submitAttemptCount: 1, clearCount: 0 }}>
            <RenderWidget
              {...widgetProps('a11y1', type, { currentMode: 'view', widgetWidth: box.width, widgetHeight: box.height })}
            />
          </FormSignalContext.Provider>
        )
      );
      await waitFor(() => expect(document.querySelector('[aria-invalid=true]')).toBeTruthy());
      const control = document.querySelector('[aria-invalid=true]');
      const note = document.getElementById(control.getAttribute('aria-describedby'));
      expect(note).toHaveAttribute('role', 'alert');
      expect(await violations(document.body)).toEqual([]);
    });

  if (OPENS.has(type)) {
    test(`[${type}-A11Y-004] with its overlay open it has no axe violations`, async () => {
      await mount();
      await openOverlay(widget.exposed());
      await waitFor(() => expect(document.querySelector(OVERLAY)).toBeTruthy());
      await settle();
      expect(await violations(document.body)).toEqual([]);
    });

    test(`[${type}-A11Y-005] opens from the keyboard, takes focus, closes on Escape and gives focus back`, async () => {
      const { container } = await mount();
      const user = userEvent.setup({ delay: null });
      const trigger = container.querySelector(TRIGGER);
      await act(async () => trigger.focus());
      await user.keyboard('{Enter}');
      await waitFor(() => expect(document.querySelector(OVERLAY)).toBeTruthy());
      const overlay = document.querySelector(OVERLAY);
      await waitFor(() => expect(overlay.contains(document.activeElement)).toBe(true));
      if (type === 'ShadDialog') {
        // A modal dialog keeps Tab inside it.
        for (let i = 0; i < 8; i += 1) {
          await user.tab();
          expect(overlay.contains(document.activeElement)).toBe(true);
        }
      }
      await user.keyboard('{Escape}');
      await waitFor(() => expect(document.querySelector(OVERLAY)).toBeNull());
      await waitFor(() => expect(document.activeElement).toBe(trigger));
    });
  }
});
