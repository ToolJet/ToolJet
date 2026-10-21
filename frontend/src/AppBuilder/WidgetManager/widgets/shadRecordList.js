export const shadRecordListConfig = {
  name: 'ShadRecordList',
  displayName: 'Record list',
  description:
    "List of records as two-line rows, for a recent-orders, people, tickets or activity panel beside a chart or a table: an avatar (avatarField: an image URL, else the initials of that field's text, else of the title), the title (titleField), a meta line under it (metaFields, a comma list of field specs joined with ' · ': 'city', 'total|currency', 'due|date:Due {}' (value in a label), 'seats:Seats' (label first); formats number, currency, percent, compact, date, datetime), a progress bar under the meta line (progressField: a percentage 0 to 100, as 42 or '42%'; onboarding, a project's completion), a status chip on the right (statusField, toned by its words: Paid green, Pending amber, Overdue red, Open blue) and a trailing value (valueField in valueFormat: currency in currency, date, number, ...). density compact, default or comfortable; showDividers; listStyle 'card' (bordered panel) or 'plain'; avatarShape circle or rounded. A click selects the row (selectedItem, selectedItemId, selectedItemIndex; onItemClicked). Draws 100 rows and a Show more button. Height: grows with its rows (about 60px a row at default density)",
  component: 'ShadRecordList',
  defaultSize: {
    width: 20,
    height: 340,
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
      placeholder: "[{ id: 1, customer: 'Harbor Bistro', contact: 'Maya Chen', status: 'Paid', total: 1240 }]",
    },
    titleField: {
      type: 'code',
      displayName: 'Title field',
      validation: {
        schema: {
          type: 'string',
          optional: true,
        },
        defaultValue: 'customer',
      },
    },
    avatarField: {
      type: 'code',
      displayName: 'Avatar field (image URL or a name; empty uses the title)',
      validation: {
        schema: {
          type: 'string',
          optional: true,
        },
        defaultValue: '',
      },
    },
    metaFields: {
      type: 'code',
      displayName: "Meta fields (comma list; 'total|currency', 'due|date:Due {}')",
      validation: {
        schema: {
          type: 'union',
          schemas: [
            {
              type: 'array',
            },
            {
              type: 'string',
            },
          ],
          optional: true,
        },
        defaultValue: '',
      },
    },
    statusField: {
      type: 'code',
      displayName: 'Status field (a chip toned by its words)',
      validation: {
        schema: {
          type: 'string',
          optional: true,
        },
        defaultValue: '',
      },
    },
    progressField: {
      type: 'code',
      displayName: 'Progress field (a percentage, 0 to 100)',
      validation: {
        schema: {
          type: 'string',
          optional: true,
        },
        defaultValue: '',
      },
    },
    valueField: {
      type: 'code',
      displayName: 'Trailing value field',
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
      displayName: 'Trailing value format',
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
        {
          name: 'Date',
          value: 'date',
        },
        {
          name: 'Date and time',
          value: 'datetime',
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
    showAvatar: {
      type: 'toggle',
      displayName: 'Show avatar',
      validation: {
        schema: {
          type: 'boolean',
          optional: true,
        },
        defaultValue: true,
      },
    },
    avatarShape: {
      type: 'switch',
      displayName: 'Avatar shape',
      options: [
        {
          displayName: 'Circle',
          value: 'circle',
        },
        {
          displayName: 'Rounded',
          value: 'rounded',
        },
      ],
      validation: {
        schema: {
          type: 'string',
          optional: true,
        },
        defaultValue: 'circle',
      },
      isFxNotRequired: true,
      fullWidth: true,
    },
    density: {
      type: 'switch',
      displayName: 'Density',
      options: [
        {
          displayName: 'Compact',
          value: 'compact',
        },
        {
          displayName: 'Default',
          value: 'default',
        },
        {
          displayName: 'Comfortable',
          value: 'comfortable',
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
    showDividers: {
      type: 'toggle',
      displayName: 'Show dividers',
      validation: {
        schema: {
          type: 'boolean',
          optional: true,
        },
        defaultValue: true,
      },
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
    highlightSelected: {
      type: 'toggle',
      displayName: 'Highlight the selected row',
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
      displayName: 'Empty text',
      validation: {
        schema: {
          type: 'string',
          optional: true,
        },
        defaultValue: 'Nothing here yet',
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
      displayName: 'Title and value color',
      validation: {
        schema: {
          type: 'string',
          optional: true,
        },
      },
    },
    textColor: {
      type: 'colorSwatches',
      displayName: 'Meta line color',
      validation: {
        schema: {
          type: 'string',
          optional: true,
        },
      },
    },
    accentColor: {
      type: 'colorSwatches',
      displayName: 'Selected row accent',
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
      displayName: 'Title typeface',
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
          "{{[{ id: 1, customer: 'Harbor Bistro', contact: 'Maya Chen', due: '2026-10-14', status: 'Paid', total: 1240 }, { id: 2, customer: 'Northwind Florists', contact: 'Owen Hart', due: '2026-10-16', status: 'Pending', total: 386.5 }, { id: 3, customer: 'Juniper Dental', contact: 'Priya Nair', due: '2026-10-09', status: 'Overdue', total: 2915 }, { id: 4, customer: 'Copper Kettle Cafe', contact: 'Leo Martins', due: '2026-10-21', status: 'Draft', total: 742 }]}}",
      },
      titleField: {
        value: 'customer',
      },
      avatarField: {
        value: '',
      },
      metaFields: {
        value: 'contact, due|date:Due {}',
      },
      statusField: {
        value: 'status',
      },
      progressField: {
        value: '',
      },
      valueField: {
        value: 'total',
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
      showAvatar: {
        value: '{{true}}',
      },
      avatarShape: {
        value: 'circle',
      },
      density: {
        value: 'default',
      },
      showDividers: {
        value: '{{true}}',
      },
      listStyle: {
        value: 'card',
      },
      highlightSelected: {
        value: '{{true}}',
      },
      emptyText: {
        value: 'Nothing here yet',
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
