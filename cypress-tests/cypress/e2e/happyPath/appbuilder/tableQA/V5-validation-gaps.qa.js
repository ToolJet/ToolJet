// Column-type validation matrix. Observes every case (no fail-fast) and writes logs/v5-results.json;
// `node v3diff.js` lists mismatches between expected and observed.
import { tq, col } from "./_harness";

const OUT = "cypress/e2e/happyPath/appbuilder/tableQA/logs/v5-results.json";
const results = [];

// Read validation state of a cell: { invalid, msg, truncated, cls }
const observe = (colName, row = 0) =>
  tq.cell(row, colName).then(($td) => {
    const td = $td[0];
    const fb = td.querySelector(".invalid-feedback, .invalid-feedback-date");
    const invalidCls = !!td.querySelector(".is-invalid");
    return {
      invalid: !!fb || invalidCls,
      msg: fb ? fb.textContent.trim() : null,
      truncated: fb ? fb.scrollWidth > fb.clientWidth + 1 : false,
      text: td.innerText.trim().slice(0, 60),
    };
  });

// cases: [id, colType, colExtra, value, expect: {invalid, msg?}, note]
const E = (extra) => ({ isEditable: true, ...extra });
const CASES = [
  ["t-maxlen-long", "text", E({ maxLength: 3 }), "abcd", { invalid: true, msg: "Maximum 3 characters is allowed" }],
  ["t-custom", "text", E({ customRule: "{{cellValue.includes('x') ? 'No x' : ''}}" }), "box", { invalid: true, msg: "No x" }],
  ["n-custom", "number", E({ customRule: "{{cellValue % 2 ? 'Must be even' : ''}}" }), 3, { invalid: true, msg: "Must be even" }],
  ["n-min-decimal", "number", E({ minValue: 1.5 }), 1.4, { invalid: true, msg: "Minimum value is 1.5" }],
  ["n-max-string-data", "number", E({ maxValue: 10 }), "20", { invalid: true, msg: "Maximum value is 10" }],
  ["n-minlen-fx", "string", E({ minLength: "{{3}}" }), "ab", { invalid: true, msg: "Minimum 3 characters is needed" }],
  ["sel-custom-value-var", "select", E({ options: [{ label: "A", value: "a" }], customRule: "{{value ? '' : 'Pick one'}}" }), null, { invalid: true, msg: "Pick one" }, "same rule using `value` instead of cellValue"],
  ["tags-custom-value-var", "tagsV2", E({ options: [{ label: "A", value: "a" }], customRule: "{{value?.length ? '' : 'Add a tag'}}" }), [], { invalid: true, msg: "Add a tag" }],
  ["d-mintime", "datepicker", E({ dateFormat: "DD/MM/YYYY", parseDateFormat: "DD/MM/YYYY", isTimeChecked: true, isTwentyFourHrFormatEnabled: true, minTime: "09:00" }), "15/05/2026 08:00", { invalid: true }],
  ["d-maxtime", "datepicker", E({ dateFormat: "DD/MM/YYYY", parseDateFormat: "DD/MM/YYYY", isTimeChecked: true, isTwentyFourHrFormatEnabled: true, maxTime: "17:00" }), "15/05/2026 18:00", { invalid: true }],
  ["d-timeformat-dead", "datepicker", { dateFormat: "DD/MM/YYYY", parseDateFormat: "DD/MM/YYYY", isTimeChecked: true, timeFormat: "HH:mm" }, "15/05/2026 14:30", { invalid: false }, "display should follow Time format HH:mm (inventory says dead)"],
  ["s-editable-fx-false", "string", { isEditable: "{{false}}", minLength: 5 }, "abc", { invalid: false }, "fx-false editability hides validation"],
];

// Group cases into tables of up to 6 columns (one app per group) to keep the run short.
const groups = Cypress._.chunk(CASES, 6);

describe("V5 validation gaps", () => {
  afterEach(() => tq.cleanup());
  after(() => cy.writeFile(OUT, results));

  groups.forEach((g, gi) =>
    it(`group ${gi + 1}: ${g.map((c) => c[0]).join(", ")}`, () => {
      const row = {};
      const columns = g.map(([id, type, extra, value]) => {
        const key = `c${CASES.findIndex((c) => c[0] === id)}`;
        row[key] = value;
        return col(key, type, { name: key, ...extra });
      });
      tq.app({ data: [row], columns, width: 40, props: { defaultSelectedRow: "{{undefined}}" } });
      g.forEach(([id, type, extra, value, expect, note]) => {
        const key = `c${CASES.findIndex((c) => c[0] === id)}`;
        observe(key).then((obs) => results.push({ id, type, extra, value, expect, note, obs }));
      });
    })
  );

  it("row-scoped custom rule uses rowData", () => {
    tq.app({ data: [{ id: 1, c: "x" }, { id: 2, c: "y" }], columns: [col("id"), col("c", "string", { isEditable: true, customRule: "{{rowData.id === 1 ? 'Row one is locked' : ''}}" })], props: { defaultSelectedRow: "{{undefined}}" } });
    observe("c", 0).then((obs) => results.push({ id: "rowData-rule:row1", expect: { invalid: true, msg: "Row one is locked" }, obs }));
    observe("c", 1).then((obs) => results.push({ id: "rowData-rule:row2", expect: { invalid: false }, obs }));
  });
});
