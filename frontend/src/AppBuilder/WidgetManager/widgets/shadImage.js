export const shadImageConfig = {
  name: 'ShadImage',
  displayName: 'Image',
  description:
    "Image: source (URL), alternativeText, imageFit (cover, contain, fill), aspectRatio ('auto' fills the drawn height; '16/9', '4/3', '1/1' size it from the width), caption below, fallback when the URL is empty or fails ('placeholder', 'icon', or 'initials' of fallbackText), showBorder, zoomOnClick lightbox; a skeleton shows while it loads; onClick. Height: as drawn with aspect auto (a caption takes 28px of it)",
  component: 'ShadImage',
  defaultSize: {
    width: 10,
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
    source: {
      type: 'code',
      displayName: 'Image URL',
      validation: {
        schema: {
          type: 'string',
          optional: true,
        },
        defaultValue: '',
      },
    },
    alternativeText: {
      type: 'code',
      displayName: 'Alt text',
      validation: {
        schema: {
          type: 'string',
          optional: true,
        },
        defaultValue: '',
      },
    },
    imageFit: {
      type: 'select',
      displayName: 'Fit',
      options: [
        {
          name: 'Cover (fill, crop)',
          value: 'cover',
        },
        {
          name: 'Contain (whole image)',
          value: 'contain',
        },
        {
          name: 'Fill (stretch)',
          value: 'fill',
        },
      ],
      validation: {
        schema: {
          type: 'string',
          optional: true,
        },
        defaultValue: 'cover',
      },
    },
    aspectRatio: {
      type: 'select',
      displayName: 'Aspect ratio',
      options: [
        {
          name: 'Auto (widget height)',
          value: 'auto',
        },
        {
          name: '1:1 square',
          value: '1/1',
        },
        {
          name: '4:3',
          value: '4/3',
        },
        {
          name: '3:2',
          value: '3/2',
        },
        {
          name: '16:9',
          value: '16/9',
        },
        {
          name: '21:9',
          value: '21/9',
        },
        {
          name: '3:4 portrait',
          value: '3/4',
        },
        {
          name: '9:16 portrait',
          value: '9/16',
        },
      ],
      validation: {
        schema: {
          type: 'string',
          optional: true,
        },
        defaultValue: 'auto',
      },
    },
    caption: {
      type: 'code',
      displayName: 'Caption',
      validation: {
        schema: {
          type: 'string',
          optional: true,
        },
        defaultValue: '',
      },
    },
    fallback: {
      type: 'switch',
      displayName: 'Fallback',
      options: [
        {
          displayName: 'Placeholder',
          value: 'placeholder',
        },
        {
          displayName: 'Icon',
          value: 'icon',
        },
        {
          displayName: 'Initials',
          value: 'initials',
        },
      ],
      validation: {
        schema: {
          type: 'string',
          optional: true,
        },
        defaultValue: 'placeholder',
      },
      isFxNotRequired: true,
      fullWidth: true,
    },
    fallbackText: {
      type: 'code',
      displayName: 'Fallback name (initials) or text',
      validation: {
        schema: {
          type: 'string',
          optional: true,
        },
        defaultValue: '',
      },
    },
    showBorder: {
      type: 'toggle',
      displayName: 'Border',
      validation: {
        schema: {
          type: 'boolean',
          optional: true,
        },
        defaultValue: false,
      },
    },
    zoomOnClick: {
      type: 'toggle',
      displayName: 'Zoom on click (lightbox)',
      validation: {
        schema: {
          type: 'boolean',
          optional: true,
        },
        defaultValue: false,
      },
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
    onClick: {
      displayName: 'On click',
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
    borderRadius: {
      type: 'numberInput',
      displayName: 'Image radius',
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
    borderColor: {
      type: 'colorSwatches',
      displayName: 'Border color',
      validation: {
        schema: {
          type: 'string',
          optional: true,
        },
      },
    },
    backgroundColor: {
      type: 'colorSwatches',
      displayName: 'Background (letterbox and fallback)',
      validation: {
        schema: {
          type: 'string',
          optional: true,
        },
      },
    },
    fallbackTextColor: {
      type: 'colorSwatches',
      displayName: 'Fallback text and icon color',
      validation: {
        schema: {
          type: 'string',
          optional: true,
        },
      },
    },
    captionColor: {
      type: 'colorSwatches',
      displayName: 'Caption color',
      validation: {
        schema: {
          type: 'string',
          optional: true,
        },
      },
    },
  },
  exposedVariables: {
    isVisible: true,
    isLoading: false,
    isDisabled: false,
    hasError: false,
    imageURL: '',
    alternativeText: '',
  },
  actions: [
    {
      handle: 'setImageURL',
      displayName: 'Set image URL',
      params: [
        {
          handle: 'url',
          displayName: 'URL',
          defaultValue: '',
        },
      ],
    },
    {
      handle: 'clearImage',
      displayName: 'Clear image',
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
      source: {
        value: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=800',
      },
      alternativeText: {
        value: 'Mountain lake at sunrise',
      },
      imageFit: {
        value: 'cover',
      },
      aspectRatio: {
        value: 'auto',
      },
      caption: {
        value: '',
      },
      fallback: {
        value: 'placeholder',
      },
      fallbackText: {
        value: '',
      },
      showBorder: {
        value: '{{false}}',
      },
      zoomOnClick: {
        value: '{{false}}',
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
