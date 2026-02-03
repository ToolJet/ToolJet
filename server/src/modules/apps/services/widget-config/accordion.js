export const accordionConfig = {
  name: 'Accordion',
  displayName: 'Accordion',
  description: 'Group components',
  defaultSize: {
    width: 15,
    height: 450,
  },
  component: 'Accordion',
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
    dynamicHeight: {
      type: 'toggle',
      displayName: 'Dynamic height',
      validation: {
        schema: { type: 'boolean' },
        defaultValue: false,
      },
      section: 'additionalActions',
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
    showHeader: {
      type: 'toggle',
      displayName: 'Show header',
      validation: {
        schema: { type: 'boolean' },
        defaultValue: true,
      },
    },
    tooltip: {
      type: 'code',
      displayName: 'Tooltip',
      validation: { schema: { type: 'string' } },
      section: 'additionalActions',
      placeholder: 'Enter tooltip text',
    },
  },
  defaultChildren: [
    {
      componentName: 'Text',
      slotName: 'header',
      layout: {
        top: 20,
        left: 1,
        height: 40,
        width: 20,
      },
      displayName: 'AccordionText',
      properties: ['text'],
      accessorKey: 'text',
      styles: ['fontWeight', 'textSize', 'textColor', 'boxShadow', 'verticalAlignment'],
      defaultValue: {
        text: 'Accordion title',
        fontWeight: 'bold',
        textSize: 16,
        textColor: 'var(--cc-primary-text)',
        boxShadow: '0px 0px 0px 0px #00000090',
        verticalAlignment: 'center',
      },
    },
  ],
  events: {
    onExpand: { displayName: 'On expand' },
    onCollapse: { displayName: 'On collapse' },
  },
  styles: {
    headerBackgroundColor: {
      type: 'colorSwatches',
      displayName: 'Background',
      validation: {
        schema: { type: 'string' },
        defaultValue: 'var(--cc-surface1-surface)',
      },
      accordian: 'header',
    },

    backgroundColor: {
      type: 'colorSwatches',
      displayName: 'Background',
      validation: {
        schema: { type: 'string' },
        defaultValue: 'var(--cc-surface1-surface)',
      },
      accordian: 'container',
    },
    chevronIconColor: {
      type: 'colorSwatches',
      displayName: 'Chevron icon',
      validation: {
        schema: { type: 'string' },
        defaultValue: 'var(--cc-default-icon)',
      },
      accordian: 'header',
    },
    headerDividerColor: {
      type: 'colorSwatches',
      displayName: 'Divider',
      validation: {
        schema: { type: 'string' },
        defaultValue: 'var(--cc-default-border)',
      },
      accordian: 'header',
    },
    borderColor: {
      type: 'colorSwatches',
      displayName: 'Border color',
      validation: {
        schema: { type: 'string' },
        defaultValue: 'var(--cc-weak-border)',
      },
      accordian: 'container',
    },
    borderRadius: {
      type: 'numberInput',
      displayName: 'Border radius',
      validation: {
        schema: {
          type: 'union',
          schemas: [{ type: 'string' }, { type: 'number' }],
        },
        defaultValue: 6,
      },
      accordian: 'container',
    },
    boxShadow: {
      type: 'boxShadow',
      displayName: 'Box shadow',
      validation: { schema: { type: 'union', schemas: [{ type: 'string' }, { type: 'number' }] } },
      accordian: 'container',
    },
  },
  exposedVariables: {
    isExpanded: true,
    isVisible: true,
    isDisabled: false,
    isLoading: false,
  },
  actions: [
    {
      handle: 'expand',
      displayName: 'Expand',
    },
    {
      handle: 'collapse',
      displayName: 'Collapse',
    },
    {
      handle: 'setVisibility',
      displayName: 'Set visibility',
      params: [{ handle: 'disable', displayName: 'Value', defaultValue: '{{false}}', type: 'toggle' }],
    },
    {
      handle: 'setDisable',
      displayName: 'Set disable',
      params: [{ handle: 'setDisable', displayName: 'Value', defaultValue: '{{false}}', type: 'toggle' }],
    },
    {
      handle: 'setLoading',
      displayName: 'Set loading',
      params: [{ handle: 'setLoading', displayName: 'Value', defaultValue: '{{false}}', type: 'toggle' }],
    },
  ],
  definition: {
    others: {
      showOnDesktop: { value: '{{true}}' },
      showOnMobile: { value: '{{false}}' },
    },
    properties: {
      showHeader: { value: `{{true}}` },
      loadingState: { value: `{{false}}` },
      visibility: { value: '{{true}}' },
      disabledState: { value: '{{false}}' },
      dynamicHeight: { value: '{{false}}' },
      headerHeight: { value: `{{80}}` },
    },
    events: [],
    styles: {
      backgroundColor: { value: 'var(--cc-surface1-surface)' },
      headerBackgroundColor: { value: 'var(--cc-surface1-surface)' },
      chevronIconColor: { value: 'var(--cc-default-icon)' },
      headerDividerColor: { value: 'var(--cc-default-border)' },
      borderRadius: { value: '6' },
      borderColor: { value: 'var(--cc-weak-border)' },
      boxShadow: { value: '0px 0px 0px 0px #00000040' },
    },
  },
};
