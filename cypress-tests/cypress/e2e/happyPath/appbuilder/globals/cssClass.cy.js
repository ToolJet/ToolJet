import { commonWidgetSelector } from "Selectors/common";
import { fake } from "Fixtures/fake";
import { openEditorSidebar, openAccordion } from "Support/utils/commonWidget";

// Covers the universal per-widget "CSS class" field (Styles -> Advanced).
// The field is added once via universalProps.styles, so Button is a
// representative revamped widget. Published-app application is verified
// manually (same RenderWidget node renders in the viewer).
describe("Widget - CSS class field (Styles > Advanced)", () => {
  const widgetName = "button1";

  beforeEach(() => {
    cy.apiLogin();
    cy.apiCreateApp(`${fake.companyName}-cssClass-App`);
    cy.openApp();
    cy.dragAndDropWidget("Button", 500, 100);
    openEditorSidebar(widgetName);
    cy.get(commonWidgetSelector.buttonStylesEditorSideBar).click();
    openAccordion("Advanced");
  });

  it("should expose a CSS class field under the Advanced accordion", () => {
    cy.get(commonWidgetSelector.parameterLabel("CSS class"))
      .scrollIntoView()
      .should("have.text", "CSS class");
  });

  it("should apply a single custom class to the widget root node", () => {
    cy.get(commonWidgetSelector.parameterInputField("CSS class"))
      .clearAndTypeOnCodeMirror("custom-btn");
    cy.waitForAutoSave();
    cy.forceClickOnCanvas();

    cy.get(commonWidgetSelector.draggableWidget(widgetName)).should(
      "have.class",
      "custom-btn"
    );
  });

  it("should apply multiple space-separated classes and collapse extra whitespace", () => {
    cy.get(commonWidgetSelector.parameterInputField("CSS class"))
      .clearAndTypeOnCodeMirror("  alpha   beta  ");
    cy.waitForAutoSave();
    cy.forceClickOnCanvas();

    cy.get(commonWidgetSelector.draggableWidget(widgetName))
      .should("have.class", "alpha")
      .and("have.class", "beta")
      // collapse: no run of >1 space should survive between our tokens
      .invoke("attr", "class")
      .then((cls) => expect(cls).to.not.match(/alpha\s{2,}beta/));
  });

  it("should resolve a dynamic {{ }} bound class expression", () => {
    cy.get(commonWidgetSelector.parameterInputField("CSS class"))
      .clearAndTypeOnCodeMirror("{{'dyn-class'}}");
    cy.waitForAutoSave();
    cy.forceClickOnCanvas();

    cy.get(commonWidgetSelector.draggableWidget(widgetName)).should(
      "have.class",
      "dyn-class"
    );
  });
});
