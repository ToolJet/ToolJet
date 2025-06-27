export const modalV2Config = {
  name: 'Modal',
  displayName: 'Modal',
  description: 'Show pop-up windows',
  component: 'ModalV2',
  defaultSize: {
    width: 10,
    height: 40,
  },
  others: {
    showOnDesktop: { type: 'toggle', displayName: 'Show on desktop' },
    showOnMobile: { type: 'toggle', displayName: 'Show on mobile' },
  },
  properties: {
    loadingState: {
      type: 'toggle',
      displayName: 'Loading state',
      validation: {
        schema: { type: 'boolean' },
        defaultValue: false,
      },
      section: 'additionalActions',
    },
    visibility: {
      type: 'toggle',
      displayName: 'Modal trigger visibility',
      validation: {
        schema: { type: 'boolean' },
        defaultValue: true,
      },
    },
    disabledTrigger: {
      type: 'toggle',
      displayName: 'Disable modal trigger',
      validation: {
        schema: { type: 'boolean' },
        defaultValue: false,
      },
    },
    disabledModal: {
      type: 'toggle',
      displayName: 'Disable modal window',
      validation: {
        schema: { type: 'boolean' },
        defaultValue: false,
      },
      section: 'additionalActions',
    },
    useDefaultButton: {
      type: 'toggle',
      displayName: 'Use default trigger button',
      validation: {
        schema: {
          type: 'boolean',
        },
        defaultValue: true,
      },
    },
    triggerButtonLabel: {
      type: 'code',
      displayName: 'Trigger button label',
      validation: {
        schema: {
          type: 'string',
        },
        defaultValue: 'Launch Modal',
      },
    },

    // Data Accordion
    showHeader: { type: 'toggle', displayName: 'Header', accordian: 'Data' },
    showFooter: { type: 'toggle', displayName: 'Footer', accordian: 'Data' },

    size: {
      type: 'select',
      displayName: 'Width',
      accordian: 'Data',
      options: [
        { name: 'small', value: 'sm' },
        { name: 'medium', value: 'lg' },
        { name: 'large', value: 'xl' },
        { name: 'fullscreen', value: 'fullscreen' },
      ],
      validation: {
        schema: { type: 'string' },
        defaultValue: 'lg',
      },
    },
    modalHeight: {
      type: 'numberInput',
      displayName: 'Height',
      accordian: 'Data',
      validation: { schema: { type: 'union', schemas: [{ type: 'string' }, { type: 'number' }] }, defaultValue: 400 },
    },
    hideOnEsc: { type: 'toggle', displayName: 'Close on escape key', section: 'additionalActions' },
    closeOnClickingOutside: { type: 'toggle', displayName: 'Close on clicking outside', section: 'additionalActions' },
    hideCloseButton: { type: 'toggle', displayName: 'Hide close button', section: 'additionalActions' },
  },
  events: {
    onOpen: { displayName: 'On open' },
    onClose: { displayName: 'On close' },
  },
  defaultChildren: [
    {
      componentName: 'Text',
      slotName: 'header',
      layout: {
        top: 21,
        left: 1,
        height: 40,
      },
      displayName: 'ModalHeaderTitle',
      properties: ['text'],
      accessorKey: 'text',
      styles: ['fontWeight', 'textSize', 'textColor'],
      defaultValue: {
        text: 'Modal title',
        textSize: 20,
        textColor: '#000',
      },
    },
    {
      componentName: 'Button',
      slotName: 'footer',
      layout: {
        top: 24,
        left: 22,
        height: 40,
      },
      displayName: 'ModalFooterCancel',
      properties: ['text'],
      styles: ['type', 'borderColor', 'padding'],
      defaultValue: {
        text: 'Button1',
        type: 'outline',
        borderColor: '#CCD1D5',
      },
    },
    {
      componentName: 'Button',
      slotName: 'footer',
      layout: {
        top: 24,
        left: 32,
        height: 40,
      },
      displayName: 'ModalFooterConfirm',
      properties: ['text'],
      defaultValue: {
        text: 'Button2',
        padding: 'none',
      },
    },
  ],
  styles: {
    headerBackgroundColor: {
      type: 'colorSwatches',
      displayName: 'Header background color',
      validation: {
        schema: { type: 'string' },
        defaultValue: '#ffffffff',
      },
    },
    footerBackgroundColor: {
      type: 'colorSwatches',
      displayName: 'Footer background color',
      validation: {
        schema: { type: 'string' },
        defaultValue: '#ffffffff',
      },
    },
    bodyBackgroundColor: {
      type: 'colorSwatches',
      displayName: 'Body background color',
      validation: {
        schema: { type: 'string' },
        defaultValue: '#ffffffff',
      },
    },
    triggerButtonBackgroundColor: {
      type: 'colorSwatches',
      displayName: 'Trigger button background color',
      validation: {
        schema: { type: 'string' },
        defaultValue: false,
      },
    },
    triggerButtonTextColor: {
      type: 'colorSwatches',
      displayName: 'Trigger button text color',
      validation: {
        schema: { type: 'string' },
        defaultValue: false,
      },
    },
  },
  exposedVariables: {
    show: false,
    isDisabledModal: false,
    isDisabledTrigger: false,
    isVisible: true,
    isLoading: false,
  },
  actions: [
    {
      handle: 'open',
      displayName: 'Open',
    },
    {
      handle: 'close',
      displayName: 'Close',
    },
    {
      handle: 'setVisibility',
      displayName: 'Set visibility',
      params: [{ handle: 'setVisibility', displayName: 'Value', defaultValue: '{{true}}', type: 'toggle' }],
    },
    {
      handle: 'setDisableTrigger',
      displayName: 'Set disable trigger',
      params: [{ handle: 'setDisableTrigger', displayName: 'Value', defaultValue: '{{false}}', type: 'toggle' }],
    },
    {
      handle: 'setDisableModal',
      displayName: 'Set disable modal',
      params: [{ handle: 'setDisableModal', displayName: 'Value', defaultValue: '{{false}}', type: 'toggle' }],
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
      loadingState: { value: `{{false}}` },
      visibility: { value: '{{true}}' },
      disabledTrigger: { value: '{{false}}' },
      disabledModal: { value: '{{false}}' },
      useDefaultButton: { value: `{{true}}` },
      triggerButtonLabel: { value: `Launch Modal` },
      size: { value: 'lg' },
      showHeader: { value: '{{true}}' },
      showFooter: { value: '{{true}}' },
      hideCloseButton: { value: '{{false}}' },
      hideOnEsc: { value: '{{true}}' },
      closeOnClickingOutside: { value: '{{false}}' },
      modalHeight: { value: 400 },
      headerHeight: { value: 80 },
      footerHeight: { value: 80 },
    },
    events: [],
    styles: {
      headerBackgroundColor: { value: '#ffffffff' },
      footerBackgroundColor: { value: '#ffffffff' },
      bodyBackgroundColor: { value: '#ffffffff' },
      triggerButtonBackgroundColor: { value: 'var(--cc-primary-brand)' },
      triggerButtonTextColor: { value: '#ffffffff' },
    },
  },
};
