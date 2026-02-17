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
  validation: {
    mandatory: { type: 'toggle', displayName: 'Make this field mandatory' },
    minSelection: {
      type: 'code',
      displayName: 'Minimum selection',
      validation: {
        schema: { type: 'number' },
        defaultValue: 0,
      },
    },
    maxSelection: {
      type: 'code',
      displayName: 'Maximum selection',
      validation: {
        schema: { type: 'number' },
        defaultValue: 0,
      },
    },
    customRule: {
      type: 'code',
      displayName: 'Custom validation',
      placeholder: `{{components.text2.text=='yes'&&'valid'}}`,
    },
  },
  properties: {
    label: {
      type: 'code',
      displayName: 'Label',
      validation: {
        schema: { type: 'string' },
        defaultValue: 'Countries',
      },
      accordian: 'Data',
    },
    advanced: {
      type: 'toggle',
      displayName: 'Dynamic options',
      validation: {
        schema: { type: 'boolean' },
      },
    },
    data: {
      type: 'code',
      displayName: 'Schema',
    },
    allowIndependentSelection: {
      type: 'toggle',
      displayName: 'Allow independent selection',
      validation: {
        schema: { type: 'boolean' },
      },
    },
    checkedData: { type: 'code', displayName: 'Selected values' },
    expandedData: { type: 'code', displayName: 'Expanded values' },
    visibility: {
      type: 'toggle',
      displayName: 'Visibility',
      validation: { schema: { type: 'boolean' }, defaultValue: true },
      section: 'additionalActions',
    },
    disabledState: {
      type: 'toggle',
      displayName: 'Disable',
      validation: { schema: { type: 'boolean' }, defaultValue: false },
      section: 'additionalActions',
    },
    tooltip: {
      type: 'code',
      displayName: 'Tooltip',
      validation: {
        schema: { type: 'string' },
        defaultValue: '',
      },
      section: 'additionalActions',
      placeholder: 'Enter tooltip text',
    },
  },
  events: {
    onChange: { displayName: 'On change' },
    onCheck: { displayName: 'On check' },
    onUnCheck: { displayName: 'On uncheck' },
  },
  styles: {
    labelColor: {
      type: 'colorSwatches',
      displayName: 'Color',
      validation: { schema: { type: 'string' } },
      accordian: 'label',
    },
    alignment: {
      type: 'switch',
      displayName: 'Alignment',
      validation: { schema: { type: 'string' }, defaultValue: 'left' },
      options: [
        { displayName: 'Left', value: 'left' },
        { displayName: 'Right', value: 'right' },
      ],
      accordian: 'label',
    },
    borderColor: {
      type: 'colorSwatches',
      displayName: 'Border',
      validation: { schema: { type: 'string' } },
      accordian: 'switch',
    },
    uncheckedBackground: {
      type: 'colorSwatches',
      displayName: 'Unchecked background',
      validation: { schema: { type: 'string' } },
      accordian: 'switch',
      tip: 'Unchecked background',
      tooltipStyle: {},
      tooltipPlacement: 'bottom',
    },
    checkboxColor: {
      type: 'colorSwatches',
      displayName: 'Checked background',
      validation: { schema: { type: 'string' } },
      accordian: 'switch',
      tip: 'Checked background',
      tooltipStyle: {},
      tooltipPlacement: 'bottom',
    },
    checkmarkColor: {
      type: 'colorSwatches',
      displayName: 'Checkmark',
      validation: { schema: { type: 'string' } },
      accordian: 'switch',
    },
    optionTextColor: {
      type: 'colorSwatches',
      displayName: 'Option text',
      validation: { schema: { type: 'string' } },
      accordian: 'switch',
    },
    padding: {
      type: 'switch',
      displayName: 'Padding',
      validation: {
        schema: { type: 'union', schemas: [{ type: 'string' }, { type: 'number' }] },
        defaultValue: 'default',
      },
      isFxNotRequired: true,
      options: [
        { displayName: 'Default', value: 'default' },
        { displayName: 'None', value: 'none' },
      ],
      accordian: 'container',
    },
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
    leafPathArray: [
      ['asia', 'china', 'beijing'],
      ['asia', 'china', 'shanghai'],
      ['asia', 'japan'],
      ['asia', 'india', 'delhi'],
      ['asia', 'india', 'mumbai'],
      ['asia', 'india', 'bengaluru'],
    ],
    leafPathStrings: [
      'asia-china-beijing',
      'asia-china-shanghai',
      'asia-japan',
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
    validation: {
      mandatory: { value: '{{false}}' },
      minSelection: { value: '{{0}}' },
      maxSelection: { value: '{{0}}' },
      customRule: { value: null },
    },
    properties: {
      label: { value: 'Countries' },
      advanced: { value: '{{false}}' },
      data: {
        value:
          '{{[{"label":"Asia","value":"asia","children":[{"label":"China","value":"china","children":[{"label":"Beijing","value":"beijing"},{"label":"Shanghai","value":"shanghai"}]},{"label":"Japan","value":"japan"},{"label":"India","value":"india","children":[{"label":"Delhi","value":"delhi"},{"label":"Mumbai","value":"mumbai"},{"label":"Bengaluru","value":"bengaluru"}]}]},{"label":"Europe","value":"europe","children":[{"label":"France","value":"france"},{"label":"Spain","value":"spain"},{"label":"England","value":"england"}]},{"label":"Africa","value":"africa"}]}}',
      },
      allowIndependentSelection: { value: '{{true}}' },
      checkedData: { value: '{{["asia"]}}' },
      expandedData: { value: '{{["asia"]}}' },
      visibility: { value: '{{true}}' },
      disabledState: { value: '{{false}}' },
      tooltip: { value: '' },
      options: {
        value: [
          {
            label: 'Asia',
            value: 'asia',
            visible: { value: true },
            disable: { value: false },
            children: [
              {
                label: 'China',
                value: 'china',
                visible: { value: true },
                disable: { value: false },
                children: [
                  { label: 'Beijing', value: 'beijing', visible: { value: true }, disable: { value: false } },
                  { label: 'Shanghai', value: 'shanghai', visible: { value: true }, disable: { value: false } },
                ],
              },
              { label: 'Japan', value: 'japan', visible: { value: true }, disable: { value: false } },
              {
                label: 'India',
                value: 'india',
                visible: { value: true },
                disable: { value: false },
                children: [
                  { label: 'Delhi', value: 'delhi', visible: { value: true }, disable: { value: false } },
                  { label: 'Mumbai', value: 'mumbai', visible: { value: true }, disable: { value: false } },
                  { label: 'Bengaluru', value: 'bengaluru', visible: { value: true }, disable: { value: false } },
                ],
              },
            ],
          },
          {
            label: 'Europe',
            value: 'europe',
            visible: { value: true },
            disable: { value: false },
            children: [
              { label: 'France', value: 'france', visible: { value: true }, disable: { value: false } },
              { label: 'Spain', value: 'spain', visible: { value: true }, disable: { value: false } },
              { label: 'England', value: 'england', visible: { value: true }, disable: { value: false } },
            ],
          },
          { label: 'Africa', value: 'africa', visible: { value: true }, disable: { value: false } },
        ],
      },
    },
    events: [],
    styles: {
      labelColor: { value: 'var(--cc-primary-text)' },
      alignment: { value: 'left' },
      borderColor: { value: 'var(--cc-default-border)' },
      uncheckedBackground: { value: 'var(--cc-surface1-surface)' },
      checkboxColor: { value: 'var(--cc-primary-brand)' },
      checkmarkColor: { value: 'var(--cc-surface1-surface)' },
      optionTextColor: { value: 'var(--cc-primary-text)' },
      padding: { value: 'default' },
    },
  },
};
