export const listviewConfig = {
  name: 'Listview',
  displayName: 'List View',
  description: 'List multiple items',
  defaultSize: {
    width: 15,
    height: 450,
  },
  // Laid out in grid columns (43 across) against the 64px `rowHeight`.
  defaultChildren: [
    {
      componentName: 'Image',
      layout: {
        top: 10,
        left: 1,
        height: 44,
        width: 4,
      },
      properties: ['source'],
      accessorKey: 'imageURL',
      styles: ['imageFit', 'borderRadius'],
      defaultValue: {
        imageFit: 'cover',
        borderRadius: '{{4}}',
      },
    },
    {
      componentName: 'Text',
      layout: {
        top: 5,
        left: 6,
        height: 28,
        width: 26,
      },
      properties: ['text'],
      accessorKey: 'text',
      // Text clips at textSize * 1.5 + 6px of padding/border, so heights below 27 cut descenders.
      styles: ['fontWeight', 'textSize', 'textColor'],
      defaultValue: {
        fontWeight: 'bold',
        textSize: '{{14}}',
        textColor: 'var(--cc-primary-text)',
      },
    },
    {
      componentName: 'Text',
      layout: {
        top: 33,
        left: 6,
        height: 26,
        width: 26,
      },
      properties: ['text'],
      accessorKey: 'description',
      styles: ['fontWeight', 'textSize', 'textColor'],
      defaultValue: {
        fontWeight: 'normal',
        textSize: '{{12}}',
        textColor: 'var(--cc-secondary-text)',
      },
    },
    {
      componentName: 'Button',
      layout: {
        top: 18,
        left: 33,
        height: 28,
        width: 9,
      },
      properties: ['text'],
      accessorKey: 'buttonText',
      // Button only auto-derives outline colors from the legacy hexes, not from tokens.
      styles: ['type', 'textColor', 'borderColor', 'icon', 'iconColor', 'iconVisibility', 'textSize'],
      defaultValue: {
        type: 'outline',
        textColor: 'var(--cc-primary-text)',
        borderColor: 'var(--cc-weak-border)',
        icon: 'IconMail',
        iconColor: 'var(--cc-primary-text)',
        iconVisibility: true,
        textSize: '{{12}}',
      },
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

    collapseWhenHidden: {
      type: 'toggle',
      displayName: 'Collapse when hidden',
      validation: { schema: { type: 'boolean' }, defaultValue: false },
      section: 'additionalActions',
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
    // Renders first in the Additional Actions section. Its displayName is the
    // visible "Tooltip" label for the whole pair; the `tooltip` code field below
    // hides its own label via showLabel:false so we don't get a duplicate.
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
      newLine: true, // render the switch on its own line below the "Tooltip" label
      section: 'additionalActions',
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
      showLabel: false,
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
        defaultValue: 64,
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
        defaultValue: 10,
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
      { imageURL: 'https://reqres.in/img/faces/7-image.jpg', text: 'Olivia Nguyen · Design', description: 'olivia.nguyen@example.com', buttonText: 'Contact' },
      { imageURL: 'https://reqres.in/img/faces/5-image.jpg', text: 'Liam Patel · Sales', description: 'liam.patel@example.com', buttonText: 'Contact' },
      { imageURL: 'https://reqres.in/img/faces/3-image.jpg', text: 'Sophia Reyes · Support', description: 'sophia.reyes@example.com', buttonText: 'Contact' },
      { imageURL: 'https://reqres.in/img/faces/1-image.jpg', text: 'Jacob Hernandez · Eng', description: 'jacob.hernandez@example.com', buttonText: 'Contact' },
      { imageURL: 'https://reqres.in/img/faces/4-image.jpg', text: 'William Sanchez · Eng', description: 'william.sanchez@example.com', buttonText: 'Contact' },
      { imageURL: 'https://reqres.in/img/faces/6-image.jpg', text: 'Ethan Morales · Design', description: 'ethan.morales@example.com', buttonText: 'Contact' },
      { imageURL: 'https://reqres.in/img/faces/2-image.jpg', text: 'Mia Tiana · Marketing', description: 'mia.tiana@example.com', buttonText: 'Contact' },
      { imageURL: 'https://reqres.in/img/faces/9-image.jpg', text: 'Lucas Ramirez · Support', description: 'lucas.ramirez@example.com', buttonText: 'Contact' },
      { imageURL: 'https://reqres.in/img/faces/8-image.jpg', text: 'Alexander Vela · Finance', description: 'alexander.vela@example.com', buttonText: 'Contact' },
      { imageURL: 'https://reqres.in/img/faces/10-image.jpg', text: 'Michael Reyes · Operations', description: 'michael.reyes@example.com', buttonText: 'Contact' },
    ]}}`,
      },
      mode: { value: 'list' },
      columns: { value: '{{3}}' },
      rowHeight: {
        value: '64',
      },
      loadingState: { value: '{{false}}' },
      dynamicHeight: { value: '{{false}}' },
      visible: { value: '{{true}}' },
      visibility: { value: '{{true}}' },

      collapseWhenHidden: { value: '{{false}}' },
      disabledState: { value: '{{false}}' },
      tooltip: { value: '' },
      tooltipFormat: { value: 'plainText' },
      showBorder: { value: '{{true}}' },
      rowsPerPage: { value: '{{10}}' },
      enablePagination: { value: '{{false}}' },
    },
    events: [],
    styles: {
      backgroundColor: { value: 'var(--cc-surface1-surface)' },
      borderColor: { value: 'var(--cc-weak-border)' },
      borderRadius: { value: '{{10}}' },
      boxShadow: { value: '0px 0px 0px 0px #00000040' },
    },
  },
};
