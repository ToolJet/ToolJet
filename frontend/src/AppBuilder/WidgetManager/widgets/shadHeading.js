// GENERATED from WidgetManager/shadcnSource.js by scripts-shadcn-literals.mjs. Do not edit by hand.
export const shadHeadingConfig = {
  name: 'ShadHeading',
  displayName: 'Heading',
  description: 'shadcn/ui heading (h1 to h4)',
  component: 'ShadHeading',
  defaultSize: {
    width: 16,
    height: 36,
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
    text: {
      type: 'code',
      displayName: 'Text',
      validation: {
        schema: {
          type: 'string',
        },
        defaultValue: 'Heading',
      },
    },
    level: {
      type: 'switch',
      displayName: 'Level',
      options: [
        {
          displayName: 'H1',
          value: 'h1',
        },
        {
          displayName: 'H2',
          value: 'h2',
        },
        {
          displayName: 'H3',
          value: 'h3',
        },
        {
          displayName: 'H4',
          value: 'h4',
        },
      ],
      validation: {
        schema: {
          type: 'string',
        },
        defaultValue: 'h2',
      },
      isFxNotRequired: true,
      fullWidth: true,
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
  },
  events: {},
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
    textColor: {
      type: 'colorSwatches',
      displayName: 'Heading color',
      validation: {
        schema: {
          type: 'string',
        },
      },
    },
    textAlign: {
      type: 'alignButtons',
      displayName: 'Text alignment (left, center, right)',
      validation: {
        schema: {
          type: 'string',
        },
        defaultValue: 'left',
      },
    },
  },
  exposedVariables: {
    isVisible: true,
    isLoading: false,
    isDisabled: false,
  },
  actions: [],
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
      text: {
        value: 'Heading',
      },
      level: {
        value: 'h2',
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
    },
    events: [],
    styles: {
      boxShadow: {
        value: '0px 0px 0px 0px #00000040',
      },
      textAlign: {
        value: 'left',
      },
    },
  },
};
