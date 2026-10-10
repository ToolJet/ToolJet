// GENERATED from WidgetManager/shadcnSource.actions.js by scripts-shadcn-literals.mjs. Do not edit by hand.
export const shadDropdownMenuConfig = {
  name: 'ShadDropdownMenu',
  displayName: 'Dropdown menu',
  description:
    "shadcn/ui dropdown menu: a trigger button (label + variant, or an icon-only '...' trigger) opening a menu of items [{ label, value, icon?: 'IconPencil', description?, shortcut?: '⌘E', disabled?, visible?, destructive?, separator? (line above), group? (heading) }]. On select fires onSelect with lastClickedOption { label, value, description }. Height 36px (sm 32px, lg 40px)",
  component: 'ShadDropdownMenu',
  defaultSize: {
    width: 6,
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
    label: {
      type: 'code',
      displayName: 'Label',
      validation: {
        schema: {
          type: 'string',
        },
        defaultValue: 'Actions',
      },
    },
    triggerType: {
      type: 'switch',
      displayName: 'Trigger',
      options: [
        {
          displayName: 'Button',
          value: 'button',
        },
        {
          displayName: 'Icon only',
          value: 'icon',
        },
      ],
      validation: {
        schema: {
          type: 'string',
        },
        defaultValue: 'button',
      },
      isFxNotRequired: true,
      fullWidth: true,
    },
    variant: {
      type: 'switch',
      displayName: 'Variant',
      options: [
        {
          displayName: 'Default',
          value: 'default',
        },
        {
          displayName: 'Secondary',
          value: 'secondary',
        },
        {
          displayName: 'Outline',
          value: 'outline',
        },
        {
          displayName: 'Ghost',
          value: 'ghost',
        },
        {
          displayName: 'Destructive',
          value: 'destructive',
        },
        {
          displayName: 'Link',
          value: 'link',
        },
      ],
      validation: {
        schema: {
          type: 'string',
        },
        defaultValue: 'outline',
      },
      isFxNotRequired: true,
      fullWidth: true,
    },
    size: {
      type: 'switch',
      displayName: 'Size',
      options: [
        {
          displayName: 'Sm',
          value: 'sm',
        },
        {
          displayName: 'Default',
          value: 'default',
        },
        {
          displayName: 'Lg',
          value: 'lg',
        },
      ],
      validation: {
        schema: {
          type: 'string',
        },
        defaultValue: 'default',
      },
      isFxNotRequired: true,
      fullWidth: true,
    },
    triggerIcon: {
      type: 'code',
      displayName: 'Trigger icon (Tabler name, e.g. IconDots)',
      validation: {
        schema: {
          type: 'string',
        },
        defaultValue: '',
      },
    },
    showChevron: {
      type: 'toggle',
      displayName: 'Show chevron',
      validation: {
        schema: {
          type: 'boolean',
        },
        defaultValue: true,
      },
    },
    fullWidth: {
      type: 'toggle',
      displayName: 'Full width',
      validation: {
        schema: {
          type: 'boolean',
        },
        defaultValue: false,
      },
    },
    items: {
      type: 'code',
      displayName: 'Items',
      validation: {
        schema: {
          type: 'array',
        },
        defaultValue: [],
      },
      placeholder:
        "[{ label: 'Edit', value: 'edit', icon: 'IconPencil', shortcut: '⌘E' }, { label: 'Delete', value: 'delete', destructive: true, separator: true }]",
    },
    menuLabel: {
      type: 'code',
      displayName: 'Menu heading',
      validation: {
        schema: {
          type: 'string',
        },
        defaultValue: '',
      },
    },
    align: {
      type: 'switch',
      displayName: 'Menu align',
      options: [
        {
          displayName: 'Start',
          value: 'start',
        },
        {
          displayName: 'Center',
          value: 'center',
        },
        {
          displayName: 'End',
          value: 'end',
        },
      ],
      validation: {
        schema: {
          type: 'string',
        },
        defaultValue: 'start',
      },
      isFxNotRequired: true,
      fullWidth: true,
    },
    side: {
      type: 'switch',
      displayName: 'Menu side',
      options: [
        {
          displayName: 'Bottom',
          value: 'bottom',
        },
        {
          displayName: 'Top',
          value: 'top',
        },
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
        defaultValue: 'bottom',
      },
      isFxNotRequired: true,
      fullWidth: true,
    },
    optionsLoadingState: {
      type: 'toggle',
      displayName: 'Options loading state',
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
  },
  events: {
    onSelect: {
      displayName: 'On select',
    },
    onOpen: {
      displayName: 'On open',
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
        },
        defaultValue: '0px 0px 0px 0px #00000040',
      },
      accordian: 'Container',
    },
    backgroundColor: {
      type: 'colorSwatches',
      displayName: 'Trigger background',
      validation: {
        schema: {
          type: 'string',
        },
      },
    },
    hoverBackgroundColor: {
      type: 'colorSwatches',
      displayName: 'Trigger hover background',
      validation: {
        schema: {
          type: 'string',
        },
      },
    },
    textColor: {
      type: 'colorSwatches',
      displayName: 'Trigger text color',
      validation: {
        schema: {
          type: 'string',
        },
      },
    },
    borderColor: {
      type: 'colorSwatches',
      displayName: 'Trigger border color',
      validation: {
        schema: {
          type: 'string',
        },
      },
    },
    borderRadius: {
      type: 'numberInput',
      displayName: 'Trigger radius',
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
      },
    },
    menuBackgroundColor: {
      type: 'colorSwatches',
      displayName: 'Menu background',
      validation: {
        schema: {
          type: 'string',
        },
      },
    },
    menuBorderColor: {
      type: 'colorSwatches',
      displayName: 'Menu border color',
      validation: {
        schema: {
          type: 'string',
        },
      },
    },
    itemTextColor: {
      type: 'colorSwatches',
      displayName: 'Item text color',
      validation: {
        schema: {
          type: 'string',
        },
      },
    },
    itemHoverBackgroundColor: {
      type: 'colorSwatches',
      displayName: 'Item hover background',
      validation: {
        schema: {
          type: 'string',
        },
      },
    },
    itemHoverTextColor: {
      type: 'colorSwatches',
      displayName: 'Item hover text color',
      validation: {
        schema: {
          type: 'string',
        },
      },
    },
    descriptionColor: {
      type: 'colorSwatches',
      displayName: 'Item description and shortcut color',
      validation: {
        schema: {
          type: 'string',
        },
      },
    },
    iconColor: {
      type: 'colorSwatches',
      displayName: 'Item icon color',
      validation: {
        schema: {
          type: 'string',
        },
      },
    },
    destructiveColor: {
      type: 'colorSwatches',
      displayName: 'Destructive item color',
      validation: {
        schema: {
          type: 'string',
        },
      },
    },
    menuRadius: {
      type: 'numberInput',
      displayName: 'Menu radius',
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
      },
    },
    menuWidth: {
      type: 'numberInput',
      displayName: 'Menu width (px)',
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
      },
    },
  },
  exposedVariables: {
    isVisible: true,
    isLoading: false,
    isDisabled: false,
    lastClickedOption: null,
    isOpen: false,
  },
  actions: [
    {
      handle: 'open',
      displayName: 'Open menu',
    },
    {
      handle: 'close',
      displayName: 'Close menu',
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
      label: {
        value: 'Actions',
      },
      triggerType: {
        value: 'button',
      },
      variant: {
        value: 'outline',
      },
      size: {
        value: 'default',
      },
      triggerIcon: {
        value: '',
      },
      showChevron: {
        value: '{{true}}',
      },
      fullWidth: {
        value: '{{false}}',
      },
      items: {
        value:
          "{{[{ label: 'Edit', value: 'edit', icon: 'IconPencil', shortcut: '⌘E' }, { label: 'Duplicate', value: 'duplicate', icon: 'IconCopy', shortcut: '⌘D' }, { label: 'Archive', value: 'archive', icon: 'IconArchive' }, { label: 'Delete', value: 'delete', icon: 'IconTrash', destructive: true, separator: true }]}}",
      },
      menuLabel: {
        value: '',
      },
      align: {
        value: 'start',
      },
      side: {
        value: 'bottom',
      },
      optionsLoadingState: {
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
