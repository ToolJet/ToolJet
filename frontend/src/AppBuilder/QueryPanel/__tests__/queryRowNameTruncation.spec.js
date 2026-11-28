/**
 * @jest-environment node
 */
// A long query name truncates with an ellipsis instead of pushing the row wider than the panel. The
// name column is a flex item, so it only shrinks below its text width with min-width: 0. The left
// panel list, the legacy query pane list and the drag ghost all need it.
const fs = require('fs');
const path = require('path');

const styles = fs.readFileSync(path.join(__dirname, '../../../_styles/queryManager.scss'), 'utf8');
const nameColumnRules = [...styles.matchAll(/\.query-row-query-name\s*\{([^}]*)\}/g)].map(([, body]) => body);

test('lets the query name column shrink in every query list', () => {
  expect(nameColumnRules).toHaveLength(3);
  nameColumnRules.forEach((body) => {
    expect(body).toMatch(/flex:\s*1 1 0;/);
    expect(body).toMatch(/min-width:\s*0;/);
  });
});
