// Column-type validation matrix. Observes every case (no fail-fast) and writes logs/v3-results.json;
// `node v3diff.js` lists mismatches between expected and observed.
import { tq, col } from "./_harness";

const OUT = "cypress/e2e/happyPath/appbuilder/tableQA/logs/v3-results.json";
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
  // ---- String ----
  ["s-minlen-short", "string", E({ minLength: 5 }), "abc", { invalid: true, msg: "Minimum 5 characters is needed" }],
  ["s-minlen-ok", "string", E({ minLength: 5 }), "abcdef", { invalid: false }],
  ["s-minlen-empty", "string", E({ minLength: 3 }), "", { invalid: true }, "empty value vs min length"],
  ["s-minlen-null", "string", E({ minLength: 3 }), null, { invalid: true }, "null value vs min length"],
  ["s-minlen-numeric-data", "string", E({ minLength: 3 }), 12, { invalid: true }, "number data in string column"],
  ["s-maxlen-long", "string", E({ maxLength: 3 }), "abcd", { invalid: true, msg: "Maximum 3 characters is allowed" }],
  ["s-maxlen-numeric-data", "string", E({ maxLength: 3 }), 12345, { invalid: true }, "number data in string column"],
  ["s-regex-fail", "string", E({ regex: "^[A-Z]+$" }), "abc", { invalid: true, msg: "The input should match pattern" }],
  ["s-regex-ok", "string", E({ regex: "^[A-Z]+$" }), "ABC", { invalid: false }],
  ["s-regex-broken", "string", E({ regex: "[" }), "abc", { invalid: false }, "a builder typo should not paint every cell red for end users"],
  ["s-custom-msg", "string", E({ customRule: "{{cellValue.length > 3 ? '' : 'Too short'}}" }), "ab", { invalid: true, msg: "Too short" }],
  ["s-minlen-nonnumeric", "string", E({ minLength: "abc" }), "x", { invalid: false }, "non-numeric min length config"],
  ["s-min-gt-max", "string", E({ minLength: 5, maxLength: 2 }), "abc", { invalid: true }, "conflicting config"],
  ["s-readonly-invalid", "string", { minLength: 5 }, "abc", { invalid: false }, "read-only cell: user cannot fix it"],
  ["s-long-msg", "string", E({ customRule: "{{'This value must be a valid internal employee code starting with EMP'}}" }), "x", { invalid: true, msg: "This value must be a valid internal employee code starting with EMP" }],
  // ---- Text ----
  ["t-regex-fail", "text", E({ regex: "^[A-Z]+$" }), "abc", { invalid: true }, "inspector offers Regex for Text"],
  ["t-minlen-short", "text", E({ minLength: 5 }), "abc", { invalid: true }],
  // ---- Number ----
  ["n-min-fail", "number", E({ minValue: 10 }), 5, { invalid: true, msg: "Minimum value is 10" }],
  ["n-min-zero", "number", E({ minValue: 0 }), -5, { invalid: true, msg: "Minimum value is 0" }],
  ["n-max-zero", "number", E({ maxValue: 0 }), 5, { invalid: true, msg: "Maximum value is 0" }],
  ["n-max-fail", "number", E({ maxValue: 10 }), 11, { invalid: true, msg: "Maximum value is 10" }],
  ["n-min-null", "number", E({ minValue: 1 }), null, { invalid: false }, "empty cell vs min value"],
  ["n-regex-fail", "number", E({ regex: "^\\d{3}$" }), 12, { invalid: true }, "inspector offers Regex for Number"],
  ["n-min-string-data", "number", E({ minValue: 10 }), "5", { invalid: true }],
  ["n-min-gt-max", "number", E({ minValue: 10, maxValue: 5 }), 7, { invalid: true }, "conflicting config"],
  ["n-readonly-invalid", "number", { minValue: 10 }, 5, { invalid: false }, "read-only cell: user cannot fix it"],
  // ---- Select / MultiSelect / Tags ----
  ["sel-custom", "select", E({ options: [{ label: "A", value: "a" }], customRule: "{{cellValue ? '' : 'Pick one'}}" }), null, { invalid: true, msg: "Pick one" }],
  ["sel-readonly", "select", { options: [{ label: "A", value: "a" }], customRule: "{{cellValue ? '' : 'Pick one'}}" }, null, { invalid: false }],
  ["msel-custom", "newMultiSelect", E({ options: [{ label: "A", value: "a" }, { label: "B", value: "b" }], customRule: "{{cellValue?.length >= 2 ? '' : 'Pick two'}}" }), ["a"], { invalid: true, msg: "Pick two" }],
  ["tags-custom", "tagsV2", E({ options: [{ label: "A", value: "a" }], customRule: "{{cellValue?.length ? '' : 'Add a tag'}}" }), [], { invalid: true, msg: "Add a tag" }],
  // ---- Datepicker ----
  ["d-min-fail", "datepicker", E({ dateFormat: "DD/MM/YYYY", parseDateFormat: "DD/MM/YYYY", minDate: "01/01/2024" }), "15/12/2023", { invalid: true }],
  ["d-max-fail", "datepicker", E({ dateFormat: "DD/MM/YYYY", parseDateFormat: "DD/MM/YYYY", maxDate: "01/01/2024" }), "15/02/2024", { invalid: true }],
  ["d-disabled-date", "datepicker", E({ dateFormat: "DD/MM/YYYY", parseDateFormat: "DD/MM/YYYY", disabledDates: "{{['15/12/2023']}}" }), "15/12/2023", { invalid: true }, "value sits on a disabled date"],
  ["d-custom", "datepicker", E({ dateFormat: "DD/MM/YYYY", parseDateFormat: "DD/MM/YYYY", customRule: "{{'No weekends'}}" }), "15/12/2023", { invalid: true, msg: "No weekends" }],
  ["d-readonly-invalid", "datepicker", { dateFormat: "DD/MM/YYYY", parseDateFormat: "DD/MM/YYYY", minDate: "01/01/2024" }, "15/12/2023", { invalid: false }],
];

// Group cases into tables of up to 6 columns (one app per group) to keep the run short.
const groups = Cypress._.chunk(CASES, 6);

describe("V3 column-type validation matrix", () => {
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

  it("edit flow: typing an invalid value shows the error, fixing it clears it (string minLength 5)", () => {
    tq.app({ data: [{ id: 1, code: "abcdef" }], columns: [col("id"), col("code", "string", { isEditable: true, minLength: 5 })] });
    const rec = (id, expect) => observe("code").then((obs) => results.push({ id, type: "string", expect, obs }));
    rec("flow-initial-valid", { invalid: false });
    tq.cell(0, "code").find(".long-text-input").click({ force: true });
    tq.cell(0, "code").find('[contenteditable="true"]').type("{selectall}{backspace}ab", { force: true });
    rec("flow-while-typing-invalid", { invalid: true }); // live feedback while typing?
    tq.cell(0, "code").find('[contenteditable="true"]').blur();
    rec("flow-after-blur-invalid", { invalid: true });
    tq.cell(0, "code").find(".long-text-input").click({ force: true });
    tq.cell(0, "code").find('[contenteditable="true"]').type("{selectall}{backspace}abcdefg", { force: true }).blur();
    rec("flow-fixed-valid", { invalid: false });
  });
});
