/**
 * Single config for all inspector variants (PopoverMenu, ButtonGroupV2, ReorderableList).
 */
export const COMPONENT_INSPECTOR_CONFIG = {
  PopoverMenu: {
    propertiesAccordionTitle: 'Menu',
    popoverFields: ['format', 'label', 'description', 'value', 'icon', 'visibility', 'disable'],
    optionLabelPrefix: 'option',
    singleDataSection: false,
    dataCy: 'inspector-popover-menu',
  },
  ButtonGroupV2: {
    propertiesAccordionTitle: 'Data',
    optionsAccordionTitle: 'Buttons',
    popoverTitle: 'Edit button',
    popoverFields: ['label', 'value', 'icon', 'default', 'disable'],
    optionLabelPrefix: 'Button',
    addOptionCtaLabel: 'Add new button',
    singleDataSection: false,
    dataCy: 'inspector-button-group-v2',
  },
  ReorderableList: {
    propertiesAccordionTitle: 'Data',
    popoverFields: ['format', 'label', 'value'],
    optionLabelPrefix: 'Card',
    singleDataSection: true,
    dataCy: 'inspector-reorderable-list',
  },
};

export const DEFAULT_CONFIG = {
  propertiesAccordionTitle: 'Properties', // Title for the main properties accordion
  popoverFields: [], // Field names to show in each option's details popover
  popoverTitle: 'Option details', // Title shown in the option details popover header
  popoverClassName: 'pm-option-popover', // CSS class applied to the option details popover
  optionLabelPrefix: 'option', // Prefix for new option labels (e.g. "option1", "Card1")
  addOptionCtaLabel: 'Add new option', // Label for the add-option button
  singleDataSection: false, // If true, one "Data" section; if false, separate "Properties" + "Options"
  dataCy: '', // data-cy prefix for option list and related elements
};
