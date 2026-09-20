/**
 * JSONEditor widget behaviour.
 *
 * Contract: frontend/ee/test/app-builder/widgets/JSONEditor/TESTING.md
 *
 * The session declares `geometry: { textRange: true }` because CodeMirror
 * measures itself on every edit; that control was added under the sibling
 * CodeEditor contract's D-02 and is reused here unchanged.
 *
 * NOTE on disabled state: the MOUSE block is platform-owned — RenderWidget adds
 * a `disabled` class and a global rule gives it `pointer-events: none`. Jest
 * does not load that stylesheet, so nothing here can assert it; the browser
 * scenario JSONEditor-BRW-004 owns it. What this file asserts is the KEYBOARD
 * path, which is what `editable` controls.
 */
import userEvent from '@testing-library/user-event';
import { screen, waitFor } from '@testing-library/react';
import { createWidgetHarness, binding, store } from '@/AppBuilder/Widgets/__tests__/integration/widgetHarness';
import { componentDefinition } from '@/test/app-builder';

const ID = 'jsoneditor1';

const jsonEditor = createWidgetHarness({
  componentType: 'JSONEditor',
  handle: ID,
  id: ID,
  widgetHeight: 200,
  capabilities: { geometry: { textRange: true } },
});

const surface = () => screen.getByRole('textbox');
const documentText = (container) => container.querySelector('.cm-content')?.textContent;
const mounted = async (container) => {
  await waitFor(() => expect(container.querySelector('.cm-editor')).toBeInTheDocument());
  return container;
};
const setProperty = (property, value) =>
  jsonEditor.session.store.act(() => jsonEditor.setComponentProperty(ID, property, value, 'properties'));
const container$ = (c) => c.querySelector('.json-editor-widget');
const editorPresent = (c) => !!c.querySelector('.cm-editor');
const foldPlaceholders = (c) => c.querySelectorAll('.cm-foldPlaceholder').length;
/** Inline underlines inside the document. Suppressed by the widget's markerFilter. */
const inlineLintMarks = (c) => c.querySelectorAll('.cm-lintPoint, .cm-lintRange').length;
/** The error marker in the lint gutter. This one DOES render. */
const gutterLintMarkers = (c) => c.querySelectorAll('.cm-lint-marker-error').length;
/** CodeMirror's linter debounces ~750ms; assert past it or the check is vacuous. */
const LINTER_DELAY_MS = 1000;
/** The seeded default JSON this widget registers. */
const SEEDED = {
  text: 'Hello World',
  number: 64,
  boolean: true,
  nullValue: null,
  fruits: ['banana', 'mango', 'grape'],
  objectA: { value: 'testing', enabled: false },
  items: [],
};
const expectExposed = (values) => waitFor(() => expect(jsonEditor.exposed()).toEqual(expect.objectContaining(values)));

describe('JSONEditor widget', () => {
  beforeEach(() => jsonEditor.setup());
  afterEach(() => jsonEditor.teardown());

  test('[JSONEditor-STATE-001] a disabled JSONEditor cannot be edited by keyboard', async () => {
    // Break this catches: the platform's `disabled` class stops the MOUSE with pointer-events, but
    // CodeMirror's contenteditable surface stays in the tab order, so without `editable` a user can
    // Tab into a disabled editor and rewrite a config the app deliberately locked. Commit 4f159069c7
    // closed this for eighteen widgets; JSONEditor was not among them.
    const container = await mounted(
      jsonEditor.render({ properties: { disabledState: binding('{{true}}') } }).container
    );
    const before = documentText(container);

    expect(surface()).toHaveAttribute('contenteditable', 'false');
    await waitFor(() => expect(jsonEditor.exposed()?.isDisabled).toBe(true));

    await userEvent.click(surface());
    await userEvent.type(surface(), '{{"injected": true}');
    expect(documentText(container)).toBe(before);

    // Re-enabling through the property restores editing.
    await setProperty('disabledState', '{{false}}');
    await waitFor(() => expect(surface()).toHaveAttribute('contenteditable', 'true'));
  });

  test('[JSONEditor-STATE-001] the setDisable action also closes the keyboard path', async () => {
    // Break this catches: routing only the PROPERTY through `editable` would leave an app that locks
    // the editor from a query still keyboard-editable, which is the commoner pattern of the two.
    const container = await mounted(jsonEditor.render().container);
    expect(surface()).toHaveAttribute('contenteditable', 'true');

    await jsonEditor.act('setDisable', true);

    await waitFor(() => expect(surface()).toHaveAttribute('contenteditable', 'false'));
    const before = documentText(container);
    await userEvent.click(surface());
    await userEvent.type(surface(), 'nope');
    expect(documentText(container)).toBe(before);
  });

  test('[JSONEditor-FOCUS-001] focus selects the component while authoring', async () => {
    // Break this catches: losing the focus handler costs builders the affordance of clicking into a
    // JSON editor to select it and land on its configuration tab.
    const container = await mounted(jsonEditor.render({ currentMode: 'edit' }).container);

    await userEvent.click(surface());

    await waitFor(() => expect(store().selectedComponents).toEqual([ID]));
    expect(store().activeRightSideBarTab).toBe('configuration');
  });

  test('[JSONEditor-FOCUS-001] focus in the viewer changes no builder state', async () => {
    // Break this catches: the handler writes component selection and inspector state, so without the
    // currentMode gate an end user clicking into a JSON editor in a deployed app drives builder chrome.
    const container = await mounted(jsonEditor.render({ currentMode: 'view' }).container);
    const selectedBefore = store().selectedComponents;
    const tabBefore = store().activeRightSideBarTab;

    await userEvent.click(surface());
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(store().selectedComponents).toEqual(selectedBefore);
    expect(store().activeRightSideBarTab).toBe(tabBefore);
  });

  test('[JSONEditor-REN-001] a dropped editor shows its seeded JSON and publishes it parsed', async () => {
    // Break this catches: failing to stringify the seeded object leaves builders staring at
    // [object Object], and failing to publish it strands every {{components.x.value}} binding.
    const container = await mounted(jsonEditor.render().container);

    expect(surface()).toHaveAttribute('data-language', 'json');
    expect(documentText(container)).toContain('"text": "Hello World"');
    await expectExposed({ value: SEEDED, isValid: true });
  });

  test('[JSONEditor-PROP-001] a changed JSON property replaces the document and the exposed value', async () => {
    // Break this catches: dropping the value dep from the batched effect leaves the editor showing
    // stale JSON after a query rebinds it, which is the widget's main data-in path.
    const container = await mounted(jsonEditor.render({ properties: { value: binding('{{({a:1})}}') } }).container);
    expect(documentText(container)).toBe('{  "a": 1}');

    await setProperty('value', '{{({b:2})}}');

    await waitFor(() => expect(documentText(container)).toBe('{  "b": 2}'));
    await expectExposed({ value: { b: 2 }, isValid: true });
  });

  test('[JSONEditor-EDIT-001] typing republishes valid JSON and keeps the last good parse when invalid', async () => {
    // Break this catches: publishing a half-typed object would make every bound query flap mid-edit,
    // while never flipping isValid would let apps trust garbage. Also pins the validation surfaces
    // (contract D-03): the gutter error marker is what a user actually sees, while the inline
    // underlines are deliberately filtered out — so both losing the gutter marker and un-suppressing
    // the inline marks are caught here.
    const container = await mounted(jsonEditor.render({ properties: { value: binding('{{({a:1})}}') } }).container);
    await expectExposed({ value: { a: 1 }, isValid: true });

    await userEvent.click(surface());
    await userEvent.type(surface(), 'garbage');

    await waitFor(() => expect(jsonEditor.exposed()?.isValid).toBe(false));
    // `value` holds its last successful parse rather than going blank — contract D-06.
    expect(jsonEditor.exposed()?.value).toEqual({ a: 1 });

    // Past CodeMirror's linter delay (~750ms): asserting immediately passes whether or not anything is
    // suppressed, which measurement confirmed.
    await new Promise((resolve) => setTimeout(resolve, LINTER_DELAY_MS));
    // The gutter error marker DOES render — this is the on-screen validation signal a user gets.
    expect(gutterLintMarkers(container)).toBe(1);
    // The inline underlines are suppressed by the widget's markerFilter, deliberately (contract D-03).
    expect(inlineLintMarks(container)).toBe(0);
  });

  test('[JSONEditor-FOLD-001] expand entire JSON folds and unfolds the document', async () => {
    // Break this catches: losing the folding latch leaves large configs either permanently collapsed
    // or permanently expanded, ignoring the builder's toggle.
    const container = await mounted(
      jsonEditor.render({ properties: { shouldExpandEntireJSON: binding('{{false}}') } }).container
    );

    await waitFor(() => expect(foldPlaceholders(container)).toBe(1));

    await setProperty('shouldExpandEntireJSON', '{{true}}');

    await waitFor(() => expect(foldPlaceholders(container)).toBe(0));
    expect(container.querySelectorAll('.cm-line').length).toBeGreaterThan(1);
  });

  test('[JSONEditor-CSA-001] setValue accepts objects, arrays and null, and reports anything else invalid', async () => {
    // Break this catches: the typeof branch decides both what the editor shows and what isValid says.
    // null must take the SUCCESS path (typeof null === 'object'), while a string or number publishes
    // the raw argument with isValid false even though the editor then displays valid JSON — pinned
    // per contract D-02 so a refactor cannot flip it silently.
    const container = await mounted(jsonEditor.render().container);

    await jsonEditor.act('setValue', { a: 1 });
    expect(documentText(container)).toBe('{  "a": 1}');
    await expectExposed({ value: { a: 1 }, isValid: true });

    await jsonEditor.act('setValue', [1, 2]);
    await expectExposed({ value: [1, 2], isValid: true });

    await jsonEditor.act('setValue', null);
    expect(documentText(container)).toBe('null');
    await expectExposed({ value: null, isValid: true });

    await jsonEditor.act('setValue', '{"a":1}');
    expect(documentText(container)).toBe('{"a":1}');
    await expectExposed({ value: '{"a":1}', isValid: false });

    await jsonEditor.act('setValue', 42);
    await expectExposed({ value: 42, isValid: false });
  });

  test('[JSONEditor-CSA-002] setVisibility hides and restores the editor', async () => {
    // Break this catches: an app hiding a JSON editor from a query would leave it on screen.
    const container = await mounted(jsonEditor.render().container);
    expect(container$(container)).toHaveStyle({ visibility: 'visible' });

    await jsonEditor.act('setVisibility', false);

    await waitFor(() => expect(container$(container)).toHaveStyle({ visibility: 'hidden' }));
    await expectExposed({ isVisible: false });

    await jsonEditor.act('setVisibility', true);
    await waitFor(() => expect(container$(container)).toHaveStyle({ visibility: 'visible' }));
  });

  test('[JSONEditor-CSA-003] setLoading coerces its argument and swaps the editor for a loader', async () => {
    // Break this catches: dropping the !! coercion makes setLoading('') or setLoading(1) behave
    // unpredictably from a query, and losing the swap leaves no progress indication at all.
    const container = await mounted(jsonEditor.render().container);
    expect(editorPresent(container)).toBe(true);

    await jsonEditor.act('setLoading', 'truthy-string');

    await waitFor(() => expect(editorPresent(container)).toBe(false));
    await expectExposed({ isLoading: true });

    await jsonEditor.act('setLoading', 0);
    await waitFor(() => expect(editorPresent(container)).toBe(true));
    await expectExposed({ isLoading: false });
  });

  test('[JSONEditor-CSA-004] a CSA state survives a no-op property re-resolve and yields to a real change', async () => {
    // Break this catches: widening the batched effect's dep comparison would make any unrelated
    // re-resolve stamp the property back over a state the app set deliberately.
    const container = await mounted(jsonEditor.render().container);

    await jsonEditor.act('setVisibility', false);
    await waitFor(() => expect(container$(container)).toHaveStyle({ visibility: 'hidden' }));

    // A no-op rewrite: the property was already {{true}} and must not revert the CSA.
    await setProperty('visibility', '{{true}}');
    expect(container$(container)).toHaveStyle({ visibility: 'hidden' });
    expect(jsonEditor.exposed()?.isVisible).toBe(false);

    // A genuine change must win.
    await setProperty('visibility', '{{false}}');
    await setProperty('visibility', '{{true}}');
    await waitFor(() => expect(container$(container)).toHaveStyle({ visibility: 'visible' }));
    await expectExposed({ isVisible: true });
  });

  test('[JSONEditor-STATE-002] loading replaces the editor and the document survives it', async () => {
    // Break this catches: the editor is UNMOUNTED while loading, so if the document did not live in
    // the parent's state a loading cycle would silently discard the user's JSON.
    const container = await mounted(jsonEditor.render().container);
    await jsonEditor.act('setValue', { survives: true });
    expect(documentText(container)).toBe('{  "survives": true}');

    await setProperty('loadingState', '{{true}}');
    await waitFor(() => expect(editorPresent(container)).toBe(false));

    await setProperty('loadingState', '{{false}}');
    await waitFor(() => expect(editorPresent(container)).toBe(true));
    expect(documentText(container)).toBe('{  "survives": true}');
  });

  test('[JSONEditor-STATE-003] hiding the editor hides it without unmounting it', async () => {
    // Break this catches: swapping the visibility keyword for an unmount would destroy the document,
    // so a builder toggling visibility would lose whatever the user had typed.
    const container = await mounted(jsonEditor.render().container);
    await jsonEditor.act('setValue', { kept: 1 });

    await setProperty('visibility', '{{false}}');

    await waitFor(() => expect(container$(container)).toHaveStyle({ visibility: 'hidden' }));
    expect(editorPresent(container)).toBe(true);

    await setProperty('visibility', '{{true}}');
    await waitFor(() => expect(container$(container)).toHaveStyle({ visibility: 'visible' }));
    expect(documentText(container)).toBe('{  "kept": 1}');
  });

  test('[JSONEditor-STATE-004] loading and visibility remain independent', async () => {
    // Break this catches: both write the same inline style object, so rebuilding it for one state can
    // drop the other and leave a hidden widget visible or a loading one unstyled.
    // Deliberately NOT the `mounted()` helper: this case starts in the loading state, where the editor
    // is unmounted by design, so waiting for `.cm-editor` would never settle.
    const { container } = jsonEditor.render({
      properties: { loadingState: binding('{{true}}'), visibility: binding('{{false}}') },
    });

    await waitFor(() => expect(container$(container)).toHaveStyle({ visibility: 'hidden', display: 'flex' }));
    expect(editorPresent(container)).toBe(false);

    await setProperty('loadingState', '{{false}}');
    await waitFor(() => expect(editorPresent(container)).toBe(true));
    expect(container$(container)).toHaveStyle({ visibility: 'hidden' });

    await setProperty('visibility', '{{true}}');
    await waitFor(() => expect(container$(container)).toHaveStyle({ visibility: 'visible' }));
  });

  test('[JSONEditor-STYLE-001] container styles compose onto one element', async () => {
    // Break this catches: rebuilding the container's style object drops whichever property is written
    // last, silently reverting authored styling to default chrome.
    // Literal colours are required: the registered defaults are var() custom properties, which jsdom's
    // style parser discards.
    const shadow = '1px 2px 3px 4px rgba(0, 0, 0, 0.5)';
    const container = await mounted(
      jsonEditor.render({
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

    await jsonEditor.session.store.act(() => jsonEditor.setComponentProperty(ID, 'borderRadius', '{{2}}', 'styles'));
    await waitFor(() => expect(container$(container)).toHaveStyle({ borderRadius: '2px' }));
    expect(container$(container)).toHaveStyle({ backgroundColor: '#102030', border: '1px solid #ff0000' });
  });

  test('[JSONEditor-DYN-001] dynamic height is inert on the canvas and active in the viewer', async () => {
    // Break this catches: dropping the currentMode gate resizes components under a builder while they
    // are laying the page out; ignoring view mode clips the JSON it is meant to reveal.
    const editor = await mounted(
      jsonEditor.render({ properties: { dynamicHeight: binding('{{true}}') }, currentMode: 'edit' }).container
    );
    expect(container$(editor)).toHaveStyle({ height: '196px' });

    jsonEditor.teardown();
    jsonEditor.setup();
    const viewer = await mounted(
      jsonEditor.render({ properties: { dynamicHeight: binding('{{true}}') }, currentMode: 'view' }).container
    );
    expect(container$(viewer)).toHaveStyle({ height: '100%' });
  });

  test('[JSONEditor-FORM-001] a JSONEditor inside a Form contributes its JSON to the Form data', async () => {
    // Break this catches: losing the child's registration drops the field from every submission.
    const container = jsonEditor.renderInsideForm({}).container;
    await mounted(container);
    await waitFor(() => expect(jsonEditor.exposed()?.setValue).toBeInstanceOf(Function));

    await jsonEditor.act('setValue', { payload: 1 });

    await waitFor(() => expect(jsonEditor.exposed('form1')?.formData).toEqual({ [ID]: { payload: 1 } }));
    expect(Object.keys(jsonEditor.exposed('form1')?.children ?? {})).toContain(ID);
  });

  test('[JSONEditor-FORM-002] clearForm clears to null and resetForm re-seeds from the property', async () => {
    // Break this catches: clearForm must reach useFormClear, and resetForm must re-seed from the value
    // property. The sibling CodeEditor registers NO value property and so goes stale on reset (its
    // D-04); this widget must not regress into the same shape.
    const container = jsonEditor.renderInsideForm({}).container;
    await mounted(container);
    await waitFor(() => expect(jsonEditor.exposed()?.setValue).toBeInstanceOf(Function));

    await jsonEditor.act('setValue', { payload: 1 });
    await expectExposed({ value: { payload: 1 } });

    await jsonEditor.session.store.act(async () => {
      await jsonEditor.exposed('form1').clearForm();
    });
    await waitFor(() => expect(documentText(container)).toBe('null'));
    await expectExposed({ value: null, isValid: true });

    await jsonEditor.act('setValue', { payload: 2 });
    await expectExposed({ value: { payload: 2 } });

    await jsonEditor.session.store.act(async () => {
      await jsonEditor.exposed('form1').resetForm();
    });
    await waitFor(() => expect(jsonEditor.exposed()?.value).toEqual(SEEDED));
  });

  test('[JSONEditor-ISO-001] two editors on one page keep separate documents', async () => {
    // Break this catches: hoisting the document into module scope would leak one editor's JSON into
    // another, and two editors on a page is the ordinary case.
    const second = componentDefinition('jsoneditor2', 'jsoneditor2', 'JSONEditor', {});
    const { container } = jsonEditor.render({
      extraComponents: { jsoneditor2: second },
      also: [{ id: 'jsoneditor2', componentType: 'JSONEditor' }],
    });
    await waitFor(() => expect(container.querySelectorAll('.cm-editor')).toHaveLength(2));

    await jsonEditor.act('setValue', { only: 'first' });

    await waitFor(() => expect(jsonEditor.exposed(ID)?.value).toEqual({ only: 'first' }));
    expect(jsonEditor.exposed('jsoneditor2')?.value).toEqual(SEEDED);

    // Also assert the rendered documents, not just the store. The store is keyed per component id by
    // RenderWidget, so exposed values stay separate even if the widget hoisted its document into
    // module scope — measured: that fault leaves these two assertions as the only thing that notices.
    const [firstDoc, secondDoc] = container.querySelectorAll('.cm-content');
    expect(firstDoc.textContent).toBe('{  "only": "first"}');
    expect(secondDoc.textContent).toContain('"text": "Hello World"');
  });

  test('[JSONEditor-A11Y-001] the editor is reachable and announced as a multi-line text control', async () => {
    // Break this catches: losing the role or live region makes the editor invisible to assistive
    // technology — this widget has no label of its own, so the role is all a screen reader has.
    const container = await mounted(jsonEditor.render().container);

    expect(surface()).toHaveAttribute('role', 'textbox');
    expect(surface()).toHaveAttribute('aria-multiline', 'true');
    expect(container.querySelector('.cm-announced')).toHaveAttribute('aria-live', 'polite');
  });
});
