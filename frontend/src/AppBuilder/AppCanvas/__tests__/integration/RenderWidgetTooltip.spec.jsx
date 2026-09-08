/**
 * Shared-layer spec for the widget tooltip.
 *
 * Commissioned by decision D-02, recorded in every option-widget contract
 * (`ee/test/app-builder/widgets/<Widget>/TESTING.md`). `tooltip` and `tooltipFormat`
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
import { getTooltipCollisionBoundary } from '@/AppBuilder/AppCanvas/WidgetTooltip';
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

/**
 * Collision boundary — reported by QA 2026-09-08.
 *
 * Radix avoids collisions against the VIEWPORT by default, and the editor's
 * left sidebar is inside the viewport, so a tooltip on a widget near the left
 * edge of a horizontally scrolled canvas paints straight over it.
 *
 * The boundary must be the element that actually scrolls — `.canvas-container`,
 * a flex sibling of the sidebar, whose rect is always the visible canvas area
 * beside it. NOT `#real-canvas`: that is the scrolled *content*, and once the
 * canvas is scrolled right its own left edge is already under the sidebar.
 * (ColorPicker.jsx:403 bounds to `#real-canvas` and has the same latent gap.)
 *
 * Jest can only pin the wiring. Whether the tooltip visually clears the sidebar
 * is resolved by Radix from real getBoundingClientRect values, and jsdom has no
 * layout — so that outcome is browser-owned:
 *
 *   [RenderWidget-TOOLTIP-BRW-001]  Layer: Browser  Owner: QA
 *   Guarantee: with the canvas scrolled horizontally and a widget positioned so
 *   its tooltip would extend past the left edge of the canvas viewport, the
 *   tooltip is repositioned to stay inside the canvas and never overlaps the
 *   left sidebar. Same for the right sidebar and the canvas header.
 */
describe('tooltip collision boundary', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  test('[RenderWidget-TOOLTIP-006] the boundary is the canvas scroll container', () => {
    // Break this catches: returning the viewport (null) inside the editor lets
    // Radix place a tooltip over the left sidebar — the reported bug.
    document.body.innerHTML = '<div class="canvas-container page-container"></div>';

    expect(getTooltipCollisionBoundary()).toBe(document.querySelector('.canvas-container'));
  });

  test('[RenderWidget-TOOLTIP-007] the boundary is the scroll container, not the scrolled canvas content', () => {
    // Break this catches: bounding to `#real-canvas` instead. That element is
    // the content INSIDE the scroll container, so a horizontally scrolled canvas
    // already extends under the sidebar and the tooltip follows it there.
    document.body.innerHTML = '<div class="canvas-container page-container"><div id="real-canvas"></div></div>';

    expect(getTooltipCollisionBoundary()).not.toBe(document.getElementById('real-canvas'));
    expect(getTooltipCollisionBoundary()).toBe(document.querySelector('.canvas-container'));
  });

  test('[RenderWidget-TOOLTIP-009] in the viewer it is the app canvas, not the outer viewer wrapper', () => {
    // Break this catches: the viewer nests TWO .canvas-container elements —
    // Viewer.jsx:173 wraps the page-navigation sidebar, AppCanvas.jsx:228 sits
    // inside `.canvas-box`, which clears that sidebar with a 256px margin.
    // A bare `.canvas-container` selector takes the FIRST in document order,
    // which is the outer wrapper, so a tooltip could still cover the viewer's
    // page sidebar.
    document.body.innerHTML = `
      <div class="canvas-container align-items-center">
        <div class="canvas-box">
          <div class="canvas-container page-container" id="app-canvas"></div>
        </div>
      </div>`;

    expect(getTooltipCollisionBoundary()).toBe(document.getElementById('app-canvas'));
  });

  test('[RenderWidget-TOOLTIP-008] outside the editor it falls back to the viewport', () => {
    // Break this catches: returning some other element in the viewer, where
    // there is no canvas-container and no sidebar to avoid, would bound every
    // tooltip to the wrong box.
    expect(getTooltipCollisionBoundary()).toBeNull();
  });
});
