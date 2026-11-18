import fs from 'fs';
import path from 'path';

// QA (PF-261): a Rocket 2.0 Spinner's label that is one long word ran thousands of px outside its box; Badge, Link and
// Progress labels end in an ellipsis. jsdom does not lay text out, so the rules that keep the label to its box are
// what is checked: the label is cut with an ellipsis, and the spinner row may shrink to the box. Confirmed in the app.
const css = fs.readFileSync(
  path.resolve(__dirname, '../../../../../../packs/shadcn/src/styles/ui2-display.css'),
  'utf8'
);
// The declarations of a rule, by its exact selector.
const rule = (selector) => {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const match = css.match(new RegExp(`(?:^|\\n)${escaped}\\s*\\{([^}]*)\\}`));
  return (match?.[1] ?? '').replace(/\s+/g, ' ');
};

describe('Rocket Spinner: a long label stays in its box', () => {
  test('[PackComponent-SPINNER-LABEL-001] the label is cut with an ellipsis on one line', () => {
    const label = rule('.ui2-spinner-label');
    expect(label).toMatch(/white-space: nowrap/);
    expect(label).toMatch(/overflow: hidden/);
    expect(label).toMatch(/text-overflow: ellipsis/);
    expect(label).toMatch(/min-width: 0/);
  });

  test('[PackComponent-SPINNER-LABEL-002] the spinner row shrinks to its box', () => {
    const row = rule('.ui2-spinner');
    expect(row).toMatch(/max-width: 100%/);
    expect(row).toMatch(/min-width: 0/);
  });
});
