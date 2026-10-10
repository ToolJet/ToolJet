// GENERATED from WidgetManager/shadcnSource.overlays.js by scripts-shadcn-literals.mjs. Do not edit by hand.
export const shadDialogConfig = {
  name: 'ShadDialog',
  displayName: 'Dialog',
  description:
    'shadcn/ui dialog or side sheet (ToolJet Modal in the pack look): header, body and footer canvases (put a ShadHeading and a muted ShadText in the header, the form in the body, ShadButtons in the footer); open and close it with the show-modal / close-modal event actions or its open and close actions; exposed show. Kind "sheet" slides in from the side at full height',
  component: 'ShadDialog',
  defaultSize: {
    width: 10,
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
    visibility: {
      type: 'toggle',
      displayName: 'Modal trigger visibility',
      validation: {
        schema: {
          type: 'boolean',
        },
        defaultValue: true,
      },
    },
    collapseWhenHidden: {
      type: 'toggle',
      displayName: 'Collapse when hidden',
      validation: {
        schema: {
          type: 'boolean',
        },
        defaultValue: false,
      },
      section: 'additionalActions',
    },
    disabledTrigger: {
      type: 'toggle',
      displayName: 'Disable modal trigger',
      validation: {
        schema: {
          type: 'boolean',
        },
        defaultValue: false,
      },
    },
    disabledModal: {
      type: 'toggle',
      displayName: 'Disable modal window',
      validation: {
        schema: {
          type: 'boolean',
        },
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
    showHeader: {
      type: 'toggle',
      displayName: 'Header',
      accordian: 'Data',
    },
    showFooter: {
      type: 'toggle',
      displayName: 'Footer',
      accordian: 'Data',
    },
    size: {
      type: 'select',
      displayName: 'Width',
      accordian: 'Data',
      options: [
        {
          name: 'small',
          value: 'sm',
        },
        {
          name: 'medium',
          value: 'lg',
        },
        {
          name: 'large',
          value: 'xl',
        },
        {
          name: 'fullscreen',
          value: 'fullscreen',
        },
      ],
      validation: {
        schema: {
          type: 'string',
        },
        defaultValue: 'lg',
      },
    },
    modalHeight: {
      type: 'numberInput',
      displayName: 'Height',
      accordian: 'Data',
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
        defaultValue: 400,
      },
    },
    hideOnEsc: {
      type: 'toggle',
      displayName: 'Close on escape key',
      section: 'additionalActions',
    },
    closeOnClickingOutside: {
      type: 'toggle',
      displayName: 'Close on clicking outside',
      section: 'additionalActions',
    },
    hideCloseButton: {
      type: 'toggle',
      displayName: 'Hide close button',
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
    variant: {
      type: 'switch',
      displayName: 'Kind',
      options: [
        {
          displayName: 'Dialog',
          value: 'dialog',
        },
        {
          displayName: 'Side sheet',
          value: 'sheet',
        },
      ],
      validation: {
        schema: {
          type: 'string',
        },
        defaultValue: 'dialog',
      },
      isFxNotRequired: true,
      fullWidth: true,
    },
    side: {
      type: 'switch',
      displayName: 'Sheet side',
      options: [
        {
          displayName: 'Right',
          value: 'right',
        },
        {
          displayName: 'Left',
          value: 'left',
        },
      ],
      validation: {
        schema: {
          type: 'string',
        },
        defaultValue: 'right',
      },
      isFxNotRequired: true,
      fullWidth: true,
    },
  },
  events: {
    onOpen: {
      displayName: 'On open',
    },
    onClose: {
      displayName: 'On close',
    },
  },
  defaultChildren: [
    {
      componentName: 'ShadHeading',
      slotName: 'header',
      layout: {
        top: 12,
        left: 1,
        height: 32,
      },
      displayName: 'DialogTitle',
      properties: ['text', 'level'],
      defaultValue: {
        text: 'Dialog title',
        level: 'h4',
      },
    },
    {
      componentName: 'ShadText',
      slotName: 'header',
      layout: {
        top: 44,
        left: 1,
        height: 24,
      },
      displayName: 'DialogDescription',
      properties: ['text', 'tone'],
      defaultValue: {
        text: 'Describe what this dialog is for.',
        tone: 'muted',
      },
    },
    {
      componentName: 'ShadButton',
      slotName: 'footer',
      layout: {
        top: 16,
        left: 26,
        height: 36,
      },
      displayName: 'DialogCancel',
      properties: ['text', 'variant'],
      defaultValue: {
        text: 'Cancel',
        variant: 'outline',
      },
    },
    {
      componentName: 'ShadButton',
      slotName: 'footer',
      layout: {
        top: 16,
        left: 34,
        height: 36,
      },
      displayName: 'DialogConfirm',
      properties: ['text'],
      defaultValue: {
        text: 'Save',
      },
    },
  ],
  styles: {
    headerBackgroundColor: {
      type: 'colorSwatches',
      displayName: 'Background',
      validation: {
        schema: {
          type: 'string',
        },
        defaultValue: 'var(--cc-surface1-surface)',
      },
      accordian: 'header',
    },
    headerDividerColor: {
      type: 'colorSwatches',
      displayName: 'Divider',
      validation: {
        schema: {
          type: 'string',
        },
        defaultValue: 'var(--cc-default-border)',
      },
      accordian: 'header',
    },
    bodyBackgroundColor: {
      type: 'colorSwatches',
      displayName: 'Background',
      validation: {
        schema: {
          type: 'string',
        },
        defaultValue: 'var(--cc-surface1-surface)',
      },
      accordian: 'container',
    },
    footerBackgroundColor: {
      type: 'colorSwatches',
      displayName: 'Background',
      validation: {
        schema: {
          type: 'string',
        },
        defaultValue: 'var(--cc-surface1-surface)',
      },
      accordian: 'footer',
    },
    footerDividerColor: {
      type: 'colorSwatches',
      displayName: 'Divider',
      validation: {
        schema: {
          type: 'string',
        },
        defaultValue: 'var(--cc-default-border)',
      },
      accordian: 'footer',
    },
    triggerButtonBackgroundColor: {
      type: 'colorSwatches',
      displayName: 'Background',
      validation: {
        schema: {
          type: 'string',
        },
        defaultValue: false,
      },
      accordian: 'trigger button',
    },
    triggerButtonHoverBackgroundMode: {
      type: 'switch',
      displayName: 'Hover background',
      validation: {
        schema: {
          type: 'string',
        },
        defaultValue: 'auto',
      },
      options: [
        {
          displayName: 'Auto',
          value: 'auto',
        },
        {
          displayName: 'Manual',
          value: 'manual',
        },
      ],
      accordian: 'trigger button',
      isFxNotRequired: true,
    },
    triggerButtonHoverBackgroundColor: {
      type: 'colorSwatches',
      displayName: '',
      showLabel: false,
      validation: {
        schema: {
          type: 'string',
        },
        defaultValue: false,
      },
      conditionallyRender: {
        key: 'triggerButtonHoverBackgroundMode',
        value: 'manual',
      },
      accordian: 'trigger button',
    },
    triggerButtonTextColor: {
      type: 'colorSwatches',
      displayName: 'Text',
      validation: {
        schema: {
          type: 'string',
        },
        defaultValue: false,
      },
      accordian: 'trigger button',
    },
    triggerButtonTextSize: {
      type: 'numberInput',
      displayName: 'Font size',
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
        defaultValue: 14,
      },
      accordian: 'trigger button',
    },
    triggerButtonFontWeight: {
      type: 'select',
      displayName: 'Font Weight',
      options: [
        {
          name: 'normal',
          value: 'normal',
        },
        {
          name: 'medium',
          value: 'medium',
        },
        {
          name: 'bold',
          value: 'bold',
        },
        {
          name: 'lighter',
          value: 'lighter',
        },
        {
          name: 'bolder',
          value: 'bolder',
        },
      ],
      accordian: 'trigger button',
    },
    triggerButtonContentAlignment: {
      type: 'alignButtons',
      displayName: 'Content alignment',
      validation: {
        schema: {
          type: 'string',
        },
        defaultValue: 'center',
      },
      accordian: 'trigger button',
    },
    icon: {
      type: 'icon',
      displayName: 'Icon',
      validation: {
        schema: {
          type: 'string',
        },
      },
      accordian: 'trigger button',
      visibility: false,
    },
    iconColor: {
      type: 'colorSwatches',
      displayName: 'Icon color',
      validation: {
        schema: {
          type: 'string',
        },
      },
      accordian: 'trigger button',
      visibility: false,
    },
    direction: {
      type: 'switch',
      displayName: '',
      validation: {
        schema: {
          type: 'string',
        },
      },
      showLabel: false,
      isIcon: true,
      options: [
        {
          displayName: 'alignleftinspector',
          value: 'left',
          iconName: 'alignleftinspector',
        },
        {
          displayName: 'alignrightinspector',
          value: 'right',
          iconName: 'alignrightinspector',
        },
      ],
      accordian: 'trigger button',
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
      params: [
        {
          handle: 'setVisibility',
          displayName: 'Value',
          defaultValue: '{{true}}',
          type: 'toggle',
        },
      ],
    },
    {
      handle: 'setDisableTrigger',
      displayName: 'Set disable trigger',
      params: [
        {
          handle: 'setDisableTrigger',
          displayName: 'Value',
          defaultValue: '{{false}}',
          type: 'toggle',
        },
      ],
    },
    {
      handle: 'setDisableModal',
      displayName: 'Set disable modal',
      params: [
        {
          handle: 'setDisableModal',
          displayName: 'Value',
          defaultValue: '{{false}}',
          type: 'toggle',
        },
      ],
    },
    {
      handle: 'setLoading',
      displayName: 'Set loading',
      params: [
        {
          handle: 'setLoading',
          displayName: 'Value',
          defaultValue: '{{false}}',
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
      loadingState: {
        value: '{{false}}',
      },
      dynamicHeight: {
        value: '{{false}}',
      },
      visibility: {
        value: '{{true}}',
      },
      collapseWhenHidden: {
        value: '{{false}}',
      },
      disabledTrigger: {
        value: '{{false}}',
      },
      disabledModal: {
        value: '{{false}}',
      },
      useDefaultButton: {
        value: '{{true}}',
      },
      triggerButtonLabel: {
        value: 'Open dialog',
      },
      size: {
        value: 'lg',
      },
      showHeader: {
        value: '{{true}}',
      },
      showFooter: {
        value: '{{true}}',
      },
      hideCloseButton: {
        value: '{{false}}',
      },
      hideOnEsc: {
        value: '{{true}}',
      },
      closeOnClickingOutside: {
        value: '{{false}}',
      },
      modalHeight: {
        value: '{{400}}',
      },
      headerHeight: {
        value: 80,
      },
      footerHeight: {
        value: 68,
      },
      tooltipFormat: {
        value: 'plainText',
      },
      tooltip: {
        value: '',
      },
      variant: {
        value: 'dialog',
      },
      side: {
        value: 'right',
      },
    },
    events: [],
    styles: {
      icon: {
        value: 'IconAlignBoxBottomLeft',
      },
      iconVisibility: {
        value: false,
      },
      iconColor: {
        value: 'var(--cc-surface1-surface)',
      },
      direction: {
        value: 'left',
      },
      headerBackgroundColor: {
        value: 'var(--cc-surface1-surface)',
      },
      footerBackgroundColor: {
        value: 'var(--cc-surface1-surface)',
      },
      bodyBackgroundColor: {
        value: 'var(--cc-surface1-surface)',
      },
      triggerButtonBackgroundColor: {
        value: 'var(--cc-primary-brand)',
      },
      triggerButtonHoverBackgroundMode: {
        value: 'auto',
      },
      triggerButtonHoverBackgroundColor: {
        value: 'var(--cc-primary-brand)',
      },
      triggerButtonTextColor: {
        value: 'var(--cc-surface1-surface)',
      },
      triggerButtonTextSize: {
        value: '{{14}}',
      },
      triggerButtonFontWeight: {
        value: 'normal',
      },
      triggerButtonContentAlignment: {
        value: 'center',
      },
      headerDividerColor: {
        value: '#00000000',
      },
      footerDividerColor: {
        value: '#00000000',
      },
    },
  },
};
