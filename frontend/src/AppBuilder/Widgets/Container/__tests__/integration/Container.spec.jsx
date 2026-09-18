/**
 * Container widget behaviour.
 *
 * Contract: frontend/ee/test/app-builder/widgets/Container/TESTING.md
 * Every test title starts with its approved scenario ID; the `// Break this catches:`
 * comment names the production edit its oracle is meant to catch.
 */
import { waitFor } from '@testing-library/react';
import { createWidgetHarness, binding, drain } from '@/AppBuilder/Widgets/__tests__/integration/widgetHarness';
import { componentDefinition } from '@/test/app-builder';
import { buildComponentMetaDefinition } from '@/_helpers/appUtils';

const ID = 'c1';
const NAME = 'container1';

const harness = createWidgetHarness({
  componentType: 'Container',
  handle: NAME,
  id: ID,
  // AppCanvas/Container throws `Expected drag drop context` without the real DndProvider.
  capabilities: { dnd: true },
  widgetHeight: 450,
  widgetWidth: 600,
});

/**
 * The FIRST mount of a widget inside the sub-canvas compiles the whole WidgetWrapper
 * dependency tree — measured at ~4s warm and long enough to blow Jest's 5s per-test timeout
 * on a cold transform cache. Paid once here, so no scenario's own waitFor is secretly
 * measuring module compilation and every child assertion below settles in tens of ms.
 */
beforeAll(async () => {
  const warm = createWidgetHarness({
    componentType: 'Container',
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
  // Drain exactly as the global afterEach does, so the warm-up leaves no DOM or store behind.
  const sessions = globalThis.__TOOLJET_APP_BUILDER_TEST_SESSIONS__ || [];
  while (sessions.length) await sessions.pop()();
  require('zustand').__resetAllStores?.();
}, 180000);

beforeEach(() => harness.setup());
afterEach(() => harness.teardown());

const root = () => document.getElementById(ID);
const bodyCanvas = () => document.getElementById(`canvas-${ID}`);
const headerCanvas = () => document.getElementById(`canvas-${ID}-header`);
const headerRegion = () => document.querySelector(`[data-cy="${NAME}-header-section"]`);

describe('Container: base rendering', () => {
  // Break this catches: the body sub-canvas no longer being mounted (e.g. an early
  // return around <ContainerComponent/>), which would leave every child of every
  // Container in every app unrendered with no error anywhere.
  test('[Container-RENDER-001] a default Container renders its chrome, header slot and body canvas', async () => {
    harness.render();

    await waitFor(() => expect(root()).toBeTruthy());
    expect(root().className).toContain('jet-container');
    expect(headerRegion()).toBeTruthy();
    expect(headerCanvas()).toBeTruthy();
    expect(bodyCanvas()).toBeTruthy();
  });
});

/** A Text child seeded under `parent`, which the Container renders through its own sub-canvas. */
const childOf = (parent, id, name, text) => {
  const child = componentDefinition(id, name, 'Text', { text: binding(text) });
  child.component.parent = parent;
  return child;
};
const childNode = (name) => document.querySelector(`[data-cy="draggable-widget-${name}"]`);
/**
 * A NESTED widget's WidgetWrapper carries the same DOM id as the widget root inside it, so
 * getElementById returns the wrapper. Pick the Container's own root out of the duplicates.
 */
const containerRoot = (id) =>
  [...document.querySelectorAll(`#${id}`)].find((el) => el.classList.contains('jet-container'));

describe('Container: the three shared states', () => {
  // Break this catches: dropping the `display: isVisible ? 'flex' : 'none'` branch, which
  // would leave a container visible in the Viewer after an app hid it.
  test('[Container-STATE-001] visibility hides the Container and publishes isVisible', async () => {
    harness.render({ properties: { visibility: binding('{{false}}') } });

    await waitFor(() => expect(root()).toBeTruthy());
    expect(root().style.display).toBe('none');
    await waitFor(() => expect(harness.exposed().isVisible).toBe(false));

    harness.setComponentProperty(ID, 'visibility', '{{true}}', 'properties');
    await waitFor(() => expect(root().style.display).toBe('flex'));
    expect(harness.exposed().isVisible).toBe(true);
  });

  // Break this catches: removing the `isDisabled &&` guard on the body style, which would
  // leave a disabled container fully interactive while still looking disabled.
  test('[Container-STATE-002] a disabled Container blocks its body and publishes isDisabled', async () => {
    harness.render({ properties: { disabledState: binding('{{true}}') } });

    await waitFor(() => expect(root()).toBeTruthy());
    expect(root().getAttribute('data-disabled')).toBe('true');
    const body = bodyCanvas().closest('.widget-type-container');
    expect(body.style.pointerEvents).toBe('none');
    expect(body.style.opacity).toBe('0.5');
    await waitFor(() => expect(harness.exposed().isDisabled).toBe(true));

    harness.setComponentProperty(ID, 'disabledState', '{{false}}', 'properties');
    await waitFor(() => expect(root().getAttribute('data-disabled')).toBe('false'));
    expect(bodyCanvas().closest('.widget-type-container').style.pointerEvents).toBe('');
  });

  // Break this catches: rendering the spinner ALONGSIDE the body instead of instead of it.
  // Children would keep running (queries, timers) behind a spinner that claims to be loading.
  test('[Container-STATE-003] loading replaces the whole body, destroying and remounting children', async () => {
    harness.render({
      extraComponents: { kid: childOf(ID, 'kid', 'bodytext', 'inside') },
    });
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

describe('Container: children and slots', () => {
  // Break this catches: the header slot being mounted with the body's canvas id, so every
  // header-parented child silently falls into the body and the layout breaks with no error.
  //
  // Measured during sensitivity: faulting getParentComponentIdByType does NOT fail this test.
  // That function is reached only from the canvas drop handler, which a seeded store never
  // runs, so the slot-ID scheme's authoring half is browser ground — this scenario protects
  // the RENDERING half.
  test('[Container-CHILD-001] header children and body children render in their own slots', async () => {
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

  // Break this catches: dropping the `id === 'canvas' || componentType === 'ModuleContainer'`
  // half of showEmptyContainer. Every empty Container in every app would then display the
  // root canvas's "connect a data source" empty box inside itself.
  //
  // Measured: for a Container sub-canvas showEmptyContainer is ALWAYS false, so the empty
  // subtree is rendered but hidden. Presence-plus-hidden is therefore the oracle, not
  // visibility, and the children wrapper's height never flips to `auto` here.
  test('[Container-CHILD-002] an empty Container renders the empty-canvas state, always hidden', async () => {
    harness.render();
    await waitFor(() => expect(bodyCanvas()).toBeTruthy());

    const placeholder = bodyCanvas().querySelector('.empty-box-cont');
    expect(placeholder).toBeTruthy();
    const emptyWrapper = [...bodyCanvas().children].find((el) => el.contains(placeholder));
    expect(emptyWrapper.style.display).toBe('none');
    expect(bodyCanvas().querySelector('.rm-container').style.height).toBe('100%');

    harness.render({ extraComponents: { kid: childOf(ID, 'kid', 'bodytext', 'inside') } });
    await waitFor(() => expect(childNode('bodytext')).toBeTruthy());
    expect(bodyCanvas().querySelector('.empty-box-cont')).toBeNull();
  });
});

describe('Container: the header', () => {
  // Break this catches: inverting the showHeader branch, which would put a header on every
  // container that deliberately turned it off (and hide the one it was configured for).
  test('[Container-HDR-001] showHeader adds and removes the header region', async () => {
    harness.render({
      properties: { showHeader: binding('{{false}}') },
      extraComponents: { body: childOf(ID, 'body', 'bodytext', 'content') },
    });

    await waitFor(() => expect(childNode('bodytext')).toBeTruthy());
    expect(headerRegion()).toBeNull();
    expect(headerCanvas()).toBeNull();

    harness.setComponentProperty(ID, 'showHeader', '{{true}}', 'properties');
    await waitFor(() => expect(headerRegion()).toBeTruthy());
    expect(childNode('bodytext')).toBeTruthy();
  });
});

describe('Container: saved-app compatibility', () => {
  /** A saved component row as the server returns it: only what the user actually changed. */
  const savedApp = (properties) => ({
    [ID]: {
      id: ID,
      name: NAME,
      component: { component: 'Container', name: NAME, definition: { properties, styles: {}, others: {} } },
      layouts: { desktop: { top: 0, left: 0, width: 30, height: 450 } },
    },
  });

  // Break this catches: changing the registered showHeader default back to false. Every app
  // saved after April 2025 carries no explicit value and relies on the load-time merge to
  // put the header back, so the header would silently vanish from all of them.
  //
  // This goes through buildComponentMetaDefinition — the real load path (pageMenuSlice.js:260)
  // — because that merge, not the widget, is what supplies an absent key. Seeding the store
  // directly bypasses it, and a Container whose definition genuinely lacks the key renders
  // no header at all.
  test('[Container-COMPAT-001] a saved Container with no showHeader key gains the header at load', async () => {
    const merged = buildComponentMetaDefinition(savedApp({}));
    expect(merged[ID].component.definition.properties.showHeader).toEqual({ value: '{{true}}' });

    harness.render({ extraComponents: { [ID]: merged[ID] } });
    await waitFor(() => expect(root()).toBeTruthy());
    expect(headerRegion()).toBeTruthy();
  });

  // Break this catches: the load-time merge overwriting a saved value with the registered
  // default, which would undo the server migration and put a header back on every
  // pre-April-2025 app that was migrated to not have one.
  test('[Container-COMPAT-001] an explicit saved showHeader false survives the load merge', async () => {
    const merged = buildComponentMetaDefinition(savedApp({ showHeader: { value: '{{false}}' } }));
    expect(merged[ID].component.definition.properties.showHeader).toEqual({ value: '{{false}}' });

    harness.render({ extraComponents: { [ID]: merged[ID] } });
    await waitFor(() => expect(root()).toBeTruthy());
    expect(headerRegion()).toBeNull();
  });
});

describe('Container: component-specific actions', () => {
  // Break this catches: setVisibility updating the local state without writing the exposed
  // variable (they drifted once before, f0b76b5c61). An app reading
  // {{components.container1.isVisible}} would then see a stale value forever.
  test('[Container-CSA-001] setVisibility drives visibility at runtime', async () => {
    harness.render();
    await waitFor(() => expect(root().style.display).toBe('flex'));

    await harness.act('setVisibility', false);
    await waitFor(() => expect(root().style.display).toBe('none'));
    expect(harness.exposed().isVisible).toBe(false);

    await harness.act('setVisibility', true);
    await waitFor(() => expect(root().style.display).toBe('flex'));
    expect(harness.exposed().isVisible).toBe(true);
  });

  // Break this catches: setDisable failing to publish isDisabled, which both the widget's
  // own body style and RenderWidget's disabled class read back out of the store.
  test('[Container-CSA-002] setDisable drives the disabled state at runtime', async () => {
    harness.render();
    await waitFor(() => expect(root()).toBeTruthy());
    expect(root().getAttribute('data-disabled')).toBe('false');

    await harness.act('setDisable', true);
    await waitFor(() => expect(root().getAttribute('data-disabled')).toBe('true'));
    expect(harness.exposed().isDisabled).toBe(true);

    await harness.act('setDisable', false);
    await waitFor(() => expect(root().getAttribute('data-disabled')).toBe('false'));
    expect(harness.exposed().isDisabled).toBe(false);
  });

  // Break this catches: setLoading writing the exposed variable but not the state that
  // swaps in the spinner, so a query could never show a container as loading.
  test('[Container-CSA-003] setLoading drives the loading state at runtime', async () => {
    harness.render({ extraComponents: { kid: childOf(ID, 'kid', 'bodytext', 'inside') } });
    await waitFor(() => expect(childNode('bodytext')).toBeTruthy());

    await harness.act('setLoading', true);
    await waitFor(() => expect(bodyCanvas()).toBeNull());
    expect(harness.exposed().isLoading).toBe(true);

    await harness.act('setLoading', false);
    await waitFor(() => expect(childNode('bodytext')).toBeTruthy());
    expect(harness.exposed().isLoading).toBe(false);
  });

  // Break this catches: rewriting the property effects to run on every resolution instead of
  // on a changed value. Any unrelated re-render would then silently undo a setDisable() an
  // app had just performed — the classic "my CSA doesn't stick" bug.
  test('[Container-CSA-004] a CSA-set state survives a no-op property rewrite but yields to a real change', async () => {
    harness.render({ properties: { disabledState: binding('{{true}}') } });
    await waitFor(() => expect(root().getAttribute('data-disabled')).toBe('true'));

    // The CSA overrides the property.
    await harness.act('setDisable', false);
    await waitFor(() => expect(root().getAttribute('data-disabled')).toBe('false'));

    // A rewrite to the value the property ALREADY held must not clobber it.
    harness.setComponentProperty(ID, 'disabledState', '{{true}}', 'properties');
    await drain();
    expect(root().getAttribute('data-disabled')).toBe('false');
    expect(harness.exposed().isDisabled).toBe(false);

    // A genuinely changed property does win. Two writes, because the observable direction is
    // the property arriving at a value the CSA did not set: false clears it, true re-asserts it.
    harness.setComponentProperty(ID, 'disabledState', '{{false}}', 'properties');
    await drain();
    harness.setComponentProperty(ID, 'disabledState', '{{true}}', 'properties');
    await waitFor(() => expect(root().getAttribute('data-disabled')).toBe('true'));
    expect(harness.exposed().isDisabled).toBe(true);
  });
});

describe('Container: accessibility', () => {
  // Break this catches: removing the useDisableInert call (the property reads back undefined)
  // or inverting its argument (it reads back false). Either leaves a disabled container
  // keyboard-reachable while the mouse is blocked — the exact gap 4f159069c7 closed.
  //
  // Measured 2026-09-18: this repository's jsdom implements NO inert semantics — the property
  // is a plain expando, no attribute is reflected and focus is not blocked. The property
  // transition is therefore the only faultable signal here; the tab order itself is
  // Container-BRW-007.
  test('[Container-A11Y-001] a disabled Container marks its subtree inert', async () => {
    harness.render({ properties: { disabledState: binding('{{true}}') } });
    await waitFor(() => expect(root()).toBeTruthy());
    await waitFor(() => expect(root().inert).toBe(true));

    harness.setComponentProperty(ID, 'disabledState', '{{false}}', 'properties');
    await waitFor(() => expect(root().inert).toBe(false));
  });
});

describe('Container: instance isolation', () => {
  // Break this catches: hoisting the expose state out of the component (a module-level ref, a
  // store key without the component id), which would make every Container on a page share one
  // visibility/disabled/loading state.
  test('[Container-ISO-001] two Containers keep separate state and separate children', async () => {
    const second = componentDefinition('c2', 'container2', 'Container');
    harness.render({
      extraComponents: {
        c2: second,
        kid1: childOf(ID, 'kid1', 'firsttext', 'first'),
        kid2: childOf('c2', 'kid2', 'secondtext', 'second'),
      },
      also: [{ id: 'c2', componentType: 'Container' }],
    });

    await waitFor(() => expect(childNode('firsttext')).toBeTruthy());
    await waitFor(() => expect(childNode('secondtext')).toBeTruthy());
    expect(document.getElementById(`canvas-${ID}`).contains(childNode('firsttext'))).toBe(true);
    expect(document.getElementById('canvas-c2').contains(childNode('secondtext'))).toBe(true);

    await harness.act('setDisable', true);

    await waitFor(() => expect(harness.exposed(ID).isDisabled).toBe(true));
    expect(harness.exposed('c2').isDisabled).toBe(false);
    expect(document.getElementById(ID).getAttribute('data-disabled')).toBe('true');
    expect(document.getElementById('c2').getAttribute('data-disabled')).toBe('false');
  });
});

describe('Container: header geometry and chrome', () => {
  const headerSlot = () => headerRegion().querySelector('.resizable-slot');

  // Break this catches: removing headerHeight from `definition.properties`. It is declared
  // ONLY there — never in the properties schema — so nothing would supply it and every
  // container's header would silently jump to the component's 80px fallback.
  //
  // Measured: useSubContainerResizable seeds its height state on MOUNT, so each value needs
  // its own test rather than a rebind inside one (harness.render() re-renders a single root).
  test('[Container-HDR-002] headerHeight comes from the definition', async () => {
    harness.render();
    await waitFor(() => expect(headerSlot()).toBeTruthy());
    expect(headerSlot().style.height).toBe('60px');
  });

  test('[Container-HDR-002] a configured headerHeight drives the header slot', async () => {
    harness.render({ properties: { headerHeight: binding('{{120}}') } });
    await waitFor(() => expect(headerSlot()).toBeTruthy());
    expect(headerSlot().style.height).toBe('120px');
  });

  test('[Container-HDR-002] with the key absent the component falls back to 80', async () => {
    const noKey = componentDefinition(ID, NAME, 'Container');
    delete noKey.component.definition.properties.headerHeight;
    harness.render({ extraComponents: { [ID]: noKey } });
    await waitFor(() => expect(headerSlot()).toBeTruthy());
    expect(headerSlot().style.height).toBe('80px');
  });

  // Break this catches: dropping HorizontalSlot's disabled overlay, which would leave header
  // children clickable in a container the app has disabled.
  test('[Container-HDR-003] a disabled Container also blocks its header children', async () => {
    harness.render({ properties: { disabledState: binding('{{true}}') } });
    await waitFor(() => expect(document.getElementById(`${ID}-header-disabled`)).toBeTruthy());

    harness.setComponentProperty(ID, 'disabledState', '{{false}}', 'properties');
    await waitFor(() => expect(document.getElementById(`${ID}-header-disabled`)).toBeNull());
  });

  // Break this catches: changing the header's max-height arithmetic. The shipped formula is
  // the widget height minus 110, which is what keeps a resized header inside its container.
  test('[Container-HDR-004] the header max height is derived from the widget height', async () => {
    harness.render();
    await waitFor(() => expect(headerRegion()).toBeTruthy());
    // RenderWidget passes height = widgetHeight - 4, so 450 - 4 - 110.
    expect(headerRegion().style.maxHeight).toBe('336px');
  });

  // Second mount, because the height is fixed per harness. Nothing else is rendered in this
  // test: the element lookups are document-wide, so a second render alongside the first would
  // silently assert against the first container's header.
  test('[Container-HDR-004] a short Container gets a negative header max height, unclamped', async () => {
    const short = createWidgetHarness({
      componentType: 'Container',
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
      // 60 - 4 - 110 goes negative and is NOT clamped; this is the shipped behaviour.
      expect(headerRegion().style.maxHeight).toBe('-54px');
    } finally {
      short.teardown();
    }
  });

  // Break this catches: rendering the resize handle in the Viewer, which would let an end
  // user drag a header they are only meant to look at.
  test('[Container-HDR-005] the header resize handle is editor-only', async () => {
    harness.render({ currentMode: 'edit' });
    await waitFor(() => expect(headerRegion()).toBeTruthy());
    expect(headerRegion().querySelector('.resize-handle')).toBeTruthy();

    harness.render({ currentMode: 'view' });
    await waitFor(() => expect(headerRegion()).toBeTruthy());
    expect(headerRegion().querySelector('.resize-handle')).toBeNull();
  });
});

describe('Container: styles', () => {
  // Break this catches: dropping the dark-mode sentinel rewrite, which would leave a white
  // container glaring on a dark canvas for every app that kept the literal default.
  test('[Container-STYLE-001] the body background honours the configured colour and the dark-mode sentinel', async () => {
    harness.render({ styles: { backgroundColor: binding('rgb(1, 2, 3)') } });
    await waitFor(() => expect(root()).toBeTruthy());
    expect(root().style.backgroundColor).toBe('rgb(1, 2, 3)');

    harness.render({ styles: { backgroundColor: binding('#fff') }, darkMode: true });
    await waitFor(() => expect(root().style.backgroundColor).toBe('rgb(35, 46, 60)'));

    // A theme token is NOT a sentinel and must survive dark mode untouched.
    harness.render({ styles: { backgroundColor: binding('rgb(9, 9, 9)') }, darkMode: true });
    await waitFor(() => expect(root().style.backgroundColor).toBe('rgb(9, 9, 9)'));
  });

  // Break this catches: resolving the header background from the body's colour (an easy
  // copy-paste slip between two near-identical useMemos), which would make the header
  // untintable.
  test('[Container-STYLE-002] the header background is resolved independently of the body', async () => {
    harness.render({
      styles: { backgroundColor: binding('rgb(1, 2, 3)'), headerBackgroundColor: binding('rgb(4, 5, 6)') },
    });
    await waitFor(() => expect(headerRegion()).toBeTruthy());

    expect(root().style.backgroundColor).toBe('rgb(1, 2, 3)');
    expect(headerRegion().style.backgroundColor).toBe('rgb(4, 5, 6)');
  });

  // Break this catches: writing the divider colour to a standard border property instead of
  // the custom property the stylesheet reads, which silently does nothing.
  test('[Container-STYLE-003] the header divider colour is published as a CSS custom property', async () => {
    harness.render({ styles: { headerDividerColor: binding('rgb(7, 7, 7)') } });
    await waitFor(() => expect(root()).toBeTruthy());

    expect(root().style.getPropertyValue('--cc-container-header-divider-color')).toBe('rgb(7, 7, 7)');
  });

  // Break this catches: dropping the border or box-shadow from the computed style, or failing
  // to carry the radius onto the header's top corners so it square-clips its own header.
  test('[Container-STYLE-004] border colour, radius and box shadow reach the root and the header corners', async () => {
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

  // Break this catches: "tidying" the parseFloat away, or clamping the radius to the
  // documented default. Neither matches the product: an unparseable radius emits the invalid
  // declaration `NaNpx`, which the browser drops, leaving square corners rather than 6px.
  //
  // Measured: `borderRadius ? parseFloat(borderRadius) : 0` only reaches 0 for a FALSY value;
  // a truthy unparseable string reaches NaN. Asserting 0px here — or 6px, per the docs —
  // would be asserting an intention the code does not have.
  test('[Container-STYLE-005] a non-numeric border radius emits NaN, not zero and not the documented default', async () => {
    harness.render({ styles: { borderRadius: binding('not-a-number') } });
    await waitFor(() => expect(root()).toBeTruthy());
    expect(root().style.borderRadius).toBe('NaNpx');

    // An exactly-empty value never reaches the widget: getDefaultStyles restores the
    // registered definition default (6) first.
    harness.render({ styles: { borderRadius: binding('') } });
    await waitFor(() => expect(root().style.borderRadius).toBe('6px'));

    harness.render({ styles: { borderRadius: binding('12') } });
    await waitFor(() => expect(root().style.borderRadius).toBe('12px'));
  });
});

describe('Container: dynamic height', () => {
  // Break this catches: dropping the `currentMode === 'view'` half of the gate, which would
  // resize containers under a builder while they are laying out a page (89d705a454 added it
  // deliberately). Only the GATE is asserted — jsdom measures every element as zero.
  test('[Container-DYN-001] dynamic height is gated to the Viewer', async () => {
    harness.render({ properties: { dynamicHeight: binding('{{true}}') }, currentMode: 'edit' });
    await waitFor(() => expect(root()).toBeTruthy());
    expect(root().style.height).toBe('446px');
    expect(root().style.minHeight).toBe('');

    harness.render({ properties: { dynamicHeight: binding('{{true}}') }, currentMode: 'view' });
    await waitFor(() => expect(root().style.height).toBe('100%'));
    expect(root().style.minHeight).toBe('446px');
  });
});

describe('Container: which children it accepts', () => {
  const canAdd = (parentId, widget) => harness.session.store.read((s) => s.canAddToParent(parentId, widget, 'canvas'));

  // Break this catches: emptying RESTRICTED_WIDGETS_CONFIG.Container, or reading it with the
  // wrong key. Calendar and Kanban render their own canvases and break layout inside one.
  //
  // Scoped to the DIRECT add: the guard is single-level and add-time (D-07), so this does not
  // claim a restricted descendant cannot reach a Container by another route.
  test('[Container-DROP-001] a Container refuses Calendar and Kanban as children', async () => {
    harness.render();
    await waitFor(() => expect(root()).toBeTruthy());

    expect(canAdd(ID, 'Calendar')).toBe(false);
    expect(canAdd(ID, 'Kanban')).toBe(false);
    expect(canAdd(ID, 'Text')).not.toBe(false);
    expect(canAdd(ID, 'Table')).not.toBe(false);
  });

  // Break this catches: dropping the slot half of the union in canAddToParent, which would let
  // a Form, a Container or a Chart be dropped into a container HEADER — a 60px strip that
  // cannot lay them out.
  test('[Container-DROP-002] the header slot refuses far more child types than the body', async () => {
    harness.render();
    await waitFor(() => expect(root()).toBeTruthy());

    // Accepted in the body, refused in the header, decided purely by the `-header` suffix.
    for (const widget of ['Form', 'Container', 'Listview', 'Chart', 'Map', 'PDF']) {
      expect(canAdd(ID, widget)).not.toBe(false);
      expect(canAdd(`${ID}-header`, widget)).toBe(false);
    }
    // A leaf widget is welcome in both...
    expect(canAdd(`${ID}-header`, 'Text')).not.toBe(false);
    // ...and so is Table, which is deliberately absent from RESTRICTED_WIDGET_SLOTS_CONFIG
    // even though it is a container of sorts. Asserting otherwise would invent a rule.
    expect(canAdd(ID, 'Table')).not.toBe(false);
    expect(canAdd(`${ID}-header`, 'Table')).not.toBe(false);
  });
});

describe('Container: nested in other containers', () => {
  // Break this catches: a Form child losing its own exposed values because CSAs for form
  // children are dispatched through the Form's children map (eventsSlice.js:928). A Container
  // in a Form would then stop reporting isVisible/isDisabled to the rest of the app.
  test('[Container-NEST-001] a Container inside a Form keeps its own exposed state', async () => {
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
      const nested = componentDefinition(ID, NAME, 'Container');
      nested.component.parent = 'form1';
      form.render({
        extraComponents: { [ID]: nested, kid: childOf(ID, 'kid', 'bodytext', 'inside') },
        currentMode: 'view',
      });

      await waitFor(() => expect(document.getElementById(ID)).toBeTruthy());
      await waitFor(() => expect(childNode('bodytext')).toBeTruthy());
      expect(document.getElementById(`canvas-${ID}`).contains(childNode('bodytext'))).toBe(true);

      await waitFor(() => expect(form.exposed(ID).isVisible).toBe(true));
      expect(form.exposed(ID).isDisabled).toBe(false);
      expect(form.exposed(ID).isLoading).toBe(false);
    } finally {
      form.teardown();
    }
  });

  // Break this catches: the sub-canvas resolving its children from anything other than the
  // component's own id (a shared key, the root canvas id), which would make the inner
  // Container render the outer one's children — or nothing at all.
  test('[Container-NEST-003] a Container inside a Container renders recursively', async () => {
    const inner = componentDefinition('c2', 'container2', 'Container');
    inner.component.parent = ID;
    harness.render({
      extraComponents: { c2: inner, kid: childOf('c2', 'kid', 'innertext', 'deep') },
    });

    await waitFor(() => expect(containerRoot('c2')).toBeTruthy());
    await waitFor(() => expect(childNode('innertext')).toBeTruthy());

    expect(containerRoot('c2').className).toContain('jet-container');
    expect(document.getElementById(`canvas-${ID}`).contains(containerRoot('c2'))).toBe(true);
    expect(document.getElementById('canvas-c2').contains(childNode('innertext'))).toBe(true);
  });

  // Break this catches: narrowing useDisableInert to the widget's own subtree exclusions, or
  // pushing the disabled state down into child components' state. The cascade is a DOM fact:
  // the outer root is inert and the inner container's OWN isDisabled stays false.
  test('[Container-NEST-003] disabling the outer Container leaves the inner state untouched', async () => {
    const inner = componentDefinition('c2', 'container2', 'Container');
    inner.component.parent = ID;
    harness.render({
      properties: { disabledState: binding('{{true}}') },
      extraComponents: { c2: inner, kid: childOf('c2', 'kid', 'innertext', 'deep') },
    });

    await waitFor(() => expect(containerRoot('c2')).toBeTruthy());
    await waitFor(() => expect(root().inert).toBe(true));

    // The whole subtree sits inside the inert root...
    expect(root().contains(containerRoot('c2'))).toBe(true);
    expect(root().contains(childNode('innertext'))).toBe(true);
    // ...while the inner Container never became disabled in its own right.
    expect(containerRoot('c2').inert).toBe(false);
    expect(harness.exposed('c2').isDisabled).toBe(false);
    expect(containerRoot('c2').getAttribute('data-disabled')).toBe('false');
  });
});

describe('Container: the reflow inputs it supplies', () => {
  const tempHeight = () => harness.session.store.read((s) => s.temporaryLayouts?.[ID]?.height);
  const settle = async () => {
    await drain();
    await new Promise((resolve) => requestAnimationFrame(resolve));
    await drain();
  };

  // Break this catches: dropping `isContainer: true`, or dropping headerHeight/showHeader from
  // the hook's trigger value. The container's computed height would then ignore its own header
  // and every child would sit 71px too high in the Viewer.
  //
  // Unlike a leaf widget, a Container's reflow is computed from CHILD LAYOUT POSITIONS rather
  // than DOM measurement (dynamicHeightReflow.js:332-340), so it IS observable in jsdom —
  // which is why this scenario asserts a real height and not merely a gate.
  test('[Container-DYN-002] Container feeds the shared reflow its container-shaped inputs', async () => {
    const kid = componentDefinition('kid', 'bodytext', 'Text', { text: binding('x') });
    kid.component.parent = ID;
    kid.layouts = { desktop: { top: 100, left: 0, width: 10, height: 60 } };

    harness.render({
      properties: { dynamicHeight: binding('{{true}}') },
      currentMode: 'view',
      extraComponents: { kid },
    });
    await waitFor(() => expect(bodyCanvas()).toBeTruthy());
    await settle();

    const withHeader = tempHeight();
    expect(withHeader).toBeGreaterThan(0);

    harness.setComponentProperty(ID, 'showHeader', '{{false}}', 'properties');
    await settle();

    // Hand-derived: headerHeight (60) + CONTAINER_FORM_CANVAS_PADDING (7) + 3 + 1.
    expect(withHeader - tempHeight()).toBe(71);
  });

  // Break this catches: letting the reflow run on the builder canvas, which would rewrite the
  // authored height of every dynamic-height container while someone is laying out a page.
  test('[Container-DYN-002] the reflow does not run on the builder canvas', async () => {
    const kid = componentDefinition('kid', 'bodytext', 'Text', { text: binding('x') });
    kid.component.parent = ID;
    kid.layouts = { desktop: { top: 100, left: 0, width: 10, height: 60 } };

    harness.render({
      properties: { dynamicHeight: binding('{{true}}') },
      currentMode: 'edit',
      extraComponents: { kid },
    });
    await waitFor(() => expect(bodyCanvas()).toBeTruthy());
    await settle();

    expect(tempHeight()).toBeUndefined();
  });
});

describe('Container: nested in a Listview row', () => {
  // Break this catches: the Container's sub-canvas resolving against the root context instead
  // of its row's, which would render every row's children from row 0's data — the classic
  // "all my list rows show the same record" bug. Also catches per-row exposed state
  // collapsing to a single shared object.
  test('[Container-NEST-002] a Container inside a Listview row resolves per row', async () => {
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
      const nested = componentDefinition(ID, NAME, 'Container');
      nested.component.parent = 'lv1';
      const rowChild = componentDefinition('kid', 'rowtext', 'Text', { text: binding('{{listItem.label}}') });
      rowChild.component.parent = ID;

      listview.render({
        properties: { data: binding('{{[{"label":"one"},{"label":"two"}]}}'), rowHeight: binding('{{200}}') },
        extraComponents: { [ID]: nested, kid: rowChild },
      });

      await waitFor(() => expect(document.querySelectorAll('.jet-container')).toHaveLength(2));

      // Each row's Container renders ITS OWN row's data, not a shared copy.
      const rendered = [...document.querySelectorAll('[data-cy="draggable-widget-rowtext"]')].map((n) => n.textContent);
      expect(rendered).toEqual(['one', 'two']);

      // A Listview ancestor switches the Container's exposed values to row-indexed storage
      // (resolvedSlice.js:569-577), so this is an array of two, not one object.
      const exposed = listview.session.store.read((s) => s.getExposedValueOfComponent(ID, 'canvas'));
      expect(Array.isArray(exposed)).toBe(true);
      expect(exposed).toHaveLength(2);
      expect(exposed[0].isVisible).toBe(true);
      expect(exposed[1].isVisible).toBe(true);
    } finally {
      listview.teardown();
    }
  });
});
