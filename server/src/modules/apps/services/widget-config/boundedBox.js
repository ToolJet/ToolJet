export const boundedBoxConfig = {
  name: 'BoundedBox',
  displayName: 'Bounded Box',
  description: 'An infinitely customizable image annotation widget',
  component: 'BoundedBox',
  defaultSize: {
    width: 30,
    height: 420,
  },
  others: {
    showOnDesktop: { type: 'toggle', displayName: 'Show on desktop' },
    showOnMobile: { type: 'toggle', displayName: 'Show on mobile' },
  },
  properties: {
    imageUrl: {
      type: 'code',
      displayName: 'Image URL',
      validation: {
        schema: { type: 'string' },
        defaultValue: `https://exaple.com/photos/three-cars.jpg`,
      },
    },

    defaultValue: {
      type: 'code',
      displayName: 'Default value',
      validation: {
        schema: { type: 'union', schemas: [{ type: 'string' }, { type: 'array', element: { type: 'object' } }] },
        defaultValue: "{{[{type: 'RECTANGLE',width: 40,height:24, x:41,y:62,text:'Car'}]}}",
      },
    },
    selector: {
      type: 'select',
      displayName: 'Selector',
      options: [
        { name: 'Rectangle', value: 'RECTANGLE' },
        { name: 'Point', value: 'POINT' },
      ],
      validation: {
        schema: { type: 'string' },
        defaultValue: 'RECTANGLE',
      },
    },
    labels: {
      type: 'code',
      displayName: 'List of labels',
      validation: {
        schema: { type: 'array' },
        element: { type: 'union', schemas: [{ type: 'string' }, { type: 'number' }] },
        defaultValue: `{{['Car', 'Tree']}}`,
      },
    },
    loadingState: {
      type: 'toggle',
      displayName: 'Loading state',
      validation: { schema: { type: 'boolean' }, defaultValue: false },
      section: 'additionalActions',
    },
    visibility: {
      type: 'toggle',
      displayName: 'Visibility',
      validation: { schema: { type: 'boolean' }, defaultValue: true },
      section: 'additionalActions',
    },
    disabledState: {
      type: 'toggle',
      displayName: 'Disable',
      validation: { schema: { type: 'boolean' }, defaultValue: false },
      section: 'additionalActions',
    },
    collapseWhenHidden: {
      type: 'toggle',
      displayName: 'Collapse when hidden',
      validation: { schema: { type: 'boolean' }, defaultValue: false },
      section: 'additionalActions',
    },
    tooltipFormat: {
      type: 'switch',
      displayName: 'Tooltip',
      options: [
        { displayName: 'Plain text', value: 'plainText' },
        { displayName: 'Markdown', value: 'markdown' },
        { displayName: 'HTML', value: 'html' },
      ],
      isFxNotRequired: true,
      defaultValue: { value: 'plainText' },
      fullWidth: true,
      newLine: true,
      section: 'additionalActions',
    },
    tooltip: {
      type: 'code',
      displayName: 'Tooltip',
      validation: { schema: { type: 'string' }, defaultValue: '' },
      section: 'additionalActions',
      placeholder: 'Enter tooltip text',
      showLabel: false,
    },
  },
  events: {
    onChange: { displayName: 'On change' },
  },
  styles: {
    backgroundColor: {
      type: 'colorSwatches',
      displayName: 'Background',
      validation: { schema: { type: 'string' }, defaultValue: 'var(--cc-surface1-surface)' },
      accordian: 'container',
    },
    borderColor: {
      type: 'colorSwatches',
      displayName: 'Border',
      validation: { schema: { type: 'string' }, defaultValue: 'var(--cc-weak-border)' },
      accordian: 'container',
    },
    borderRadius: {
      type: 'numberInput',
      displayName: 'Border radius',
      validation: { schema: { type: 'union', schemas: [{ type: 'string' }, { type: 'number' }] }, defaultValue: 6 },
      accordian: 'container',
    },
    boxShadow: {
      type: 'boxShadow',
      displayName: 'Box shadow',
      validation: {
        schema: { type: 'union', schemas: [{ type: 'string' }, { type: 'number' }] },
        defaultValue: '0px 0px 0px 0px #00000040',
      },
      accordian: 'container',
    },
  },
  exposedVariables: {
    annotations: [
      {
        type: 'RECTANGLE',
        x: 41,
        y: 62,
        width: 40,
        height: 24,
        text: 'Car',
        id: 'ce103db2-b2a6-46f5-a4f0-5f4eaa6f3663',
      },
      {
        type: 'RECTANGLE',
        x: 41,
        y: 12,
        width: 40,
        height: 24,
        text: 'Tree',
        id: 'b1a7315e-2b15-4bc8-a1c6-a042dab44f27',
      },
    ],
  },
  actions: [],
  definition: {
    others: {
      showOnDesktop: { value: '{{true}}' },
      showOnMobile: { value: '{{false}}' },
    },
    properties: {
      defaultValue: {
        value:
          "{{[\t{type: 'RECTANGLE',width: 40,height:24, x:41,y:62,text:'Car'},{type: 'RECTANGLE',width: 40,height:24, x:41,y:12,text:'Tree'}\t]}}",
      },
      imageUrl: {
        value: `https://burst.shopifycdn.com/photos/three-cars-are-parked-on-stone-paved-street.jpg?width=746&format=pjpg&exif=1&iptc=1`,
      },
      selector: { value: `RECTANGLE` },
      labels: { value: `{{['Tree', 'Car', 'Stree light']}}` },
      loadingState: { value: '{{false}}' },
      visibility: { value: '{{true}}' },
      disabledState: { value: '{{false}}' },
      collapseWhenHidden: { value: '{{false}}' },
      tooltipFormat: { value: 'plainText' },
      tooltip: { value: '' },
    },
    events: [],
    styles: {
      backgroundColor: { value: 'var(--cc-surface1-surface)' },
      borderColor: { value: 'var(--cc-weak-border)' },
      borderRadius: { value: '{{6}}' },
      boxShadow: { value: '0px 0px 0px 0px #00000040' },
    },
  },
};
