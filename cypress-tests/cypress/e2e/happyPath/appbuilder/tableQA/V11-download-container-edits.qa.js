// Excel/PDF download triggers (contents parsed offline), container styles on the right element,
// editing under pin/search/sort/pagination, add-row popup validation for select/tags/date. Observe-only.
import { tq, col, OPTS, PROBES, recorder, cellFacts, probe } from "./_obs";

const R = recorder("v11-results.json");
const DATA = [
  { id: 1, name: "Ada", city: { name: "NY" }, status: "red", meta: { plan: "pro" }, joined: "2024-03-15" },
  { id: 2, name: "Grace", city: { name: "LA" }, status: "green", meta: { plan: "free" }, joined: "2023-01-02" },
  { id: 3, name: "Alan", city: { name: "SF" }, status: "blue", meta: null, joined: "2025-07-20" },
];
const COLS = [col("id", "number"), col("name"), col("city", "string", { key: "city.name", name: "city" }), col("status", "select", { options: OPTS }), col("meta", "json"), col("joined", "datepicker", { dateFormat: "DD-MMM-YYYY", parseDateFormat: "YYYY-MM-DD" })];

describe("V11 downloads, container styles, contextual edits, popup validation", () => {
  afterEach(() => tq.cleanup());
  after(() => R.flush());

  ["excel", "pdf"].forEach((fmt) =>
    it(`download ${fmt} with search 'A' active`, () => {
      if (fmt === "excel") cy.exec("rm -rf cypress/downloads/*", { failOnNonZeroExit: false });
      tq.app({ data: DATA, columns: COLS, width: 40, props: { defaultSelectedRow: "{{undefined}}" } });
      cy.get('[data-cy="table1-search-input-field"]').type("Ada", { force: true });
      cy.wait(400);
      cy.get('[data-cy="table1-file-download-button"]').click({ force: true });
      cy.get(`[data-cy="option-download-as-${fmt}"]`).click({ force: true });
      cy.wait(3000);
      cy.exec("ls -1 cypress/downloads || true").then((r) => R.push({ id: `download:${fmt}:files`, files: r.stdout.split("\n").filter(Boolean) }));
    })
  );

  it("container styles on the element that receives them", () => {
    tq.app({
      data: DATA.slice(0, 1), columns: [col("id"), col("name")],
      styles: { containerBackgroundColor: "#0000ff", borderColor: "#ff00ff", borderRadius: "{{20}}", boxShadow: "4px 4px 10px 0px #000000" },
      props: { defaultSelectedRow: "{{undefined}}" },
    });
    cy.document().then((doc) => {
      [...doc.querySelectorAll('[data-cy="draggable-widget-table1"]')].forEach((el, i) => {
        const s = getComputedStyle(el);
        R.push({ id: `container:el${i}(${el.tagName}.${String(el.className).split(" ").slice(0, 2).join(".")})`, bg: s.backgroundColor, border: s.borderTopColor, radius: s.borderTopLeftRadius, shadow: s.boxShadow });
      });
    });
  });

  it("edit while search / sort / pagination / pinning is active lands on the right record", () => {
    const rows = Array.from({ length: 8 }, (_, i) => ({ id: i + 1, name: `N${i + 1}`, note: `note${i + 1}` }));
    tq.app({
      data: rows, width: 40, probes: PROBES,
      columns: [col("id", "number", { pinPosition: "left" }), col("name"), col("note", "string", { isEditable: true, pinPosition: "right" })],
      props: { defaultSelectedRow: "{{undefined}}", rowsPerPage: "{{3}}" },
    });
    // 1) sort desc by id (click twice for number = desc first per TanStack), edit first visible row
    cy.get('[data-cy="id-column-header"]').click({ force: true });
    cy.wait(300);
    cy.document().then((doc) => R.push({ id: "ctx:sorted first row id", id0: doc.querySelector('td[data-cy="table1-id-row-0"]')?.innerText }));
    tq.cell(0, "note").find(".long-text-input").click({ force: true });
    tq.cell(0, "note").find('[contenteditable="true"]').type("{selectall}{backspace}EDIT-SORTED", { force: true });
    tq.cell(0, "name").click({ force: true });
    cy.wait(300);
    cy.document().then((doc) => R.push({ id: "ctx:after edit on sorted view", cs: probe(doc, "cs"), shownRow0: cellFacts(doc, "note", 0).text }));
    // 2) page 2 then edit first row there
    cy.get('[data-cy="pagination-button-to-next"]').click({ force: true });
    cy.wait(300);
    cy.document().then((doc) => R.push({ id: "ctx:page2 first row id", id0: doc.querySelector('td[data-cy="table1-id-row-0"]')?.innerText || doc.querySelector('[data-cy^="table1-id-row-"]')?.innerText }));
    cy.get('[data-cy^="table1-note-row-"]').first().find(".long-text-input").click({ force: true });
    cy.get('[data-cy^="table1-note-row-"]').first().find('[contenteditable="true"]').type("{selectall}{backspace}EDIT-PAGE2", { force: true });
    cy.get('[data-cy^="table1-name-row-"]').first().click({ force: true });
    cy.wait(300);
    cy.document().then((doc) => R.push({ id: "ctx:after edit on page 2", cs: probe(doc, "cs") }));
    // 3) search narrows to N7, edit it
    cy.get('[data-cy="table1-search-input-field"]').type("N7", { force: true });
    cy.wait(400);
    cy.get('[data-cy^="table1-note-row-"]').first().find(".long-text-input").click({ force: true });
    cy.get('[data-cy^="table1-note-row-"]').first().find('[contenteditable="true"]').type("{selectall}{backspace}EDIT-SEARCH", { force: true });
    cy.get('[data-cy^="table1-name-row-"]').first().click({ force: true });
    cy.wait(300);
    cy.document().then((doc) => R.push({ id: "ctx:after edit under search N7", cs: probe(doc, "cs"), ud: probe(doc, "ud") }));
  });

  it("add-row popup validation for select / tags / datepicker custom rules and min date", () => {
    tq.app({
      data: [{ id: 1, s: "red", t: ["red"], d: "15/05/2026" }], probes: PROBES, width: 40,
      columns: [col("id"),
        col("s", "select", { isEditable: true, options: OPTS, customRule: "{{value ? '' : 'Pick one'}}" }),
        col("t", "tagsV2", { isEditable: true, options: OPTS, allowMultipleSelection: true, customRule: "{{value?.length ? '' : 'Add a tag'}}" }),
        col("d", "datepicker", { isEditable: true, dateFormat: "DD/MM/YYYY", parseDateFormat: "DD/MM/YYYY", minDate: "01/01/2027" })],
      props: { defaultSelectedRow: "{{undefined}}", showAddNewRowButton: "{{true}}" },
    });
    cy.get('[data-cy="table1-add-new-row-button"]').click({ force: true });
    cy.wait(600);
    cy.document().then((doc) => ["s", "t", "d"].forEach((c) => R.push({ id: `popupVal:${c}:empty`, cell: cellFacts(doc, c, 0, true) })));
    cy.get('.table-add-new-row td[data-cy="d-column-0"] input').click({ force: true });
    cy.get(".react-datepicker__day--015:not(.react-datepicker__day--outside-month)").first().click({ force: true });
    cy.wait(400);
    cy.document().then((doc) => R.push({ id: "popupVal:d:picked before minDate", cell: cellFacts(doc, "d", 0, true), nr: probe(doc, "nr") }));
  });
});
