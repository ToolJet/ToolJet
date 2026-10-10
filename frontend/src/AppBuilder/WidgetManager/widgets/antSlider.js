// GENERATED from WidgetManager/antDesignSource.js by scripts-antd-literals.mjs. Do not edit by hand.
export const antSliderConfig = {
  name: 'AntSlider',
  displayName: 'Slider',
  description: 'Ant Design slider, single value or range',
  component: 'AntSlider',
  defaultSize: {
    width: 14,
    height: 40,
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
    min: {
      type: 'code',
      displayName: 'Minimum',
      validation: {
        schema: {
          type: 'number',
        },
        defaultValue: 0,
      },
    },
    max: {
      type: 'code',
      displayName: 'Maximum',
      validation: {
        schema: {
          type: 'number',
        },
        defaultValue: 100,
      },
    },
    step: {
      type: 'code',
      displayName: 'Step',
      validation: {
        schema: {
          type: 'number',
        },
        defaultValue: 1,
      },
    },
    defaultValue: {
      type: 'code',
      displayName: 'Default value (number, or [start, end] for a range)',
      validation: {
        schema: {
          type: 'union',
          schemas: [
            {
              type: 'number',
            },
            {
              type: 'array',
            },
          ],
        },
        defaultValue: 30,
      },
    },
    range: {
      type: 'toggle',
      displayName: 'Range',
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
  },
  events: {
    onChange: {
      displayName: 'On change (on release)',
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
  },
  exposedVariables: {
    isVisible: true,
    isLoading: false,
    isDisabled: false,
    value: 30,
  },
  actions: [
    {
      handle: 'setValue',
      displayName: 'Set value',
      params: [
        {
          handle: 'value',
          displayName: 'Value',
          defaultValue: '{{0}}',
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
      min: {
        value: '{{0}}',
      },
      max: {
        value: '{{100}}',
      },
      step: {
        value: '{{1}}',
      },
      defaultValue: {
        value: '{{30}}',
      },
      range: {
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
    },
    events: [],
    styles: {
      boxShadow: {
        value: '0px 0px 0px 0px #00000040',
      },
    },
  },
};
