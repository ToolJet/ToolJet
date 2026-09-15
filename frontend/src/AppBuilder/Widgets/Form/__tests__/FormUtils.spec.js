/**
 * Pure-unit scenarios from the Form testing contract
 * (ee/test/app-builder/widgets/Form/TESTING.md).
 *
 * `getBodyHeight` and `generateUIComponents` are the two exported deterministic
 * product APIs Form owns, so they are tested at the cheapest seam the contract
 * allows — no store, no DOM. Everything else in the contract needs the real
 * composed store and lives in ./integration/Form.spec.jsx.
 */
import { getBodyHeight, generateUIComponents } from '../FormUtils';
import { formConfig } from '@/AppBuilder/WidgetManager/widgets/form';

describe('getBodyHeight', () => {
  // Expected values are hand-derived from the documented arithmetic, never by
  // calling the function: subtract each SHOWN slot's height plus its padding
  // (10px header, 14px footer), round the remainder UP to the next 10px, take
  // off 20px of body padding, and never return less than 40px.
  //
  //   450, no slots          -> 450            -> ceil 450 -> 430
  //   450, header 60         -> 450-60-10=380  -> ceil 380 -> 360
  //   450, footer 60         -> 450-60-14=376  -> ceil 380 -> 360
  //   450, both 60/60        -> 380-60-14=306  -> ceil 310 -> 290
  //   450, both 100/40       -> 340-40-14=286  -> ceil 290 -> 270
  //   100, both 60/60        -> 30-60-14=-44   -> ceil -40 -> -60 -> clamped 40
  const cases = [
    ['neither slot shown, the whole height less body padding', 450, false, false, 60, 60, '430px'],
    ['only the header is subtracted when only the header shows', 450, true, false, 60, 60, '360px'],
    ['only the footer is subtracted when only the footer shows', 450, false, true, 60, 60, '360px'],
    ['both slots are subtracted when both show', 450, true, true, 60, 60, '290px'],
    ['each slot subtracts its own configured height', 450, true, true, 100, 40, '270px'],
    ['a string height is parsed', '450px', false, false, 60, 60, '430px'],
  ];

  test.each(cases)(
    '[Form-LAYOUT-001] %s',
    (_name, height, showHeader, showFooter, headerHeight, footerHeight, expected) => {
      // Break this catches: subtracting a hidden slot's height (dropping the
      // `showHeader ? ... : 0` guards) shrinks the body by up to 120px on every
      // Form that hides a slot, cutting off the last field.
      expect(getBodyHeight(height, showHeader, showFooter, headerHeight, footerHeight)).toBe(expected);
    }
  );

  test('[Form-LAYOUT-001] the body never collapses below 40px, however large the slots', () => {
    // Break this catches: dropping the Math.max floor lets a short Form with
    // two tall slots compute a NEGATIVE body height, which renders as a body
    // of zero and hides every field in the form.
    expect(getBodyHeight(100, true, true, 60, 60)).toBe('40px');
  });

  test('[Form-LAYOUT-001] a missing height is treated as zero, not NaN', () => {
    // Break this catches: dropping the `height ? ... : 0` guard makes
    // parseInt(undefined) return NaN, and the body height becomes the string
    // "NaNpx" — an invalid style the browser discards, collapsing the body.
    expect(getBodyHeight(undefined, false, false, 60, 60)).toBe('40px');
  });

  test('[Form-LAYOUT-001] slot heights default to 60 when the caller omits them', () => {
    // Break this catches: changing the default parameters silently rescales
    // every Form saved before headerHeight/footerHeight were persisted.
    expect(getBodyHeight(450, true, true)).toBe('290px');
  });
});

describe('generateUIComponents', () => {
  const schema = {
    title: 'User registration form',
    properties: {
      firstname: { type: 'textinput', label: 'First name', value: 'Maria' },
      age: { type: 'number', label: 'Age' },
    },
    submitButton: { value: 'Submit' },
  };

  test('[Form-SCHEMA-002] each property becomes a label Text followed by its input component', () => {
    // Break this catches: emitting only the input (dropping the paired Text)
    // strips every field label from a JSON-schema form, and also breaks
    // `data`, which keys off the preceding Text in extractData().
    const rendered = generateUIComponents(schema, true).map((item) => item.component);

    expect(rendered).toEqual(['Text', 'Text', 'TextInput', 'Text', 'NumberInput', 'Button']);
  });

  test('[Form-SCHEMA-002] the label Text carries the property label and the field carries its value', () => {
    // Break this catches: writing the schema KEY instead of the `label` into
    // the Text shows "firstname" to users instead of "First name".
    const [, firstLabel, firstInput] = generateUIComponents(schema, true);

    expect(firstLabel.definition.properties.text).toBe('First name');
    expect(firstInput.definition.properties.value).toBe('Maria');
    // The input's own label is blanked so it is not printed twice.
    expect(firstInput.definition.properties.label).toBe('');
  });

  test('[Form-SCHEMA-002] the title is prepended as the first component', () => {
    // Break this catches: appending the title instead of unshifting it puts
    // the form heading below the fields.
    const [title] = generateUIComponents(schema, true);

    expect(title.component).toBe('Text');
    expect(title.definition.properties.text).toBe('User registration form');
  });

  test('[Form-SCHEMA-002] the submit button is appended last, carrying its configured caption', () => {
    // Break this catches: the submit handler matches the button POSITIONALLY
    // (`buttonComponentId == uiComponents.length - 1`, Form.jsx:411), so a
    // button emitted anywhere but last stops submitting the form entirely.
    const rendered = generateUIComponents(schema, true);
    const last = rendered[rendered.length - 1];

    expect(last.component).toBe('Button');
    expect(last.definition.properties.text).toBe('Submit');
  });

  test('[Form-SCHEMA-002] a schema with no title and no submit button emits only its fields', () => {
    // Break this catches: unconditionally prepending a title or appending a
    // button injects an empty heading and a stray button into every schema
    // that declares neither.
    const rendered = generateUIComponents({ properties: { a: { type: 'textinput' } } }, true).map((i) => i.component);

    expect(rendered).toEqual(['Text', 'TextInput']);
  });

  test('[Form-SCHEMA-003] a property with an unrecognised type is dropped, and its siblings still render', () => {
    // Break this catches: leaving the undefined placeholders in the returned
    // array (dropping the final filter) makes RenderSchema mount `undefined`
    // as a component, which throws and blanks the whole form.
    const rendered = generateUIComponents(
      { properties: { good: { type: 'textinput', label: 'Good' }, bad: { type: 'notawidget', label: 'Bad' } } },
      true
    );

    expect(rendered.map((item) => item.component)).toEqual(['Text', 'TextInput']);
    expect(rendered[0].definition.properties.text).toBe('Good');
  });

  test('[Form-SCHEMA-003] a schema with no properties object yields nothing instead of throwing', () => {
    // Break this catches: removing the `typeof properties !== 'object'` guard
    // makes Object.entries(undefined) throw while the builder is mid-edit,
    // crashing the canvas on every keystroke in the schema editor.
    expect(generateUIComponents({}, true)).toBeUndefined();
    expect(generateUIComponents({ properties: null }, true)).toBeUndefined();
  });

  test('[Form-SCHEMA-003] nothing is generated when the Form is not in schema mode', () => {
    // Break this catches: generating components regardless of `advanced` makes
    // a normal drag-and-drop Form render its stale JSON schema alongside the
    // real children.
    expect(generateUIComponents(schema, false)).toBeUndefined();
  });
});

describe('data-source field hints', () => {
  // The code editor's Expected box renders `validation.defaultValue` verbatim
  // (CodeEditor/PreviewBox.jsx:568). It is the only place that teaches an author
  // the shape a data-source field wants, so a field without one prints the
  // literal string "undefined" at exactly the moment the author needs the hint.
  //
  // Display only: both runtime substitution paths read validation.SCHEMA
  // .defaultValue, which no widget sets, and fall back to findDefault()
  // (component-properties-validation.js:124, debuggerSlice.js:179).
  test.each([['JSONData'], ['newJsonSchema']])(
    '[Form-SCHEMA-008] the %s data source documents an example value',
    (key) => {
      // Break this catches: shipping a data-source code field with no
      // validation.defaultValue, which shows "undefined" under Expected.
      const { validation } = formConfig.properties[key];

      expect(typeof validation.defaultValue).toBe('string');
      expect(validation.defaultValue.trim()).not.toBe('');
    }
  );
});

describe('schema-driven visibility and disabled', () => {
  // Both flags are read from a bucket that depends on the widget:
  // STATE_READ_FROM_PROPERTIES widgets read them from
  // `properties` — useInput.js:56 destructures `{ disabledState, visibility } = properties` — and
  // every other widget reads them from `styles`. `resolveDefinition` already seeds the defaults into
  // the right bucket; generation has to write the schema's values into the same one.
  const fieldOf = (schema) => generateUIComponents(schema, true)[1];

  const withStyles = (type, styles) => ({ properties: { f: { type, label: 'F', styles } } });

  test('[Form-SCHEMA-009] a hidden field is hidden, for a widget that reads visibility from properties', () => {
    // Break this catches: writing visibility to `styles` for a TextInput puts it where nothing reads,
    // so `visibility: false` in a schema renders a fully visible field.
    const field = fieldOf(withStyles('textinput', { visibility: false }));

    expect(field.component).toBe('TextInput');
    expect(field.definition.properties.visibility).toBe(false);
  });

  test('[Form-SCHEMA-009] `false` is honoured, not skipped as falsy', () => {
    // Break this catches: `if (value?.styles?.visibility)` never sees `false`, so a bound
    // `{{components.toggle1.value}}` can only ever show a field and never hide one.
    const shown = fieldOf(withStyles('textinput', { visibility: true }));
    const hidden = fieldOf(withStyles('textinput', { visibility: false }));

    expect(shown.definition.properties.visibility).toBe(true);
    expect(hidden.definition.properties.visibility).toBe(false);
  });

  test('[Form-SCHEMA-009] a widget that reads visibility from styles still gets it there', () => {
    // Break this catches: routing every widget to `properties` would break the ones that were
    // working — DropDown is not in STATE_READ_FROM_PROPERTIES and reads from styles.
    const field = fieldOf(withStyles('dropdown', { visibility: false }));

    expect(field.component).toBe('DropDown');
    expect(field.definition.styles.visibility).toBe(false);
  });

  // The properties-reading set is wider than the original four-name list, and is NOT predicted by
  // NEW_REVAMPED_COMPONENTS either — DaterangePicker is in that list yet reads from styles
  // (DaterangePicker.jsx:23). Verified per widget instead of inferred from a list.
  test.each([['emailinput'], ['currencyinput'], ['textarea'], ['checkbox'], ['starrating']])(
    '[Form-SCHEMA-009] %s honours visibility where it reads it',
    (type) => {
      // Break this catches: predicating the bucket on the 4-name
      // original four-name list leaves these widgets writing to styles, which they
      // never read — the original bug, just narrower.
      const field = fieldOf(withStyles(type, { visibility: false }));

      expect(field.definition.properties.visibility).toBe(false);
    }
  );

  test('[Form-SCHEMA-010] a disabled field is disabled, in the bucket its widget reads', () => {
    // Break this catches: same wrong-bucket write for `disabled` — useInput.js:56 reads
    // `disabledState` from properties, while generation writes it to styles.
    const field = fieldOf(withStyles('textinput', { disabled: true }));

    expect(field.definition.properties.disabledState).toBe(true);
  });

  test('[Form-SCHEMA-010] a widget that reads disabled from styles still gets it there', () => {
    // Break this catches: routing every widget's `disabled` to properties would break DropDown,
    // which is not in STATE_READ_FROM_PROPERTIES and reads it from styles.
    //
    // There is deliberately no `disabled: false` case here. `disabledState` already defaults to
    // false, so a skipped write and an honoured one are indistinguishable — such a test would pass
    // against the bug. For `disabled` only the bucket is observable; the falsy guard is not.
    const field = fieldOf(withStyles('dropdown', { disabled: true }));

    expect(field.component).toBe('DropDown');
    expect(field.definition.styles.disabledState).toBe(true);
  });
});

describe('schema-driven mandatory', () => {
  // `mandatory` was the one validation the schema path never copied, so a JSON-schema form could not
  // have a required field at all. The widget side was already complete — the types below declare it
  // and componentsSlice.js:773 unwraps both the bare and `{value}` shapes.
  const fieldOf = (type, validation) =>
    generateUIComponents({ properties: { f: { type, label: 'F', validation } } }, true)[1];

  test.each([
    ['textinput'],
    ['emailinput'],
    ['phoneinput'],
    ['currencyinput'],
    ['number'],
    ['password'],
    ['textarea'],
    ['checkbox'],
    ['daterangepicker'],
  ])('[Form-SCHEMA-011] %s honours validation.mandatory', (type) => {
    // Break this catches: with no `mandatory` branch the field keeps its registered default of
    // `{{false}}`, so every schema-generated form submits with its required fields empty.
    expect(fieldOf(type, { mandatory: true }).definition.validation.mandatory).toBe(true);
  });

  test('[Form-SCHEMA-011] a type that does not register mandatory is left untouched', () => {
    // Break this catches: writing `mandatory` onto every type is NOT harmless — validateWidget
    // never consults the registration (componentsSlice.js:773), so `mandatory` on a `text` field
    // returns "Field cannot be empty" for a label the user can never fill, and the form can never
    // be submitted. Verified for Text, RadioButton, StarRating, ToggleSwitch, Multiselect, DropDown.
    const text = generateUIComponents(
      { properties: { f: { type: 'text', label: 'F', validation: { mandatory: true } } } },
      true
    )[1];

    expect(text.component).toBe('Text');
    expect(text.definition.validation?.mandatory).toBeUndefined();
  });
});
