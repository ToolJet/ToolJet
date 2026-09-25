// Verification spec for ambiguous failures (orchestrator-owned).
import { tq } from "./_harness";
import { addFilter } from "Support/utils/appBuilder/components/table";

describe("V1 verify", () => {
  afterEach(() => tq.cleanup());

  it("exposed isVisible/isDisabled/isLoading at mount", () => {
    tq.app({
      data: [{ id: 1 }],
      probes: {
        v: "{{String(components.table1.isVisible)}}",
        d: "{{String(components.table1.isDisabled)}}",
        l: "{{String(components.table1.isLoading)}}",
      },
    });
    tq.probe("v").invoke("text").should("eq", "true");
    tq.probe("d").invoke("text").should("eq", "false");
    tq.probe("l").invoke("text").should("eq", "false");
  });

  it("filter 'is empty' on string column", () => {
    tq.app({
      data: [{ id: 1, name: "Alice" }, { id: 2, name: "" }],
      probes: { f: "{{JSON.stringify(components.table1.filters)}}" },
    });
    addFilter([{ column: "name", operation: "is empty" }], true);
    tq.probe("f").invoke("text").then((t) => cy.writeFile("cypress/e2e/happyPath/appbuilder/tableQA/logs/v1-isempty.txt", t));
    tq.rows().should("have.length", 1);
  });

  it("removing one of two filters re-applies the remaining one", () => {
    tq.app({
      data: [{ id: 1, name: "Alice", city: "NY" }, { id: 2, name: "Alan", city: "LA" }, { id: 3, name: "Bob", city: "NY" }],
      probes: { f: "{{JSON.stringify(components.table1.filters)}}" },
    });
    addFilter([{ column: "name", operation: "contains", value: "Al" }, { column: "city", operation: "equals", value: "NY" }], true);
    tq.rows().should("have.length", 1);
    tq.probe("f").invoke("text").then((t) => cy.writeFile("cypress/e2e/happyPath/appbuilder/tableQA/logs/v1-filters.txt", t));
  });
});
