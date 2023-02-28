import {
  commonSelectors,
  cyParamName,
  commonWidgetSelector,
} from "Selectors/common";
import { postgreSqlSelector } from "Selectors/postgreSql";

export const selectQueryMode = (mode) => {
  cy.get(`${postgreSqlSelector.querySelectDropdown}:eq(0)`).click();
  cy.contains("[id*=react-select-]", mode).click();
};   
