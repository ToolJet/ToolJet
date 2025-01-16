export const imageConfig = {
  name: 'Image',
  displayName: 'Image',
  description: 'Show image files',
  defaultSize: {
    width: 3,
    height: 100,
  },
  component: 'Image',
  others: {
    showOnDesktop: { type: 'toggle', displayName: 'Show on desktop' },
    showOnMobile: { type: 'toggle', displayName: 'Show on mobile' },
  },
  properties: {
    source: {
      type: 'code',
      displayName: 'URL',
      validation: {
        schema: { type: 'string' },
        defaultValue: 'https://www.svgrepo.com/image.svg',
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
    alternativeText: {
      type: 'code',
      displayName: 'Alternative text',
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
    },
    rotateButton: {
      type: 'toggle',
      displayName: 'Rotate button',
      validation: {
        schema: { type: 'boolean' },
        defaultValue: false,
      },
    },
  },
  events: {
    onClick: { displayName: 'On click' },
  },
  styles: {
    borderType: {
      type: 'select',
      displayName: 'Border type',
      options: [
        { name: 'None', value: 'none' },
        { name: 'Rounded', value: 'rounded' },
        { name: 'Circle', value: 'rounded-circle' },
        { name: 'Thumbnail', value: 'img-thumbnail' },
      ],
      validation: {
        schema: { type: 'string' },
        defaultValue: 'none',
      },
    },
    backgroundColor: {
      type: 'color',
      displayName: 'Background color',
      validation: {
        schema: { type: 'string' },
        defaultValue: '#ffffff',
      },
    },
    padding: {
      type: 'code',
      displayName: 'Padding',
      validation: { schema: { type: 'union', schemas: [{ type: 'string' }, { type: 'number' }] }, defaultValue: 0 },
    },
    visibility: {
      type: 'toggle',
      displayName: 'Visibility',
      validation: {
        schema: { type: 'boolean' },
        defaultValue: true,
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
    imageFit: {
      type: 'select',
      displayName: 'Image fit',
      options: [
        { name: 'fill', value: 'fill' },
        { name: 'contain', value: 'contain' },
        { name: 'cover', value: 'cover' },
        { name: 'scale-down', value: 'scale-down' },
      ],
      validation: {
        schema: { type: 'string' },
        defaultValue: 'contain',
      },
    },
  },
  exposedVariables: {},
  definition: {
    others: {
      showOnDesktop: { value: '{{true}}' },
      showOnMobile: { value: '{{false}}' },
    },
    properties: {
      source: { value: 'https://www.svgrepo.com/show/34217/image.svg' },
      visible: { value: '{{true}}' },
      loadingState: { value: '{{false}}' },
      alternativeText: { value: '' },
      zoomButtons: { value: '{{false}}' },
      rotateButton: { value: '{{false}}' },
    },
    events: [],
    styles: {
      borderType: { value: 'none' },
      padding: { value: '0' },
      visibility: { value: '{{true}}' },
      disabledState: { value: '{{false}}' },
      imageFit: { value: 'contain' },
      backgroundColor: { value: '' },
    },
  },
};
