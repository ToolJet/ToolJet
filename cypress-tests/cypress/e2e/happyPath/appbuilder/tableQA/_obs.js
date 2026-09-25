// Observation helpers for observe-only matrix specs (V5–V8). Nothing here asserts; it records facts.
import { tq, col } from "./_harness";

export const OPTS = [
  { label: "Red", value: "red" },
  { label: "Green", value: "green" },
  { label: "Blue", value: "blue" },
];
export const PROBES = {
  cs: "{{JSON.stringify(components.table1.changeSet)}}",
  ud: "{{JSON.stringify(components.table1.updatedData)}}",
  nr: "{{JSON.stringify(components.table1.newRows)}}",
};

export const recorder = (file) => {
  const results = [];
  return {
    results,
    push: (r) => results.push(r),
    flush: () => cy.writeFile(`cypress/e2e/happyPath/appbuilder/tableQA/logs/${file}`, results),
  };
};

// Facts about a cell (row, col) in the main table or in the add-row popup (scope ".table-add-new-row").
export const cellFacts = (doc, colName, row = 0, popup = false) => {
  const sel = popup
    ? `.table-add-new-row td[data-cy="${colName}-column-${row}"]`
    : `td[data-cy="table1-${colName}-row-${row}"]`;
  const td = doc.querySelector(sel);
  if (!td) return { missing: true };
  const inp = td.querySelector("input:not([type=checkbox]):not([class*=dummyInput]), textarea");
  const chk = td.querySelector("input[type=checkbox]");
  const fb = td.querySelector(".invalid-feedback, .invalid-feedback-date");
  return {
    text: td.innerText.trim().slice(0, 80),
    input: inp ? inp.value : undefined,
    checked: chk ? chk.checked : undefined,
    editableEl: !!td.querySelector('[contenteditable="true"], input:not([type=checkbox]):not([readonly]), .react-select__control, label.boolean-switch'),
    invalid: !!fb || !!td.querySelector(".is-invalid"),
    msg: fb ? fb.textContent.trim() : null,
  };
};

export const probe = (doc, name) => {
  const el = doc.querySelector(`[data-cy="draggable-widget-${name}"]`);
  return el ? el.innerText.trim() : null;
};

// Computed style snapshot of the first matching element inside a cell.
export const styleOf = (doc, colName, inner = null, row = 0) => {
  const td = doc.querySelector(`td[data-cy="table1-${colName}-row-${row}"]`);
  if (!td) return { missing: true };
  const el = inner ? td.querySelector(inner) : td;
  if (!el) return { missingInner: inner };
  const cs = getComputedStyle(el);
  return {
    color: cs.color,
    bg: cs.backgroundColor,
    justify: cs.justifyContent,
    textAlign: cs.textAlign,
    radius: cs.borderRadius,
    objectFit: cs.objectFit,
    textDecoration: cs.textDecorationLine,
    decorationColor: cs.textDecorationColor,
    position: cs.position,
    left: cs.left,
    right: cs.right,
    width: cs.width,
  };
};

export { tq, col };
