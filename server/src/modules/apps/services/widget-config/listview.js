export const listviewConfig = {
  name: 'Listview',
  displayName: 'List View',
  description: 'List multiple items',
  defaultSize: {
    width: 15,
    height: 450,
  },
  defaultChildren: [
    {
      componentName: 'Image',
      layout: {
        top: 10,
        left: 3,
        height: 80,
        width: 6,
      },
      properties: ['source'],
      accessorKey: 'imageURL',
    },
    {
      componentName: 'Text',
      layout: {
        top: 30,
        left: 11,
        height: 30,
        width: 12,
      },
      properties: ['text'],
      accessorKey: 'text',
    },
    {
      componentName: 'Button',
      layout: {
        top: 30,
        left: 25,
        height: 30,
        width: 17,
      },
      // incrementWidth: 2,
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
    dataSourceSelector: {
      type: 'dropdownMenu',
      displayName: 'Data source',
      options: [{ name: 'Raw JSON', value: 'rawJson' }],
      validation: { schema: { type: 'union', schemas: [{ type: 'string' }, { type: 'array' }, { type: 'object' }] } },
      newLine: true,
    },
    data: {
      type: 'code',
      displayName: ' ',
      validation: {
        schema: {
          type: 'union',
          schemas: [
            { type: 'array', element: { type: 'object' } },
            { type: 'array', element: { type: 'string' } },
          ],
        },
        defaultValue: "[{text: 'Sample text 1'}]",
      },
      conditionallyRender: {
        key: 'dataSourceSelector',
        value: 'rawJson',
      },
    },
    loadingState: {
      type: 'toggle',
      displayName: 'Loading state',
      section: 'additionalActions',
      validation: {
        schema: { type: 'boolean' },
        defaultValue: false,
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
    visibility: {
      type: 'toggle',
      displayName: 'Visibility',
      section: 'additionalActions',
      validation: {
        schema: { type: 'boolean' },
        defaultValue: true,
      },
    },
    disabledState: {
      type: 'toggle',
      displayName: 'Disable',
      section: 'additionalActions',
      validation: {
        schema: { type: 'boolean' },
        defaultValue: false,
      },
    },
    tooltip: {
      type: 'code',
      displayName: 'Tooltip',
      validation: {
        schema: { type: 'string' },
        defaultValue: 'Enter tooltip text',
      },
      section: 'additionalActions',
      placeholder: 'Enter tooltip text',
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
      type: 'colorSwatches',
      displayName: 'Background color',
      validation: {
        schema: { type: 'string' },
        defaultValue: 'var(--cc-surface1-surface)',
      },
    },
    borderColor: {
      type: 'colorSwatches',
      displayName: 'Border',
      validation: {
        schema: { type: 'string' },
        defaultValue: 'var(--cc-weak-border)',
      },
    },
    borderRadius: {
      type: 'number',
      displayName: 'Border radius',
      validation: {
        schema: { type: 'number' },
        defaultValue: 6,
      },
    },
    boxShadow: {
      type: 'boxShadow',
      displayName: 'Box shadow',
      validation: { schema: { type: 'union', schemas: [{ type: 'string' }, { type: 'number' }] } },
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
      dataSourceSelector: { value: 'rawJson' },
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
      loadingState: { value: '{{false}}' },
      dynamicHeight: { value: '{{false}}' },
      visible: { value: '{{true}}' },
      visibility: { value: '{{true}}' },
      disabledState: { value: '{{false}}' },
      tooltip: { value: '' },
      showBorder: { value: '{{true}}' },
      rowsPerPage: { value: '{{10}}' },
      enablePagination: { value: '{{false}}' },
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
