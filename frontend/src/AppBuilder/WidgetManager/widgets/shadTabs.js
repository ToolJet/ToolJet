// GENERATED from WidgetManager/shadcnSource.layout.js by scripts-shadcn-literals.mjs. Do not edit by hand.
export const shadTabsConfig = {
  name: 'ShadTabs',
  displayName: 'Tabs',
  description:
    'shadcn/ui tabs: a container with one canvas per tab (parent the tab content with slot_name tab-<id>). Variants: pills (shadcn default), underline, or steps (a wizard with Back/Next/Finish buttons)',
  component: 'ShadTabs',
  defaultSize: {
    width: 30,
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
    useDynamicOptions: {
      type: 'toggle',
      displayName: 'Dynamic options',
      validation: {
        schema: {
          type: 'boolean',
        },
        defaultValue: false,
      },
    },
    tabs: {
      type: 'code',
      displayName: 'Tabs',
      validation: {
        schema: {
          type: 'array',
        },
        defaultValue: [],
      },
      placeholder: "[{ id: 'overview', title: 'Overview' }, { id: 'activity', title: 'Activity' }]",
    },
    defaultTab: {
      type: 'code',
      displayName: 'Default tab',
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
        defaultValue: 't0',
      },
    },
    variant: {
      type: 'switch',
      displayName: 'Style',
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
          displayName: 'Wizard',
          value: 'steps',
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
    tabsAlign: {
      type: 'switch',
      displayName: 'Tab alignment',
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
          displayName: 'Fill',
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
    scrollToTopOnTabSwitch: {
      type: 'toggle',
      displayName: 'Scroll to top on tab switch',
      validation: {
        schema: {
          type: 'boolean',
        },
        defaultValue: false,
      },
    },
    showStepNav: {
      type: 'toggle',
      displayName: 'Wizard: Back and Next buttons',
      validation: {
        schema: {
          type: 'boolean',
        },
        defaultValue: true,
      },
    },
    nextLabel: {
      type: 'code',
      displayName: 'Wizard: Next label',
      validation: {
        schema: {
          type: 'string',
        },
        defaultValue: 'Next',
      },
    },
    backLabel: {
      type: 'code',
      displayName: 'Wizard: Back label',
      validation: {
        schema: {
          type: 'string',
        },
        defaultValue: 'Back',
      },
    },
    finishLabel: {
      type: 'code',
      displayName: 'Wizard: Finish label',
      validation: {
        schema: {
          type: 'string',
        },
        defaultValue: 'Finish',
      },
    },
    linearSteps: {
      type: 'toggle',
      displayName: 'Wizard: steps in order only',
      validation: {
        schema: {
          type: 'boolean',
        },
        defaultValue: true,
      },
    },
    dynamicHeight: {
      type: 'toggle',
      displayName: 'Dynamic height',
      validation: {
        schema: {
          type: 'boolean',
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
    onTabSwitch: {
      displayName: 'On tab switch',
    },
    onFinish: {
      displayName: 'On finish (wizard)',
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
    accentColor: {
      type: 'colorSwatches',
      displayName: 'Accent (active step, focus ring)',
      validation: {
        schema: {
          type: 'string',
        },
      },
    },
    tabListBackground: {
      type: 'colorSwatches',
      displayName: 'Tab bar background',
      validation: {
        schema: {
          type: 'string',
        },
      },
    },
    tabTextColor: {
      type: 'colorSwatches',
      displayName: 'Tab text color',
      validation: {
        schema: {
          type: 'string',
        },
      },
    },
    activeTabTextColor: {
      type: 'colorSwatches',
      displayName: 'Active tab text color',
      validation: {
        schema: {
          type: 'string',
        },
      },
    },
    activeTabBackground: {
      type: 'colorSwatches',
      displayName: 'Active tab background (pills)',
      validation: {
        schema: {
          type: 'string',
        },
      },
    },
    indicatorColor: {
      type: 'colorSwatches',
      displayName: 'Active tab indicator (underline)',
      validation: {
        schema: {
          type: 'string',
        },
      },
    },
    panelBackground: {
      type: 'colorSwatches',
      displayName: 'Panel background',
      validation: {
        schema: {
          type: 'string',
        },
      },
    },
    borderColor: {
      type: 'colorSwatches',
      displayName: 'Border color',
      validation: {
        schema: {
          type: 'string',
        },
      },
    },
    borderRadius: {
      type: 'numberInput',
      displayName: 'Radius',
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
    tabFontSize: {
      type: 'numberInput',
      displayName: 'Tab font size',
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
    showBorder: {
      type: 'toggle',
      displayName: 'Border around tabs',
      validation: {
        schema: {
          type: 'boolean',
        },
        defaultValue: true,
      },
    },
  },
  exposedVariables: {
    isVisible: true,
    isLoading: false,
    isDisabled: false,
    currentTab: 't0',
    currentTabTitle: 'Overview',
    currentStepIndex: 0,
    isFirstStep: true,
    isLastStep: false,
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
      handle: 'nextTab',
      displayName: 'Next tab or step',
      params: [],
    },
    {
      handle: 'previousTab',
      displayName: 'Previous tab or step',
      params: [],
    },
    {
      handle: 'setTabDisable',
      displayName: 'Set tab disable',
      params: [
        {
          handle: 'tabId',
          displayName: 'Tab',
        },
        {
          handle: 'value',
          displayName: 'Value',
          defaultValue: '{{true}}',
          type: 'toggle',
        },
      ],
    },
    {
      handle: 'setTabLoading',
      displayName: 'Set tab loading',
      params: [
        {
          handle: 'tabId',
          displayName: 'Tab',
        },
        {
          handle: 'value',
          displayName: 'Value',
          defaultValue: '{{true}}',
          type: 'toggle',
        },
      ],
    },
    {
      handle: 'setTabVisibility',
      displayName: 'Set tab visibility',
      params: [
        {
          handle: 'tabId',
          displayName: 'Tab',
        },
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
      useDynamicOptions: {
        value: '{{false}}',
      },
      tabs: {
        value:
          "{{[{ id: 't0', title: 'Overview' }, { id: 't1', title: 'Activity' }, { id: 't2', title: 'Settings' }]}}",
      },
      tabItems: {
        value: [
          {
            id: 't0',
            title: 'Overview',
            icon: {
              value: 'IconHome2',
            },
            iconVisibility: {
              value: false,
            },
            loading: {
              value: false,
            },
            disable: {
              value: false,
            },
            visible: {
              value: true,
            },
            fieldBackgroundColor: {
              value: 'var(--cc-surface1-surface)',
            },
          },
          {
            id: 't1',
            title: 'Activity',
            icon: {
              value: 'IconHome2',
            },
            iconVisibility: {
              value: false,
            },
            loading: {
              value: false,
            },
            disable: {
              value: false,
            },
            visible: {
              value: true,
            },
            fieldBackgroundColor: {
              value: 'var(--cc-surface1-surface)',
            },
          },
          {
            id: 't2',
            title: 'Settings',
            icon: {
              value: 'IconHome2',
            },
            iconVisibility: {
              value: false,
            },
            loading: {
              value: false,
            },
            disable: {
              value: false,
            },
            visible: {
              value: true,
            },
            fieldBackgroundColor: {
              value: 'var(--cc-surface1-surface)',
            },
          },
        ],
      },
      defaultTab: {
        value: 't0',
      },
      variant: {
        value: 'pills',
      },
      tabsAlign: {
        value: 'start',
      },
      hideTabs: {
        value: '{{false}}',
      },
      renderOnlyActiveTab: {
        value: '{{false}}',
      },
      scrollToTopOnTabSwitch: {
        value: '{{false}}',
      },
      showStepNav: {
        value: '{{true}}',
      },
      nextLabel: {
        value: 'Next',
      },
      backLabel: {
        value: 'Back',
      },
      finishLabel: {
        value: 'Finish',
      },
      linearSteps: {
        value: '{{true}}',
      },
      dynamicHeight: {
        value: '{{true}}',
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
      showBorder: {
        value: true,
      },
    },
  },
};
