/**
 * CodeEditor widget behaviour.
 *
 * Contract: frontend/ee/test/app-builder/widgets/CodeEditor/TESTING.md
 *
 * Two things about this widget shape every test here:
 *
 *  1. It registers ZERO events and NO value property. `{{components.x.value}}`
 *     is its entire contract with the rest of ToolJet, which is why the typed
 *     input path (INPUT-001/002) is covered at this layer and not left to the
 *     `setValue` CSA alone — a break in `onChange` -> `updateValue` -> debounce
 *     -> store would leave every CSA test passing.
 *  2. CodeMirror measures itself on every edit, so the session declares
 *     `geometry: { textRange: true }` (contract D-02).
 *
 *     Why that control exists: CodeMirror asks a Range for its client rects
 *     to find out how wide a character is. jsdom implements no such method, so
 *     the measurement throws mid-flight AND leaves CodeMirror's own probe text
 *     ("abc def ghi jkl mno pqr stu") sitting in the document — without the
 *     control a typing test yields garbage rather than simply failing. The
 *     stub answers with a fixed 8x14 character box. Nothing asserted below
 *     depends on that number; it exists only so editing reaches the document
 *     and the store, which is what these tests actually check.
 *
 * FORM-002 and ASYNC-001 deliberately pin KNOWN DEFECTS (contract D-04, D-05).
 * They are expected to fail when those defects are fixed — read the comment in
 * each before "correcting" it.
 */
import userEvent from '@testing-library/user-event';
import { screen, waitFor } from '@testing-library/react';
import { createWidgetHarness, binding } from '@/AppBuilder/Widgets/__tests__/integration/widgetHarness';
import { componentDefinition } from '@/test/app-builder';

const ID = 'codeeditor1';
const WIDGET_HEIGHT = 120;
/** The debounce the widget puts between an edit and the store write. */
const DEBOUNCE_MS = 500;

const codeEditor = createWidgetHarness({
  componentType: 'CodeEditor',
  handle: ID,
  id: ID,
  widgetHeight: WIDGET_HEIGHT,
  capabilities: { geometry: { textRange: true } },
});

/** The widget's own wrapper: carries visibility, height and the disabled flag. */
const wrapper = (container) => container.querySelector(`[data-cy="${ID}"]`);
/** The bordered box: carries border, radius, shadow and the height cap. */
const box = (container) => container.querySelector('.code-editor-widget');
/** CodeMirror's editable surface. Public query: role=textbox. */
const surface = () => screen.getByRole('textbox');
const documentText = (container) => container.querySelector('.cm-content')?.textContent;
const lineNumbers = (container) => container.querySelector('.cm-lineNumbers');
const foldGutter = (container) => container.querySelector('.cm-foldGutter');
const placeholderText = (container) => container.querySelector('.cm-placeholder')?.textContent;

const mounted = async (container) => {
  await waitFor(() => expect(container.querySelector('.cm-editor')).toBeInTheDocument());
  return container;
};

/** Lets the widget's 500ms debounce elapse so the store write lands. */
const settle = () => new Promise((resolve) => setTimeout(resolve, DEBOUNCE_MS + 200));

const setProperty = (property, value, paramType = 'properties') =>
  codeEditor.session.store.act(() => codeEditor.setComponentProperty(ID, property, value, paramType));

const expectValue = async (expected, componentId = ID) =>
  waitFor(() => expect(codeEditor.exposed(componentId)?.value).toBe(expected));

describe('CodeEditor widget', () => {
  beforeEach(() => codeEditor.setup());
  afterEach(() => codeEditor.teardown());

  describe('rendering and defaults', () => {
    test('[CodeEditor-REN-001] renders an editable multi-line code surface with a line-number gutter', async () => {
      // Break this catches: dropping the CodeMirror extensions or the basicSetup gutter flags leaves
      // builders with an unusable or unreachable editor that no accessible query can find.
      const container = await mounted(codeEditor.render().container);

      expect(surface()).toHaveAttribute('aria-multiline', 'true');
      expect(surface()).toHaveAttribute('contenteditable', 'true');
      expect(lineNumbers(container)).toBeInTheDocument();
    });

    test('[CodeEditor-REN-002] a new editor starts empty and exposes an empty value', async () => {
      // Break this catches: seeding the document from an unrelated property (placeholder, mode) would
      // put text a builder never wrote into the editor and into every binding reading its value.
      const container = await mounted(codeEditor.render().container);

      expect(documentText(container)).toBe('');
      await expectValue('');
    });
  });

  describe('properties', () => {
    // Literal, hand-checked: the five languages langSupport maps, plus the fallback cases.
    // `css` resolves to the sass parser and `jsx` reports as javascript — both verified by hand
    // against CodeEditor.jsx:16-22, not derived from the production table.
    test.each([
      ['javascript', 'javascript'],
      ['python', 'python'],
      ['sql', 'sql'],
      ['jsx', 'javascript'],
      ['css', 'sass'],
      ['PYTHON', 'python'],
      ['go', 'javascript'],
      ['', 'javascript'],
    ])('[CodeEditor-PROP-001] mode %p selects the %p parser', async (mode, expected) => {
      // Break this catches: losing the toLowerCase() breaks every capitalised mode a builder saved,
      // and losing the `?? javascript()` fallback makes an unmapped language render nothing at all.
      // The fallback is pinned deliberately (contract D-01): the docs advertise ~150 languages while
      // five are mapped, so unmapped values are the path builders following the docs actually hit.
      const container = await mounted(codeEditor.render({ properties: { mode: binding(mode) } }).container);

      expect(container.querySelector('.cm-content')).toHaveAttribute('data-language', expected);
    });

    test('[CodeEditor-PROP-002] placeholder renders only when configured and follows live changes', async () => {
      // Break this catches: forwarding the registered validation default ('placeholder') instead of the
      // seeded definition default ('') would show stray hint text in every freshly dropped editor.
      const container = await mounted(codeEditor.render().container);
      expect(placeholderText(container)).toBeUndefined();

      await setProperty('placeholder', 'type code here');
      await waitFor(() => expect(placeholderText(container)).toBe('type code here'));

      await setProperty('placeholder', 'changed');
      await waitFor(() => expect(placeholderText(container)).toBe('changed'));
    });

    test('[CodeEditor-PROP-003] show line number toggles the numbers without removing the fold gutter', async () => {
      // Break this catches: wiring enableLineNumber to the whole gutter rather than the lineNumbers flag
      // would take code folding away with the numbers.
      const container = await mounted(codeEditor.render().container);
      expect(lineNumbers(container)).toBeInTheDocument();
      expect(foldGutter(container)).toBeInTheDocument();

      await setProperty('enableLineNumber', '{{false}}');
      await waitFor(() => expect(lineNumbers(container)).not.toBeInTheDocument());
      expect(foldGutter(container)).toBeInTheDocument();

      await setProperty('enableLineNumber', '{{true}}');
      await waitFor(() => expect(lineNumbers(container)).toBeInTheDocument());
    });
  });

  describe('typed input', () => {
    test('[CodeEditor-INPUT-001] typed code reaches the document and settles into the exposed value', async () => {
      // Break this catches: a break anywhere in onChange -> updateValue -> codeChanged -> setExposedVariable
      // silently strands every {{components.x.value}} binding, and NO setValue test would notice because
      // the CSA writes the store on a different path.
      const container = await mounted(codeEditor.render().container);

      await userEvent.click(surface());
      await userEvent.type(surface(), 'const a = 1');

      expect(documentText(container)).toBe('const a = 1');
      // Asserts the SETTLED value only, never a write count: the debounce is rebuilt every render and
      // does not coalesce (contract D-03), so a count would pin a defect instead of the guarantee.
      await expectValue('const a = 1');
    });

    test('[CodeEditor-INPUT-002] a disabled editor refuses typed input', async () => {
      // Break this catches: dropping `editable={!disabledState}` lets users edit a form field the app
      // deliberately locked, and the edit would reach the store looking like legitimate input.
      const container = await mounted(codeEditor.render({ styles: { disabledState: binding('{{true}}') } }).container);

      await userEvent.click(surface());
      await userEvent.type(surface(), 'should not appear');
      await settle();

      expect(documentText(container)).toBe('');
      expect(codeEditor.exposed()?.value).toBe('');
    });
  });

  describe('component actions', () => {
    test('[CodeEditor-CSA-001] setValue replaces the document and settles into the exposed value', async () => {
      // Break this catches: losing the setExposedVariable('setValue') registration breaks every RunJS
      // query and event handler that fills this editor programmatically.
      const container = await mounted(codeEditor.render().container);

      await codeEditor.act('setValue', 'const getRandom = () => 4');

      expect(documentText(container)).toBe('const getRandom = () => 4');
      await expectValue('const getRandom = () => 4');
    });

    test('[CodeEditor-CSA-002] setValue with an empty string clears the editor', async () => {
      // Break this catches: guarding on truthiness rather than typeof would make '' a no-op, removing
      // the only way an app has to clear this editor — it registers no clear action.
      const container = await mounted(codeEditor.render().container);
      await codeEditor.act('setValue', 'to be cleared');
      await expectValue('to be cleared');

      await codeEditor.act('setValue', '');

      expect(documentText(container)).toBe('');
      await expectValue('');
    });

    test('[CodeEditor-CSA-003] setValue ignores a non-string argument without wedging the handle', async () => {
      // Break this catches: dropping the typeof guard renders '[object Object]' or '42' as code; leaving
      // the handle broken afterwards would strand every later call from the same query.
      const container = await mounted(codeEditor.render().container);

      await codeEditor.act('setValue', 42);
      await codeEditor.act('setValue', { code: 'x' });
      await codeEditor.act('setValue', null);
      await settle();

      expect(documentText(container)).toBe('');
      expect(codeEditor.exposed()?.value).toBe('');

      await codeEditor.act('setValue', 'valid again');
      expect(documentText(container)).toBe('valid again');
      await expectValue('valid again');
    });

    test('[CodeEditor-CSA-004] editor content survives an unrelated property change', async () => {
      // Break this catches: keying the editor on a property, or re-seeding local state from one, would
      // wipe a user's code the moment any bound property re-resolved.
      const container = await mounted(codeEditor.render().container);
      await codeEditor.act('setValue', 'keep me');
      await expectValue('keep me');

      await setProperty('mode', 'sql');
      await waitFor(() => expect(container.querySelector('.cm-content')).toHaveAttribute('data-language', 'sql'));

      expect(documentText(container)).toBe('keep me');
      expect(codeEditor.exposed()?.value).toBe('keep me');
    });
  });

  describe('states', () => {
    test('[CodeEditor-STATE-001] disable makes the editor read-only and marks it in the DOM', async () => {
      // Break this catches: losing either half leaves a form field editable when the app locked it, or
      // leaves styling and automation unable to tell that it is locked.
      const container = await mounted(codeEditor.render().container);
      expect(surface()).toHaveAttribute('contenteditable', 'true');
      expect(wrapper(container)).toHaveAttribute('data-disabled', 'false');

      await setProperty('disabledState', '{{true}}', 'styles');
      await waitFor(() => expect(surface()).toHaveAttribute('contenteditable', 'false'));
      expect(wrapper(container)).toHaveAttribute('data-disabled', 'true');

      await setProperty('disabledState', '{{false}}', 'styles');
      await waitFor(() => expect(surface()).toHaveAttribute('contenteditable', 'true'));
    });

    test('[CodeEditor-STATE-002] hiding the editor hides it without unmounting it', async () => {
      // Break this catches: unmounting on hide would destroy the CodeMirror document, so a builder
      // toggling visibility would silently lose whatever the user had typed.
      const container = await mounted(codeEditor.render().container);
      await codeEditor.act('setValue', 'survives hiding');
      await expectValue('survives hiding');

      await setProperty('visibility', '{{false}}', 'styles');
      await waitFor(() => expect(wrapper(container)).toHaveStyle({ display: 'none' }));
      // `hidden: true` is the point of the assertion, not a workaround: display:none makes the editor
      // inaccessible, and the guarantee is that it is nonetheless still MOUNTED rather than destroyed.
      expect(screen.getByRole('textbox', { hidden: true })).toBeInTheDocument();

      await setProperty('visibility', '{{true}}', 'styles');
      await waitFor(() => expect(wrapper(container)).toHaveStyle({ display: 'block' }));
      expect(documentText(container)).toBe('survives hiding');
      expect(codeEditor.exposed()?.value).toBe('survives hiding');
    });

    test('[CodeEditor-STATE-003] setValue still works on a disabled editor', async () => {
      // Break this catches: routing the CSA through the same editable gate as the user would break the
      // common pattern of filling a read-only editor from a query result.
      const container = await mounted(codeEditor.render({ styles: { disabledState: binding('{{true}}') } }).container);

      await codeEditor.act('setValue', 'filled by a query');

      expect(documentText(container)).toBe('filled by a query');
      await expectValue('filled by a query');
      expect(surface()).toHaveAttribute('contenteditable', 'false');
    });
  });

  describe('styles', () => {
    test('[CodeEditor-STYLE-001] border radius, border colour and box shadow compose onto one container', async () => {
      // Break this catches: rebuilding the container's inline style object drops whichever property is
      // written last, so authored styling silently reverts to the default chrome.
      const shadow = '1px 2px 3px 4px rgba(0, 0, 0, 0.5)';
      const container = await mounted(
        codeEditor.render({
          styles: {
            borderRadius: binding('{{12}}'),
            borderColor: binding('#ff0000'),
            backgroundColor: binding('#00ff00'),
            boxShadow: binding(shadow),
          },
        }).container
      );

      expect(box(container)).toHaveStyle({ borderRadius: '12px', border: '1px solid #ff0000', boxShadow: shadow });

      await setProperty('borderRadius', '{{2}}', 'styles');
      await waitFor(() => expect(box(container)).toHaveStyle({ borderRadius: '2px' }));
      expect(box(container)).toHaveStyle({ border: '1px solid #ff0000', boxShadow: shadow });
    });

    test('[CodeEditor-STYLE-002] background colour is published as the custom property the stylesheet reads', async () => {
      // Break this catches: renaming the custom property on either side (here or in codeEditor.scss)
      // silently restores the default surface and the configured Background stops applying.
      const container = await mounted(codeEditor.render({ styles: { backgroundColor: binding('#123456') } }).container);

      expect(box(container).style.getPropertyValue('--cc-code-editor-background-color')).toBe('#123456');

      await setProperty('backgroundColor', '#654321', 'styles');
      await waitFor(() =>
        expect(box(container).style.getPropertyValue('--cc-code-editor-background-color')).toBe('#654321')
      );
    });
  });

  describe('dynamic height', () => {
    test('[CodeEditor-DYN-001] dynamic height is inert on the canvas and active in the viewer', async () => {
      // Break this catches: dropping the currentMode gate resizes components under a builder while they
      // are laying the page out; ignoring view mode clips the content it is meant to reveal.
      const editor = await mounted(
        codeEditor.render({ properties: { dynamicHeight: binding('{{true}}') }, currentMode: 'edit' }).container
      );
      expect(wrapper(editor)).toHaveStyle({ height: `${WIDGET_HEIGHT - 4}px` });

      codeEditor.teardown();
      codeEditor.setup();
      const viewer = await mounted(
        codeEditor.render({ properties: { dynamicHeight: binding('{{true}}') }, currentMode: 'view' }).container
      );
      expect(wrapper(viewer)).toHaveStyle({ height: '100%' });

      await setProperty('dynamicHeight', '{{false}}');
      await waitFor(() => expect(wrapper(viewer)).toHaveStyle({ height: `${WIDGET_HEIGHT - 4}px` }));
    });

    test('[CodeEditor-DYN-002] the 320px scroll cap is lifted only by dynamic height', async () => {
      // Break this catches: losing the cap lets a long file push the component past its authored box on
      // the canvas; losing the lift traps a dynamic-height editor at 320px and clips the content.
      const fixed = await mounted(codeEditor.render({ currentMode: 'view' }).container);
      expect(box(fixed)).toHaveStyle({ maxHeight: '320px', overflow: 'auto' });

      codeEditor.teardown();
      codeEditor.setup();
      const dynamic = await mounted(
        codeEditor.render({ properties: { dynamicHeight: binding('{{true}}') }, currentMode: 'view' }).container
      );
      expect(box(dynamic)).toHaveStyle({ maxHeight: '100%', overflow: 'auto' });
    });
  });

  describe('Form lifecycle', () => {
    test('[CodeEditor-FORM-001] a CodeEditor inside a Form contributes its code to the Form data', async () => {
      // Break this catches: losing the child's registration in the Form's children map drops the field
      // from every submission, and breaks setValue dispatch routed through that same map.
      const { container } = codeEditor.renderInsideForm({});
      await mounted(container);
      await waitFor(() => expect(codeEditor.exposed()?.setValue).toBeInstanceOf(Function));

      await codeEditor.act('setValue', 'payload');
      await expectValue('payload');

      await waitFor(() => expect(codeEditor.exposed('form1')?.formData).toEqual({ [ID]: 'payload' }));
      expect(Object.keys(codeEditor.exposed('form1')?.children ?? {})).toContain(ID);
    });

    test('[CodeEditor-FORM-002] clearForm clears both, while resetForm leaves the exposed value stale', async () => {
      // KNOWN DEFECT, pinned deliberately (contract D-04). `resetForm` remounts the child, which empties
      // the editor, but this widget registers no value property and republishes nothing on mount, so the
      // store keeps the pre-reset text: a Form can submit code the user can no longer see. Measured
      // CodeEditor-only across eight form-aware widgets; every other one re-seeds from its value property.
      // WHEN THAT DEFECT IS FIXED THIS TEST WILL FAIL. That is intended — update the expectation to ''
      // rather than reverting the fix.
      // Break this catches, meanwhile: a regression in clearForm, whose two-sided clear is correct today.
      const { container } = codeEditor.renderInsideForm({});
      await mounted(container);
      await waitFor(() => expect(codeEditor.exposed()?.setValue).toBeInstanceOf(Function));

      await codeEditor.act('setValue', 'payload');
      await expectValue('payload');

      await codeEditor.session.store.act(async () => {
        await codeEditor.exposed('form1').resetForm();
      });
      await settle();
      expect(documentText(container)).toBe('');
      expect(codeEditor.exposed()?.value).toBe('payload'); // the defect

      await codeEditor.act('setValue', 'payload again');
      await expectValue('payload again');

      await codeEditor.session.store.act(async () => {
        await codeEditor.exposed('form1').clearForm();
      });
      await settle();
      expect(documentText(container)).toBe('');
      await expectValue(''); // clearForm is correct
    });
  });

  describe('lifecycle and isolation', () => {
    test('[CodeEditor-ASYNC-001] a write scheduled before unmount still lands afterwards', async () => {
      // KNOWN DEFECT, pinned deliberately (contract D-05). The 500ms debounce is never cancelled, so a
      // write outlives the component and lands on exposed values for a widget that no longer exists.
      // WHEN THAT DEFECT IS FIXED THIS TEST WILL FAIL. That is intended — flip the expectation to '' and
      // keep the scenario, rather than reverting the cleanup.
      const { container, unmount } = codeEditor.render();
      await mounted(container);

      await codeEditor.act('setValue', 'scheduled');
      expect(codeEditor.exposed()?.value).toBe(''); // still inside the debounce window

      unmount();
      await settle();

      expect(codeEditor.exposed()?.value).toBe('scheduled'); // the defect
    });

    test('[CodeEditor-ISO-001] two editors on one page keep separate documents', async () => {
      // Break this catches: hoisting the document into module scope or sharing it across instances would
      // leak one editor's code into another — and two editors on a page is the ordinary case.
      const second = componentDefinition('codeeditor2', 'codeeditor2', 'CodeEditor', {});
      const { container } = codeEditor.render({
        extraComponents: { codeeditor2: second },
        also: [{ id: 'codeeditor2', componentType: 'CodeEditor' }],
      });
      await waitFor(() => expect(container.querySelectorAll('.cm-editor')).toHaveLength(2));

      await codeEditor.act('setValue', 'first only');
      await expectValue('first only', ID);
      await expectValue('', 'codeeditor2');

      const editors = container.querySelectorAll('.cm-content');
      expect(editors[0].textContent).toBe('first only');
      expect(editors[1].textContent).toBe('');
    });
  });

  describe('accessibility', () => {
    test('[CodeEditor-A11Y-001] the editor is reachable and announced as a multi-line text control', async () => {
      // Break this catches: losing the role or the live region makes the editor invisible to assistive
      // technology — this widget has no label of its own, so the role is all a screen reader has.
      const container = await mounted(codeEditor.render().container);

      expect(surface()).toHaveAttribute('role', 'textbox');
      expect(surface()).toHaveAttribute('aria-multiline', 'true');
      expect(container.querySelector('.cm-announced')).toHaveAttribute('aria-live', 'polite');
    });
  });
});
