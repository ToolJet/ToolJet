import { fake } from "Fixtures/fake";

export const multiselectSelector = {
  dropdownArrow: ".dropdown-heading-dropdown-arrow",
  dropdownAllItems: "[class*='select-item']",
  dropdownCheckbox: ".item-renderer > input",
  multiselectHeader: ".dropdown-heading-value > span",
  boxShadowPopover: "[id='popover-basic']",
  colourPickerInput: "[data-cy='color-picker-input']",
  colourPickerParent: "[data-cy='color-picker-parent']",
  inputBoxShadow: "[data-cy= 'input-box-shadow']",
  dropdownContainer: ".dropdown-container",

  multiselectLabel: (widgetName) => {
    return `[data-cy="multiselect-label-${widgetName.toLowerCase()}"]`;
  },

  textArrayOfLength: (index) => {
    const labels = [];
    for (let i = 0; i < index; i++) {
      labels.push(`"${fake.firstName}"`);
    }
    return labels;
  },
};
