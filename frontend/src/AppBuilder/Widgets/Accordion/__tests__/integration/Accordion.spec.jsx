/**
 * Accordion widget behaviour.
 *
 * Contract: frontend/ee/test/app-builder/widgets/Accordion/TESTING.md
 * Every test title starts with its approved scenario ID; the `// Break this catches:`
 * comment names the production edit its oracle is meant to catch.
 *
 * The chevron is addressed BY ROLE throughout. Its `data-cy` was unscoped until D-04's fix,
 * and its accessible name is itself part of the contract (Accordion-A11Y-002).
 */
import { fireEvent, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  createWidgetHarness,
  binding,
  drain,
  countInvocationsOn,
} from '@/AppBuilder/Widgets/__tests__/integration/widgetHarness';
import { componentDefinition } from '@/test/app-builder';

const ID = 'a1';
const NAME = 'accordion1';

const harness = createWidgetHarness({
  componentType: 'Accordion',
  handle: NAME,
  id: ID,
  // AppCanvas/Container throws `Expected drag drop context` without the real DndProvider.
  capabilities: { dnd: true },
  widgetHeight: 450,
  widgetWidth: 600,
});

const root = () => document.getElementById(ID);
const bodyCanvas = () => document.getElementById(`canvas-${ID}`);
const headerCanvas = () => document.getElementById(`canvas-${ID}-header`);
const headerRegion = () => document.querySelector('.tj-accordion-header');
const content = () => document.querySelector('.widget-type-container');
const chevron = () => screen.queryByRole('button', { name: /accordion/i });
const childOf = (parent, id, name, text) => {
  const child = componentDefinition(id, name, 'Text', { text: binding(text) });
  child.component.parent = parent;
  return child;
};
const childNode = (name) => document.querySelector(`[data-cy="draggable-widget-${name}"]`);

/**
 * The first mount of a widget inside the sub-canvas compiles the whole WidgetWrapper dependency
 * tree — measured at ~4s warm on the sibling Container suite, and enough to blow Jest's 5s
 * per-test timeout on a cold cache. Paid once here so no scenario's waitFor measures compilation.
 */
beforeAll(async () => {
  const warm = createWidgetHarness({
    componentType: 'Accordion',
    handle: NAME,
    id: ID,
    capabilities: { dnd: true },
    widgetHeight: 450,
    widgetWidth: 600,
  });
  warm.setup();
  warm.render({ extraComponents: { warmkid: childOf(ID, 'warmkid', 'warmtext', 'warm') } });
  await waitFor(() => expect(document.querySelector('[data-cy="draggable-widget-warmtext"]')).toBeTruthy(), {
    timeout: 120000,
  });
  warm.teardown();
  const sessions = globalThis.__TOOLJET_APP_BUILDER_TEST_SESSIONS__ || [];
  while (sessions.length) await sessions.pop()();
  require('zustand').__resetAllStores?.();
}, 180000);

beforeEach(() => harness.setup());
afterEach(() => harness.teardown());

/**
 * A genuinely fresh MOUNT. `harness.teardown()` does not unmount — the global afterEach does —
 * so without draining the session queue the previous render stays in the document and every
 * document-wide lookup silently hits the stale one.
 */
async function remount() {
  harness.teardown();
  const sessions = globalThis.__TOOLJET_APP_BUILDER_TEST_SESSIONS__ || [];
  while (sessions.length) await sessions.pop()();
  require('zustand').__resetAllStores?.();
  harness.setup();
}

describe('Accordion: base rendering', () => {
  // Break this catches: the body sub-canvas no longer being mounted, which would leave every
  // child of every Accordion unrendered with no error anywhere.
  test('[Accordion-RENDER-001] a default Accordion renders expanded with its header, chevron and body canvas', async () => {
    harness.render();

    await waitFor(() => expect(root()).toBeTruthy());
    expect(root().className).toContain('jet-container');
    expect(root().className).toContain('jet-accordion-expanded');
    expect(headerRegion()).toBeTruthy();
    expect(headerCanvas()).toBeTruthy();
    expect(bodyCanvas()).toBeTruthy();
    expect(chevron()).toBeTruthy();
    await waitFor(() => expect(harness.exposed().isExpanded).toBe(true));
  });
});

describe('Accordion: expanding and collapsing', () => {
  // Break this catches: the collapse branch no longer hiding the content, so the chevron
  // becomes decorative and an accordion can never actually collapse.
  test('[Accordion-EXP-001] the chevron collapses and expands the Accordion', async () => {
    harness.render();
    await waitFor(() => expect(chevron()).toBeTruthy());
    expect(content().style.display).toBe('flex');

    await userEvent.click(chevron());

    await waitFor(() => expect(content().style.display).toBe('none'));
    expect(root().className).toContain('jet-accordion-collapsed');
    expect(root().className).not.toContain('jet-accordion-expanded');
    expect(harness.exposed().isExpanded).toBe(false);

    await userEvent.click(chevron());

    await waitFor(() => expect(content().style.display).toBe('flex'));
    expect(root().className).toContain('jet-accordion-expanded');
    expect(harness.exposed().isExpanded).toBe(true);
  });

  // Break this catches: changing the collapsed-height arithmetic. The accordion would either
  // clip its own header or leave a gap under it on every collapse.
  test('[Accordion-EXP-002] a collapsed Accordion is exactly its header height plus twelve', async () => {
    harness.render();
    await waitFor(() => expect(chevron()).toBeTruthy());
    // RenderWidget passes height = widgetHeight - 4.
    expect(root().style.height).toBe('446px');

    await userEvent.click(chevron());

    // Hand-derived: the registered default headerHeight 80 (Container's is 60) +
    // CONTAINER_FORM_CANVAS_PADDING 7 + 3 bottom padding + 2 borders.
    await waitFor(() => expect(root().style.height).toBe('92px'));
  });

  test('[Accordion-EXP-002] the collapsed height follows a configured header height', async () => {
    harness.render({ properties: { headerHeight: binding('{{120}}') } });
    await waitFor(() => expect(chevron()).toBeTruthy());

    await userEvent.click(chevron());

    await waitFor(() => expect(root().style.height).toBe('132px'));
  });

  // Break this catches: implementing collapse by unmounting the content instead of hiding it.
  // Every child would lose its state on each collapse — a half-filled form inside an accordion
  // would empty itself when the user folded the section away.
  test('[Accordion-EXP-003] collapsing hides the children without unmounting them, unlike loading', async () => {
    harness.render({ extraComponents: { kid: childOf(ID, 'kid', 'bodytext', 'inside') } });
    await waitFor(() => expect(childNode('bodytext')).toBeTruthy());

    await userEvent.click(chevron());

    // Collapsed: hidden, but still mounted.
    await waitFor(() => expect(content().style.display).toBe('none'));
    expect(childNode('bodytext')).toBeTruthy();

    // Loading: genuinely unmounted, which is the contrast that makes the above meaningful.
    harness.setComponentProperty(ID, 'loadingState', '{{true}}', 'properties');
    await waitFor(() => expect(childNode('bodytext')).toBeNull());
  });

  // Break this catches: seeding isExpanded from anything that could persist a collapsed state
  // without a property to author it — the contract today is that an accordion always opens.
  test('[Accordion-EXP-004] an Accordion always mounts expanded', async () => {
    harness.render();
    await waitFor(() => expect(chevron()).toBeTruthy());
    await userEvent.click(chevron());
    await waitFor(() => expect(harness.exposed().isExpanded).toBe(false));

    // A fresh mount, after the widget was left collapsed.
    await remount();
    harness.render();
    await waitFor(() => expect(root()).toBeTruthy());
    expect(root().className).toContain('jet-accordion-expanded');
    await waitFor(() => expect(harness.exposed().isExpanded).toBe(true));

    // And no registered property exists that could have authored it collapsed.
    const registered = harness.session.store.read(
      (st) => st.getComponentDefinition(ID, 'canvas').component.definition.properties
    );
    expect(Object.keys(registered)).not.toContain('isExpanded');
    expect(Object.keys(registered)).not.toContain('expanded');
  });

  // Break this catches: dropping the `showHeader ||` half of the display expression, which would
  // hide every headerless accordion outright — or adding it where it does not belong.
  test('[Accordion-EXP-005] a collapsed Accordion with no header hides completely and only a CSA brings it back', async () => {
    harness.render({ properties: { showHeader: binding('{{false}}') } });
    await waitFor(() => expect(root()).toBeTruthy());
    // Headerless but expanded: still visible, and there is no chevron to collapse it with.
    expect(root().style.display).toBe('flex');
    expect(chevron()).toBeNull();

    await harness.act('collapse');

    await waitFor(() => expect(root().style.display).toBe('none'));
    expect(chevron()).toBeNull();

    await harness.act('expand');
    await waitFor(() => expect(root().style.display).toBe('flex'));
  });

  test('[Accordion-EXP-005] a collapsed Accordion WITH a header stays visible', async () => {
    harness.render();
    await waitFor(() => expect(chevron()).toBeTruthy());

    await userEvent.click(chevron());

    await waitFor(() => expect(root().className).toContain('jet-accordion-collapsed'));
    expect(root().style.display).toBe('flex');
  });

  // Break this catches: poking the editor grid from the Viewer too, which would churn the
  // canvas updater for every end user expanding a section.
  //
  // Measured: the shared reflow ALSO bumps this counter (gridSlice.js:223) and, per D-02, runs
  // in view mode regardless of the dynamicHeight property — so the counter alone cannot separate
  // the two. They differ in TIMING: the widget's poke is synchronous with the state commit,
  // while the reflow's rides a requestAnimationFrame. The oracle therefore reads the counter
  // immediately after a synchronous click, before any frame has run.
  test('[Accordion-EXP-006] expanding pokes the editor grid only in edit mode', async () => {
    const updater = () => harness.session.store.read((st) => st.triggerCanvasUpdater);

    harness.render({ currentMode: 'edit' });
    await waitFor(() => expect(chevron()).toBeTruthy());
    fireEvent.click(chevron());
    await waitFor(() => expect(harness.exposed().isExpanded).toBe(false));

    const beforeEditExpand = updater();
    fireEvent.click(chevron());
    expect(updater()).toBe(beforeEditExpand + 1);

    await remount();
    harness.render({ currentMode: 'view' });
    await waitFor(() => expect(chevron()).toBeTruthy());
    fireEvent.click(chevron());
    await waitFor(() => expect(harness.exposed().isExpanded).toBe(false));

    const beforeViewExpand = updater();
    fireEvent.click(chevron());
    expect(updater()).toBe(beforeViewExpand);
  });
});

describe('Accordion: events', () => {
  // Break this catches: firing onExpand from the state effect as well as the handler, which
  // would double every analytics call and every query an app hangs off the event.
  test('[Accordion-EVT-001] onExpand fires exactly once, from the chevron and from the CSA', async () => {
    harness.render({ events: countInvocationsOn(ID, 'onExpand', { key: 'expands' }) });
    await waitFor(() => expect(chevron()).toBeTruthy());

    // Collapse first (must not fire onExpand), then expand via the chevron.
    await userEvent.click(chevron());
    await drain();
    expect(harness.variables()?.expands ?? 0).toBe(0);

    await userEvent.click(chevron());
    await waitFor(() => expect(harness.variables()?.expands).toBe(1));

    // The CSA path fires it exactly once more.
    await harness.act('collapse');
    await harness.act('expand');
    await waitFor(() => expect(harness.variables()?.expands).toBe(2));
  });

  // Break this catches: the same double-fire on the collapse side, or the chevron firing the
  // wrong event when it toggles.
  test('[Accordion-EVT-002] onCollapse fires exactly once, from the chevron and from the CSA', async () => {
    harness.render({ events: countInvocationsOn(ID, 'onCollapse', { key: 'collapses' }) });
    await waitFor(() => expect(chevron()).toBeTruthy());

    await userEvent.click(chevron());
    await waitFor(() => expect(harness.variables()?.collapses).toBe(1));

    // Expanding must not fire it.
    await userEvent.click(chevron());
    await drain();
    expect(harness.variables().collapses).toBe(1);

    await harness.act('collapse');
    await waitFor(() => expect(harness.variables().collapses).toBe(2));
  });
});

describe('Accordion: component-specific actions', () => {
  // Break this catches: expand() updating local state without writing the exposed variable, so
  // an app reading {{components.accordion1.isExpanded}} would see a stale value forever.
  test('[Accordion-CSA-001] expand() expands the Accordion and publishes isExpanded', async () => {
    harness.render({ events: countInvocationsOn(ID, 'onExpand', { key: 'expands' }) });
    await waitFor(() => expect(chevron()).toBeTruthy());
    await harness.act('collapse');
    await waitFor(() => expect(content().style.display).toBe('none'));

    await harness.act('expand');

    await waitFor(() => expect(content().style.display).toBe('flex'));
    expect(root().className).toContain('jet-accordion-expanded');
    expect(harness.exposed().isExpanded).toBe(true);
    await waitFor(() => expect(harness.variables()?.expands).toBe(1));
  });

  // Break this catches: collapse() failing to publish isExpanded or to fire its event.
  test('[Accordion-CSA-002] collapse() collapses the Accordion and publishes isExpanded', async () => {
    harness.render({ events: countInvocationsOn(ID, 'onCollapse', { key: 'collapses' }) });
    await waitFor(() => expect(chevron()).toBeTruthy());

    await harness.act('collapse');

    await waitFor(() => expect(content().style.display).toBe('none'));
    expect(root().className).toContain('jet-accordion-collapsed');
    expect(harness.exposed().isExpanded).toBe(false);
    await waitFor(() => expect(harness.variables()?.collapses).toBe(1));
  });

  // Break this catches: setVisibility writing only the exposed variable and not the local state
  // the display expression reads, so the accordion would report itself hidden while still showing.
  test('[Accordion-CSA-003] setVisibility drives visibility at runtime', async () => {
    harness.render();
    await waitFor(() => expect(root()).toBeTruthy());
    expect(root().style.display).toBe('flex');

    await harness.act('setVisibility', false);

    await waitFor(() => expect(root().style.display).toBe('none'));
    expect(harness.exposed().isVisible).toBe(false);

    await harness.act('setVisibility', true);
    await waitFor(() => expect(root().style.display).toBe('flex'));
    expect(harness.exposed().isVisible).toBe(true);
  });

  // Break this catches: setDisable not reaching the chevron, leaving a disabled accordion
  // still collapsible by the user.
  test('[Accordion-CSA-004] setDisable drives the disabled state at runtime', async () => {
    harness.render();
    await waitFor(() => expect(chevron()).toBeTruthy());
    expect(root().getAttribute('data-disabled')).toBe('false');

    await harness.act('setDisable', true);

    await waitFor(() => expect(root().getAttribute('data-disabled')).toBe('true'));
    expect(content().style.pointerEvents).toBe('none');
    expect(content().style.opacity).toBe('0.5');
    expect(chevron()).toBeDisabled();
    expect(harness.exposed().isDisabled).toBe(true);

    await harness.act('setDisable', false);
    await waitFor(() => expect(root().getAttribute('data-disabled')).toBe('false'));
    expect(chevron()).not.toBeDisabled();
  });

  // Break this catches: setLoading writing the exposed variable but not the state that swaps in
  // the spinner, so a query could never show an accordion as loading.
  test('[Accordion-CSA-005] setLoading drives the loading state at runtime', async () => {
    harness.render({ extraComponents: { kid: childOf(ID, 'kid', 'bodytext', 'inside') } });
    await waitFor(() => expect(childNode('bodytext')).toBeTruthy());

    await harness.act('setLoading', true);

    await waitFor(() => expect(bodyCanvas()).toBeNull());
    expect(headerRegion()).toBeNull();
    expect(harness.exposed().isLoading).toBe(true);

    await harness.act('setLoading', false);
    await waitFor(() => expect(childNode('bodytext')).toBeTruthy());
    expect(harness.exposed().isLoading).toBe(false);
  });

  // Break this catches: replacing useBatchedUpdateEffectArray's `prev !== dep` comparison with an
  // unconditional run. Any unrelated re-render would then silently undo a setDisable() an app had
  // just performed — the classic "my CSA doesn't stick" bug, reached here by a different
  // mechanism from Container's React dependency array.
  test('[Accordion-CSA-006] a CSA-set state survives a no-op property rewrite but yields to a real change', async () => {
    harness.render({ properties: { disabledState: binding('{{true}}') } });
    await waitFor(() => expect(root().getAttribute('data-disabled')).toBe('true'));

    await harness.act('setDisable', false);
    await waitFor(() => expect(root().getAttribute('data-disabled')).toBe('false'));

    // A rewrite to the value the property ALREADY held must not clobber the CSA.
    harness.setComponentProperty(ID, 'disabledState', '{{true}}', 'properties');
    await drain();
    expect(root().getAttribute('data-disabled')).toBe('false');
    expect(harness.exposed().isDisabled).toBe(false);

    // A genuinely changed property does win.
    harness.setComponentProperty(ID, 'disabledState', '{{false}}', 'properties');
    await drain();
    harness.setComponentProperty(ID, 'disabledState', '{{true}}', 'properties');
    await waitFor(() => expect(root().getAttribute('data-disabled')).toBe('true'));
    expect(harness.exposed().isDisabled).toBe(true);
  });
});

describe('Accordion: the three shared states', () => {
  // Break this catches: dropping the isVisible half of the display expression, leaving a
  // container visible in the Viewer after an app hid it.
  test('[Accordion-STATE-001] visibility hides the Accordion and publishes isVisible', async () => {
    harness.render({ properties: { visibility: binding('{{false}}') } });
    await waitFor(() => expect(root()).toBeTruthy());
    expect(root().style.display).toBe('none');
    await waitFor(() => expect(harness.exposed().isVisible).toBe(false));

    harness.setComponentProperty(ID, 'visibility', '{{true}}', 'properties');
    await waitFor(() => expect(root().style.display).toBe('flex'));
    expect(harness.exposed().isVisible).toBe(true);
  });

  // Break this catches: removing the isDisabled guard on the content style, leaving a disabled
  // accordion's children fully interactive while looking disabled.
  test('[Accordion-STATE-002] a disabled Accordion blocks its body and publishes isDisabled', async () => {
    harness.render({ properties: { disabledState: binding('{{true}}') } });
    await waitFor(() => expect(root()).toBeTruthy());

    expect(root().getAttribute('data-disabled')).toBe('true');
    expect(content().getAttribute('data-disabled')).toBe('true');
    expect(content().style.pointerEvents).toBe('none');
    expect(content().style.opacity).toBe('0.5');
    await waitFor(() => expect(harness.exposed().isDisabled).toBe(true));

    harness.setComponentProperty(ID, 'disabledState', '{{false}}', 'properties');
    await waitFor(() => expect(root().getAttribute('data-disabled')).toBe('false'));
    expect(content().style.pointerEvents).toBe('');
  });

  // Break this catches: rendering the spinner alongside the body instead of instead of it, so
  // children keep running behind a spinner that claims to be loading.
  test('[Accordion-STATE-003] loading replaces the whole body, destroying and remounting children', async () => {
    harness.render({ extraComponents: { kid: childOf(ID, 'kid', 'bodytext', 'inside') } });
    await waitFor(() => expect(childNode('bodytext')).toBeTruthy());

    harness.setComponentProperty(ID, 'loadingState', '{{true}}', 'properties');

    await waitFor(() => expect(childNode('bodytext')).toBeNull());
    expect(bodyCanvas()).toBeNull();
    expect(headerRegion()).toBeNull();
    await waitFor(() => expect(harness.exposed().isLoading).toBe(true));

    harness.setComponentProperty(ID, 'loadingState', '{{false}}', 'properties');
    await waitFor(() => expect(childNode('bodytext')).toBeTruthy());
    expect(harness.exposed().isLoading).toBe(false);
  });
});

describe('Accordion: the header', () => {
  const headerSlot = () => headerRegion().querySelector('.resizable-slot');

  // Break this catches: inverting the showHeader branch, which would strip the chevron from
  // every accordion configured to have one — and with it the only way to collapse.
  test('[Accordion-HDR-001] showHeader adds and removes the header region', async () => {
    harness.render({
      properties: { showHeader: binding('{{false}}') },
      extraComponents: { kid: childOf(ID, 'kid', 'bodytext', 'content') },
    });
    await waitFor(() => expect(childNode('bodytext')).toBeTruthy());
    expect(headerRegion()).toBeNull();
    expect(chevron()).toBeNull();

    harness.setComponentProperty(ID, 'showHeader', '{{true}}', 'properties');

    await waitFor(() => expect(headerRegion()).toBeTruthy());
    expect(chevron()).toBeTruthy();
    expect(childNode('bodytext')).toBeTruthy();
  });

  // Break this catches: removing headerHeight from definition.properties. It is declared ONLY
  // there, so nothing would supply it and every header would jump to the component's 80 fallback
  // — which happens to equal the registered default here, so the collapsed-height scenarios
  // would not notice. A configured value is what makes this observable.
  test('[Accordion-HDR-002] headerHeight comes from the definition', async () => {
    harness.render();
    await waitFor(() => expect(headerSlot()).toBeTruthy());
    expect(headerSlot().style.height).toBe('80px');
  });

  test('[Accordion-HDR-002] a configured headerHeight drives the header slot', async () => {
    harness.render({ properties: { headerHeight: binding('{{120}}') } });
    await waitFor(() => expect(headerSlot()).toBeTruthy());
    expect(headerSlot().style.height).toBe('120px');
  });

  // Break this catches: dropping HorizontalSlot's disabled overlay, leaving header children
  // clickable in an accordion the app has disabled.
  test('[Accordion-HDR-003] a disabled Accordion also blocks its header children', async () => {
    harness.render({ properties: { disabledState: binding('{{true}}') } });
    await waitFor(() => expect(document.getElementById(`${ID}-header-disabled`)).toBeTruthy());

    harness.setComponentProperty(ID, 'disabledState', '{{false}}', 'properties');
    await waitFor(() => expect(document.getElementById(`${ID}-header-disabled`)).toBeNull());
  });

  // Break this catches: changing the header's max-height arithmetic, which is what keeps a
  // resized header inside its accordion.
  test('[Accordion-HDR-004] the header max height is derived from the widget height', async () => {
    harness.render();
    await waitFor(() => expect(headerRegion()).toBeTruthy());
    // RenderWidget passes height = widgetHeight - 4, so 450 - 4 - 110.
    expect(headerRegion().style.maxHeight).toBe('336px');
  });

  test('[Accordion-HDR-004] a short Accordion gets a negative header max height, unclamped', async () => {
    await remount();
    const short = createWidgetHarness({
      componentType: 'Accordion',
      handle: NAME,
      id: ID,
      capabilities: { dnd: true },
      widgetHeight: 60,
      widgetWidth: 600,
    });
    short.setup();
    try {
      short.render();
      await waitFor(() => expect(headerRegion()).toBeTruthy());
      expect(headerRegion().style.maxHeight).toBe('-54px');
    } finally {
      short.teardown();
    }
  });

  // Break this catches: rendering the resize handle in the Viewer, letting an end user drag a
  // header they are only meant to look at.
  test('[Accordion-HDR-005] the header resize handle is editor-only', async () => {
    harness.render({ currentMode: 'edit' });
    await waitFor(() => expect(headerRegion()).toBeTruthy());
    expect(headerRegion().querySelector('.resize-handle')).toBeTruthy();

    harness.render({ currentMode: 'view' });
    await waitFor(() => expect(headerRegion()).toBeTruthy());
    expect(headerRegion().querySelector('.resize-handle')).toBeNull();
  });
});

describe('Accordion: children and slots', () => {
  // Break this catches: the header slot being mounted with the body's canvas id, so every
  // header-parented child silently falls into the body.
  test('[Accordion-CHILD-001] header children and body children render in their own slots', async () => {
    harness.render({
      extraComponents: {
        head: childOf(`${ID}-header`, 'head', 'headertext', 'title'),
        body: childOf(ID, 'body', 'bodytext', 'content'),
      },
    });

    await waitFor(() => expect(childNode('headertext')).toBeTruthy());
    await waitFor(() => expect(childNode('bodytext')).toBeTruthy());

    expect(headerCanvas().contains(childNode('headertext'))).toBe(true);
    expect(headerCanvas().contains(childNode('bodytext'))).toBe(false);
    expect(bodyCanvas().contains(childNode('bodytext'))).toBe(true);
    expect(bodyCanvas().contains(childNode('headertext'))).toBe(false);
  });

  // Break this catches: making the empty-canvas placeholder visible inside a sub-canvas, which
  // would show the root canvas's "connect a data source" box inside every empty accordion.
  test('[Accordion-CHILD-002] an empty Accordion renders the empty-canvas state, always hidden', async () => {
    harness.render();
    await waitFor(() => expect(bodyCanvas()).toBeTruthy());

    const placeholder = bodyCanvas().querySelector('.empty-box-cont');
    expect(placeholder).toBeTruthy();
    const emptyWrapper = [...bodyCanvas().children].find((el) => el.contains(placeholder));
    expect(emptyWrapper.style.display).toBe('none');

    harness.render({ extraComponents: { kid: childOf(ID, 'kid', 'bodytext', 'inside') } });
    await waitFor(() => expect(childNode('bodytext')).toBeTruthy());
    expect(bodyCanvas().querySelector('.empty-box-cont')).toBeNull();
  });
});

describe('Accordion: instance-scoped test ids', () => {
  // Break this catches: reverting D-04 — an unscoped constant on the chevron and a `dataCy` that
  // never reaches the header slot. Two accordions on one page become indistinguishable to any
  // browser test, and the header's attribute reads the literal string "undefined".
  test('[Accordion-CY-001] the header region and the chevron carry instance-scoped test ids', async () => {
    const second = componentDefinition('a2', 'accordion2', 'Accordion');
    harness.render({
      extraComponents: { a2: second },
      also: [{ id: 'a2', componentType: 'Accordion' }],
    });
    await waitFor(() => expect(document.querySelectorAll('.tj-accordion-header')).toHaveLength(2));

    expect(document.querySelector(`[data-cy="${NAME}-header-section"]`)).toBeTruthy();
    expect(document.querySelector('[data-cy="accordion2-header-section"]')).toBeTruthy();
    expect(document.querySelector('[data-cy="undefined-header-section"]')).toBeNull();

    expect(document.querySelector(`[data-cy="${NAME}-toggle-button"]`)).toBeTruthy();
    expect(document.querySelector('[data-cy="accordion2-toggle-button"]')).toBeTruthy();
    expect(document.querySelector('[data-cy="accordion-close-button"]')).toBeNull();
  });
});

describe('Accordion: styles', () => {
  // Break this catches: dropping the dark-mode sentinel rewrite, leaving a white accordion
  // glaring on a dark canvas for every app that kept the literal default.
  test('[Accordion-STYLE-001] the body background honours the configured colour and the dark-mode sentinel', async () => {
    harness.render({ styles: { backgroundColor: binding('rgb(1, 2, 3)') } });
    await waitFor(() => expect(root()).toBeTruthy());
    expect(root().style.backgroundColor).toBe('rgb(1, 2, 3)');

    harness.render({ styles: { backgroundColor: binding('#fff') }, darkMode: true });
    await waitFor(() => expect(root().style.backgroundColor).toBe('rgb(35, 46, 60)'));

    harness.render({ styles: { backgroundColor: binding('rgb(9, 9, 9)') }, darkMode: true });
    await waitFor(() => expect(root().style.backgroundColor).toBe('rgb(9, 9, 9)'));
  });

  // Break this catches: resolving the header background from the body's colour. Accordion
  // resolves it inside Header, a separate copy of the same sentinel logic.
  test('[Accordion-STYLE-002] the header background is resolved independently of the body', async () => {
    harness.render({
      styles: { backgroundColor: binding('rgb(1, 2, 3)'), headerBackgroundColor: binding('rgb(4, 5, 6)') },
    });
    await waitFor(() => expect(headerRegion()).toBeTruthy());

    expect(root().style.backgroundColor).toBe('rgb(1, 2, 3)');
    expect(headerRegion().style.backgroundColor).toBe('rgb(4, 5, 6)');
  });

  // Break this catches: publishing the divider under Container's custom property name, which the
  // accordion stylesheet does not read — the divider would silently fall back to the theme token.
  test('[Accordion-STYLE-003] the divider colour is published as an accordion-specific custom property', async () => {
    harness.render({ styles: { headerDividerColor: binding('rgb(7, 7, 7)') } });
    await waitFor(() => expect(root()).toBeTruthy());

    expect(root().style.getPropertyValue('--cc-accordion-header-divider-color')).toBe('rgb(7, 7, 7)');
    expect(root().style.getPropertyValue('--cc-container-header-divider-color')).toBe('');
  });

  // Break this catches: dropping the border or box-shadow, or failing to carry the radius onto
  // the header's top corners so the accordion square-clips its own header.
  test('[Accordion-STYLE-004] border colour, radius and box shadow reach the root and the header corners', async () => {
    harness.render({
      styles: {
        borderColor: binding('rgb(8, 8, 8)'),
        borderRadius: binding('12'),
        boxShadow: binding('0px 2px 4px 0px rgba(0, 0, 0, 0.5)'),
      },
    });
    await waitFor(() => expect(headerRegion()).toBeTruthy());

    expect(root().style.border).toBe('1px solid rgb(8, 8, 8)');
    expect(root().style.borderRadius).toBe('12px');
    expect(root().style.boxShadow).toBe('0px 2px 4px 0px rgba(0, 0, 0, 0.5)');
    expect(headerRegion().style.borderTopLeftRadius).toBe('12px');
    expect(headerRegion().style.borderTopRightRadius).toBe('12px');
  });

  // Break this catches: clamping an unparseable radius to the documented default. The shipped
  // behaviour emits the invalid declaration NaNpx, which the browser drops — square corners,
  // not 6px. Accordion carries its own copy of this expression, so it is re-asserted here.
  test('[Accordion-STYLE-005] a non-numeric border radius emits NaN, not zero and not the documented default', async () => {
    harness.render({ styles: { borderRadius: binding('not-a-number') } });
    await waitFor(() => expect(root()).toBeTruthy());
    expect(root().style.borderRadius).toBe('NaNpx');

    harness.render({ styles: { borderRadius: binding('12') } });
    await waitFor(() => expect(root().style.borderRadius).toBe('12px'));
  });

  // Break this catches: dropping chevronIconColor on the way to the icon — the one style with no
  // Container counterpart. The chevron would silently fall back to the theme stroke.
  test('[Accordion-STYLE-006] the chevron icon takes its configured colour', async () => {
    harness.render({ styles: { chevronIconColor: binding('rgb(3, 4, 5)') } });
    const button = await waitFor(() => {
      const el = chevron();
      expect(el).toBeTruthy();
      return el;
    });
    await waitFor(() => expect(button.querySelector('svg')).toBeTruthy(), { timeout: 20000 });

    expect(button.querySelector('svg').getAttribute('stroke')).toBe('rgb(3, 4, 5)');
  }, 30000);

  // Break this catches: applying the bottom corner radii unconditionally, so an EXPANDED
  // accordion rounds off the seam between its header and its content.
  test('[Accordion-STYLE-007] a collapsed Accordion rounds its header bottom corners', async () => {
    harness.render({ styles: { borderRadius: binding('12') } });
    await waitFor(() => expect(chevron()).toBeTruthy());
    expect(headerRegion().style.borderBottomLeftRadius).toBe('');
    expect(headerRegion().style.borderBottomRightRadius).toBe('');

    await userEvent.click(chevron());

    await waitFor(() => expect(headerRegion().style.borderBottomLeftRadius).toBe('12px'));
    expect(headerRegion().style.borderBottomRightRadius).toBe('12px');
  });
});

describe('Accordion: accessibility', () => {
  // Break this catches: removing useDisableInert or inverting its argument, leaving a disabled
  // accordion keyboard-reachable while the mouse is blocked. jsdom implements no inert
  // semantics, so the property transition is the faultable signal; the tab order is
  // Accordion-BRW-005.
  test('[Accordion-A11Y-001] a disabled Accordion marks its subtree inert', async () => {
    harness.render({ properties: { disabledState: binding('{{true}}') } });
    await waitFor(() => expect(root()).toBeTruthy());
    await waitFor(() => expect(root().inert).toBe(true));

    harness.setComponentProperty(ID, 'disabledState', '{{false}}', 'properties');
    await waitFor(() => expect(root().inert).toBe(false));
  });

  // Break this catches: a static aria-label, which would announce "Collapse accordion" to a
  // screen reader on a section that is already collapsed — or dropping the disabled guard, so a
  // disabled accordion could still be toggled by keyboard or click.
  test('[Accordion-A11Y-002] the chevron announces its action and is disabled with the widget', async () => {
    harness.render();
    await waitFor(() => expect(chevron()).toBeTruthy());
    expect(screen.getByRole('button', { name: 'Collapse accordion' })).toBeTruthy();

    await userEvent.click(chevron());

    await waitFor(() => expect(screen.getByRole('button', { name: 'Expand accordion' })).toBeTruthy());

    harness.setComponentProperty(ID, 'disabledState', '{{true}}', 'properties');
    await waitFor(() => expect(chevron()).toBeDisabled());

    // A disabled chevron must not toggle.
    await userEvent.click(chevron(), { pointerEventsCheck: 0 });
    await drain();
    expect(harness.exposed().isExpanded).toBe(false);
  });
});

describe('Accordion: instance isolation', () => {
  // Break this catches: hoisting the expansion state out of the component, which would make
  // every Accordion on a page open and close together.
  test('[Accordion-ISO-001] two Accordions keep separate expansion, state and children', async () => {
    const second = componentDefinition('a2', 'accordion2', 'Accordion');
    harness.render({
      extraComponents: {
        a2: second,
        kid1: childOf(ID, 'kid1', 'firsttext', 'first'),
        kid2: childOf('a2', 'kid2', 'secondtext', 'second'),
      },
      also: [{ id: 'a2', componentType: 'Accordion' }],
    });

    await waitFor(() => expect(childNode('firsttext')).toBeTruthy());
    await waitFor(() => expect(childNode('secondtext')).toBeTruthy());
    expect(document.getElementById(`canvas-${ID}`).contains(childNode('firsttext'))).toBe(true);
    expect(document.getElementById('canvas-a2').contains(childNode('secondtext'))).toBe(true);

    await harness.act('collapse');

    await waitFor(() => expect(harness.exposed(ID).isExpanded).toBe(false));
    expect(harness.exposed('a2').isExpanded).toBe(true);
    expect(document.getElementById(ID).className).toContain('jet-accordion-collapsed');
    expect(document.getElementById('a2').className).toContain('jet-accordion-expanded');
  });
});

describe('Accordion: dynamic height', () => {
  const tempHeight = () => harness.session.store.read((st) => st.temporaryLayouts?.[ID]?.height);
  const settle = async () => {
    await drain();
    await new Promise((resolve) => requestAnimationFrame(resolve));
    await drain();
  };
  /**
   * gridSlice batches reflows into a module-level `_pendingReflows` map flushed on a rAF. That
   * closure state survives the zustand reset between tests, so a test that schedules a reflow
   * and ends without letting the frame run leaks its write into the NEXT test's store — which
   * is what made the edit-mode assertion below see a height it had never asked for.
   */
  afterEach(settle);

  const withChild = () => {
    const kid = componentDefinition('kid', 'bodytext', 'Text', { text: binding('x') });
    kid.component.parent = ID;
    kid.layouts = { desktop: { top: 100, left: 0, width: 10, height: 60 } };
    return { kid };
  };

  // Break this catches: gating the reflow hook on the dynamicHeight PROPERTY, the way Container
  // does. A collapsing accordion would then leave a hole in the page for every app that had not
  // switched dynamic height on — which is exactly why D-02 made this asymmetry deliberate.
  test('[Accordion-DYN-001] the reflow runs in the Viewer even with the dynamicHeight property off', async () => {
    harness.render({
      properties: { dynamicHeight: binding('{{false}}') },
      currentMode: 'view',
      extraComponents: withChild(),
    });
    await waitFor(() => expect(bodyCanvas()).toBeTruthy());
    await settle();

    expect(tempHeight()).toBeGreaterThan(0);
    // ...while the property still governs the inline height branch.
    expect(root().style.height).toBe('446px');
    expect(root().style.minHeight).toBe('');
  });

  test('[Accordion-DYN-001] the dynamicHeight property alone drives the inline height branch', async () => {
    harness.render({
      properties: { dynamicHeight: binding('{{true}}') },
      currentMode: 'view',
      extraComponents: withChild(),
    });
    await waitFor(() => expect(root()).toBeTruthy());

    expect(root().style.height).toBe('100%');
    expect(root().style.minHeight).toBe('446px');
  });

  test('[Accordion-DYN-001] neither half runs on the builder canvas', async () => {
    harness.render({
      properties: { dynamicHeight: binding('{{true}}') },
      currentMode: 'edit',
      extraComponents: withChild(),
    });
    await waitFor(() => expect(bodyCanvas()).toBeTruthy());
    await settle();

    expect(tempHeight()).toBeUndefined();
    expect(root().style.height).toBe('446px');
  });

  // Break this catches: reverting 934bb5dd64 — committing isExpanded only through the batched
  // effect. The reflow reads it from the store while being scheduled off the local flip, so it
  // would compute the accordion's height one toggle behind and siblings would overlap.
  test('[Accordion-DYN-002] collapsing feeds the reflow a synchronously committed isExpanded', async () => {
    harness.render({ currentMode: 'view', extraComponents: withChild() });
    await waitFor(() => expect(chevron()).toBeTruthy());
    await settle();
    const expandedHeight = tempHeight();

    fireEvent.click(chevron());
    // The store must already agree, before any frame has run — that is the whole fix.
    expect(harness.exposed().isExpanded).toBe(false);

    await settle();
    // Measured: a collapsed accordion reflows to its collapsed height, headerHeight 80 + 12,
    // rather than to a child-derived extent. The point is that it recomputes in THIS pass.
    expect(tempHeight()).toBe(92);
    expect(tempHeight()).not.toBe(expandedHeight);
  });
});

describe('Accordion: which children it accepts', () => {
  const canAdd = (parentId, widget) =>
    harness.session.store.read((st) => st.canAddToParent(parentId, widget, 'canvas'));

  // Break this catches: nothing today — this scenario PINS a gap. Accordion has no
  // RESTRICTED_WIDGETS_CONFIG entry, so Calendar and Kanban are accepted where Container refuses
  // them. Per D-05 this is characterized, not endorsed: adding the missing key will fail this
  // test deliberately, forcing the change to be explicit.
  test('[Accordion-DROP-001] an Accordion accepts Calendar and Kanban as children', async () => {
    harness.render();
    await waitFor(() => expect(root()).toBeTruthy());

    expect(canAdd(ID, 'Calendar')).not.toBe(false);
    expect(canAdd(ID, 'Kanban')).not.toBe(false);
    expect(canAdd(ID, 'Text')).not.toBe(false);
  });

  // Break this catches: dropping the slot half of the union in canAddToParent, which would let a
  // Form, an Accordion or a Chart be dropped into a header strip that cannot lay them out.
  test('[Accordion-DROP-002] the header slot refuses far more child types than the body', async () => {
    harness.render();
    await waitFor(() => expect(root()).toBeTruthy());

    for (const widget of ['Form', 'Container', 'Accordion', 'Listview', 'Chart', 'PDF']) {
      expect(canAdd(ID, widget)).not.toBe(false);
      expect(canAdd(`${ID}-header`, widget)).toBe(false);
    }
    expect(canAdd(`${ID}-header`, 'Text')).not.toBe(false);
  });
});

describe('Accordion: nested in other containers', () => {
  // Break this catches: a Form child losing its own exposed values because CSAs for form children
  // are dispatched through the Form's children map.
  test('[Accordion-NEST-001] an Accordion inside a Form keeps its own exposed state', async () => {
    await remount();
    const form = createWidgetHarness({
      componentType: 'Form',
      handle: 'form1',
      id: 'form1',
      capabilities: { dnd: true },
      widgetHeight: 500,
      widgetWidth: 600,
    });
    form.setup();
    try {
      const nested = componentDefinition(ID, NAME, 'Accordion');
      nested.component.parent = 'form1';
      form.render({
        extraComponents: { [ID]: nested, kid: childOf(ID, 'kid', 'bodytext', 'inside') },
        currentMode: 'view',
      });

      await waitFor(() => expect(document.getElementById(`canvas-${ID}`)).toBeTruthy());
      await waitFor(() => expect(childNode('bodytext')).toBeTruthy());
      expect(document.getElementById(`canvas-${ID}`).contains(childNode('bodytext'))).toBe(true);

      await waitFor(() => expect(form.exposed(ID).isExpanded).toBe(true));
      expect(form.exposed(ID).isVisible).toBe(true);
      expect(form.exposed(ID).isDisabled).toBe(false);
    } finally {
      form.teardown();
    }
  });

  // Break this catches: the row context not reaching inside the nested accordion, so every row
  // would render row 0's data — the classic "all my list rows look the same" bug.
  test('[Accordion-NEST-002] an Accordion inside a Listview row resolves per row', async () => {
    await remount();
    const listview = createWidgetHarness({
      componentType: 'Listview',
      handle: 'listview1',
      id: 'lv1',
      capabilities: { dnd: true },
      widgetHeight: 500,
      widgetWidth: 600,
    });
    listview.setup();
    try {
      const nested = componentDefinition(ID, NAME, 'Accordion');
      nested.component.parent = 'lv1';
      const rowChild = componentDefinition('kid', 'rowtext', 'Text', { text: binding('{{listItem.label}}') });
      rowChild.component.parent = ID;

      listview.render({
        properties: { data: binding('{{[{"label":"one"},{"label":"two"}]}}'), rowHeight: binding('{{250}}') },
        extraComponents: { [ID]: nested, kid: rowChild },
      });

      await waitFor(() => expect(document.querySelectorAll('.jet-container')).toHaveLength(2));

      const rendered = [...document.querySelectorAll('[data-cy="draggable-widget-rowtext"]')].map((n) => n.textContent);
      expect(rendered).toEqual(['one', 'two']);

      const exposed = listview.session.store.read((st) => st.getExposedValueOfComponent(ID, 'canvas'));
      expect(Array.isArray(exposed)).toBe(true);
      expect(exposed).toHaveLength(2);
      expect(exposed[0].isExpanded).toBe(true);
    } finally {
      listview.teardown();
    }
  });

  // Break this catches: the disabled cascade being pushed into child state rather than left to
  // the DOM, or the nested sub-canvas resolving its children from the wrong id.
  test('[Accordion-NEST-003] an Accordion inside a Container renders recursively and cascades disabled state', async () => {
    await remount();
    const container = createWidgetHarness({
      componentType: 'Container',
      handle: 'container1',
      id: 'c1',
      capabilities: { dnd: true },
      widgetHeight: 500,
      widgetWidth: 600,
    });
    container.setup();
    try {
      const nested = componentDefinition(ID, NAME, 'Accordion');
      nested.component.parent = 'c1';
      container.render({
        properties: { disabledState: binding('{{true}}') },
        extraComponents: { [ID]: nested, kid: childOf(ID, 'kid', 'innertext', 'deep') },
      });

      await waitFor(() => expect(document.getElementById(`canvas-${ID}`)).toBeTruthy());
      await waitFor(() => expect(childNode('innertext')).toBeTruthy());

      const outerRoot = document.getElementById('c1');
      await waitFor(() => expect(outerRoot.inert).toBe(true));
      expect(outerRoot.contains(childNode('innertext'))).toBe(true);
      expect(container.exposed(ID).isDisabled).toBe(false);
    } finally {
      container.teardown();
    }
  });
});
