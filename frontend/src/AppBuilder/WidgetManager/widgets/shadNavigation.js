// GENERATED from WidgetManager/shadcnSource.actions.js by scripts-shadcn-literals.mjs. Do not edit by hand.
export const shadNavigationConfig = {
  name: 'ShadNavigation',
  displayName: 'Navigation',
  description:
    "shadcn/ui app navigation: a vertical sidebar list or a horizontal top bar from items [{ label, value, icon?: 'IconHome', badge?, disabled?, group? (sidebar heading), children?: [{ label, value }] }] (children open as a dropdown in the top bar, a nested list in the sidebar). variant pills, underline or ghost; defaultValue is the active item; onSelect fires on click with exposed value and activeItem { label, value, parentLabel, parentValue } (wire page switches here); setActive(value). Item height 36px; a top bar is 40px tall, a sidebar fills the widget's height",
  component: 'ShadNavigation',
  defaultSize: {
    width: 9,
    height: 320,
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
    items: {
      type: 'code',
      displayName: 'Items',
      validation: {
        schema: {
          type: 'array',
        },
        defaultValue: [],
      },
      placeholder:
        "[{ label: 'Dashboard', value: 'dashboard', icon: 'IconLayoutDashboard' }, { label: 'Orders', value: 'orders', badge: 12 }]",
    },
    defaultValue: {
      type: 'code',
      displayName: 'Active item (value)',
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
            {
              type: 'boolean',
            },
            {
              type: 'array',
            },
            {
              type: 'object',
            },
          ],
        },
        defaultValue: '',
      },
    },
    orientation: {
      type: 'switch',
      displayName: 'Orientation',
      options: [
        {
          displayName: 'Vertical',
          value: 'vertical',
        },
        {
          displayName: 'Horizontal',
          value: 'horizontal',
        },
      ],
      validation: {
        schema: {
          type: 'string',
        },
        defaultValue: 'vertical',
      },
      isFxNotRequired: true,
      fullWidth: true,
    },
    variant: {
      type: 'switch',
      displayName: 'Variant',
      options: [
        {
          displayName: 'Pills',
          value: 'pills',
        },
        {
          displayName: 'Underline',
          value: 'underline',
        },
        {
          displayName: 'Ghost',
          value: 'ghost',
        },
      ],
      validation: {
        schema: {
          type: 'string',
        },
        defaultValue: 'pills',
      },
      isFxNotRequired: true,
      fullWidth: true,
    },
    size: {
      type: 'switch',
      displayName: 'Size',
      options: [
        {
          displayName: 'Sm',
          value: 'sm',
        },
        {
          displayName: 'Default',
          value: 'default',
        },
        {
          displayName: 'Lg',
          value: 'lg',
        },
      ],
      validation: {
        schema: {
          type: 'string',
        },
        defaultValue: 'default',
      },
      isFxNotRequired: true,
      fullWidth: true,
    },
    align: {
      type: 'switch',
      displayName: 'Align (top bar)',
      options: [
        {
          displayName: 'Start',
          value: 'start',
        },
        {
          displayName: 'Center',
          value: 'center',
        },
        {
          displayName: 'End',
          value: 'end',
        },
        {
          displayName: 'Stretch',
          value: 'stretch',
        },
      ],
      validation: {
        schema: {
          type: 'string',
        },
        defaultValue: 'start',
      },
      isFxNotRequired: true,
      fullWidth: true,
    },
    collapsed: {
      type: 'toggle',
      displayName: 'Collapsed (icon-only sidebar)',
      validation: {
        schema: {
          type: 'boolean',
        },
        defaultValue: false,
      },
    },
    loadingState: {
      type: 'toggle',
      displayName: 'Loading state',
      validation: {
        schema: {
          type: 'boolean',
        },
        defaultValue: false,
      },
      section: 'additionalActions',
    },
    visibility: {
      type: 'toggle',
      displayName: 'Visibility',
      validation: {
        schema: {
          type: 'boolean',
        },
        defaultValue: true,
      },
      section: 'additionalActions',
    },
    disabledState: {
      type: 'toggle',
      displayName: 'Disable',
      validation: {
        schema: {
          type: 'boolean',
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
        },
      },
      section: 'additionalActions',
      placeholder: 'Enter tooltip text',
      showLabel: false,
    },
  },
  events: {
    onSelect: {
      displayName: 'On select',
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
        },
        defaultValue: '0px 0px 0px 0px #00000040',
      },
      accordian: 'Container',
    },
    backgroundColor: {
      type: 'colorSwatches',
      displayName: 'Background',
      validation: {
        schema: {
          type: 'string',
        },
      },
    },
    textColor: {
      type: 'colorSwatches',
      displayName: 'Item text color',
      validation: {
        schema: {
          type: 'string',
        },
      },
    },
    iconColor: {
      type: 'colorSwatches',
      displayName: 'Item icon color',
      validation: {
        schema: {
          type: 'string',
        },
      },
    },
    hoverBackgroundColor: {
      type: 'colorSwatches',
      displayName: 'Item hover background',
      validation: {
        schema: {
          type: 'string',
        },
      },
    },
    activeBackgroundColor: {
      type: 'colorSwatches',
      displayName: 'Active item background',
      validation: {
        schema: {
          type: 'string',
        },
      },
    },
    activeTextColor: {
      type: 'colorSwatches',
      displayName: 'Active item text color',
      validation: {
        schema: {
          type: 'string',
        },
      },
    },
    indicatorColor: {
      type: 'colorSwatches',
      displayName: 'Active indicator color (underline)',
      validation: {
        schema: {
          type: 'string',
        },
      },
    },
    badgeBackgroundColor: {
      type: 'colorSwatches',
      displayName: 'Badge background',
      validation: {
        schema: {
          type: 'string',
        },
      },
    },
    badgeTextColor: {
      type: 'colorSwatches',
      displayName: 'Badge text color',
      validation: {
        schema: {
          type: 'string',
        },
      },
    },
    groupLabelColor: {
      type: 'colorSwatches',
      displayName: 'Group heading color',
      validation: {
        schema: {
          type: 'string',
        },
      },
    },
    separatorColor: {
      type: 'colorSwatches',
      displayName: 'Separator color',
      validation: {
        schema: {
          type: 'string',
        },
      },
    },
    itemRadius: {
      type: 'numberInput',
      displayName: 'Item radius',
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
        },
      },
    },
  },
  exposedVariables: {
    isVisible: true,
    isLoading: false,
    isDisabled: false,
    value: '',
    activeItem: null,
    isCollapsed: false,
  },
  actions: [
    {
      handle: 'setActive',
      displayName: 'Set active item',
      params: [
        {
          handle: 'value',
          displayName: 'Value',
          defaultValue: '',
        },
      ],
    },
    {
      handle: 'setCollapsed',
      displayName: 'Set collapsed',
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
      items: {
        value:
          "{{[{ label: 'Dashboard', value: 'dashboard', icon: 'IconLayoutDashboard' }, { label: 'Orders', value: 'orders', icon: 'IconShoppingCart', badge: 12 }, { label: 'Customers', value: 'customers', icon: 'IconUsers' }, { label: 'Reports', value: 'reports', icon: 'IconChartBar', children: [{ label: 'Sales', value: 'sales' }, { label: 'Traffic', value: 'traffic' }] }, { label: 'Settings', value: 'settings', icon: 'IconSettings', group: 'Workspace' }]}}",
      },
      defaultValue: {
        value: 'dashboard',
      },
      orientation: {
        value: 'vertical',
      },
      variant: {
        value: 'pills',
      },
      size: {
        value: 'default',
      },
      align: {
        value: 'start',
      },
      collapsed: {
        value: '{{false}}',
      },
      loadingState: {
        value: '{{false}}',
      },
      visibility: {
        value: '{{true}}',
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
