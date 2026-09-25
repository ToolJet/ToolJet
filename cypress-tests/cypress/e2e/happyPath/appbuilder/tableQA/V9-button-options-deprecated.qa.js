// Button column, dynamic options, default option, deprecated types. Observe-only -> logs/v9-results.json
import { tq, col, OPTS, recorder, cellFacts } from "./_obs";

const R = recorder("v9-results.json");
const toasts = (doc, p) => [...doc.querySelectorAll('[role="status"]')].map((e) => e.innerText.trim()).filter((t) => t.startsWith(p));
const tdOf = (doc, c, r = 0) => doc.querySelector(`td[data-cy="table1-${c}-row-${r}"]`);
const btnFacts = (b) => b && ({ text: b.innerText.trim(), disabled: b.disabled || b.getAttribute("aria-disabled") === "true", title: b.getAttribute("title") || b.getAttribute("data-tooltip-content"), bg: getComputedStyle(b).backgroundColor, color: getComputedStyle(b).color, radius: getComputedStyle(b).borderRadius, border: getComputedStyle(b).borderColor, visible: b.offsetParent !== null, hasSpinner: !!b.querySelector('[class*="spinner"], [class*="loader"], [class*="animate-spin"]'), hasIcon: !!b.querySelector("svg") });

describe("V9 button column, options, deprecated types", () => {
  afterEach(() => tq.cleanup());
  after(() => R.flush());

  it("button column: properties and styles per button", () => {
    const B = [
      { id: "b1", buttonLabel: "Plain" },
      { id: "b2", buttonLabel: "Tip", buttonTooltip: "Hello tip" },
      { id: "b3", buttonLabel: "Load", loadingState: "{{true}}" },
      { id: "b4", buttonLabel: "Hidden", buttonVisibility: "{{false}}" },
      { id: "b5", buttonLabel: "Off", disableButton: "{{true}}" },
      { id: "b6", buttonLabel: "RowFx", disableButton: "{{rowData.id === 1}}" },
      { id: "b7", buttonLabel: "Styled", buttonType: "outline", buttonBackgroundColor: "#ff0000", buttonLabelColor: "#00ff00", buttonBorderColor: "#0000ff", buttonBorderRadius: "20", buttonIconVisibility: true, buttonIconName: "IconHome2" },
    ];
    tq.app({ data: [{ id: 1 }, { id: 2 }], width: 60, columns: [col("id", "number"), col("act", "button", { buttons: B })], props: { defaultSelectedRow: "{{undefined}}" } });
    cy.document().then((doc) => {
      const all = [...(tdOf(doc, "act")?.querySelectorAll("button") || [])];
      R.push({ id: "button:rendered labels row1", labels: all.map((b) => b.innerText.trim()) });
      B.forEach((b) => R.push({ id: `button:${b.buttonLabel}`, row1: btnFacts(all.find((x) => x.innerText.trim() === b.buttonLabel)) }));
      const r2 = [...(tdOf(doc, "act", 1)?.querySelectorAll("button") || [])].find((x) => x.innerText.trim() === "RowFx");
      R.push({ id: "button:RowFx row2 (should be enabled)", row2: btnFacts(r2) });
    });
    cy.get('td[data-cy="table1-act-row-0"] button').contains("Tip").trigger("mouseover", { force: true });
    cy.wait(600);
    cy.document().then((doc) => R.push({ id: "button:tooltip on hover", tooltip: [...doc.querySelectorAll('[role="tooltip"], .tooltip, [class*="tooltip"]')].map((e) => e.innerText.trim()).filter(Boolean).slice(0, 3) }));
  });

  it("button column: click fires its event with the clicked row", () => {
    tq.app({
      data: [{ id: 1, name: "A" }, { id: 2, name: "B" }],
      columns: [col("id", "number"), col("name"), { ...col("act", "button", { buttons: [{ id: "go", buttonLabel: "Go" }] }), id: "actcol" }],
      events: [
        { eventId: "OnTableButtonColumnClicked", message: "BTNKEY:{{components.table1.selectedRow?.name}}", ref: "act::go" },
        { eventId: "OnTableButtonColumnClicked", message: "BTNID:{{components.table1.selectedRow?.name}}", ref: "actcol::go" },
      ],
      props: { defaultSelectedRow: "{{undefined}}" },
    });
    cy.get('td[data-cy="table1-act-row-1"] button').contains("Go").click({ force: true });
    cy.wait(900);
    cy.document().then((doc) => R.push({ id: "button:click row 2", byKeyRef: toasts(doc, "BTNKEY"), byIdRef: toasts(doc, "BTNID"), selectedRowCell: doc.querySelector('td[data-cy="table1-name-row-1"]')?.closest("tr")?.className }));
    cy.get('td[data-cy="table1-act-row-0"] button').contains("Go").click({ force: true });
    cy.wait(900);
    cy.document().then((doc) => R.push({ id: "button:then click row 1", byKeyRef: toasts(doc, "BTNKEY"), byIdRef: toasts(doc, "BTNID") }));
  });

  it("dynamic options + loading state; default option", () => {
    const dyn = "{{[{label: 'Dyn One', value: 'd1'}, {label: 'Dyn Two', value: 'd2'}]}}";
    tq.app({
      data: [{ s: "d1", t: ["d2"], l: "d1", def: null }],
      width: 50,
      columns: [
        col("s", "select", { useDynamicOptions: true, dynamicOptions: dyn, isEditable: true }),
        col("t", "tagsV2", { useDynamicOptions: true, dynamicOptions: dyn, allowMultipleSelection: true }),
        col("l", "select", { useDynamicOptions: true, dynamicOptions: dyn, optionsLoadingState: "{{true}}", isEditable: true }),
        col("def", "select", { options: OPTS, defaultOptionsList: [OPTS[1]], isEditable: true }),
      ],
      props: { defaultSelectedRow: "{{undefined}}", showAddNewRowButton: "{{true}}" },
    });
    cy.document().then((doc) => {
      ["s", "t", "l", "def"].forEach((c) => R.push({ id: `options:${c}`, cell: cellFacts(doc, c), loading: !!tdOf(doc, c)?.querySelector('[class*="loading"], [class*="spinner"], [class*="Loading"]') }));
    });
    tq.cell(0, "s").find(".react-select__control").click({ force: true });
    cy.wait(400);
    cy.document().then((doc) => R.push({ id: "options:s menu", options: [...doc.querySelectorAll('[class*="option"]')].map((e) => e.innerText.trim()).filter(Boolean).slice(0, 5) }));
    cy.get("body").type("{esc}");
    cy.get('[data-cy="table1-add-new-row-button"]').click({ force: true });
    cy.wait(600);
    cy.document().then((doc) => R.push({ id: "options:default in new row", cell: cellFacts(doc, "def", 0, true), nr: doc.querySelector('[data-cy="draggable-widget-nr"]')?.innerText }));
  });

  it("deprecated column types still render existing data", () => {
    const D = [
      ["default", "plain"], ["dropdown", "red"], ["multiselect", ["red", "green"]], ["toggle", true],
      ["radio", "green"], ["badge", "red"], ["badges", ["red", "blue"]], ["tags", ["alpha", "beta"]],
    ];
    const row = {}; D.forEach(([t, v], i) => (row[`d${i}`] = v));
    tq.app({ data: [row], width: 60, columns: D.map(([t], i) => col(`d${i}`, t, { values: ["red", "green", "blue"], labels: ["Red", "Green", "Blue"], isEditable: true })), props: { defaultSelectedRow: "{{undefined}}" } });
    cy.document().then((doc) => D.forEach(([t, v], i) => R.push({ id: `deprecated:${t}`, value: v, cell: cellFacts(doc, `d${i}`), html: (tdOf(doc, `d${i}`)?.innerHTML || "").replace(/<path[^>]*>|<\/?svg[^>]*>/g, "").slice(0, 160) })));
  });
});
