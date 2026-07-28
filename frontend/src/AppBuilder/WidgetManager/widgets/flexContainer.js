export const flexContainerConfig = {
  name: 'FlexContainer',
  displayName: 'Flex Container',
  description: 'Auto-layout flex container',
  defaultSize: {
    width: 15,
    height: 300,
  },
  component: 'FlexContainer',
  others: {
    showOnDesktop: { type: 'toggle', displayName: 'Show on desktop' },
    showOnMobile: { type: 'toggle', displayName: 'Show on mobile' },
  },
  properties: {
    direction: {
      type: 'switch',
      displayName: 'Direction',
      isIcon: true,
      isFxNotRequired: true,
      options: [
        { displayName: 'row', value: 'row', lucideIconName: 'move-horizontal' },
        { displayName: 'column', value: 'column', lucideIconName: 'move-vertical' },
      ],
      validation: {
        schema: { type: 'string' },
        defaultValue: 'column',
      },
    },
    justifyContent: {
      type: 'switch',
      displayName: 'Justify',
      isIcon: true,
      isFxNotRequired: true,
      options: [
        { displayName: 'flex-start', value: 'flex-start', lucideIconName: 'align-horizontal-justify-start' },
        { displayName: 'center', value: 'center', lucideIconName: 'align-horizontal-justify-center' },
        { displayName: 'flex-end', value: 'flex-end', lucideIconName: 'align-horizontal-justify-end' },
      ],
      validation: {
        schema: { type: 'string' },
        defaultValue: 'flex-start',
      },
    },
    alignItems: {
      type: 'switch',
      displayName: 'Align',
      isIcon: true,
      isFxNotRequired: true,
      options: [
        { displayName: 'flex-start', value: 'flex-start', lucideIconName: 'align-vertical-justify-start' },
        { displayName: 'center', value: 'center', lucideIconName: 'align-vertical-justify-center' },
        { displayName: 'flex-end', value: 'flex-end', lucideIconName: 'align-vertical-justify-end' },
      ],
      validation: {
        schema: { type: 'string' },
        defaultValue: 'flex-start',
      },
    },
    gap: {
      type: 'numberInput',
      displayName: 'Gap (px)',
      validation: {
        schema: { type: 'union', schemas: [{ type: 'string' }, { type: 'number' }] },
        defaultValue: 8,
      },
    },
    padding: {
      type: 'numberInput',
      displayName: 'Padding (px)',
      validation: {
        schema: { type: 'union', schemas: [{ type: 'string' }, { type: 'number' }] },
        defaultValue: 12,
      },
    },
    flexWrap: {
      type: 'toggle',
      displayName: 'Allow wrapping',
      validation: {
        schema: { type: 'boolean' },
        defaultValue: true,
      },
    },
    stackBelow: {
      type: 'select',
      displayName: 'Stack below',
      options: [
        { name: 'No stacking', value: 'none' },
        { name: 'Mobile (375px)', value: '375' },
        { name: 'Tablet (768px)', value: '768' },
        { name: 'Desktop (1440px)', value: '1440' },
      ],
      validation: {
        schema: { type: 'string' },
        defaultValue: 'none',
      },
    },
    dynamicHeight: {
      type: 'toggle',
      displayName: 'Dynamic height',
      section: 'additionalActions',
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
    collapseWhenHidden: {
      type: 'toggle',
      displayName: 'Collapse when hidden',
      validation: { schema: { type: 'boolean' }, defaultValue: false },
      section: 'additionalActions',
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
    tooltip: {
      type: 'code',
      displayName: 'Tooltip',
      validation: { schema: { type: 'string' }, defaultValue: 'Tooltip text' },
      section: 'additionalActions',
      placeholder: 'Enter tooltip text',
    },
  },
  events: {},
  styles: {
    backgroundColor: {
      type: 'colorSwatches',
      displayName: 'Background',
      validation: {
        schema: { type: 'string' },
        defaultValue: 'var(--cc-surface1-surface)',
      },
      accordian: 'Container',
    },
    borderColor: {
      type: 'colorSwatches',
      displayName: 'Border color',
      validation: {
        schema: { type: 'string' },
        defaultValue: 'var(--cc-weak-border)',
      },
      accordian: 'Container',
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
      accordian: 'Container',
    },
    boxShadow: {
      type: 'boxShadow',
      displayName: 'Box shadow',
      validation: { schema: { type: 'union', schemas: [{ type: 'string' }, { type: 'number' }] } },
      accordian: 'Container',
    },
  },
  exposedVariables: {
    isVisible: true,
    isDisabled: false,
  },
  actions: [
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
  ],
  definition: {
    others: {
      showOnDesktop: { value: '{{true}}' },
      showOnMobile: { value: '{{false}}' },
    },
    properties: {
      direction: { value: 'row' },
      flexWrap: { value: '{{true}}' },
      gap: { value: '12' },
      padding: { value: '12' },
      justifyContent: { value: 'flex-start' },
      alignItems: { value: 'flex-start' },
      stackBelow: { value: 'none' },
      loadingState: { value: '{{false}}' },
      dynamicHeight: { value: '{{false}}' },
      visibility: { value: '{{true}}' },
      collapseWhenHidden: { value: '{{false}}' },
      disabledState: { value: '{{false}}' },
    },
    events: [],
    styles: {
      backgroundColor: { value: 'var(--cc-surface1-surface)' },
      borderRadius: { value: '6' },
      borderColor: { value: 'var(--cc-weak-border)' },
      boxShadow: { value: '0px 0px 0px 0px #00000040' },
    },
  },
};
