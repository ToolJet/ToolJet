import { commonWidgetSelector, cyParamName } from "Selectors/common";
import { tableSelector } from "Selectors/table";

export const searchOnTable = (value = "") => {
  cy.get('[data-cy="search-input-field"]').type(
    `{selectAll}{backspace}${value}`
  );
  cy.wait(100);
};

export const verifyTableElements = (
  values,
  columns = ["id", "name", "email"]
) => {
  values.forEach((value, i) => {
    columns.forEach((column, index) => {
      cy.get(tableSelector.column(index))
        .eq(i)
        .should("have.text", `${value[column]}`);
    });
  });
  cy.forceClickOnCanvas();
};

export const selectDropdownOption = (inputSelector, option) => {
  const data = {
    default: 0,
    string: 1,
    number: 2,
    text: 3,
    badge: 4,
    multipleBadges: 5,
    tags: 6,
    dropdown: 7,
    radio: 8,
    multiselect: 9,
    toggleSwitch: 10,
    datePicker: 11,
    image: 12,
    wrap: 0,
    scroll: 1,
    hide: 2,
  };

  const click = () => {
    cy.get(inputSelector).click();
    cy.wait(500);
    cy.get("body").then(($body) => {
      if ($body.find('[data-index="0"]').length == 0) {
        click();
      }
    });
  };

  click();
  cy.get(
    isNaN(option)
      ? `[data-index="${data[option]}"]`
      : `[data-index="${option}"]`
  ).click();
};

export const verifyAndEnterColumnOptionInput = (label, value) => {
  cy.get(`[data-cy="input-and-label-${cyParamName(label)}"]`)
    .find("label")
    .should("have.text", label);
  cy.get(`[data-cy="input-and-label-${cyParamName(label)}"]`).type(
    `{selectAll}{backspace}${value}`
  );
};

export const addAndOpenColumnOption = (name, type) => {
  cy.get('[data-cy="button-add-column"]').click();
  cy.get('[data-cy="button-add-column"]')
    .parents(".accordion-body")
    .find('[data-cy*="column-"]')
    .last()
    .click();
  selectDropdownOption(
    '[data-cy="dropdown-column-type"] > .select-search',
    type
  );
  verifyAndEnterColumnOptionInput("Column name", name);
};

export const deleteAndVerifyColumn = (columnName) => {
  cy.get(`[data-cy="button-delete-${columnName}"]`).click();
  cy.notVisible(`[data-cy="column-${columnName}"]`);
  cy.forceClickOnCanvas();
  cy.notVisible(tableSelector.columnHeader(columnName));
};

export const verifyInvalidFeedback = (columnIndex = 0, rowIndex = 0, text) => {
  cy.get(tableSelector.column(columnIndex))
    .eq(rowIndex)
    .find('[class="invalid-feedback"]')
    .should("have.text", text);
  cy.forceClickOnCanvas();
};

export const addInputOnTable = (
  columnIndex = 0,
  rowIndex = 0,
  value,
  type = "input"
) => {
  cy.forceClickOnCanvas();
  cy.get(tableSelector.column(columnIndex))
    .eq(rowIndex)
    .find(type)
    .click()
    .type(`{selectAll}{backspace}${value}`);
  cy.forceClickOnCanvas();
};

export const verifySingleValueOnTable = (
  columnIndex = 0,
  rowIndex = 0,
  value
) => {
  cy.get(tableSelector.column(columnIndex))
    .eq(rowIndex)
    .should("have.text", value);
};

export const verifyAndModifyToggleFx = (
  paramName,
  defaultValue,
  toggleModification = true
) => {
  cy.get(`[data-cy="label-${cyParamName(paramName)}"]`).should(
    "have.text",
    paramName
  );
  cy.get(commonWidgetSelector.parameterFxButton(paramName, ":eq(1)"))
    .scrollIntoView()
    .should("have.text", "Fx")
    .click();
  if (defaultValue)
    cy.get(commonWidgetSelector.parameterInputField(paramName))
      .find("pre.CodeMirror-line")
      .should("have.text", defaultValue);
  cy.get(commonWidgetSelector.parameterFxButton(paramName)).click();
  if (toggleModification == true)
    cy.get(commonWidgetSelector.parameterTogglebutton(paramName)).click();
};

export const selectFromSidebarDropdown = (selector, option) => {
  cy.get(selector).click().type(`${option}{enter}`);
};

export const dataPdfAssertionHelper = (data) => {
  let dataArray = [];
  data.forEach((a) => {
    dataArray.push("" + a.id + a.name + a.email);
  });
  return dataArray;
};

export const dataCsvAssertionHelper = (data) => {
  let dataArray = [];
  data.forEach((a) => {
    dataArray.push(`${a.id},${a.name},${a.email}`);
  });
  return dataArray;
};
