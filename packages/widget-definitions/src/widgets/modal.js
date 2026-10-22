export const modalConfig = {
  name: 'ModalLegacy',
  displayName: 'Modal (Legacy)',
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
    loadingState: {
      type: 'toggle',
      displayName: 'Loading state',
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
      type: 'colorSwatches',
      displayName: 'Header background color',
      validation: {
        schema: { type: 'string' },
        defaultValue: 'var(--cc-surface1-surface)',
      },
    },
    headerTextColor: {
      type: 'colorSwatches',
      displayName: 'Header title color',
      validation: {
        schema: { type: 'string' },
        defaultValue: 'var(--cc-primary-text)',
      },
    },
    bodyBackgroundColor: {
      type: 'colorSwatches',
      displayName: 'Body background color',
      validation: {
        schema: { type: 'string' },
        defaultValue: 'var(--cc-surface1-surface)',
      },
    },
    disabledState: {
      type: 'toggle',
      displayName: 'Disable',
      validation: {
        schema: { type: 'boolean' },
        defaultValue: false,
      },
    },
    visibility: {
      type: 'toggle',
      displayName: 'Visibility',
      validation: {
        schema: { type: 'boolean' },
        defaultValue: true,
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
      headerBackgroundColor: { value: 'var(--cc-surface1-surface)' },
      headerTextColor: { value: 'var(--cc-primary-text)' },
      bodyBackgroundColor: { value: 'var(--cc-surface1-surface)' },
      disabledState: { value: '{{false}}' },
      visibility: { value: '{{true}}' },
      triggerButtonBackgroundColor: { value: 'var(--cc-primary-brand)' },
      triggerButtonTextColor: { value: '#ffffffff' },
    },
  },
};
