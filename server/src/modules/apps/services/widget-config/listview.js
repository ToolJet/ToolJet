export const listviewConfig = {
  name: 'Listview',
  displayName: 'List View',
  description: 'List multiple items',
  defaultSize: {
    width: 30,
    height: 300,
  },
  defaultChildren: [
    {
      componentName: 'Image',
      layout: {
        top: 15,
        left: 3,
        height: 100,
        width: 7,
      },
      properties: ['source'],
      accessorKey: 'imageURL',
    },
    {
      componentName: 'Text',
      layout: {
        top: 50,
        left: 11,
        height: 30,
      },
      properties: ['text'],
      accessorKey: 'text',
    },
    {
      componentName: 'Button',
      layout: {
        top: 50,
        left: 26,
        height: 30,
      },
      incrementWidth: 2,
      properties: ['text'],
      accessorKey: 'buttonText',
    },
  ],
  component: 'Listview',
  others: {
    showOnDesktop: { type: 'toggle', displayName: 'Show on desktop' },
    showOnMobile: { type: 'toggle', displayName: 'Show on mobile' },
  },
  properties: {
    data: {
      type: 'code',
      displayName: 'List data',
      schema: {
        type: 'union',
        schemas: [
          { type: 'array', element: { type: 'object' } },
          { type: 'array', element: { type: 'string' } },
        ],
        defaultValue: "[{text: 'Sample text 1'}]",
      },
    },
    dynamicHeight: {
      type: 'toggle',
      displayName: 'Dynamic height',
      validation: {
        schema: { type: 'boolean' },
        defaultValue: false,
      },
      section: 'additionalActions',
    },
    mode: {
      type: 'select',
      displayName: 'Mode',
      options: [
        { name: 'list', value: 'list' },
        { name: 'grid', value: 'grid' },
      ],
      validation: {
        schema: { type: 'string' },
        defaultValue: 'list',
      },
    },
    columns: {
      type: 'number',
      displayName: 'Columns',
      validation: {
        schema: { type: 'number' },
        defaultValue: 3,
      },
      conditionallyRender: {
        key: 'mode',
        value: 'grid',
      },
    },
    rowHeight: {
      type: 'code',
      displayName: 'Row height',
      validation: {
        schema: { type: 'number' },
        defaultValue: 100,
      },
    },
    showBorder: {
      type: 'code',
      displayName: 'Show bottom border',
      validation: {
        schema: { type: 'boolean' },
        defaultValue: true,
      },
      conditionallyRender: {
        key: 'mode',
        value: 'list',
      },
    },
    enablePagination: {
      type: 'toggle',
      displayName: 'Enable pagination',
      validation: {
        schema: { type: 'boolean' },
        defaultValue: false,
      },
    },
    rowsPerPage: {
      type: 'code',
      displayName: 'Rows per page',
      validation: {
        schema: { type: 'number' },
        defaultValue: 10,
      },
    },
  },
  events: {
    onRowClicked: { displayName: 'Row clicked (Deprecated)' },
    onRecordClicked: { displayName: 'Record clicked' },
  },
  styles: {
    backgroundColor: {
      type: 'color',
      displayName: 'Background color',
      validation: {
        schema: { type: 'string' },
        defaultValue: '#fff',
      },
    },
    borderColor: {
      type: 'color',
      displayName: 'Border color',
      validation: {
        schema: { type: 'string' },
        defaultValue: '#dadcde',
      },
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
    borderRadius: {
      type: 'number',
      displayName: 'Border radius',
      validation: {
        schema: { type: 'number' },
        defaultValue: 4,
      },
    },
  },
  exposedVariables: {
    data: [{}],
  },
  definition: {
    others: {
      showOnDesktop: { value: '{{true}}' },
      showOnMobile: { value: '{{false}}' },
    },
    properties: {
      data: {
        value: `{{[
    { imageURL: 'https://www.svgrepo.com/show/34217/image.svg', text: 'Sample text 1', buttonText: 'Button 1' },
      { imageURL: 'https://www.svgrepo.com/show/34217/image.svg', text: 'Sample text 1', buttonText: 'Button 2' },
      { imageURL: 'https://www.svgrepo.com/show/34217/image.svg', text: 'Sample text 1', buttonText: 'Button 3' },
    ]}}`,
      },
      mode: { value: 'list' },
      columns: { value: '{{3}}' },
      rowHeight: {
        value: '100',
      },
      dynamicHeight: { value: '{{false}}' },
      visible: { value: '{{true}}' },
      showBorder: { value: '{{true}}' },
      rowsPerPage: { value: '{{10}}' },
      enablePagination: { value: '{{false}}' },
    },
    events: [],
    styles: {
      backgroundColor: { value: '#fff' },
      borderColor: { value: '#dadcde' },
      visibility: { value: '{{true}}' },
      disabledState: { value: '{{false}}' },
      borderRadius: { value: '{{4}}' },
    },
  },
};
