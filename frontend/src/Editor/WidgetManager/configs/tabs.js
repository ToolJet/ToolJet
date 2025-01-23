export const tabsConfig = {
  name: 'Tabs',
  displayName: 'Tabs',
  description: 'Organize content in tabs',
  defaultSize: {
    width: 30,
    height: 300,
  },
  defaultChildren: [
    {
      componentName: 'Image',
      layout: {
        top: 60,
        left: 17,
        height: 100,
        width: 7,
      },
      tab: 0,
      properties: ['source'],
      defaultValue: {
        source: 'https://uploads-ssl.webflow.com/6266634263b9179f76b2236e/62666392f32677b5cb2fb84b_logo.svg',
      },
    },
    {
      componentName: 'Text',
      layout: {
        top: 100,
        left: 5,
        height: 50,
        width: 34,
      },
      tab: 1,
      properties: ['text'],
      defaultValue: {
        text: 'Open-source low-code framework to build & deploy internal tools within minutes.',
      },
    },
    {
      componentName: 'Table',
      layout: {
        top: 0,
        left: 1,
        width: 41,
        height: 250,
      },
      tab: 2,
    },
  ],
  component: 'Tabs',
  others: {
    showOnDesktop: { type: 'toggle', displayName: 'Show on desktop' },
    showOnMobile: { type: 'toggle', displayName: 'Show on mobile' },
  },
  properties: {
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
      validation: {
        schema: {
          type: 'boolean',
        },
        defaultValue: false,
      },
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
    visibility: {
      type: 'toggle',
      displayName: 'Visibility',
      validation: {
        schema: {
          type: 'boolean',
        },
        defaultValue: false,
      },
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
      tabs: {
        value:
          "{{[ \n\t\t{ title: 'Home 1', id: '0' }, \n\t\t{ title: 'Profile', id: '1' }, \n\t\t{ title: 'Settings', id: '2' } \n ]}}",
      },
      defaultTab: { value: '0' },
      hideTabs: { value: false },
      renderOnlyActiveTab: { value: false },
      loadingState: { value: `{{false}}` },
      visibility: { value: '{{true}}' },
      disabledState: { value: '{{false}}' },
    },
    events: [],
    styles: {
      highlightColor: { value: '#375FCF' },
      visibility: { value: '{{true}}' },
      disabledState: { value: '{{false}}' },
      tabWidth: { value: 'auto' },
    },
  },
};
