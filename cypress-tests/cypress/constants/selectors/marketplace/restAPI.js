export const cyParamName = (paramName = "") => {
  return String(paramName)
    .toLowerCase()
    .replace(/\(s\)/g, "")
    .replace(/\s+/g, "-");
};
export const restAPISelector = {
  accordionHeader: (header) => {
    return `[data-cy="widget-accordion-${cyParamName(header)}"]`;
  },
  subHeaderLabel: (header) => {
    return `[data-cy="label-${cyParamName(header)}"]`;
  },
  subSection: (header) => {
    return `[data-cy="${cyParamName(header)}-section"]`;
  },
  keyInputField: (header, index) => {
    return `[data-cy="${cyParamName(header)}-key-input-field-${cyParamName(index)}"]`;
  },
  valueInputField: (header, index) => {
    return `[data-cy="${cyParamName(header)}-value-input-field-${cyParamName(index)}"]`;
  },
  deleteButton: (header, index) => {
    return `[data-cy="${cyParamName(header)}-delete-button-${cyParamName(index)}"]`;
  },
  addMoreButton: (header) => {
    return `[data-cy="${cyParamName(header)}-add-button"]`;
  },
  dropdownLabel: (label) => {
    return `[data-cy="${cyParamName(label)}-dropdown-label"]`;
  },
  inputField: (fieldName) => {
    return `[data-cy="${cyParamName(fieldName)}-input-field"]`;
  },
  button: (buttonName) => {
    return `[data-cy="button-${cyParamName(buttonName)}"]`;
  },
  authenticationAllUsersToggleSwitch:
    '[data-cy="authentication-required-for-all-users-toggle-switch"]',
  retryNetworkToggleSwitch: '[data-cy="retry-network-errors-toggle-input"]',
  retryNetworkToggleText: '[data-cy="retry-network-errors-toggle-text"]',
  retryNetworkToggleSubtext: '[data-cy="retry-network-errors-toggle-subtext"]',
  readDocumentationLinkText: '[data-cy="link-read-documentation"]',
};
