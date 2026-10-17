export const shadHeroConfig = {
  name: 'ShadHero',
  displayName: 'Hero',
  description:
    "Page hero at the top of a page: eyebrow (small caps line above), title, subtitle, meta facts (['Sun, 11 Oct', '14 bookings'] or [{ label, value }]), an aside on the right and up to two actions (actionLabel, secondaryActionLabel; onActionClicked, onSecondaryActionClicked). The aside is one headline figure (asideValue 12480 or '$12,480', asideLabel 'Revenue today' above it) or a short list of facts (asideValue [{ label: 'Open', value: 14 }, { label: 'Due today', value: 3 }], up to 4, asideLabel as their heading). Greetings and header facts belong in the hero itself: 'Good morning, Ada' as the title, one line of what needs attention as the subtitle, today's date and counts as meta chips, the one number that matters in the aside; never a separate Text or Stat floating beside or over the header. With an aside, the actions sit under the text. background 'plain' (no panel), 'tint' (a soft panel in the accent), 'gradient' (accent wash), 'image' (imageUrl behind a dark overlay, white text) or 'dark' (deep accent panel, white text); icon (lucide name) in a rounded tile beside the title; align left or center (the aside goes under the text); size compact, default or large. Styles accentColor (else the theme's primary), titleFontFamily ('serif', 'display', ...). Height: grows with its content (about 150px default, 120px compact, 220px large; add 40px for actions under the text)",
  component: 'ShadHero',
  defaultSize: {
    width: 43,
    height: 200,
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
    eyebrow: {
      type: 'code',
      displayName: 'Eyebrow',
      validation: {
        schema: {
          type: 'string',
          optional: true,
        },
        defaultValue: 'Operations',
      },
    },
    title: {
      type: 'code',
      displayName: 'Title',
      validation: {
        schema: {
          type: 'string',
          optional: true,
        },
        defaultValue: 'Good morning, Ada',
      },
    },
    subtitle: {
      type: 'code',
      displayName: 'Subtitle',
      validation: {
        schema: {
          type: 'string',
          optional: true,
        },
        defaultValue: '',
      },
    },
    meta: {
      type: 'code',
      displayName: 'Meta facts',
      validation: {
        schema: {
          type: 'union',
          schemas: [
            {
              type: 'array',
            },
            {
              type: 'string',
            },
          ],
          optional: true,
        },
        defaultValue: [],
      },
      placeholder: "['Sun, 11 Oct', '14 bookings']",
    },
    actionLabel: {
      type: 'code',
      displayName: 'Primary action label (empty hides it)',
      validation: {
        schema: {
          type: 'string',
          optional: true,
        },
        defaultValue: '',
      },
    },
    secondaryActionLabel: {
      type: 'code',
      displayName: 'Secondary action label (empty hides it)',
      validation: {
        schema: {
          type: 'string',
          optional: true,
        },
        defaultValue: '',
      },
    },
    asideValue: {
      type: 'code',
      displayName: 'Aside: a figure, or a list of facts',
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
            {
              type: 'array',
            },
          ],
          optional: true,
        },
        defaultValue: '',
      },
      placeholder: "12480, or [{ label: 'Open', value: 14 }]",
    },
    asideLabel: {
      type: 'code',
      displayName: "Aside label (the figure's caption, the facts' heading)",
      validation: {
        schema: {
          type: 'string',
          optional: true,
        },
        defaultValue: '',
      },
    },
    icon: {
      type: 'code',
      displayName: 'Icon (lucide name, e.g. sparkles)',
      validation: {
        schema: {
          type: 'string',
          optional: true,
        },
        defaultValue: '',
      },
    },
    background: {
      type: 'switch',
      displayName: 'Background',
      options: [
        {
          displayName: 'Plain',
          value: 'plain',
        },
        {
          displayName: 'Tint',
          value: 'tint',
        },
        {
          displayName: 'Gradient',
          value: 'gradient',
        },
        {
          displayName: 'Image',
          value: 'image',
        },
        {
          displayName: 'Dark',
          value: 'dark',
        },
      ],
      validation: {
        schema: {
          type: 'string',
          optional: true,
        },
        defaultValue: 'tint',
      },
      isFxNotRequired: true,
      fullWidth: true,
    },
    imageUrl: {
      type: 'code',
      displayName: 'Background image URL (when Background is Image)',
      validation: {
        schema: {
          type: 'string',
          optional: true,
        },
        defaultValue: '',
      },
    },
    align: {
      type: 'switch',
      displayName: 'Align',
      options: [
        {
          displayName: 'Left',
          value: 'left',
        },
        {
          displayName: 'Center',
          value: 'center',
        },
      ],
      validation: {
        schema: {
          type: 'string',
          optional: true,
        },
        defaultValue: 'left',
      },
      isFxNotRequired: true,
      fullWidth: true,
    },
    size: {
      type: 'switch',
      displayName: 'Size',
      options: [
        {
          displayName: 'Compact',
          value: 'compact',
        },
        {
          displayName: 'Default',
          value: 'default',
        },
        {
          displayName: 'Large',
          value: 'large',
        },
      ],
      validation: {
        schema: {
          type: 'string',
          optional: true,
        },
        defaultValue: 'default',
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
    onSecondaryActionClicked: {
      displayName: 'On secondary action clicked',
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
    accentColor: {
      type: 'colorSwatches',
      displayName: 'Accent color',
      validation: {
        schema: {
          type: 'string',
          optional: true,
        },
      },
    },
    backgroundColor: {
      type: 'colorSwatches',
      displayName: 'Panel background color (replaces the Background choice)',
      validation: {
        schema: {
          type: 'string',
          optional: true,
        },
      },
    },
    titleColor: {
      type: 'colorSwatches',
      displayName: 'Title color',
      validation: {
        schema: {
          type: 'string',
          optional: true,
        },
      },
    },
    textColor: {
      type: 'colorSwatches',
      displayName: 'Subtitle and meta color',
      validation: {
        schema: {
          type: 'string',
          optional: true,
        },
      },
    },
    borderRadius: {
      type: 'numberInput',
      displayName: 'Panel radius',
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
    titleFontFamily: {
      type: 'select',
      displayName: 'Title typeface',
      options: [
        {
          name: 'Theme font',
          value: 'theme',
        },
        {
          name: 'Sans serif',
          value: 'sans',
        },
        {
          name: 'Serif',
          value: 'serif',
        },
        {
          name: 'Display serif',
          value: 'display',
        },
        {
          name: 'Monospace',
          value: 'mono',
        },
      ],
      validation: {
        schema: {
          type: 'string',
          optional: true,
        },
        defaultValue: 'theme',
      },
    },
  },
  exposedVariables: {
    isVisible: true,
    isLoading: false,
    isDisabled: false,
  },
  actions: [
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
      eyebrow: {
        value: 'Operations',
      },
      title: {
        value: 'Good morning, Ada',
      },
      subtitle: {
        value: 'Here is what needs you today.',
      },
      meta: {
        value: "{{['Sun, 11 Oct', '14 bookings', '3 need a reply']}}",
      },
      actionLabel: {
        value: 'New booking',
      },
      secondaryActionLabel: {
        value: '',
      },
      asideValue: {
        value: '',
      },
      asideLabel: {
        value: '',
      },
      icon: {
        value: '',
      },
      background: {
        value: 'tint',
      },
      imageUrl: {
        value: '',
      },
      align: {
        value: 'left',
      },
      size: {
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
      titleFontFamily: {
        value: 'theme',
      },
    },
  },
};
