export const shadAlertConfig = {
  name: 'ShadAlert',
  displayName: 'Alert',
  description: 'Alert',
  component: 'ShadAlert',
  defaultSize: {
    width: 20,
    height: 72,
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
    title: {
      type: 'code',
      displayName: 'Title',
      validation: {
        schema: {
          type: 'string',
          optional: true,
        },
        defaultValue: 'Heads up',
      },
    },
    description: {
      type: 'code',
      displayName: 'Description',
      validation: {
        schema: {
          type: 'string',
          optional: true,
        },
        defaultValue: '',
      },
    },
    actionLabel: {
      type: 'code',
      displayName: 'Action label',
      validation: {
        schema: {
          type: 'string',
          optional: true,
        },
        defaultValue: '',
      },
    },
    dismissible: {
      type: 'toggle',
      displayName: 'Show close button',
      validation: {
        schema: {
          type: 'boolean',
          optional: true,
        },
        defaultValue: false,
      },
    },
    variant: {
      type: 'select',
      displayName: 'Variant',
      options: [
        {
          name: 'Default',
          value: 'default',
        },
        {
          name: 'Info',
          value: 'info',
        },
        {
          name: 'Success',
          value: 'success',
        },
        {
          name: 'Warning',
          value: 'warning',
        },
        {
          name: 'Destructive',
          value: 'destructive',
        },
        {
          name: 'Custom',
          value: 'custom',
        },
      ],
      validation: {
        schema: {
          type: 'string',
          optional: true,
        },
        defaultValue: 'default',
      },
      fullWidth: true,
    },
    dynamicHeight: {
      type: 'toggle',
      displayName: 'Dynamic height',
      validation: {
        schema: {
          type: 'boolean',
          optional: true,
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
          optional: true,
        },
        defaultValue: false,
      },
      section: 'additionalActions',
    },
    loadingIndicator: {
      type: 'switch',
      displayName: 'Loading look',
      options: [
        {
          displayName: 'Spinner',
          value: 'spinner',
        },
        {
          displayName: 'Skeleton',
          value: 'skeleton',
        },
      ],
      validation: {
        schema: {
          type: 'string',
          optional: true,
        },
        defaultValue: 'spinner',
      },
      isFxNotRequired: true,
      fullWidth: true,
      section: 'additionalActions',
    },
    visibility: {
      type: 'toggle',
      displayName: 'Visibility',
      validation: {
        schema: {
          type: 'boolean',
          optional: true,
        },
        defaultValue: true,
      },
      section: 'additionalActions',
    },
    collapseWhenHidden: {
      type: 'toggle',
      displayName: 'Collapse when hidden',
      validation: {
        schema: {
          type: 'boolean',
          optional: true,
        },
        defaultValue: false,
      },
      section: 'additionalActions',
    },
    disabledState: {
      type: 'toggle',
      displayName: 'Disable',
      validation: {
        schema: {
          type: 'boolean',
          optional: true,
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
          optional: true,
        },
      },
      section: 'additionalActions',
      placeholder: 'Enter tooltip text',
      showLabel: false,
    },
  },
  events: {
    onActionClicked: {
      displayName: 'On action clicked',
    },
    onClose: {
      displayName: 'On close',
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
          optional: true,
        },
        defaultValue: '0px 0px 0px 0px #00000040',
      },
      accordian: 'Container',
    },
    backgroundColor: {
      type: 'colorSwatches',
      displayName: 'Alert background',
      validation: {
        schema: {
          type: 'string',
          optional: true,
        },
      },
    },
    borderColor: {
      type: 'colorSwatches',
      displayName: 'Alert border color',
      validation: {
        schema: {
          type: 'string',
          optional: true,
        },
      },
    },
    accentColor: {
      type: 'colorSwatches',
      displayName: 'Custom accent',
      note: "The Custom variant's colour: its tint, border, title and text. Blank, the theme's primary.",
      validation: {
        schema: {
          type: 'string',
          optional: true,
        },
      },
    },
    titleColor: {
      type: 'colorSwatches',
      displayName: 'Alert title color',
      validation: {
        schema: {
          type: 'string',
          optional: true,
        },
      },
    },
    textColor: {
      type: 'colorSwatches',
      displayName: 'Alert description color',
      validation: {
        schema: {
          type: 'string',
          optional: true,
        },
      },
    },
    borderRadius: {
      type: 'numberInput',
      displayName: 'Alert radius',
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
          optional: true,
        },
      },
    },
  },
  exposedVariables: {
    title: 'Heads up',
    description: '',
    variant: 'default',
    isVisible: true,
    isLoading: false,
    isDisabled: false,
  },
  actions: [
    {
      handle: 'setTitle',
      displayName: 'Set title',
      params: [
        {
          handle: 'title',
          displayName: 'Title',
          defaultValue: 'New title',
        },
      ],
    },
    {
      handle: 'setDescription',
      displayName: 'Set description',
      params: [
        {
          handle: 'description',
          displayName: 'Description',
          defaultValue: 'New description',
        },
      ],
    },
    {
      handle: 'setVariant',
      displayName: 'Set variant',
      params: [
        {
          handle: 'variant',
          displayName: 'Variant (default, info, success, warning, destructive or custom)',
          defaultValue: 'info',
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
      title: {
        value: 'Heads up',
      },
      description: {
        value: '',
      },
      actionLabel: {
        value: '',
      },
      dismissible: {
        value: '{{false}}',
      },
      variant: {
        value: 'default',
      },
      dynamicHeight: {
        value: '{{true}}',
      },
      loadingState: {
        value: '{{false}}',
      },
      loadingIndicator: {
        value: 'spinner',
      },
      visibility: {
        value: '{{true}}',
      },
      collapseWhenHidden: {
        value: '{{false}}',
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
    },
  },
};
