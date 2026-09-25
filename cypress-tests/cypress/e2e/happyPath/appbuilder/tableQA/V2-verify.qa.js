import { tq } from "./_harness";
describe("V2 verify", () => {
  afterEach(() => tq.cleanup());
  it("literal dot key value renders", () => {
    tq.app({ data: [{ id: 7, "a.b": "DOTVAL", "a b": "SPACEVAL" }] });
    tq.rows().first().then(($r) => {
      const cells = [...$r[0].querySelectorAll("td")].map((td) => `${td.getAttribute("data-cy")}=${td.innerText.trim()}`);
      cy.writeFile("cypress/e2e/happyPath/appbuilder/tableQA/logs/v2-dotkey.txt", cells.join("\n"));
    });
    tq.rows().first().should("contain.text", "SPACEVAL");
    tq.rows().first().should("contain.text", "DOTVAL");
  });
  it("nested 1 level headers", () => {
    tq.app({ data: [{ id: 1, address: { city: "NY", zip: "10001" } }] });
    tq.table().should(($t) => {
      const got = [...$t[0].querySelectorAll('[data-cy$="-column-header"]')].map((e) => e.textContent.trim()).filter(Boolean);
      expect(got).to.deep.equal(["id", "address.city", "address.zip"]);
    });
  });
});
