/**
 * Form — how clicks and the Enter key submit a Form, and that neither reloads the page.
 *
 * Form has no widget test contract yet (`widget-testing-manifest.json`:
 * not-started); this is a standalone regression spec until it is backfilled.
 *
 * Background. A Form renders a real `<form>`. A browser treats every
 * `<button>` without `type="button"` as a submit button, and Enter in a
 * single-line field "implicitly submits" by clicking the form's FIRST submit
 * button in page order — not necessarily the one set as the Form's
 * "Submit button". When a Form sits inside another Form, Chromium and WebKit
 * also stop the inner form's bubbling `submit` at the outer `<form>`, so it never
 * reaches React's root listener: the browser then performs a real GET submit and
 * reloads the page.
 *
 * jsdom implements neither rule, and user-event only treats `button:not([type])`
 * / `button[type=submit]` as submit buttons. `pressEnter` below therefore follows
 * the browser's rule (the same one `InlineLibraryComponent.tsx`'s `submitOnEnter`
 * re-implements for pack fields), and the nested-form case installs Chromium's
 * stop on the outer `<form>`.
 */
import React from 'react';
import { act, fireEvent, screen } from '@testing-library/react';
import RenderWidget from '@/AppBuilder/AppCanvas/RenderWidget';
import useStore from '@/AppBuilder/_stores/store';
import { AppBuilderTestSession, defineAppBuilderScenario, seedApp, componentDefinition } from '@/test/app-builder';
import { getComponentToRender } from '@/AppBuilder/_helpers/editorHelpers';
import {
  binding,
  drain,
  widgetProps,
  preloadLazyComponent,
  MODULE_ID,
  recordNativeSubmits,
} from '@/AppBuilder/Widgets/__tests__/integration/widgetHarness';

const state = () => useStore.getState();

const SCENARIO = defineAppBuilderScenario({
  id: 'form-submit',
  name: 'Form submission by click and Enter',
  primarySeam: 'rtl',
  surface: 'app-editor',
  edition: 'ce',
  environment: 'development',
  layout: 'desktop',
  version: 'draft',
  transferPath: 'not-applicable',
  access: 'authenticated',
  // dnd: Form renders its body through AppCanvas/Container.
  capabilities: { observers: true, media: { matches: false }, dnd: true },
});

/* ------------------------------------------------------------------ *
 * App builders
 * ------------------------------------------------------------------ */

const formDefinition = (id, { buttonToSubmit = 'none', parent } = {}) => {
  const def = componentDefinition(id, id, 'Form', {
    advanced: binding('{{false}}'),
    visibility: binding('{{true}}'),
    loadingState: binding('{{false}}'),
    disabledState: binding('{{false}}'),
    showHeader: binding('{{true}}'),
    showFooter: binding('{{true}}'),
    buttonToSubmit: binding(buttonToSubmit),
  });
  if (parent) def.component.parent = parent;
  return def;
};

function child(id, type, parent, properties = {}) {
  const def = componentDefinition(id, id, type, properties);
  def.component.parent = parent;
  def.component.definition.others = { showOnDesktop: binding('{{true}}'), showOnMobile: binding('{{false}}') };
  return def;
}

const button = (id, parent, text, extra = {}) => child(id, 'Button', parent, { text: binding(text), ...extra });
const textInput = (id, parent) => child(id, 'TextInput', parent);

/** An event row that counts its own invocations in `variables[key]`. */
const counter = (sourceId, eventId, key) => ({
  id: `evt-${sourceId}-${eventId}`,
  index: 0,
  sourceId,
  name: `evt-${sourceId}-${eventId}`,
  target: 'component',
  event: { eventId, actionId: 'set-custom-variable', key, value: `{{(variables.${key} ?? 0) + 1}}` },
});
const count = (key) => state().getVariable(key, 'canvas') ?? 0;

let session;

function renderApp(components, events = []) {
  seedApp(components, { moduleId: MODULE_ID });
  if (events.length) state().eventsSlice.setEvents(events, MODULE_ID);
  state().setEditorLoading(false, MODULE_ID);
  state().setCurrentMode('view', MODULE_ID);
  return session.render(<RenderWidget {...widgetProps('form1', 'Form', { currentMode: 'view' })} />);
}

/**
 * A Form with a "Cancel" Button in its header (first in page order), a text
 * field in its body, and a "Submit" Button in its footer.
 */
function renderFormWithCancelAndSubmit({ buttonToSubmit = 'submit1', submitProps = {} } = {}) {
  return renderApp(
    {
      form1: formDefinition('form1', { buttonToSubmit }),
      cancel1: button('cancel1', 'form1-header', 'Cancel'),
      field1: textInput('field1', 'form1'),
      submit1: button('submit1', 'form1-footer', 'Submit', submitProps),
    },
    [
      counter('cancel1', 'onClick', 'cancelClicks'),
      counter('submit1', 'onClick', 'submitClicks'),
      counter('form1', 'onSubmit', 'formSubmits'),
      counter('field1', 'onEnterPressed', 'enterPresses'),
    ]
  );
}

const formElement = (id) => document.querySelector(`form#${id}`);

/**
 * Enter in a single-line field, as a browser handles it (HTML implicit
 * submission): unless keydown was cancelled, click the first submit button whose
 * form owner is the field's form; with none, submit a form that has only one
 * such field.
 */
async function pressEnter(field) {
  await act(async () => {
    field.focus();
    const proceed = fireEvent.keyDown(field, { key: 'Enter', code: 'Enter' });
    const form = field.form;
    if (proceed && form) {
      const defaultButton = Array.from(form.elements).find(
        (el) => (el instanceof HTMLButtonElement || el instanceof HTMLInputElement) && el.type === 'submit'
      );
      if (defaultButton) {
        if (!defaultButton.disabled) defaultButton.click();
      } else if (Array.from(form.elements).filter((el) => el instanceof HTMLInputElement).length === 1) {
        form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
      }
    }
    fireEvent.keyUp(field, { key: 'Enter', code: 'Enter' });
  });
  await drain();
}

describe('Form submission', () => {
  beforeEach(() => {
    session = new AppBuilderTestSession({ scenario: SCENARIO });
  });

  describe('Enter in a field', () => {
    test('presses the Form’s configured Submit button, not the first Button in the form', async () => {
      // Break this catches: leaving Enter to the browser, which clicks the
      // header "Cancel" Button because it is the first submit button in order.
      renderFormWithCancelAndSubmit();
      await drain();

      await pressEnter(screen.getByRole('textbox'));

      expect(count('submitClicks')).toBe(1);
      expect(count('formSubmits')).toBe(1);
      expect(count('cancelClicks')).toBe(0);
      // The field's own Enter event is unaffected.
      expect(count('enterPresses')).toBe(1);
    });

    test('never starts a native form submission (no page reload)', async () => {
      renderFormWithCancelAndSubmit();
      await drain();
      const nativeSubmits = recordNativeSubmits(formElement('form1'));

      await pressEnter(screen.getByRole('textbox'));

      expect(nativeSubmits).toEqual([]);
    });

    test('does nothing when the Form has no Submit button set', async () => {
      // Break this catches: a fallback that still presses some Button (here the
      // header "Cancel") when no Submit button is configured.
      renderFormWithCancelAndSubmit({ buttonToSubmit: 'none' });
      await drain();

      await pressEnter(screen.getByRole('textbox'));

      expect(count('cancelClicks')).toBe(0);
      expect(count('submitClicks')).toBe(0);
      expect(count('formSubmits')).toBe(0);
      expect(count('enterPresses')).toBe(1);
    });

    test('does nothing when the Submit button is disabled', async () => {
      // Break this catches: submitting the Form directly instead of pressing
      // the Submit button, which skips the button's disabled guard.
      renderFormWithCancelAndSubmit({ submitProps: { disabledState: binding('{{true}}') } });
      await drain();

      await pressEnter(screen.getByRole('textbox'));

      expect(count('submitClicks')).toBe(0);
      expect(count('formSubmits')).toBe(0);
      expect(count('cancelClicks')).toBe(0);
    });

    test('does nothing when the Form is disabled', async () => {
      // Break this catches: the Form's hidden default button staying enabled
      // while the Form is disabled. A field the disabled body cannot reach (here
      // one in the header) then still submits the Form on Enter.
      const form = formDefinition('form1', { buttonToSubmit: 'submit1' });
      form.component.definition.properties.disabledState = binding('{{true}}');
      renderApp(
        {
          form1: form,
          headerField: textInput('headerField', 'form1-header'),
          submit1: button('submit1', 'form1-footer', 'Submit'),
        },
        [counter('submit1', 'onClick', 'submitClicks'), counter('form1', 'onSubmit', 'formSubmits')]
      );
      await drain();
      const nativeSubmits = recordNativeSubmits(formElement('form1'));

      await pressEnter(screen.getByRole('textbox'));

      expect(count('submitClicks')).toBe(0);
      expect(count('formSubmits')).toBe(0);
      expect(nativeSubmits).toEqual([]);
    });
  });

  describe('clicking a Button', () => {
    test('a Button that is not the Submit button does not submit the form natively', async () => {
      // Break this catches: Button rendering as a submit button (`type`
      // "default"/missing), so every click inside a Form starts a native submit.
      renderFormWithCancelAndSubmit();
      await drain();
      const nativeSubmits = recordNativeSubmits(formElement('form1'));

      await session.user.click(screen.getByRole('button', { name: 'Cancel' }));

      expect(count('cancelClicks')).toBe(1);
      expect(count('formSubmits')).toBe(0);
      expect(nativeSubmits).toEqual([]);
    });

    test('the Submit button submits the Form once, without a native form submission', async () => {
      renderFormWithCancelAndSubmit();
      await drain();
      const nativeSubmits = recordNativeSubmits(formElement('form1'));

      await session.user.click(screen.getByRole('button', { name: 'Submit' }));

      expect(count('submitClicks')).toBe(1);
      expect(count('formSubmits')).toBe(1);
      expect(nativeSubmits).toEqual([]);
    });
  });

  describe('a Form nested inside a Form', () => {
    function renderNestedForms() {
      return renderApp(
        {
          form1: formDefinition('form1', { buttonToSubmit: 'outerSubmit' }),
          outerSubmit: button('outerSubmit', 'form1-footer', 'Outer submit'),
          form2: formDefinition('form2', { buttonToSubmit: 'innerSubmit', parent: 'form1' }),
          innerField: textInput('innerField', 'form2'),
          innerSubmit: button('innerSubmit', 'form2-footer', 'Inner submit'),
        },
        [
          counter('form1', 'onSubmit', 'outerSubmits'),
          counter('form2', 'onSubmit', 'innerSubmits'),
          counter('innerSubmit', 'onClick', 'innerClicks'),
        ]
      );
    }

    /**
     * Chromium/WebKit: a submit from a <form> nested in another <form> does not
     * bubble past the inner form. It never reaches the outer <form>, `document`
     * or React's root listener, so React's onSubmit cannot cancel it. This stops
     * it right above the inner form, as those browsers do, and returns every
     * submit dispatched at the inner form so a test can check each ended cancelled.
     */
    function installChromiumNestedFormStop(inner) {
      const submits = [];
      inner.addEventListener('submit', (event) => submits.push(event), true);
      inner.parentElement.addEventListener('submit', (event) => {
        if (event.target === inner) event.stopPropagation();
      });
      return submits;
    }

    /** Submits that were never cancelled: each one is a page reload in a browser. */
    const uncancelled = (submits) => submits.filter((event) => !event.defaultPrevented).map((event) => event.target.id);

    test('clicking the inner Submit button submits only the inner Form, with no native submission', async () => {
      renderNestedForms();
      await drain();
      expect(formElement('form1').contains(formElement('form2'))).toBe(true);
      const innerSubmits = installChromiumNestedFormStop(formElement('form2'));

      await session.user.click(screen.getByRole('button', { name: 'Inner submit' }));

      // Either no native submit started, or it was cancelled: never an
      // uncancelled one (a page reload).
      expect(uncancelled(innerSubmits)).toEqual([]);
      expect(count('innerClicks')).toBe(1);
      expect(count('innerSubmits')).toBe(1);
      expect(count('outerSubmits')).toBe(0);
    });

    test('Enter in an inner field submits only the inner Form, with no native submission', async () => {
      renderNestedForms();
      await drain();
      const innerSubmits = installChromiumNestedFormStop(formElement('form2'));

      await pressEnter(screen.getByRole('textbox'));

      expect(uncancelled(innerSubmits)).toEqual([]);
      expect(count('innerSubmits')).toBe(1);
      expect(count('outerSubmits')).toBe(0);
    });

    test('a button that still submits forms, inside the inner Form, cannot reload the page', async () => {
      // Break this catches: relying on each widget's buttons being type="button".
      // FileButton (like the Table button column, FileInput and Chat) renders
      // through the shared ui Button, a plain <button> that submits its form. In
      // a nested Form only a listener on the inner <form> itself can cancel that.
      await preloadLazyComponent(getComponentToRender('FileButton'));
      renderApp({
        form1: formDefinition('form1'),
        form2: formDefinition('form2', { parent: 'form1' }),
        fileButton1: child('fileButton1', 'FileButton', 'form2'),
      });
      await drain();
      const innerSubmits = installChromiumNestedFormStop(formElement('form2'));
      const submitting = Array.from(formElement('form2').querySelectorAll('button')).find(
        (el) => el.type === 'submit' && !el.classList.contains('jet-form-default-submit')
      );
      expect(submitting).toBeDefined();

      await act(async () => submitting.click());

      expect(innerSubmits.map((event) => event.target.id)).toEqual(['form2']);
      expect(uncancelled(innerSubmits)).toEqual([]);
    });
  });
});
