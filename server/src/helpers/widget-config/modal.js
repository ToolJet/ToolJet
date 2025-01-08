export const modalConfig = {
  name: 'Modal',
  displayName: 'Modal',
  description: 'Show pop-up windows',
  component: 'Modal',
  defaultSize: {
    width: 10,
    height: 34,
  },
  others: {
    showOnDesktop: { type: 'toggle', displayName: 'Show on desktop' },
    showOnMobile: { type: 'toggle', displayName: 'Show on mobile' },
  },
  properties: {
    title: {
      type: 'code',
      displayName: 'Title',
      validation: {
        schema: { type: 'string' },
        defaultValue: 'This title can be changed',
      },
    },
    titleAlignment: {
      type: 'select',
      displayName: 'Title alignment',
      options: [
        { name: 'left', value: 'left' },
        { name: 'center', value: 'center' },
        { name: 'right', value: 'right' },
      ],
      validation: {
        schema: { type: 'string' },
        defaultValue: 'left',
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
    triggerVisibility: {
      type: 'toggle',
      displayName: 'Modal trigger visibility',
      section: 'additionalActions',
      validation: {
        schema: { type: 'boolean' },
        defaultValue: true,
      },
    },
    disabledTrigger: {
      type: 'toggle',
      displayName: 'Disable modal trigger',
      section: 'additionalActions',
      validation: {
        schema: { type: 'boolean' },
        defaultValue: false,
      },
    },
    disabledModal: {
      type: 'toggle',
      displayName: 'Disable modal window',
      section: 'additionalActions',
      validation: {
        schema: { type: 'boolean' },
        defaultValue: false,
      },
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
    hideTitleBar: { type: 'toggle', displayName: 'Hide title bar' },
    hideCloseButton: { type: 'toggle', displayName: 'Hide close button' },
    hideOnEsc: { type: 'toggle', displayName: 'Close on escape key' },
    closeOnClickingOutside: { type: 'toggle', displayName: 'Close on clicking outside' },

    size: {
      type: 'select',
      displayName: 'Modal size',
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
      type: 'code',
      displayName: 'Modal height',
      validation: {
        schema: { type: 'string' },
        defaultValue: '400px',
      },
    },
  },
  events: {
    onOpen: { displayName: 'On open' },
    onClose: { displayName: 'On close' },
  },
  styles: {
    headerBackgroundColor: {
      type: 'color',
      displayName: 'Header background color',
      validation: {
        schema: { type: 'string' },
        defaultValue: '#ffffffff',
      },
    },
    headerTextColor: {
      type: 'color',
      displayName: 'Header title color',
      validation: {
        schema: { type: 'string' },
        defaultValue: '#000000',
      },
    },
    bodyBackgroundColor: {
      type: 'color',
      displayName: 'Body background color',
      validation: {
        schema: { type: 'string' },
        defaultValue: '#ffffffff',
      },
    },
    triggerButtonBackgroundColor: {
      type: 'color',
      displayName: 'Trigger button background color',
      validation: {
        schema: { type: 'string' },
        defaultValue: false,
      },
    },
    triggerButtonTextColor: {
      type: 'color',
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
      title: { value: 'This title can be changed' },
      titleAlignment: { value: 'left' },
      loadingState: { value: `{{false}}` },
      disabledModal: { value: '{{false}}' },
      disabledTrigger: { value: '{{false}}' },
      triggerVisibility: { value: '{{true}}' },
      useDefaultButton: { value: `{{true}}` },
      triggerButtonLabel: { value: `Launch Modal` },
      size: { value: 'lg' },
      hideTitleBar: { value: '{{false}}' },
      hideCloseButton: { value: '{{false}}' },
      hideOnEsc: { value: '{{true}}' },
      closeOnClickingOutside: { value: '{{false}}' },
      modalHeight: { value: '400px' },
    },
    events: [],
    styles: {
      headerBackgroundColor: { value: '#ffffffff' },
      headerTextColor: { value: '#000000' },
      bodyBackgroundColor: { value: '#ffffffff' },
      triggerButtonBackgroundColor: { value: '#4D72FA' },
      triggerButtonTextColor: { value: '#ffffffff' },
    },
  },
};
