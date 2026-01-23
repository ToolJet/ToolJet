export const htmlConfig = {
  name: 'Html',
  displayName: 'HTML Viewer',
  description: 'View HTML content',
  component: 'Html',
  defaultSize: {
    width: 10,
    height: 310,
  },
  properties: {
    rawHtml: {
      type: 'code',
      displayName: 'Raw HTML',
      validation: {
        schema: { type: 'string' },
        defaultValue: `<body><div><h1>Hello World</h1></div></body>`,
      },
    },
  },
  others: {
    showOnDesktop: { type: 'toggle', displayName: 'Show on desktop' },
    showOnMobile: { type: 'toggle', displayName: 'Show on mobile' },
  },
  events: {},
  styles: {
    visibility: {
      type: 'toggle',
      displayName: 'Visibility',
      validation: {
        defaultValue: true,
      },
    },
    backgroundColor: { type: 'color', displayName: 'Background color' },
    borderColor: { type: 'color', displayName: 'Border color' },
    borderRadius: { type: 'number', displayName: 'Border radius' },
  },
  exposedVariables: {},
  definition: {
    others: {
      showOnDesktop: { value: '{{true}}' },
      showOnMobile: { value: '{{false}}' },
    },
    properties: {
      rawHtml: {
        value: `<body><main><section class="hero" style="height:306px;display: flex;
            justify-content: center;padding:0 1px;align-items: center;text-align:center">You can build your custom HTML-CSS template here</section></main></body>`,
      },
    },
    events: [],
    styles: {
      visibility: { value: '{{true}}' },
      backgroundColor: { value: '' },
      borderColor: { value: '' },
      borderRadius: { value: '{{0}}' },
    },
  },
};
