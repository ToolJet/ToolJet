export const shadKeyValueConfig = {
  name: 'ShadKeyValue',
  displayName: 'Key-value list',
  description:
    "Description list for a record's details: data is an object ({ Status: 'Active', Owner: 'Ada' }) or an array of { label, value, type?, format? } with type text, number, currency, date, badge, link or boolean (format: a date format or { currency, decimalPlaces, prefix, suffix }); columns 1 to 4; layout 'inline' (label beside the value, labelWidth) or 'stacked'; dividers; emptyText for blanks; currency, dateFormat and badgeColors defaults; allowCopy. Height: about 41px per row inline, 69px stacked (per column when columns > 1)",
  component: 'ShadKeyValue',
  defaultSize: {
    width: 14,
    height: 260,
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
      displayName: 'Data (object or array)',
      validation: {
        schema: {
          type: 'union',
          schemas: [
            {
              type: 'array',
            },
            {
              type: 'object',
            },
          ],
          optional: true,
        },
        defaultValue: {},
      },
      placeholder: "{ Status: 'Active' } or [{ label: 'Amount', value: 1250, type: 'currency' }]",
    },
    columns: {
      minValue: 1,
      maxValue: 4,
      note: 'As many as fit the width: about 300px a column side by side, 160px with the label above.',
      type: 'switch',
      displayName: 'Columns',
      options: [
        {
          displayName: '1',
          value: '1',
        },
        {
          displayName: '2',
          value: '2',
        },
        {
          displayName: '3',
          value: '3',
        },
        {
          displayName: '4',
          value: '4',
        },
      ],
      validation: {
        schema: {
          type: 'string',
          optional: true,
        },
        defaultValue: '1',
      },
      isFxNotRequired: true,
      fullWidth: true,
    },
    layout: {
      type: 'switch',
      displayName: 'Layout',
      options: [
        {
          displayName: 'Label above',
          value: 'stacked',
        },
        {
          displayName: 'Side by side',
          value: 'inline',
        },
      ],
      validation: {
        schema: {
          type: 'string',
          optional: true,
        },
        defaultValue: 'inline',
      },
      isFxNotRequired: true,
      fullWidth: true,
    },
    labelWidth: {
      conditionallyRender: { key: 'layout', value: 'inline' },
      type: 'code',
      displayName: 'Label width (side by side; px or %)',
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
        defaultValue: '40%',
      },
    },
    dividers: {
      type: 'toggle',
      displayName: 'Dividers',
      validation: {
        schema: {
          type: 'boolean',
          optional: true,
        },
        defaultValue: true,
      },
    },
    emptyText: {
      type: 'code',
      displayName: 'Empty value text',
      validation: {
        schema: {
          type: 'string',
          optional: true,
        },
        defaultValue: '—',
      },
    },
    typedRowFormats: {
      type: 'sectionSubHeader',
      displayName: 'Formats for typed rows',
    },
    currency: {
      note: "Rows of type currency (a row's own currency wins).",
      type: 'code',
      displayName: 'Currency (currency rows)',
      validation: {
        schema: {
          type: 'string',
          optional: true,
        },
        defaultValue: 'USD',
      },
    },
    locale: {
      note: 'Rows of type number, currency, date and datetime.',
      type: 'code',
      displayName: 'Number locale',
      validation: {
        schema: {
          type: 'string',
          optional: true,
        },
        defaultValue: 'en-US',
      },
    },
    dateFormat: {
      note: 'Rows of type date and datetime.',
      type: 'code',
      displayName: 'Date format (date rows)',
      validation: {
        schema: {
          type: 'string',
          optional: true,
        },
        defaultValue: 'DD MMM YYYY',
      },
    },
    badgeColors: {
      note: 'Rows of type badge: a value to its colour.',
      type: 'code',
      displayName: 'Badge colours by value',
      validation: {
        schema: {
          type: 'object',
          optional: true,
        },
        defaultValue: {},
      },
      placeholder: "{ Active: '#16a34a' }",
    },
    allowCopy: {
      type: 'toggle',
      displayName: 'Copy button on hover',
      validation: {
        schema: {
          type: 'boolean',
          optional: true,
        },
        defaultValue: false,
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
    onFieldClick: {
      displayName: 'On field click',
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
    labelColor: {
      type: 'colorSwatches',
      displayName: 'Label color',
      validation: {
        schema: {
          type: 'string',
          optional: true,
        },
      },
    },
    valueColor: {
      type: 'colorSwatches',
      displayName: 'Value color',
      validation: {
        schema: {
          type: 'string',
          optional: true,
        },
      },
    },
    dividerColor: {
      type: 'colorSwatches',
      displayName: 'Divider color',
      validation: {
        schema: {
          type: 'string',
          optional: true,
        },
      },
    },
    linkColor: {
      type: 'colorSwatches',
      displayName: 'Link color',
      validation: {
        schema: {
          type: 'string',
          optional: true,
        },
      },
    },
  },
  exposedVariables: {
    isVisible: true,
    isLoading: false,
    isDisabled: false,
    data: [],
    lastClickedField: {},
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
          "{{[{ label: 'Customer', value: 'Ada Lovelace' }, { label: 'Email', value: 'ada@example.com', type: 'link' }, { label: 'Status', value: 'Active', type: 'badge' }, { label: 'Plan', value: 'Pro' }, { label: 'Amount', value: 1250, type: 'currency' }, { label: 'Renews', value: '2026-11-14', type: 'date' }]}}",
      },
      columns: {
        value: '1',
      },
      layout: {
        value: 'inline',
      },
      labelWidth: {
        value: '40%',
      },
      dividers: {
        value: '{{true}}',
      },
      emptyText: {
        value: '—',
      },
      currency: {
        value: 'USD',
      },
      locale: {
        value: 'en-US',
      },
      dateFormat: {
        value: 'DD MMM YYYY',
      },
      badgeColors: {
        value: "{{{ Active: '#16a34a' }}}",
      },
      allowCopy: {
        value: '{{false}}',
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
    },
  },
};
