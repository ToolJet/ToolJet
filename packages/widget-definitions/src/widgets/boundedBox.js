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
  },
  events: {
    onChange: { displayName: 'On change' },
  },
  styles: {
    visibility: {
      type: 'toggle',
      displayName: 'Visibility',
      validation: {
        schema: { type: 'boolean' },
        defaultValue: false,
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
    },
    events: [],
    styles: {
      visibility: { value: '{{true}}' },

      disabledState: { value: '{{false}}' },
    },
  },
};
