export const tabsConfig = {
  name: 'Tabs',
  displayName: 'Tabs',
  description: 'Organize content in tabs',
  defaultSize: {
    width: 30,
    height: 300,
  },
  component: 'Tabs',
  others: {
    showOnDesktop: { type: 'toggle', displayName: 'Show on desktop' },
    showOnMobile: { type: 'toggle', displayName: 'Show on mobile' },
  },
  properties: {
    useDynamicOptions: {
      type: 'toggle',
      displayName: 'Dynamic options',
      validation: {
        schema: { type: 'boolean' },
        defaultValue: false,
      },
    },
    loadingState: {
      type: 'toggle',
      displayName: 'Loading state',
      section: 'additionalActions',
      validation: {
        schema: { type: 'boolean' },
        defaultValue: false,
      },
    },
    visibility: {
      type: 'toggle',
      displayName: 'Visibility',
      section: 'additionalActions',
      validation: {
        schema: { type: 'boolean' },
        defaultValue: true,
      },
    },
    disabledState: {
      type: 'toggle',
      displayName: 'Disable',
      section: 'additionalActions',
      validation: {
        schema: { type: 'boolean' },
        defaultValue: false,
      },
    },
    tabs: {
      type: 'code',
      displayName: 'Tabs',
      validation: {
        schema: {
          type: 'array',
          element: {
            type: 'object',
            object: {
              id: {
                type: 'union',
                schemas: [{ type: 'string' }, { type: 'number' }],
              },
            },
          },
        },
        defaultValue: [
          { title: 'Home', id: '0' },
          { title: 'Profile', id: '1' },
          { title: 'Settings', id: '2' },
        ],
      },
    },
    defaultTab: {
      type: 'code',
      displayName: 'Default tab',
      validation: {
        schema: {
          type: 'union',
          schemas: [{ type: 'string' }, { type: 'number' }],
        },
        defaultValue: '0',
      },
    },
    hideTabs: {
      type: 'toggle',
      displayName: 'Hide tabs',
      section: 'additionalActions',
      validation: {
        schema: {
          type: 'boolean',
        },
        defaultValue: false,
      },
    },
    renderOnlyActiveTab: {
      type: 'toggle',
      displayName: 'Render only active tab',
      section: 'additionalActions',
      validation: {
        schema: {
          type: 'boolean',
        },
        defaultValue: false,
      },
    },
    tooltip: {
      type: 'code',
      displayName: 'Tooltip',
      validation: { schema: { type: 'string' }, defaultValue: '' },
      section: 'additionalActions',
      placeholder: 'Enter tooltip text',
    },
  },
  events: { onTabSwitch: { displayName: 'On tab switch' } },
  styles: {
    highlightColor: {
      type: 'color',
      displayName: 'Highlight color',
      validation: {
        schema: { type: 'string' },
        defaultValue: '#375FCF',
      },
    },
    tabWidth: {
      type: 'select',
      displayName: 'Tab width',
      options: [
        { name: 'Auto', value: 'auto' },
        { name: 'Equally split', value: 'split' },
      ],
    },
  },
  actions: [
    {
      handle: 'setTab',
      displayName: 'Set current tab',
      params: [
        {
          handle: 'id',
          displayName: 'Id',
        },
      ],
    },
    {
      handle: 'setVisibility',
      displayName: 'Set visibility',
      params: [{ handle: 'setVisibility', displayName: 'Value', defaultValue: '{{false}}', type: 'toggle' }],
    },
    {
      handle: 'setLoading',
      displayName: 'Set disable',
      params: [{ handle: 'setLoading', displayName: 'Value', defaultValue: '{{false}}', type: 'toggle' }],
    },
    {
      handle: 'setLoading',
      displayName: 'Set loading',
      params: [{ handle: 'setLoading', displayName: 'Value', defaultValue: '{{false}}', type: 'toggle' }],
    },
    {
      handle: 'setTabDisable',
      displayName: 'Set Tab disable',
      params: [
        {
          handle: 'tabId',
          displayName: 'Id',
          type: 'select',
          isDynamicOpiton: true,
          optionsGetter: 'component.definition.properties.tabItems.value',
        },
        {
          handle: 'value',
          type: 'toggle',
          displayName: 'Value',
          defaultValue: '{{false}}'
        },
      ],
    },
    {
      handle: 'setTabLoading',
      displayName: 'Set Tab Loading',
      params: [
        {
          handle: 'tabId',
          displayName: 'Id',
          type: 'select',
          isDynamicOpiton: true,
          optionsGetter: 'component.definition.properties.tabItems.value',
        },
        {
          handle: 'value',
          type: 'toggle',
          displayName: 'Value',
          defaultValue: '{{false}}'
        },
      ],
    },
    {
      handle: 'setTabVisibility',
      displayName: 'Set Tab visibility',
      params: [
        {
          handle: 'tabId',
          displayName: 'Id',
          type: 'select',
          isDynamicOpiton: true,
          optionsGetter: 'component.definition.properties.tabItems.value',
        },
        {
          handle: 'value',
          type: 'toggle',
          displayName: 'Value',
          defaultValue: '{{false}}'
        }
      ],
    },
  ],
  exposedVariables: {
    currentTab: '',
    isVisible: true,
    isDisabled: false,
    isLoading: false,
  },
  definition: {
    others: {
      showOnDesktop: { value: '{{true}}' },
      showOnMobile: { value: '{{false}}' },
    },
    properties: {
      useDynamicOptions: { value: '{{false}}' },
      tabs: {
        value:
          "{{[ \n\t\t{ title: 'Home', id: '0' }, \n\t\t{ title: 'Profile', id: '1' }, \n\t\t{ title: 'Settings', id: '2' } \n ]}}",
      },
      tabItems: {
        value: [
          {
            id: '0',
            title: 'Tab 1',
            icon: { value: 'IconHome2' },
            iconVisibility: { value: true },
            loading: { value: false },
            disable: { value: false },
            visible: { value: true },
          },
          {
            id: '1',
            title: 'Tab 2',
            icon: { value: 'IconHome2' },
            iconVisibility: { value: true },
            loading: { value: false },
            disable: { value: false },
            visible: { value: true },
          },
          {
            id: '2',
            title: 'Tab 3',
            icon: { value: 'IconHome2' },
            iconVisibility: { value: true },
            loading: { value: false },
            disable: { value: false },
            visible: { value: true },
          },
        ],
      },
      defaultTab: { value: '0' },
      hideTabs: { value: false },
      renderOnlyActiveTab: { value: false },
      loadingState: { value: `{{false}}` },
      visibility: { value: '{{true}}' },
      disabledState: { value: '{{false}}' },
      tooltip: { value: '' },
    },
    events: [],
    styles: {
      highlightColor: { value: '#375FCF' },
      tabWidth: { value: 'auto' },
    },
  },
};
