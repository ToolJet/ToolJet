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
