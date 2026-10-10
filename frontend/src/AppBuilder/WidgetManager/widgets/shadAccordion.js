// GENERATED from WidgetManager/shadcnSource.js by scripts-shadcn-literals.mjs. Do not edit by hand.
export const shadAccordionConfig = {
  name: 'ShadAccordion',
  displayName: 'Accordion',
  description: 'shadcn/ui accordion (FAQ, grouped detail)',
  component: 'ShadAccordion',
  defaultSize: {
    width: 20,
    height: 160,
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
      placeholder: "[{ title: 'Inclusions', content: 'Crew, fuel, linen' }]",
    },
    multiple: {
      type: 'toggle',
      displayName: 'Several open at once',
      validation: {
        schema: {
          type: 'boolean',
        },
        defaultValue: false,
      },
    },
    defaultOpen: {
      type: 'code',
      displayName: 'Open by default (indexes)',
      validation: {
        schema: {
          type: 'array',
        },
        defaultValue: [],
      },
    },
    dynamicHeight: {
      type: 'toggle',
      displayName: 'Dynamic height',
      validation: {
        schema: {
          type: 'boolean',
        },
        defaultValue: false,
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
  events: {
    onChange: {
      displayName: 'On change',
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
    openIndexes: [],
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
      items: {
        value:
          "{{[{ title: 'Inclusions', content: 'Crew, fuel and linen' }, { title: 'Cancellation', content: 'Free until 30 days before departure' }]}}",
      },
      multiple: {
        value: '{{false}}',
      },
      defaultOpen: {
        value: '{{[]}}',
      },
      dynamicHeight: {
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
