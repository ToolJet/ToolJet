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
});
