export const imageConfig = {
  name: 'Image',
  displayName: 'Image',
  description: 'Show image files',
  defaultSize: {
    width: 10,
    height: 240,
  },
  component: 'Image',
  others: {
    showOnDesktop: { type: 'toggle', displayName: 'Show on desktop' },
    showOnMobile: { type: 'toggle', displayName: 'Show on mobile' },
  },
  properties: {
    imageFormat: {
      type: 'switch',
      displayName: 'Image Format',
      options: [
        { displayName: 'Image URL', value: 'imageUrl' },
        { displayName: 'JS Object', value: 'jsObject' },
      ],
      isFxNotRequired: true,
      defaultValue: { value: 'imageUrl' },
      fullWidth: true,
      showLabel: false,
    },
    source: {
      type: 'code',
      displayName: 'Source URL',
      validation: {
        schema: { type: 'string' },
        defaultValue: 'https://www.svgrepo.com/image.svg',
      },
      showLabel: false,
    },
    alternativeText: {
      type: 'code',
      displayName: 'Alternative',
      validation: {
        schema: { type: 'string' },
        defaultValue: 'this is an image',
      },
    },
    zoomButtons: {
      type: 'toggle',
      displayName: 'Zoom button',
      validation: {
        schema: { type: 'boolean' },
        defaultValue: false,
      },
      section: 'additionalActions',
    },
    rotateButton: {
      type: 'toggle',
      displayName: 'Rotate button',
      validation: {
        schema: { type: 'boolean' },
        defaultValue: false,
      },
      section: 'additionalActions',
    },
    loadingState: {
      type: 'toggle',
      displayName: 'Show loading state',
      validation: {
        schema: { type: 'boolean' },
        defaultValue: false,
      },
      section: 'additionalActions',
    },
    visibility: {
      type: 'toggle',
      displayName: 'Visibility',
      validation: {
        schema: { type: 'boolean' },
        defaultValue: true,
      },
      section: 'additionalActions',
    },
    disabledState: {
      type: 'toggle',
      displayName: 'Disable',
      validation: {
        schema: { type: 'boolean' },
        defaultValue: false,
      },
      section: 'additionalActions',
    },
    tooltip: {
      type: 'code',
      displayName: 'Tooltip',
      validation: { schema: { type: 'string' }, defaultValue: 'Tooltip text' },
      section: 'additionalActions',
      placeholder: 'Enter tooltip text',
    },
  },
  events: {
    onClick: { displayName: 'On click' },
  },
  styles: {
    imageFit: {
      type: 'select',
      displayName: 'Image fit',
      options: [
        { name: 'Contain', value: 'contain' },
        { name: 'Fill', value: 'fill' },
        { name: 'Cover', value: 'cover' },
        { name: 'Scale down', value: 'scale-down' },
      ],
      validation: {
        schema: { type: 'string' },
        defaultValue: 'contain',
      },
      accordian: 'Image',
    },
    imageShape: {
      type: 'select',
      displayName: 'Shape',
      options: [
        { name: 'None', value: 'none' },
        { name: 'Circle', value: 'circle' },
      ],
      validation: {
        schema: { type: 'string' },
        defaultValue: 'none',
      },
      accordian: 'Image',
    },
    backgroundColor: {
      type: 'color',
      displayName: 'Background',
      validation: {
        schema: { type: 'string' },
        defaultValue: '#ffffff',
      },
      accordian: 'Container',
    },
    borderColor: {
      type: 'color',
      displayName: 'Border',
      validation: {
        schema: { type: 'string' },
        defaultValue: '#000000',
      },
      accordian: 'Container',
    },
    borderRadius: {
      type: 'numberInput',
      displayName: 'Border radius',
      validation: { schema: { type: 'union', schemas: [{ type: 'string' }, { type: 'number' }] }, defaultValue: 6 },
      accordian: 'Container',
    },
    boxShadow: {
      type: 'boxShadow',
      displayName: 'Box shadow',
      validation: {
        schema: { type: 'union', schemas: [{ type: 'string' }, { type: 'number' }] },
        defaultValue: '0px 0px 0px 0px #00000090',
      },
      accordian: 'Container',
    },
    padding: {
      type: 'switch',
      displayName: 'Padding',
      validation: { schema: { type: 'string' }, defaultValue: 'default' },
      options: [
        { displayName: 'Default', value: 'default' },
        { displayName: 'Custom', value: 'custom' },
      ],
      accordian: 'Container',
      isFxNotRequired: true,
    },
    customPadding: {
      type: 'numberInput',
      displayName: 'Padding',
      conditionallyRender: {
        key: 'padding',
        value: 'custom',
      },
      validation: { schema: { type: 'union', schemas: [{ type: 'string' }, { type: 'number' }] }, defaultValue: 0 },
      accordian: 'Container',
      showLabel: false,
    },
  },
  exposedVariables: {},
  definition: {
    others: {
      showOnDesktop: { value: '{{true}}' },
      showOnMobile: { value: '{{false}}' },
    },
    properties: {
      imageFormat: { value: 'imageUrl' },
      source: { value: 'https://www.svgrepo.com/show/34217/image.svg' },
      alternativeText: { value: null },
      zoomButtons: { value: '{{false}}' },
      rotateButton: { value: '{{false}}' },
      loadingState: { value: '{{false}}' },
      disabledState: { value: '{{false}}' },
      visibility: { value: '{{true}}' },
      visible: { value: '{{true}}' },
    },
    events: [],
    styles: {
      imageFit: { value: 'contain' },
      imageShape: { value: 'none' },
      backgroundColor: { value: '#FFFFFF' },
      borderColor: { value: '' },
      borderRadius: { value: '{{6}}' },
      boxShadow: { value: '0px 0px 0px 0px #00000090' },
      padding: { value: 'default' },
      customPadding: { value: '{{0}}' },
    },
  },
};
