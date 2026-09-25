// Transformation + editing, paste into cells (plain vs rich), browser timezone vs date columns.
import { tq, col, recorder, probe, cellFacts } from "./_obs";

const R = recorder(`v22-results-${Cypress.env("TQ_TZ") || "local"}.json`);
const P = { cs: "{{JSON.stringify(components.table1.changeSet).replace(/</g, '[')}}", ud: "{{JSON.stringify(components.table1.updatedData).replace(/</g, '[')}}" };
const paste = (sel, data) => cy.get(sel).then(($el) => {
  const el = $el[0];
  const dt = new DataTransfer();
  Object.entries(data).forEach(([k, v]) => dt.setData(k, v));
  el.dispatchEvent(new ClipboardEvent("paste", { clipboardData: dt, bubbles: true, cancelable: true }));
});

describe("V22 transformation, paste, timezone", () => {
  afterEach(() => tq.cleanup());
  after(() => R.flush());

  it("transformation + edit: which value is shown and saved", () => {
    tq.app({ data: [{ id: 1, name: "ada" }], probes: P, props: { defaultSelectedRow: "{{undefined}}" },
      columns: [col("id", "number"), col("name", "string", { isEditable: true, transformation: "{{cellValue.toUpperCase()}}" })] });
    cy.document().then((doc) => R.push({ id: "transform:initial", cell: cellFacts(doc, "name"), ud: probe(doc, "ud") }));
    cy.get('[data-cy="table1-name-row-0"]').find(".long-text-input").click({ force: true });
    cy.document().then((doc) => R.push({ id: "transform:editor opens with", text: doc.querySelector('[data-cy="table1-name-row-0"] [contenteditable="true"]')?.innerText }));
    cy.get('[data-cy="table1-name-row-0"]').find('[contenteditable="true"]').type("{selectall}{backspace}bob", { force: true });
    cy.get('[data-cy="table1-id-row-0"]').click({ force: true });
    cy.wait(400);
    cy.document().then((doc) => R.push({ id: "transform:after typing bob", cell: cellFacts(doc, "name"), cs: probe(doc, "cs"), ud: probe(doc, "ud") }));
  });

  it("paste plain text and rich HTML into an editable String cell", () => {
    tq.app({ data: [{ id: 1, a: "x", b: "y" }], probes: P, props: { defaultSelectedRow: "{{undefined}}" },
      columns: [col("id", "number"), col("a", "string", { isEditable: true }), col("b", "string", { isEditable: true })] });
    cy.get('[data-cy="table1-a-row-0"]').find(".long-text-input").click({ force: true });
    paste('[data-cy="table1-a-row-0"] [contenteditable="true"]', { "text/plain": "plain\tpasted\nline2" });
    cy.get('[data-cy="table1-id-row-0"]').click({ force: true });
    cy.get('[data-cy="table1-b-row-0"]').find(".long-text-input").click({ force: true });
    paste('[data-cy="table1-b-row-0"] [contenteditable="true"]', { "text/plain": "rich", "text/html": '<b style="color:red">rich</b><img src=x onerror="window.__tqPwn=1">' });
    cy.get('[data-cy="table1-id-row-0"]').click({ force: true });
    cy.wait(500);
    cy.window().then((w) => cy.document().then((doc) => R.push({
      id: "paste:results", a: cellFacts(doc, "a"), b: cellFacts(doc, "b"),
      bHtml: doc.querySelector('[data-cy="table1-b-row-0"] .long-text-input')?.innerHTML.slice(0, 200), injectedImg: !!doc.querySelector('[data-cy="table1-b-row-0"] img'), onerrorRan: !!w.__tqPwn, cs: probe(doc, "cs"),
    })));
  });

  it("dates under the browser timezone", () => {
    tq.app({ data: [{ id: 1, iso: "2024-03-15T23:30:00Z", plain: "2024-03-15", unix: 1710545400 }], probes: P, props: { defaultSelectedRow: "{{undefined}}" },
      columns: [col("id", "number"),
        col("iso", "datepicker", { dateFormat: "DD/MM/YYYY", parseDateFormat: "YYYY-MM-DD", isTimeChecked: true, isTwentyFourHrFormatEnabled: true }),
        col("plain", "datepicker", { dateFormat: "DD/MM/YYYY", parseDateFormat: "YYYY-MM-DD" }),
        col("unix", "datepicker", { dateFormat: "DD/MM/YYYY", parseInUnixTimestamp: true, unixTimestamp: "seconds", isTimeChecked: true, isTwentyFourHrFormatEnabled: true })] });
    cy.window().then((w) => cy.document().then((doc) => R.push({
      id: "tz:display", browserTz: w.Intl.DateTimeFormat().resolvedOptions().timeZone,
      iso: doc.querySelector('td[data-cy="table1-iso-row-0"] input')?.value, plain: doc.querySelector('td[data-cy="table1-plain-row-0"] input')?.value, unix: doc.querySelector('td[data-cy="table1-unix-row-0"] input')?.value,
    })));
  });
});
