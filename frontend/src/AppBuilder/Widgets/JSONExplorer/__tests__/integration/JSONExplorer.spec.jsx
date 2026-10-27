/**
 * JSONExplorer widget behaviour.
 *
 * Contract: frontend/ee/test/app-builder/widgets/JSONExplorer/TESTING.md
 *
 * This is a READ-ONLY viewer built on react-json-tree. Its registration is a
 * near-twin of JSONEditor's — same four actions, same four styles, same
 * union-schema `value` — but almost nothing about its runtime matches, so
 * nothing is transferred from that contract without having been measured here.
 *
 * Two deliberate absences, both approved:
 *  - No accessibility scenario. The tree has zero roles and zero focusable
 *    elements (contract D-04). Pinning that markup would make a later fix look
 *    like a regression, so the gap is recorded as an exclusion instead.
 *  - No assertion that a disabled explorer blocks interaction. Nothing here is
 *    focusable, so "disabled" is entirely the platform's dimming and
 *    pointer-events block — browser-owned, covered by JSONExplorer-BRW-001.
 */
import { waitFor } from '@testing-library/react';
import { createWidgetHarness, binding } from '@/AppBuilder/Widgets/__tests__/integration/widgetHarness';
import { componentDefinition } from '@/test/app-builder';

const ID = 'jsonexplorer1';
const WIDGET_HEIGHT = 200;

const explorer = createWidgetHarness({
  componentType: 'JSONExplorer',
  handle: ID,
  id: ID,
  widgetHeight: WIDGET_HEIGHT,
});

/** The widget's own container: carries height, visibility and every style. */
const container$ = (c) => c.querySelector('.json-explorer');
/** react-json-tree renders the document as nested lists; one li per rendered node. */
const nodeRows = (c) => c.querySelectorAll('.json-explorer li').length;
const treePresent = (c) => c.querySelectorAll('.json-explorer ul').length > 0;
const treeText = (c) => container$(c)?.textContent ?? '';

/** The JSON this widget registers as its default, used wherever the seed matters. */
const SEEDED = {
  text: 'Hello World',
  number: 64,
  boolean: true,
  nullValue: null,
  fruits: ['banana', 'mango', 'grape'],
  objectA: { value: 'testing', enabled: false },
  items: [],
};

const mounted = async (container) => {
  await waitFor(() => expect(container$(container)).toBeInTheDocument());
  return container;
};
const setProperty = (property, value) =>
  explorer.session.store.act(() => explorer.setComponentProperty(ID, property, value, 'properties'));
const expectExposed = (values) => waitFor(() => expect(explorer.exposed()).toEqual(expect.objectContaining(values)));

describe('JSONExplorer widget', () => {
  beforeEach(() => explorer.setup());
  afterEach(() => explorer.teardown());

  test('[JSONExplorer-REN-001] a dropped explorer shows its JSON as a tree and publishes it unchanged', async () => {
    // Break this catches: serializing the value before display would show escaped JSON text instead
    // of a tree, and publishing a string instead of the object would break every binding reading it.
    const container = await mounted(explorer.render().container);

    expect(treePresent(container)).toBe(true);
    expect(treeText(container)).toContain('Hello World');
    expect(treeText(container)).toContain('fruits');
    await expectExposed({ value: SEEDED });
  });

  test('[JSONExplorer-PROP-001] a changed JSON property replaces the tree and the exposed value', async () => {
    // Break this catches: dropping the value dep from the batched effect leaves the explorer showing
    // a stale query result — the widget's whole purpose is displaying data that changes.
    const container = await mounted(explorer.render({ properties: { value: binding('{{({a: 1})}}') } }).container);
    expect(treeText(container)).toContain('a');

    await setProperty('value', '{{({changed: true})}}');

    await waitFor(() => expect(treeText(container)).toContain('changed'));
    await expectExposed({ value: { changed: true } });
  });

  test('[JSONExplorer-TREE-001] expand entire JSON controls how much of the tree is open', async () => {
    // Break this catches: losing the toggle leaves large payloads either fully collapsed, hiding the
    // data, or fully expanded, burying the page. Flipping it remounts the tree, so a runtime change
    // must re-apply rather than latch at its mount value.
    const container = await mounted(
      explorer.render({ properties: { shouldExpandEntireJSON: binding('{{false}}') } }).container
    );
    const collapsed = nodeRows(container);
    expect(collapsed).toBe(1);

    await setProperty('shouldExpandEntireJSON', '{{true}}');

    await waitFor(() => expect(nodeRows(container)).toBeGreaterThan(collapsed));
    expect(treeText(container)).toContain('banana');
  });

  test('[JSONExplorer-TREE-002] show root node controls whether the root row is rendered', async () => {
    // Break this catches: inverting the flag would hide the root summary when it was asked for, or
    // add an unwanted wrapper row above data that is meant to read as a bare list.
    const withRoot = await mounted(explorer.render().container);
    expect(treeText(withRoot)).toContain('root');

    explorer.teardown();
    explorer.setup();
    const withoutRoot = await mounted(
      explorer.render({ properties: { shouldShowRootNode: binding('{{false}}') } }).container
    );
    expect(treeText(withoutRoot)).not.toContain('root');
    expect(treeText(withoutRoot)).toContain('Hello World');
  });

  test('[JSONExplorer-CSA-001] setValue displays whatever it is given', async () => {
    // Break this catches: adding a type check or a parse step would change what existing apps show.
    // The sibling JSONEditor type-checks the same action and flags a non-object invalid; this widget
    // deliberately does neither (contract D-02), and a scalar at the root is a valid JSON document.
    const container = await mounted(explorer.render().container);

    await explorer.act('setValue', { a: 1 });
    await waitFor(() => expect(treeText(container)).toContain('a'));
    await expectExposed({ value: { a: 1 } });

    await explorer.act('setValue', [1, 2]);
    await expectExposed({ value: [1, 2] });

    await explorer.act('setValue', 'plain');
    await waitFor(() => expect(treeText(container)).toContain('plain'));
    await expectExposed({ value: 'plain' });

    await explorer.act('setValue', 42);
    await expectExposed({ value: 42 });

    await explorer.act('setValue', null);
    await expectExposed({ value: null });
  });

  test('[JSONExplorer-CSA-002] setVisibility hides the explorer and survives a no-op property rewrite', async () => {
    // Break this catches: widening the batched effect's comparison would let any unrelated re-resolve
    // stamp the property back over a state the app set deliberately.
    const container = await mounted(explorer.render().container);
    expect(container$(container)).toHaveStyle({ visibility: 'visible' });

    await explorer.act('setVisibility', false);
    await waitFor(() => expect(container$(container)).toHaveStyle({ visibility: 'hidden' }));
    await expectExposed({ isVisible: false });

    // The property was already {{true}}: re-resolving it must not revert the CSA.
    await setProperty('visibility', '{{true}}');
    expect(container$(container)).toHaveStyle({ visibility: 'hidden' });

    // A genuine change must win.
    await setProperty('visibility', '{{false}}');
    await setProperty('visibility', '{{true}}');
    await waitFor(() => expect(container$(container)).toHaveStyle({ visibility: 'visible' }));
  });

  test('[JSONExplorer-CSA-003] setLoading coerces its argument and swaps the tree for a loader', async () => {
    // Break this catches: dropping the !! coercion makes setLoading('') or setLoading(1) behave
    // unpredictably from a query, and losing the swap leaves no progress indication at all.
    const container = await mounted(explorer.render().container);
    expect(treePresent(container)).toBe(true);

    await explorer.act('setLoading', 'truthy-string');

    await waitFor(() => expect(treePresent(container)).toBe(false));
    await expectExposed({ isLoading: true });

    await explorer.act('setLoading', 0);
    await waitFor(() => expect(treePresent(container)).toBe(true));
    await expectExposed({ isLoading: false });
  });

  test('[JSONExplorer-CSA-004] setDisable publishes the disabled state', async () => {
    // Break this catches: RenderWidget reads the exposed isDisabled to decide whether to dim the
    // widget and block pointer events, so losing this publication silently disables nothing. The
    // dimming itself is platform-owned and browser-observable (BRW-001), not asserted here.
    await mounted(explorer.render().container);
    await expectExposed({ isDisabled: false });

    await explorer.act('setDisable', true);

    await expectExposed({ isDisabled: true });
  });

  test('[JSONExplorer-STATE-001] loading replaces the tree and the data survives it', async () => {
    // Break this catches: the tree is UNMOUNTED while loading, so if the data did not live in the
    // parent's state a loading cycle would silently discard what the explorer was showing.
    const container = await mounted(explorer.render().container);
    await explorer.act('setValue', { survives: true });
    await waitFor(() => expect(treeText(container)).toContain('survives'));

    await setProperty('loadingState', '{{true}}');
    await waitFor(() => expect(treePresent(container)).toBe(false));

    await setProperty('loadingState', '{{false}}');
    await waitFor(() => expect(treePresent(container)).toBe(true));
    expect(treeText(container)).toContain('survives');
  });

  test('[JSONExplorer-STATE-002] hiding the explorer hides it without unmounting it', async () => {
    // Break this catches: swapping the visibility keyword for an unmount would destroy the tree, so
    // a builder toggling visibility would lose the expanded state and re-render from scratch.
    const container = await mounted(explorer.render().container);
    await explorer.act('setValue', { kept: 1 });

    await setProperty('visibility', '{{false}}');
    await waitFor(() => expect(container$(container)).toHaveStyle({ visibility: 'hidden' }));
    expect(treePresent(container)).toBe(true);

    await setProperty('visibility', '{{true}}');
    await waitFor(() => expect(container$(container)).toHaveStyle({ visibility: 'visible' }));
    expect(treeText(container)).toContain('kept');
  });

  test('[JSONExplorer-STATE-003] loading and visibility remain independent', async () => {
    // Break this catches: both states write the same inline style object, so rebuilding it for one
    // can drop the other and leave a hidden widget visible or a loading one unstyled.
    // Deliberately not the mounted() helper: this starts loading, where the tree does not exist.
    const { container } = explorer.render({
      properties: { loadingState: binding('{{true}}'), visibility: binding('{{false}}') },
    });
    await waitFor(() => expect(container$(container)).toHaveStyle({ visibility: 'hidden', display: 'flex' }));
    expect(treePresent(container)).toBe(false);

    await setProperty('loadingState', '{{false}}');
    await waitFor(() => expect(treePresent(container)).toBe(true));
    expect(container$(container)).toHaveStyle({ visibility: 'hidden' });

    await setProperty('visibility', '{{true}}');
    await waitFor(() => expect(container$(container)).toHaveStyle({ visibility: 'visible' }));
  });

  test('[JSONExplorer-STYLE-001] container styles compose onto one element', async () => {
    // Break this catches: rebuilding the container's style object drops whichever property is written
    // last, silently reverting authored styling to default chrome.
    // Literal colours are required: the registered defaults are var() custom properties, which
    // jsdom's style parser discards.
    const shadow = '1px 2px 3px 4px rgba(0, 0, 0, 0.5)';
    const container = await mounted(
      explorer.render({
        styles: {
          backgroundColor: binding('#102030'),
          borderColor: binding('#ff0000'),
          borderRadius: binding('{{12}}'),
          boxShadow: binding(shadow),
        },
      }).container
    );

    expect(container$(container)).toHaveStyle({
      backgroundColor: '#102030',
      border: '1px solid #ff0000',
      borderRadius: '12px',
      boxShadow: shadow,
    });

    await explorer.session.store.act(() => explorer.setComponentProperty(ID, 'borderRadius', '{{2}}', 'styles'));
    await waitFor(() => expect(container$(container)).toHaveStyle({ borderRadius: '2px' }));
    expect(container$(container)).toHaveStyle({ backgroundColor: '#102030', border: '1px solid #ff0000' });
  });

  test('[JSONExplorer-DYN-001] dynamic height is inert on the canvas and active in the viewer', async () => {
    // Break this catches: dropping the currentMode gate resizes components under a builder while they
    // are laying the page out; ignoring view mode clips the tree it is meant to reveal.
    const editor = await mounted(
      explorer.render({ properties: { dynamicHeight: binding('{{true}}') }, currentMode: 'edit' }).container
    );
    expect(container$(editor)).toHaveStyle({ height: `${WIDGET_HEIGHT - 4}px` });

    explorer.teardown();
    explorer.setup();
    const viewer = await mounted(
      explorer.render({ properties: { dynamicHeight: binding('{{true}}') }, currentMode: 'view' }).container
    );
    expect(container$(viewer)).toHaveStyle({ height: '100%', minHeight: `${WIDGET_HEIGHT - 4}px` });
  });

  test('[JSONExplorer-FORM-001] inside a Form the explorer contributes data but ignores clearForm', async () => {
    // Break this catches BOTH halves, which are deliberately asymmetric (contract D-03). Losing the
    // formData contribution drops the field from submissions. Adding useFormClear here — which the
    // sibling JSONEditor has — would blank a viewer whose data comes from a bound property, showing
    // an empty tree until the next resolve.
    const container = explorer.renderInsideForm({}).container;
    await mounted(container);
    await waitFor(() => expect(explorer.exposed()?.setValue).toBeInstanceOf(Function));

    await waitFor(() => expect(explorer.exposed('form1')?.formData).toEqual({ [ID]: SEEDED }));

    await explorer.session.store.act(async () => {
      await explorer.exposed('form1').clearForm();
    });

    await expectExposed({ value: SEEDED });
    expect(treeText(container)).toContain('Hello World');
  });

  test('[JSONExplorer-ISO-001] two explorers on one page keep separate data', async () => {
    // Break this catches: hoisting the document into module scope would leak one explorer's data into
    // another, and two explorers on a page is the ordinary case for comparing payloads.
    const second = componentDefinition('jsonexplorer2', 'jsonexplorer2', 'JSONExplorer', {});
    const { container } = explorer.render({
      extraComponents: { jsonexplorer2: second },
      also: [{ id: 'jsonexplorer2', componentType: 'JSONExplorer' }],
    });
    await waitFor(() => expect(container.querySelectorAll('.json-explorer')).toHaveLength(2));

    await explorer.act('setValue', { only: 'first' });

    await waitFor(() => expect(explorer.exposed(ID)?.value).toEqual({ only: 'first' }));
    expect(explorer.exposed('jsonexplorer2')?.value).toEqual(SEEDED);

    const [firstTree, secondTree] = container.querySelectorAll('.json-explorer');
    expect(firstTree.textContent).toContain('only');
    expect(secondTree.textContent).toContain('Hello World');
  });
});
