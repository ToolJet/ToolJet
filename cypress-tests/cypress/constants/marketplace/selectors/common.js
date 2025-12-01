import { cyParamName } from "../../constants/selectors/common";

export const dsCommonSelector = {
    deleteDSButton: (datasourceName) => {
        return `[data-cy="${cyParamName(datasourceName)}-delete-button"]`;
    },
    labelFieldName: (fieldName) => {
        return `[data-cy="${cyParamName(fieldName)}-field-label"]`;
    },
    textField: (fieldName) => {
        return `[data-cy="${cyParamName(fieldName)}-text-field"]`;
    },
    dataSourceNameButton: (dataSourceName) => {
        return `[data-cy="${cyParamName(dataSourceName)}-button"]`;
    },
    dropdownLabel: (label) => {
        return `[data-cy="${cyParamName(label)}-dropdown-label"]`;
    },
    dropdownField: (fieldName) => {
        return `[data-cy="${cyParamName(fieldName)}-select-dropdown"]`;
    },

    subSection: (header) => {
        return `[data-cy="${cyParamName(header)}-section"]`;
    },
    toggleInput: (toggleName) => {
        return `[data-cy="${cyParamName(toggleName)}-toggle-input"]`;
    },
    button: (buttonName) => {
        return `[data-cy="button-${cyParamName(buttonName)}"]`;
    },
    keyInputField: (header, index) => {
        return `[data-cy="${cyParamName(header)}-key-input-field-${cyParamName(index)}"]`;
    },
    valueInputField: (header, index) => {
        return `[data-cy="${cyParamName(header)}-value-input-field-${cyParamName(index)}"]`;
    },
    deleteKeyValueButton: (header, index) => {
        return `[data-cy="${cyParamName(header)}-delete-button-${cyParamName(index)}"]`;
    },
    addMoreButton: (header) => {
        return `[data-cy="${cyParamName(header)}-add-button"]`;
    },
    labelFieldValidation: (fieldName) => {
        return `[data-cy="${cyParamName(fieldName)}-is-required-validation-label"]`;
    },
    datasourceOption: (datasourceName) => {
        return `[data-cy="ds-${cyParamName(datasourceName)}"]`;
    },
};