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
    headerBackground: {
      type: 'color',
      displayName: 'Header background',
      validation: {
        schema: { type: 'string' },
        defaultValue: '#375FCF',
      },
      accordian: 'Tabs',
    },
    unselectedText: {
      type: 'color',
      displayName: 'Unselected text',
      validation: {
        schema: { type: 'string' },
        defaultValue: '#375FCF',
      },
      accordian: 'Tabs',
    },
    selectedText: {
      type: 'color',
      displayName: 'Selected text',
      validation: {
        schema: { type: 'string' },
        defaultValue: '#375FCF',
      },
      accordian: 'Tabs',
    },
    hoverBackground: {
      type: 'color',
      displayName: 'Hover Background',
      validation: {
        schema: { type: 'string' },
        defaultValue: '#375FCF',
      },
      accordian: 'Tabs',
    },
    unselectedIcon: {
      type: 'color',
      displayName: 'Unselected Icon',
      validation: {
        schema: { type: 'string' },
        defaultValue: '#CCD1D5',
      },
      accordian: 'Tabs',
    },
    selectedIcon: {
      type: 'color',
      displayName: 'Selected Icon',
      validation: {
        schema: { type: 'string' },
        defaultValue: '#CCD1D5',
      },
      accordian: 'Tabs',
    },
    accent: {
      type: 'color',
      displayName: 'Accent',
      validation: {
        schema: { type: 'string' },
        defaultValue: '#CCD1D5',
      },
      accordian: 'Tabs',
    },
    // highlightColor: {
    //   type: 'color',
    //   displayName: 'Highlight color',
    //   validation: {
    //     schema: { type: 'string' },
    //     defaultValue: '#375FCF',
    //   },
    //   accordian: 'Tabs',
    // },
    tabWidth: {
      type: 'select',
      displayName: 'Tab width',
      options: [
        { name: 'Auto', value: 'auto' },
        { name: 'Equally split', value: 'split' },
      ],
      accordian: 'Tabs',
    },
    divider: {
      type: 'color',
      displayName: 'Divider',
      validation: {
        schema: { type: 'string' },
        defaultValue: '#CCD1D5',
      },
      accordian: 'Tabs',
    },
    transition: {
      type: 'select',
      displayName: 'Transition',
      options: [
        { name: 'Slide', value: 'slide' },
        { name: 'None', value: 'none' },
      ],
      accordian: 'Tabs',
    },
    border: {
      type: 'color',
      displayName: 'Border',
      validation: {
        schema: { type: 'string' },
        defaultValue: '#375FCF',
      },
      accordian: 'Container',
    },
    borderRadius: {
      type: 'numberInput',
      displayName: 'Border radius',
      validation: {
        validation: { schema: { type: 'union', schemas: [{ type: 'string' }, { type: 'number' }] } },
        defaultValue: false,
      },
      accordian: 'Container',
    },
    boxShadow: {
      type: 'boxShadow',
      displayName: 'Box shadow',
      validation: { schema: { type: 'union', schemas: [{ type: 'string' }, { type: 'number' }] } },
      accordian: 'Container',
      conditionallyRender: {
        key: 'type',
        value: 'primary',
      },
    },
    padding: {
      type: 'switch',
      displayName: 'Padding',
      validation: { schema: { type: 'string' } },
      options: [
        { displayName: 'Default', value: 'default' },
        { displayName: 'None', value: 'none' },
      ],
      accordian: 'Container',
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
          displayName: 'Tab',
          type: 'select',
          isDynamicOpiton: true,
          optionsGetter: 'component.definition.properties.tabItems.value',
        },
        {
          handle: 'value',
          type: 'toggle',
          displayName: 'Value',
          defaultValue: '{{false}}',
        },
      ],
    },
    {
      handle: 'setTabLoading',
      displayName: 'Set Tab Loading',
      params: [
        {
          handle: 'tabId',
          displayName: 'Tab',
          type: 'select',
          isDynamicOpiton: true,
          optionsGetter: 'component.definition.properties.tabItems.value',
        },
        {
          handle: 'value',
          type: 'toggle',
          displayName: 'Value',
          defaultValue: '{{false}}',
        },
      ],
    },
    {
      handle: 'setTabVisibility',
      displayName: 'Set Tab visibility',
      params: [
        {
          handle: 'tabId',
          displayName: 'Tab',
          type: 'select',
          isDynamicOpiton: true,
          optionsGetter: 'component.definition.properties.tabItems.value',
        },
        {
          handle: 'value',
          type: 'toggle',
          displayName: 'Value',
          defaultValue: '{{false}}',
        },
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
            id: 't0',
            title: 'Tab 1',
            icon: { value: 'IconHome2' },
            iconVisibility: { value: false },
            loading: { value: false },
            disable: { value: false },
            visible: { value: true },
          },
          {
            id: 't1',
            title: 'Tab 2',
            icon: { value: 'IconHome2' },
            iconVisibility: { value: false },
            loading: { value: false },
            disable: { value: false },
            visible: { value: true },
          },
          {
            id: 't2',
            title: 'Tab 3',
            icon: { value: 'IconHome2' },
            iconVisibility: { value: false },
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
      headerBackground: { value: '#FFFFFF' },
      unselectedText: { value: '#6A727C' },
      selectedText: { value: '#1B1F24' },
      highlightColor: { value: '#375FCF' },
      hoverBackground: { value: '#E4E6E8' },
      unselectedIcon: { value: '#CCD1D5' },
      selectedIcon: { value: '#CCD1D5' },
      accent: { value: '#4368E3' },
      tabWidth: { value: 'auto' },
      divider: { value: '#CCD1D5' },
      transition: { value: 'none' },
      borderRadius: { value: '{{6}}' },
      border: { value: '#CCD1D5' },
      boxShadow: { value: '0px 0px 0px 0px #00000090' },
      padding: { value: 'none' },
    },
  },
};
