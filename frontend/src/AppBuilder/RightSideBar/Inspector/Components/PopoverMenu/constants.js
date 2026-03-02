/**
 * Single config for all inspector variants (ButtonGroup, PopoverMenu, ReorderableList).
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
    popoverFields: ['label', 'value', 'icon', 'default', 'disable'],
    optionLabelPrefix: 'Button',
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
  optionLabelPrefix: 'option', // Prefix for new option labels (e.g. "option1", "Card1")
  singleDataSection: false, // If true, one "Data" section; if false, separate "Properties" + "Options"
  dataCy: '', // data-cy prefix for option list and related elements
};
