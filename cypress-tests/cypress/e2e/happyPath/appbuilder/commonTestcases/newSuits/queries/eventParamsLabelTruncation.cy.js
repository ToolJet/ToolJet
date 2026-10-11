import { fake } from "Fixtures/fake";
import { commonWidgetSelector } from "Selectors/common";
import { openEditorSidebar } from "Support/utils/commonWidget";
import { selectRunQueryEvent } from "Support/utils/queries";
import { resizeQueryPanel } from "Support/utils/dataSource";

const LONG_PARAM = "aVeryLongParameterNameThatDefinitelyTruncatesInEventHandlerPanel";

const pickQueryInHandler = (queryName) => {
  cy.get('[data-cy="query-selection-field"]').scrollIntoView().click();
  cy.get('[data-cy="query-selection-field"] input')
    .filter(":visible")
    .first()
    .clear({ force: true })
    .type(queryName, { force: true });
  cy.get('[role="option"]')
    .filter(":visible")
    .contains(new RegExp(`^\\s*${queryName}\\s*$`, "i"))
    .click({ force: true });

  cy.wait(1000);
};

describe("Event parameters — label-truncation fix (RunjsParamters.jsx)", () => {
  beforeEach(() => {
    cy.apiLogin();
    cy.apiCreateApp(`${fake.companyName}-event-params-App`);
    cy.openApp();
    cy.apiFetchDataSourcesIdFromApp();
    cy.viewport(1800, 1800);
    cy.dragAndDropWidget("Button");
    resizeQueryPanel("80");
  });

  afterEach(() => {
  if (Cypress.env("appId")) {
      cy.apiDeleteApp();
    }
  });

  it("shows Parameters heading and side-by-side param row for a short param name", () => {
    const myParam = fake.firstName;
    cy.apiAddQueryToApp({
      queryName: "runjsShortParam",
      options: {
        code: `return params.${myParam}`,
        hasParamSupport: true,
        parameters: [{ name: myParam, defaultValue: "" }],
      },
      dataSourceName: "runjsdefault",
      dsKind: "runjs",
    });
    cy.reload();
    resizeQueryPanel("80");

    openEditorSidebar("button1");
    selectRunQueryEvent("On Click", '[data-cy="add-event-handler"]', 0, 0);
    pickQueryInHandler("runjsShortParam");

    
    cy.get(commonWidgetSelector.eventParametersSection)
      .should("be.visible")
      .and("have.text", "Parameters");

    cy.get(commonWidgetSelector.eventParametersSection)
      .parent()
      .contains(myParam)
      .should("exist");

    cy.get(commonWidgetSelector.eventParametersSection)
      .parent()
      .find('[class*="tw-justify-between"]')
      .should("have.length", 1);

    cy.get(commonWidgetSelector.eventParametersSection)
      .parent()
      .find(".cm-editor")
      .should("have.length.at.least", 1)
      .first()
      .should("be.visible");
  });

  it("CSS-truncates a long param name via OverflowTooltip without breaking layout", () => {
    cy.apiAddQueryToApp({
      queryName: "runjsLongParam",
      options: {
        code: `return params.${LONG_PARAM}`,
        hasParamSupport: true,
        parameters: [{ name: LONG_PARAM, defaultValue: "" }],
      },
      dataSourceName: "runjsdefault",
      dsKind: "runjs",
    });
    cy.reload();
    resizeQueryPanel("80");

    openEditorSidebar("button1");
    selectRunQueryEvent("On Click", '[data-cy="add-event-handler"]', 0, 0);
    pickQueryInHandler("runjsLongParam");

    cy.get(commonWidgetSelector.eventParametersSection).should("be.visible");
    cy.get(commonWidgetSelector.eventParametersSection)
      .parent()
      .find('[class*="tw-justify-between"]')
      .first()
      .find('[style*="overflow: hidden"]')
      .should("exist")
      .then(($el) => {
        expect(
          $el[0].scrollWidth,
          "long param name inner div should be overflowing"
        ).to.be.greaterThan($el[0].clientWidth);
      });

    cy.get(commonWidgetSelector.eventParametersSection)
      .parent()
      .find('[class*="tw-justify-between"]')
      .first()
      .find('[style*="overflow: hidden"]')
      .realHover();

    cy.get(".overflow-tooltip .tooltip-inner")
      .should("be.visible")
      .and("have.text", LONG_PARAM);

    cy.get(commonWidgetSelector.eventParametersSection)
      .parent()
      .find(".cm-editor")
      .should("have.length.at.least", 1)
      .first()
      .should("be.visible");
  });

  it("renders all param rows and accepts input values in CodeHinter", () => {
    const paramNames = [fake.firstName, LONG_PARAM];
    cy.apiAddQueryToApp({
      queryName: "runjsMultiParam",
      options: {
        code: `return { ${paramNames.map((n) => `${n}: params.${n}`).join(", ")} }`,
        hasParamSupport: true,
        parameters: paramNames.map((name) => ({ name, defaultValue: "" })),
      },
      dataSourceName: "runjsdefault",
      dsKind: "runjs",
    });
    cy.reload();
    resizeQueryPanel("80");

    openEditorSidebar("button1");
    selectRunQueryEvent("On Click", '[data-cy="add-event-handler"]', 0, 0);
    pickQueryInHandler("runjsMultiParam");

    cy.get(commonWidgetSelector.eventParametersSection).should("be.visible");

    cy.get(commonWidgetSelector.eventParametersSection)
      .parent()
      .find('[class*="tw-justify-between"]')
      .should("have.length", paramNames.length);

    cy.get(commonWidgetSelector.eventParametersSection)
      .parent()
      .find(".cm-editor")
      .should("have.length", paramNames.length);

    paramNames.forEach((_, i) => {
      cy.get(commonWidgetSelector.eventParametersSection)
        .parent()
        .find(".cm-editor")
        .eq(i)
        .clearAndTypeOnCodeMirror(`${i + 1}`);

      cy.get(commonWidgetSelector.eventParametersSection)
        .parent()
        .find(".cm-line")
        .eq(i)
        .should("have.text", `${i + 1}`);
    });
  });
});
