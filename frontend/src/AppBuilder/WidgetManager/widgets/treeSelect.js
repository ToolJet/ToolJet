export const treeSelectConfig = {
  name: 'TreeSelect',
  displayName: 'Tree Select',
  description: 'Hierarchical item selector',
  defaultSize: {
    width: 12,
    height: 200,
  },
  component: 'TreeSelect',
  others: {
    showOnDesktop: { type: 'toggle', displayName: 'Show on desktop' },
    showOnMobile: { type: 'toggle', displayName: 'Show on mobile' },
  },
  properties: {
    label: { type: 'code', displayName: 'Title' },
    data: { type: 'code', displayName: 'Structure' },
    checkedData: { type: 'code', displayName: 'Checked values' },
    expandedData: { type: 'code', displayName: 'Expanded values' },
  },
  events: {
    onChange: { displayName: 'On change' },
    onCheck: { displayName: 'On check' },
    onUnCheck: { displayName: 'On uncheck' },
  },
  styles: {
    textColor: { type: 'color', displayName: 'Text Color' },
    checkboxColor: { type: 'color', displayName: 'Checkbox color' },
    visibility: { type: 'toggle', displayName: 'Visibility' },
    disabledState: { type: 'toggle', displayName: 'Disable' },
  },
  exposedVariables: {
    checked: ['asia', 'china', 'beijing', 'shanghai', 'japan', 'india', 'delhi', 'mumbai', 'bengaluru'],
    expanded: ['asia'],
    checkedPathArray: [
      ['asia'],
      ['asia', 'china'],
      ['asia', 'china', 'beijing'],
      ['asia', 'china', 'shanghai'],
      ['asia', 'japan'],
      ['asia', 'india'],
      ['asia', 'india', 'delhi'],
      ['asia', 'india', 'mumbai'],
      ['asia', 'india', 'bengaluru'],
    ],
    checkedPathStrings: [
      'asia',
      'asia-china',
      'asia-china-beijing',
      'asia-china-shanghai',
      'asia-japan',
      'asia-india',
      'asia-india-delhi',
      'asia-india-mumbai',
      'asia-india-bengaluru',
    ],
  },
  definition: {
    others: {
      showOnDesktop: { value: '{{true}}' },
      showOnMobile: { value: '{{false}}' },
    },
    properties: {
      label: { value: 'Countries' },
      data: {
        value:
          '{{[{"label":"Asia","value":"asia","children":[{"label":"China","value":"china","children":[{"label":"Beijing","value":"beijing"},{"label":"Shanghai","value":"shanghai"}]},{"label":"Japan","value":"japan"},{"label":"India","value":"india","children":[{"label":"Delhi","value":"delhi"},{"label":"Mumbai","value":"mumbai"},{"label":"Bengaluru","value":"bengaluru"}]}]},{"label":"Europe","value":"europe","children":[{"label":"France","value":"france"},{"label":"Spain","value":"spain"},{"label":"England","value":"england"}]},{"label":"Africa","value":"africa"}]}}',
      },
      checkedData: { value: '{{["asia"]}}' },
      expandedData: { value: '{{["asia"]}}' },
    },
    events: [],
    styles: {
      textColor: { value: '' },
      checkboxColor: { value: '' },
      visibility: { value: '{{true}}' },
      disabledState: { value: '{{false}}' },
    },
  },
};
