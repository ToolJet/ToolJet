import { cyParamName } from "Selectors/common";

export const auditLogSelectors = {
  auditLogsHeader: '[data-cy="header-audit-logs"]',
  searchButton: '[data-cy="search-button"]',
  fromDateLabel: '[data-cy="from-date-label"]',
  toDateLabel: '[data-cy="to-date-label"]',
  fromDateInputfield: '[data-cy="from-date-inputfield"]',
  toDateInputfield: '[data-cy="to-date-inputfield"]',
  filterBySection: '[data-cy="filter-by-section"]',
  filterByLabel: '[data-cy="filter-by-label"]',
  logTable: '[data-testid="usersTable"]',
  actionTypeText: `[data-cy="audit-table-row-0"] [data-cy="audit-log-action-type"]`,
  selectDropdown: (dropdownFieldText) => {
    return `[data-cy="select-${cyParamName(dropdownFieldText)}-dropdown"]`;
  },
  selectedItemCount: (dropdownFieldText, value) => {
    return `${auditLogSelectors.selectDropdown(
      dropdownFieldText
    )} [data-cy="${value}-selected-label"]`;
  },
  filterHeadingText: (text) => {
    return `[data-cy="${cyParamName(text)}-heading-text"]`;
  },
  filterSelectedValueLabel: (selectValue) => {
    return `[data-cy="${cyParamName(selectValue)}-label"]`;
  },
  filterSelectedValueClose: (selectValue) => {
    return `[data-cy="${cyParamName(selectValue)}-close"]`;
  },
};
