/**
 * Timeline: the 14 approved Engineering scenarios in
 * frontend/ee/test/app-builder/widgets/Timeline/TESTING.md. Characterization
 * branch — `production_changes: forbidden` — every test here protects
 * Timeline.jsx's current behavior, none of it changes.
 *
 * Real store, real RenderWidget, real Timeline / getSafeRenderableValue /
 * useDynamicHeight. Nothing about the widget is mocked. Shared setup lives in
 * Widgets/widgetHarness.js.
 *
 * tooltip/tooltipFormat and cssClass are deliberately NOT re-tested here: they
 * are implemented once in RenderWidget and already covered by the shared
 * RenderWidgetTooltip.spec / RenderWidgetCssClass.spec suites this contract
 * points to (`shared:` disposition rows).
 */
import { screen, waitFor } from '@testing-library/react';
import { componentDefinition } from '@/test/app-builder';
import { createWidgetHarness, binding } from '@/AppBuilder/Widgets/__tests__/integration/widgetHarness';

const ID = 'tl1';
const NAME = 'timeline1';
const OFFSET_HEIGHT = 96;

// Baseline is timeline.js's own `definition.properties`, copied verbatim for
// the title/subTitle/date values — not invented defaults. `iconBackgroundColor`
// is the one field swapped for a literal hex color instead of the real
// default's `var(--cc-primary-brand)`: jsdom's cssstyle rejects `var()` as an
// invalid background-color value and silently drops it (verified directly —
// even `style.cssText` comes back empty, so no DOM read in this environment
// could ever observe it), which would make DEF-001 fail for an environment
// reason unrelated to the mapping it guarantees.
const widget = createWidgetHarness({
  componentType: 'Timeline',
  handle: NAME,
  id: ID,
  offsetHeight: OFFSET_HEIGHT,
  defaultProperties: {
    data: binding(
      "{{ [ \n\t\t{ title: 'Product Launched', subTitle: 'First version of our product released to public', date: '20/10/2021', iconBackgroundColor: '#4d72fa'},\n\t\t { title: 'First Signup', subTitle: 'Congratulations! We got our first signup', date: '22/10/2021', iconBackgroundColor: '#4d72fa'}, \n\t\t { title: 'First Payment', subTitle: 'Hurray! We got our first payment', date: '01/11/2021', iconBackgroundColor: '#4d72fa'} \n] }}"
    ),
    hideDate: binding('{{false}}'),
    dynamicHeight: binding('{{false}}'),
    visibility: binding('{{true}}'),
    tooltip: binding(''),
    tooltipFormat: binding('plainText'),
  },
});

const list = (container) => container.querySelector('.list-timeline');
const items = (container) => container.querySelectorAll('.list-timeline > li');
const titleOf = (li) => li.querySelector('.list-timeline-title')?.textContent;
const subtitleOf = (li) => li.querySelector('.text-muted')?.textContent;
const dateOf = (li) => li.querySelector('.list-timeline-time')?.textContent;
const iconOf = (li) => li.querySelector('.list-timeline-icon');

async function setProperty(name, value, paramType = 'properties') {
  await widget.session.store.act(() => widget.setComponentProperty(ID, name, value, paramType));
}

describe('Timeline: default rendering', () => {
  beforeEach(() => widget.setup());
  afterEach(() => widget.teardown());

  test("[Timeline-DEF-001] renders every item's title, subtitle, date, and icon color from default seeded data", async () => {
    // Break this catches: a wrong field mapping (e.g. subTitle swapped for title) or a dropped
    // iconBackgroundColor style silently breaks every default Timeline instance.
    const { container } = widget.render();

    const rows = await waitFor(() => {
      const found = items(container);
      expect(found).toHaveLength(3);
      return found;
    });
    expect(titleOf(rows[0])).toBe('Product Launched');
    expect(subtitleOf(rows[0])).toBe('First version of our product released to public');
    expect(dateOf(rows[0])).toBe('20/10/2021');
    expect(iconOf(rows[0]).style.backgroundColor).toBe('rgb(77, 114, 250)');
    expect(titleOf(rows[1])).toBe('First Signup');
    expect(titleOf(rows[2])).toBe('First Payment');
  });

  test('[Timeline-DEF-002] default hideDate=false shows the date column', async () => {
    // Break this catches: the date cell silently disappearing (or defaulting to hidden) for a
    // widget that was never configured to hide it.
    const { container } = widget.render();

    const rows = await waitFor(() => {
      const found = items(container);
      expect(found).toHaveLength(3);
      return found;
    });
    expect(dateOf(rows[0])).toBe('20/10/2021');
    expect(dateOf(rows[1])).toBe('22/10/2021');
    expect(dateOf(rows[2])).toBe('01/11/2021');
    expect(list(container)).not.toHaveClass('list-timeline-simple');
  });
});

describe('Timeline: hideDate and visibility', () => {
  beforeEach(() => widget.setup());
  afterEach(() => widget.teardown());

  test('[Timeline-STATE-001] hideDate=true hides the date and applies the simple list class', async () => {
    // Break this catches: hideDate removing content but leaving the layout class off (or vice
    // versa), which is exactly the two-property interaction BND-001 also probes.
    const { container } = widget.render({ properties: { hideDate: binding('{{true}}') } });

    await waitFor(() => expect(items(container)).toHaveLength(3));
    expect(container.querySelectorAll('.list-timeline-time')).toHaveLength(0);
    expect(list(container)).toHaveClass('list-timeline-simple');
  });

  test('[Timeline-STATE-002] visibility=false hides the widget', async () => {
    // Break this catches: dropping the `display: visibility ? '' : 'none'` wiring, or wiring it
    // to the wrong element, silently leaves a "hidden" widget visible on the canvas.
    const { container } = widget.render({ properties: { visibility: binding('{{false}}') } });
    const card = () => container.querySelector('.card');

    await waitFor(() => expect(card()).toHaveStyle({ display: 'none' }));

    await setProperty('visibility', true);
    await waitFor(() => expect(card()).not.toHaveStyle({ display: 'none' }));
  });
});

describe('Timeline: dynamic data', () => {
  beforeEach(() => widget.setup());
  afterEach(() => widget.teardown());

  test('[Timeline-DATA-001] dynamic data binding changes re-render the list', async () => {
    // Break this catches: a missing/incorrect re-render dependency leaves the previous array's
    // items in the DOM alongside (or instead of) the new ones.
    const { container } = widget.render({
      properties: {
        data: binding(
          "{{ [{title:'Alpha', subTitle:'A sub', date:'2021-01-01', iconBackgroundColor:'#111111'}, {title:'Beta', subTitle:'B sub', date:'2021-02-02', iconBackgroundColor:'#222222'}] }}"
        ),
      },
    });
    await waitFor(() => expect(items(container)).toHaveLength(2));

    await setProperty(
      'data',
      "{{ [{title:'Gamma', subTitle:'G sub', date:'2021-03-03', iconBackgroundColor:'#333333'}] }}"
    );

    await waitFor(() => expect(items(container)).toHaveLength(1));
    expect(titleOf(items(container)[0])).toBe('Gamma');
    expect(container.textContent).not.toContain('Alpha');
    expect(container.textContent).not.toContain('Beta');
  });
});

describe('Timeline: boundary values', () => {
  beforeEach(() => widget.setup());
  afterEach(() => widget.teardown());

  test('[Timeline-BND-001] empty or non-array data renders an empty list without crashing', async () => {
    // Break this catches: dropping the `isArray(data) ? data : []` guard throws (or renders
    // garbage) the moment `data` reaches Timeline.jsx as something other than an array.
    //
    // The resolver's own schema coercion (registered `validation.schema: {type:'array'}`)
    // already normalizes an ordinary `{{null}}`/non-array *binding* back to `[]` before it
    // reaches the widget, which would make this fault invisible through a normal binding.
    // `setComponentProperty(..., skipResolve: true)` writes the raw resolved value directly —
    // the same path a legacy/corrupted saved value or a raw programmatic write would take,
    // bypassing that coercion — to actually exercise Timeline.jsx's own guard.
    const { container } = widget.render({ properties: { data: binding('{{[]}}'), hideDate: binding('{{false}}') } });
    await waitFor(() => expect(list(container)).toBeInTheDocument());
    expect(items(container)).toHaveLength(0);

    await widget.session.store.act(() =>
      widget.setComponentProperty(ID, 'data', null, 'properties', 'value', true)
    );
    await widget.session.store.act(() => widget.setComponentProperty(ID, 'hideDate', true, 'properties', 'value', true));
    await waitFor(() => expect(list(container)).toHaveClass('list-timeline-simple'));
    expect(items(container)).toHaveLength(0);

    await widget.session.store.act(() =>
      widget.setComponentProperty(ID, 'data', 'not-an-array', 'properties', 'value', true)
    );
    expect(items(container)).toHaveLength(0);
  });

  test('[Timeline-BND-002] item missing one or more keys renders safely', async () => {
    // Break this catches: reading item.title/subTitle/date/iconBackgroundColor without a
    // default/guard throws on the first saved app whose item omits any of them.
    const { container } = widget.render({
      properties: { data: binding('{{ [{}] }}'), hideDate: binding('{{false}}') },
    });

    const [row] = await waitFor(() => {
      const found = items(container);
      expect(found).toHaveLength(1);
      return found;
    });
    expect(titleOf(row)).toBe('');
    expect(subtitleOf(row)).toBe('');
    expect(dateOf(row)).toBe('');
    expect(iconOf(row).style.backgroundColor).toBe('');
  });

  test('[Timeline-BND-003] non-primitive item field renders via the safe-stringify fallback', async () => {
    // Break this catches: regression of commit 109d88cc71c — passing a raw object/array straight
    // to React as a child throws "Objects are not valid as a React child".
    const { container } = widget.render({
      properties: {
        data: binding("{{ [{ title: {a:1}, subTitle: 'ok', date: [1,2], iconBackgroundColor: '#000000' }] }}"),
      },
    });

    const [row] = await waitFor(() => {
      const found = items(container);
      expect(found).toHaveLength(1);
      return found;
    });
    expect(titleOf(row)).toBe(String({ a: 1 }));
    expect(subtitleOf(row)).toBe('ok');
    expect(dateOf(row)).toBe(String([1, 2]));
  });
});

describe('Timeline: exposed value', () => {
  beforeEach(() => widget.setup());
  afterEach(() => widget.teardown());

  test('[Timeline-VAR-001] value stays at its seeded default and is never updated by the widget', async () => {
    // Break this catches: a future change wiring data/hideDate into setExposedVariable would
    // silently change `components.timeline1.value` for every app already reading it as `{}`.
    const { container } = widget.render();
    await waitFor(() => expect(items(container)).toHaveLength(3));
    expect(widget.exposed().value).toEqual({});

    await widget.session.store.act(() =>
      widget.render({ properties: { data: binding('{{[]}}'), hideDate: binding('{{true}}') } })
    );
    await waitFor(() => expect(items(container)).toHaveLength(0));
    expect(widget.exposed().value).toEqual({});
  });
});

describe('Timeline: accessibility', () => {
  beforeEach(() => widget.setup());
  afterEach(() => widget.teardown());

  test('[Timeline-A11Y-001] renders as a semantic list structure', async () => {
    // Break this catches: swapping the <ul>/<li> markup for generic <div>s drops native list
    // semantics with no ARIA replacement, silently breaking screen-reader navigation.
    widget.render();

    const timelineList = await screen.findByRole('list');
    await waitFor(() => expect(screen.getAllByRole('listitem')).toHaveLength(3));
    expect(timelineList).toHaveClass('list-timeline');
  });
});

describe('Timeline: instance isolation', () => {
  beforeEach(() => widget.setup());
  afterEach(() => widget.teardown());

  test('[Timeline-ISO-001] two Timeline instances remain independent', async () => {
    // Break this catches: any id-scoped read/write accidentally falling back to a shared/global
    // key would leak one instance's data update into its sibling's rendered list.
    const second = componentDefinition('tl2', 'timeline2', 'Timeline', {
      data: binding("{{ [{title:'Second A', subTitle:'S sub', date:'2022-01-01', iconBackgroundColor:'#222222'}] }}"),
      hideDate: binding('{{true}}'),
      visibility: binding('{{true}}'),
      dynamicHeight: binding('{{false}}'),
      tooltip: binding(''),
      tooltipFormat: binding('plainText'),
    });

    const { container } = widget.render({
      properties: {
        data: binding("{{ [{title:'First A', subTitle:'F sub', date:'2021-01-01', iconBackgroundColor:'#111111'}] }}"),
        hideDate: binding('{{false}}'),
      },
      extraComponents: { tl2: second },
      also: [{ id: 'tl2', componentType: 'Timeline' }],
    });

    const firstWrapper = () => container.querySelector('[data-cy="draggable-widget-timeline1"]');
    const secondWrapper = () => container.querySelector('[data-cy="draggable-widget-timeline2"]');

    await waitFor(() => expect(firstWrapper().querySelectorAll('li')).toHaveLength(1));
    expect(titleOf(firstWrapper().querySelector('li'))).toBe('First A');
    expect(titleOf(secondWrapper().querySelector('li'))).toBe('Second A');

    await widget.session.store.act(() =>
      widget.setComponentProperty(
        ID,
        'data',
        "{{ [{title:'Changed1', subTitle:'C1', date:'2023-01-01', iconBackgroundColor:'#ffffff'}, {title:'Changed2', subTitle:'C2', date:'2023-02-02', iconBackgroundColor:'#ffffff'}] }}",
        'properties'
      )
    );

    await waitFor(() => expect(firstWrapper().querySelectorAll('li')).toHaveLength(2));
    expect(secondWrapper().querySelectorAll('li')).toHaveLength(1);
    expect(titleOf(secondWrapper().querySelector('li'))).toBe('Second A');
  });
});

describe('Timeline: security', () => {
  beforeEach(() => widget.setup());
  afterEach(() => widget.teardown());

  test('[Timeline-SEC-001] malformed iconBackgroundColor does not crash or inject content', async () => {
    // Break this catches: routing iconBackgroundColor (or any item field) through
    // dangerouslySetInnerHTML instead of an inline style would let an attacker-controlled value
    // execute script on every viewer's canvas.
    const { container } = widget.render({
      properties: {
        data: binding(
          "{{ [{ title:'A', subTitle:'B', date:'C', iconBackgroundColor: 'not-a-real-color-xyz' }, { title:'D', subTitle:'E', date:'F', iconBackgroundColor: '<img src=x onerror=window.__timelineXss=true>' }] }}"
        ),
      },
    });

    const rows = await waitFor(() => {
      const found = items(container);
      expect(found).toHaveLength(2);
      return found;
    });
    expect(iconOf(rows[0])).toBeInTheDocument();
    expect(iconOf(rows[1])).toBeInTheDocument();
    expect(container.querySelector('img')).toBeNull();
    expect(container.querySelector('script')).toBeNull();
    expect(window.__timelineXss).toBeUndefined();
  });
});

describe('Timeline: dynamic height', () => {
  let offsetParentDescriptor;

  beforeEach(() => {
    // useDynamicHeight treats `element.offsetParent === null` as "mounted under a hidden
    // ancestor" and takes the ResizeObserver-recovery branch instead of scheduling a reflow.
    // jsdom's default offsetParent is null for every element, so without this override these
    // tests would silently exercise the wrong branch of Timeline.jsx's dynamic-height wiring.
    offsetParentDescriptor = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'offsetParent');
    Object.defineProperty(HTMLElement.prototype, 'offsetParent', {
      configurable: true,
      get() {
        return this.parentElement;
      },
    });
    widget.setup();
  });
  afterEach(() => {
    Object.defineProperty(HTMLElement.prototype, 'offsetParent', offsetParentDescriptor);
    widget.teardown();
  });

  const tempLayout = () => widget.session.store.read((state) => state.temporaryLayouts[ID]);

  test('[Timeline-DYN-001] dynamicHeight wiring re-triggers on data/hideDate change', async () => {
    // Break this catches: narrowing useDynamicHeight's effect dependency away from
    // JSON.stringify({data, hideDate}) stops the reflow from re-running when only the list
    // content changes, leaving stale temporary layout height behind.
    const { container } = widget.render({
      properties: { dynamicHeight: binding('{{true}}') },
      currentMode: 'view',
    });
    const layoutElement = container.querySelector('[data-cy="draggable-widget-timeline1"]');
    layoutElement.classList.add(`ele-${ID}`);
    layoutElement.dataset.layoutContext = 'root';

    await widget.session.store.act((state) => state.clearTemporaryLayouts());
    await setProperty(
      'data',
      "{{ [{title:'Reflowed', subTitle:'R', date:'2021-01-01', iconBackgroundColor:'#000'}] }}"
    );
    await waitFor(() => expect(tempLayout()?.height).toBe(OFFSET_HEIGHT));

    await widget.session.store.act((state) => state.clearTemporaryLayouts());
    await setProperty('hideDate', true);
    await waitFor(() => expect(tempLayout()?.height).toBe(OFFSET_HEIGHT));
  });

  test('[Timeline-DYN-002] dynamicHeight only applies in Viewer, not in the Editor canvas', async () => {
    // Break this catches: dropping the `currentMode === 'view'` half of the gate would apply
    // `height: 'auto'` in the Editor too, destabilizing canvas geometry while authoring.
    const { container } = widget.render({
      properties: { dynamicHeight: binding('{{true}}') },
      currentMode: 'edit',
    });
    const card = () => container.querySelector('.card');

    await waitFor(() => expect(items(container)).toHaveLength(3));
    expect(card()).toHaveStyle({ height: '36px', overflow: 'auto' });
    expect(card().style.minHeight).toBe('');
  });
});
