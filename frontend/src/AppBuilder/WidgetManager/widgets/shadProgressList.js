export const shadProgressListConfig = {
  name: 'ShadProgressList',
  displayName: 'Progress list',
  description:
    "List of progress rows from data, for goals, budgets, quotas, onboarding steps and capacity: each row has a label (labelField), its value against a target ('$18,400 of $25,000': valueField, targetField, in valueFormat: auto, number, currency in currency, percent, compact), a progress bar, an optional status (statusField: a chip toned by its words, On track green, At risk amber, Over budget or Behind red; a status that only names a tone, success, warning, danger, info or neutral, colours the bar without a chip) and an optional trailing caption under the bar ('12 days left': captionField). The percentage is percentField when the data has one (0 to 100), else value / target; a row with a value and no target reads the value as the percentage. autoTone colours bars from their percentage when the row has no status: 'goal' green at 100%, 'limit' (budgets, quotas, storage) amber from 80% and red over 100%. showValues and showPercent pick the figures shown; barSize thin, default or thick; listStyle 'card' (bordered panel) or 'plain'. A click on a row exposes selectedItem and selectedItemId and fires onItemClicked (rows look clickable only when it is handled). Use a Stat or a Summary strip for one headline figure, a Progress for a single bar. Height: grows with its rows (about 64px a row, 76px with captions)",
  component: 'ShadProgressList',
  defaultSize: {
    width: 20,
    height: 360,
  },
  others: {
    showOnDesktop: {
      type: 'toggle',
      displayName: 'Show on desktop',
    },
    showOnMobile: {
      type: 'toggle',
      displayName: 'Show on mobile',
    },
  },
  properties: {
    data: {
      type: 'code',
      displayName: 'Data',
      validation: {
        schema: {
          type: 'array',
          optional: true,
        },
        defaultValue: [],
      },
      placeholder: "[{ id: 1, label: 'Marketing', spent: 18400, budget: 25000, status: 'On track' }]",
    },
    labelField: {
      type: 'code',
      displayName: 'Label field',
      validation: {
        schema: {
          type: 'string',
          optional: true,
        },
        defaultValue: 'label',
      },
    },
    valueField: {
      type: 'code',
      displayName: 'Value field',
      validation: {
        schema: {
          type: 'string',
          optional: true,
        },
        defaultValue: 'value',
      },
    },
    targetField: {
      type: 'code',
      displayName: 'Target field',
      validation: {
        schema: {
          type: 'string',
          optional: true,
        },
        defaultValue: 'target',
      },
    },
    percentField: {
      type: 'code',
      displayName: 'Percent field (0 to 100; overrides value / target)',
      validation: {
        schema: {
          type: 'string',
          optional: true,
        },
        defaultValue: '',
      },
    },
    captionField: {
      type: 'code',
      displayName: 'Caption field (a line under the bar)',
      validation: {
        schema: {
          type: 'string',
          optional: true,
        },
        defaultValue: '',
      },
    },
    statusField: {
      type: 'code',
      displayName: 'Status field (a chip, or a tone name)',
      validation: {
        schema: {
          type: 'string',
          optional: true,
        },
        defaultValue: '',
      },
    },
    valueFormat: {
      type: 'select',
      displayName: 'Value format',
      options: [
        {
          name: 'Auto',
          value: 'auto',
        },
        {
          name: 'Number',
          value: 'number',
        },
        {
          name: 'Currency',
          value: 'currency',
        },
        {
          name: 'Percent',
          value: 'percent',
        },
        {
          name: 'Compact',
          value: 'compact',
        },
      ],
      validation: {
        schema: {
          type: 'string',
          optional: true,
        },
        defaultValue: 'currency',
      },
    },
    currency: {
      conditionallyRender: { key: 'valueFormat', value: 'currency' },
      type: 'code',
      displayName: 'Currency (ISO code, e.g. USD)',
      validation: {
        schema: {
          type: 'string',
          optional: true,
        },
        defaultValue: 'USD',
      },
    },
    idField: {
      type: 'code',
      displayName: 'Id field',
      validation: {
        schema: {
          type: 'string',
          optional: true,
        },
        defaultValue: 'id',
      },
    },
    autoTone: {
      type: 'switch',
      displayName: 'Tone from progress',
      options: [
        {
          displayName: 'None',
          value: 'none',
        },
        {
          displayName: 'Goal',
          value: 'goal',
        },
        {
          displayName: 'Limit',
          value: 'limit',
        },
      ],
      validation: {
        schema: {
          type: 'string',
          optional: true,
        },
        defaultValue: 'none',
      },
      isFxNotRequired: true,
      fullWidth: true,
    },
    showValues: {
      type: 'toggle',
      displayName: 'Show value of target',
      validation: {
        schema: {
          type: 'boolean',
          optional: true,
        },
        defaultValue: true,
      },
    },
    showPercent: {
      type: 'toggle',
      displayName: 'Show percentage',
      validation: {
        schema: {
          type: 'boolean',
          optional: true,
        },
        defaultValue: true,
      },
    },
    barSize: {
      type: 'switch',
      displayName: 'Bar size',
      options: [
        {
          displayName: 'Thin',
          value: 'thin',
        },
        {
          displayName: 'Default',
          value: 'default',
        },
        {
          displayName: 'Thick',
          value: 'thick',
        },
      ],
      validation: {
        schema: {
          type: 'string',
          optional: true,
        },
        defaultValue: 'default',
      },
      isFxNotRequired: true,
      fullWidth: true,
    },
    listStyle: {
      type: 'switch',
      displayName: 'List style',
      options: [
        {
          displayName: 'Card',
          value: 'card',
        },
        {
          displayName: 'Plain',
          value: 'plain',
        },
      ],
      validation: {
        schema: {
          type: 'string',
          optional: true,
        },
        defaultValue: 'card',
      },
      isFxNotRequired: true,
      fullWidth: true,
    },
    emptyText: {
      type: 'code',
      displayName: 'Empty text',
      validation: {
        schema: {
          type: 'string',
          optional: true,
        },
        defaultValue: 'Nothing to track yet',
      },
    },
    dynamicHeight: {
      type: 'toggle',
      displayName: 'Dynamic height',
      validation: {
        schema: {
          type: 'boolean',
          optional: true,
        },
        defaultValue: true,
      },
      section: 'additionalActions',
    },
    loadingState: {
      type: 'toggle',
      displayName: 'Loading state',
      validation: {
        schema: {
          type: 'boolean',
          optional: true,
        },
        defaultValue: false,
      },
      section: 'additionalActions',
    },
    loadingIndicator: {
      type: 'switch',
      displayName: 'Loading look',
      options: [
        {
          displayName: 'Spinner',
          value: 'spinner',
        },
        {
          displayName: 'Skeleton',
          value: 'skeleton',
        },
      ],
      validation: {
        schema: {
          type: 'string',
          optional: true,
        },
        defaultValue: 'spinner',
      },
      isFxNotRequired: true,
      fullWidth: true,
      section: 'additionalActions',
    },
    visibility: {
      type: 'toggle',
      displayName: 'Visibility',
      validation: {
        schema: {
          type: 'boolean',
          optional: true,
        },
        defaultValue: true,
      },
      section: 'additionalActions',
    },
    collapseWhenHidden: {
      type: 'toggle',
      displayName: 'Collapse when hidden',
      validation: {
        schema: {
          type: 'boolean',
          optional: true,
        },
        defaultValue: false,
      },
      section: 'additionalActions',
    },
    disabledState: {
      type: 'toggle',
      displayName: 'Disable',
      validation: {
        schema: {
          type: 'boolean',
          optional: true,
        },
        defaultValue: false,
      },
      section: 'additionalActions',
    },
    tooltipFormat: {
      type: 'switch',
      displayName: 'Tooltip',
      options: [
        {
          displayName: 'Plain text',
          value: 'plainText',
        },
        {
          displayName: 'Markdown',
          value: 'markdown',
        },
        {
          displayName: 'HTML',
          value: 'html',
        },
      ],
      isFxNotRequired: true,
      defaultValue: {
        value: 'plainText',
      },
      fullWidth: true,
      newLine: true,
      section: 'additionalActions',
    },
    tooltip: {
      type: 'code',
      displayName: 'Tooltip',
      validation: {
        schema: {
          type: 'string',
          optional: true,
        },
      },
      section: 'additionalActions',
      placeholder: 'Enter tooltip text',
      showLabel: false,
    },
  },
  events: {
    onItemClicked: {
      displayName: 'On item clicked',
    },
  },
  styles: {
    boxShadow: {
      type: 'boxShadow',
      displayName: 'Box shadow',
      validation: {
        schema: {
          type: 'union',
          schemas: [
            {
              type: 'string',
            },
            {
              type: 'number',
            },
          ],
          optional: true,
        },
        defaultValue: '0px 0px 0px 0px #00000040',
      },
      accordian: 'Container',
    },
    backgroundColor: {
      type: 'colorSwatches',
      displayName: 'List background',
      validation: {
        schema: {
          type: 'string',
          optional: true,
        },
      },
    },
    borderColor: {
      type: 'colorSwatches',
      displayName: 'Border and divider color',
      validation: {
        schema: {
          type: 'string',
          optional: true,
        },
      },
    },
    titleColor: {
      type: 'colorSwatches',
      displayName: 'Label and value color',
      validation: {
        schema: {
          type: 'string',
          optional: true,
        },
      },
    },
    textColor: {
      type: 'colorSwatches',
      displayName: 'Caption color',
      validation: {
        schema: {
          type: 'string',
          optional: true,
        },
      },
    },
    accentColor: {
      type: 'colorSwatches',
      displayName: 'Bar color (rows without a tone)',
      validation: {
        schema: {
          type: 'string',
          optional: true,
        },
      },
    },
    trackColor: {
      type: 'colorSwatches',
      displayName: 'Bar track color',
      validation: {
        schema: {
          type: 'string',
          optional: true,
        },
      },
    },
    borderRadius: {
      type: 'numberInput',
      displayName: 'List radius',
      validation: {
        schema: {
          type: 'union',
          schemas: [
            {
              type: 'string',
            },
            {
              type: 'number',
            },
          ],
          optional: true,
        },
      },
    },
    titleFontFamily: {
      type: 'select',
      displayName: 'Label typeface',
      options: [
        {
          name: 'Theme font',
          value: 'theme',
        },
        {
          name: 'Sans serif',
          value: 'sans',
        },
        {
          name: 'Serif',
          value: 'serif',
        },
        {
          name: 'Display serif',
          value: 'display',
        },
        {
          name: 'Monospace',
          value: 'mono',
        },
      ],
      validation: {
        schema: {
          type: 'string',
          optional: true,
        },
        defaultValue: 'theme',
      },
    },
  },
  exposedVariables: {
    isVisible: true,
    isLoading: false,
    isDisabled: false,
    selectedItem: {},
    selectedItemId: null,
    selectedItemIndex: null,
  },
  actions: [
    {
      handle: 'setVisibility',
      displayName: 'Set visibility',
      params: [
        {
          handle: 'value',
          displayName: 'Value',
          defaultValue: '{{true}}',
          type: 'toggle',
        },
      ],
    },
    {
      handle: 'setDisable',
      displayName: 'Set disable',
      params: [
        {
          handle: 'value',
          displayName: 'Value',
          defaultValue: '{{true}}',
          type: 'toggle',
        },
      ],
    },
    {
      handle: 'setLoading',
      displayName: 'Set loading',
      params: [
        {
          handle: 'value',
          displayName: 'Value',
          defaultValue: '{{true}}',
          type: 'toggle',
        },
      ],
    },
  ],
  definition: {
    others: {
      showOnDesktop: {
        value: '{{true}}',
      },
      showOnMobile: {
        value: '{{false}}',
      },
    },
    properties: {
      data: {
        value:
          "{{[{ id: 1, label: 'Marketing', spent: 18400, budget: 25000, status: 'On track', note: '12 days left in the quarter' }, { id: 2, label: 'Engineering tools', spent: 9100, budget: 10000, status: 'At risk', note: 'Renewals due in November' }, { id: 3, label: 'Travel', spent: 7600, budget: 6000, status: 'Over budget', note: 'Over by $1,600' }, { id: 4, label: 'Training', spent: 1200, budget: 5000, status: '', note: 'Courses start in November' }]}}",
      },
      labelField: {
        value: 'label',
      },
      valueField: {
        value: 'spent',
      },
      targetField: {
        value: 'budget',
      },
      percentField: {
        value: '',
      },
      captionField: {
        value: 'note',
      },
      statusField: {
        value: 'status',
      },
      valueFormat: {
        value: 'currency',
      },
      currency: {
        value: 'USD',
      },
      idField: {
        value: 'id',
      },
      autoTone: {
        value: 'none',
      },
      showValues: {
        value: '{{true}}',
      },
      showPercent: {
        value: '{{true}}',
      },
      barSize: {
        value: 'default',
      },
      listStyle: {
        value: 'card',
      },
      emptyText: {
        value: 'Nothing to track yet',
      },
      dynamicHeight: {
        value: '{{true}}',
      },
      loadingState: {
        value: '{{false}}',
      },
      loadingIndicator: {
        value: 'spinner',
      },
      visibility: {
        value: '{{true}}',
      },
      collapseWhenHidden: {
        value: '{{false}}',
      },
      disabledState: {
        value: '{{false}}',
      },
      tooltipFormat: {
        value: 'plainText',
      },
      tooltip: {
        value: '',
      },
    },
    events: [],
    styles: {
      boxShadow: {
        value: '0px 0px 0px 0px #00000040',
      },
      titleFontFamily: {
        value: 'theme',
      },
    },
  },
};
