/**
 * Shared-layer spec for the widget tooltip.
 *
 * Commissioned by decision D-02, recorded in every option-widget contract
 * (`src/test/app-builder/widgets/<Widget>/TESTING.md`). `tooltip` and `tooltipFormat`
 * are declared by each widget's registered definition but implemented once, in
 * `RenderWidget` (`RenderWidget.jsx:293-301` into `WidgetTooltip`). Testing it
 * per widget would be the same test copied N times, so each widget contract
 * points here with a `shared:` disposition instead.
 *
 * The behaviour under test is `RenderWidget`'s, not RadioButtonV2's — that
 * widget is only the cheapest real component to hang a tooltip on. The one
 * widget-specific thing being pinned is which bucket the tooltip is read from:
 * widgets listed in `SHOULD_ADD_BOX_SHADOW_AND_VISIBILITY` keep it under
 * `properties`, everything else under `general`.
 *
 * Finding from the sensitivity pass on 2026-09-04: the "blank tooltip" gate is
 * implemented TWICE — `hasUserTooltip` in RenderWidget.jsx:301 and `trimmed` in
 * WidgetTooltip.jsx — and either one alone suppresses the tooltip. Removing the
 * trim from either site individually does not fail TOOLTIP-004; only removing
 * both does. The scenario is therefore on the live path, but a regression at one
 * of the two sites would go unnoticed. Collapsing them to one guard is the fix,
 * and it is a production change no approved scenario covers yet.
 */
import { screen, waitFor } from '@testing-library/react';
import {
  createWidgetHarness,
  binding,
  radioButtonV2Defaults,
} from '@/AppBuilder/Widgets/__tests__/integration/widgetHarness';

const ID = 'radio1';

const widget = createWidgetHarness({
  componentType: 'RadioButtonV2',
  handle: 'radiobutton1',
  id: ID,
  ...radioButtonV2Defaults,
  defaultProperties: {
    ...radioButtonV2Defaults.defaultProperties,
    options: { value: [{ label: 'Alpha', value: 'a' }] },
  },
});

async function hoverTooltip() {
  await widget.session.user.hover(screen.getByRole('radiogroup'));
}

describe('RenderWidget tooltip', () => {
  beforeEach(() => widget.setup());
  afterEach(() => widget.teardown());

  test('[RenderWidget-TOOLTIP-001] a configured plain-text tooltip is shown on hover', async () => {
    // Break this catches: reading the tooltip from `general` for a widget that
    // declares it under `properties` silently drops every tooltip on the
    // sixteen widgets in SHOULD_ADD_BOX_SHADOW_AND_VISIBILITY.
    widget.render({ properties: { tooltip: binding('Choose a side'), tooltipFormat: binding('plainText') } });

    await hoverTooltip();
    await waitFor(() => expect(screen.getAllByText('Choose a side').length).toBeGreaterThan(0));
  });

  test('[RenderWidget-TOOLTIP-002] a markdown tooltip is routed through the markdown renderer', async () => {
    // Break this catches: dropping the format switch sends markdown down the
    // plain-text arm, so every markdown tooltip in an app renders its source.
    widget.render({ properties: { tooltip: binding('a **bold** hint'), tooltipFormat: binding('markdown') } });

    await hoverTooltip();
    const markdown = await waitFor(() => {
      const found = document.querySelector('.widget-tooltip-markdown');
      expect(found).not.toBeNull();
      return found;
    });
    // `react-markdown` is stubbed to a pass-through in jest.config.js, so what
    // is assertable here is that the markdown BRANCH was taken and handed the
    // source through. Whether the parser turns `**bold**` into <strong> is
    // react-markdown's own contract, not this layer's.
    expect(markdown).toHaveTextContent('a **bold** hint');
  });

  test('[RenderWidget-TOOLTIP-003] an html tooltip is rendered sanitized', async () => {
    // Break this catches: rendering html without DOMPurify would let an app
    // author's tooltip run script on every viewer's canvas.
    widget.render({
      properties: {
        tooltip: binding('<em>hint</em><img src="x" onerror="window.__xss = true" />'),
        tooltipFormat: binding('html'),
      },
    });

    await hoverTooltip();
    const html = await waitFor(() => {
      const found = document.querySelector('.widget-tooltip-html');
      expect(found).not.toBeNull();
      return found;
    });
    expect(html.querySelector('em')).toHaveTextContent('hint');
    expect(html.querySelector('img')).not.toHaveAttribute('onerror');
  });

  test('[RenderWidget-TOOLTIP-004] no tooltip is shown when the property is empty or whitespace', async () => {
    // Break this catches: a truthiness check instead of a trimmed one pops an
    // empty tooltip on hover for every widget whose author typed a space.
    widget.render({ properties: { tooltip: binding('   '), tooltipFormat: binding('plainText') } });

    await hoverTooltip();
    // capabilities.time fake timers hang Radix/user-event hover in this spec.
    // delayDuration is 500ms (WidgetTooltip.jsx); this exceeds that constant.
    await new Promise((resolve) => setTimeout(resolve, 600));
    expect(document.querySelector('[role="tooltip"]')).toBeNull();
    expect(document.querySelector('.widget-tooltip-markdown')).toBeNull();
  });

  test('[RenderWidget-TOOLTIP-005] a tooltip declared under general is shown on hover', async () => {
    // Break this catches: always reading from `properties` drops the tooltip
    // on every widget that only declares it under `general` (Spinner, via the
    // universal `general.tooltip` in componentTypes.js — it is not in
    // SHOULD_ADD_BOX_SHADOW_AND_VISIBILITY).
    const spinner = createWidgetHarness({
      componentType: 'Spinner',
      handle: 'spinner1',
      id: 'spinner1',
    });
    spinner.setup();
    spinner.render({
      afterSeed: () => spinner.setComponentProperty('spinner1', 'tooltip', 'Choose a side', 'general'),
    });
    await spinner.session.user.hover(document.querySelector('[data-cy="draggable-widget-spinner1"]'));
    await waitFor(() => expect(screen.getAllByText('Choose a side').length).toBeGreaterThan(0));
    spinner.teardown();
  });
});
