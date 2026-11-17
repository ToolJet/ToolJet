import fs from 'fs';
import path from 'path';

// Material UI Text Input (pack_bug_fixes.md 27 and 30): the default box shows the helper line, and Max length lives
// only in the Validation section. Read from the built manifest, so it is skipped until the pack has been built.
const MANIFEST = path.resolve(__dirname, '../../../../../../packs/mui/dist/manifest.json');
const built = fs.existsSync(MANIFEST) ? describe : describe.skip;

built('Material UI Text Input', () => {
  const field = () => JSON.parse(fs.readFileSync(MANIFEST, 'utf8')).components.TextField;

  test('the default box is tall enough for the label gap, the field and the helper line', () => {
    // 9px label gap + 56px field + the helper line is about 88px.
    expect(field().defaultHeight * 10).toBeGreaterThanOrEqual(90);
  });

  test('has no Max length property of its own', () => {
    expect(field().props.map((p) => p.name)).not.toContain('maxLength');
  });

  test('[PackComponent-MUILOOK-001] the TextField family keeps its look (variant, size, color) under Styles, not Properties', () => {
    // Break this catches: QA's report that a Material UI Text Field showed some of its styles (Variant, Size, Color) on
    // the Properties tab. The fields drawn as MUI's TextField share that look.
    const components = JSON.parse(fs.readFileSync(MANIFEST, 'utf8')).components;
    const LOOK = ['variant', 'size', 'color'];
    const FAMILY = [
      'TextField',
      'MultilineTextField',
      'NumberField',
      'Select',
      'Autocomplete',
      'AutocompleteMultiple',
      'DatePicker',
      'TimePicker',
      'DateTimePicker',
    ];
    const look = (list) => LOOK.filter((name) => list.some((entry) => entry.name === name));
    const placed = FAMILY.map((name) => ({
      name,
      props: look(components[name].props),
      styles: look(components[name].styles),
    }));

    expect(placed).toEqual(FAMILY.map((name) => ({ name, props: [], styles: LOOK })));
  });
});
