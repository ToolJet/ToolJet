export const listviewConfig = {
  name: 'Listview',
  displayName: 'List View',
  description: 'List multiple items',
  defaultSize: {
    width: 15,
    // 12 padding + 60 header + 6 x 80 records + 5 x 12 gaps + 12 padding: six records show, the rest scroll.
    height: 624,
  },
  // Seeded on drop only: saved ListViews keep their own children, so this is the new look (Figma 238:1379, list and grid).
  defaultChildren: [
    {
      componentName: 'Image',
      layout: { top: 20, left: 2, height: 40, width: 4 },
      properties: ['source'],
      accessorKey: 'imageURL',
      creationValues: { styles: { borderType: 'rounded-circle', imageFit: 'cover' } },
    },
    {
      componentName: 'Text',
      layout: { top: 15, left: 7, height: 25, width: 17 },
      properties: ['text'],
      accessorKey: 'name',
      creationValues: { styles: { fontWeight: 'bold' } },
    },
    {
      componentName: 'Text',
      layout: { top: 40, left: 7, height: 25, width: 17 },
      properties: ['text'],
      accessorKey: 'company',
      creationValues: { styles: { textColor: 'var(--cc-placeholder-text)' } },
    },
    {
      componentName: 'Tags',
      layout: { top: 20, left: 26, height: 40, width: 16 },
      creationValues: {
        properties: {
          // Without Dynamic tags the Tags widget shows its static sample options and ignores `data`.
          advanced: '{{true}}',
          data: "{{[{ title: listItem.role, color: 'color-mix(in srgb, var(--cc-primary-brand) 10%, transparent)', textColor: 'var(--cc-primary-text)' }]}}",
        },
        styles: { size: 'large', borderRadius: '14' },
      },
    },
    // Seeded on drop only, and every drop is a new ListView, so saved ListViews never gain it.
    {
      componentName: 'Text',
      slotName: 'header',
      layout: {
        top: 10,
        left: 1,
        height: 40,
        width: 20,
      },
      properties: ['text'],
      styles: ['fontWeight', 'textSize', 'textColor', 'verticalAlignment'],
      defaultValue: {
        text: 'List view',
        fontWeight: 'bold',
        textSize: 16,
        textColor: 'var(--cc-primary-text)',
        verticalAlignment: 'center',
      },
    },
  ],
  component: 'Listview',
  others: {
    showOnDesktop: { type: 'toggle', displayName: 'Show on desktop' },
    showOnMobile: { type: 'toggle', displayName: 'Show on mobile' },
  },
  properties: {
    showHeader: {
      type: 'toggle',
      displayName: 'Show header',
      validation: { schema: { type: 'boolean' }, defaultValue: false },
      section: 'header',
    },
    dataSourceSelector: {
      type: 'dropdownMenu',
      displayName: 'Populate data from',
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
            // A null element is tolerated: a query row can be empty without voiding the whole list.
            { type: 'array', element: { type: 'union', schemas: [{ type: 'object' }, { type: 'null' }] } },
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
      type: 'switch',
      displayName: 'Layout',
      options: [
        { displayName: 'List', value: 'list' },
        { displayName: 'Grid', value: 'grid' },
      ],
      validation: {
        schema: { type: 'string' },
        defaultValue: 'list',
      },
    },
    columns: {
      type: 'code',
      displayName: 'Number of columns',
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
      displayName: 'Record height',
      validation: {
        schema: { type: 'number' },
        defaultValue: 100,
      },
    },
    // Resolved per record with `listItem`, so the expression is read from the saved definition, not from the resolved value.
    disableRecords: {
      type: 'code',
      displayName: 'Disable records',
      validation: {
        schema: { type: 'boolean' },
        defaultValue: false,
      },
    },
    showBorder: {
      type: 'code',
      displayName: 'Show bottom border',
      validation: {
        schema: { type: 'boolean' },
        defaultValue: true,
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
    serverSidePagination: {
      type: 'clientServerSwitch',
      displayName: 'Type',
      validation: {
        schema: { type: 'boolean' },
        defaultValue: false,
      },
      options: [
        { displayName: 'Client side', value: 'clientSide' },
        { displayName: 'Server side', value: 'serverSide' },
      ],
    },
    rowsPerPage: {
      type: 'code',
      displayName: 'Number of records per page',
      validation: {
        schema: { type: 'number' },
        defaultValue: 10,
      },
    },
    totalRecords: {
      type: 'code',
      displayName: 'Total records',
      validation: {
        schema: { type: 'number' },
        defaultValue: 10,
      },
    },
  },
  events: {
    onRowClicked: { displayName: 'Row clicked (Deprecated)' },
    onRecordClicked: { displayName: 'Record clicked' },
    onRecordHovered: { displayName: 'Record hovered' },
    onPageChanged: { displayName: 'On page change' },
  },
  styles: {
    headerBackgroundColor: {
      type: 'colorSwatches',
      displayName: 'Background',
      validation: { schema: { type: 'string' }, defaultValue: 'transparent' },
      accordian: 'Header',
    },
    headerDividerColor: {
      type: 'colorSwatches',
      displayName: 'Divider',
      validation: { schema: { type: 'string' }, defaultValue: 'var(--cc-weak-border)' },
      accordian: 'Header',
    },
    listStyle: {
      type: 'select',
      displayName: 'List style',
      // Legacy is how every saved ListView keeps its look, so Star Rating's 'legacy' warning must not show here.
      hideDeprecatedStyleWarning: true,
      options: [
        { name: 'Bordered', value: 'bordered' },
        { name: 'Container', value: 'container' },
        { name: 'Plain', value: 'plain' },
        { name: 'Legacy', value: 'legacy' },
      ],
      validation: { schema: { type: 'string' }, defaultValue: 'legacy' },
      accordian: 'Records',
    },
    gap: {
      type: 'numberInput',
      displayName: 'Gap',
      validation: { schema: { type: 'union', schemas: [{ type: 'string' }, { type: 'number' }] }, defaultValue: 12 },
      conditionallyRender: { key: 'listStyle', value: ['bordered', 'container', 'plain'] },
      accordian: 'Records',
    },
    recordBackgroundColor: {
      type: 'colorSwatches',
      displayName: 'Background',
      validation: { schema: { type: 'string' }, defaultValue: 'var(--cc-surface1-surface)' },
      conditionallyRender: { key: 'listStyle', value: ['bordered', 'container'] },
      accordian: 'Records',
    },
    recordDividerColor: {
      type: 'colorSwatches',
      displayName: 'Divider',
      validation: { schema: { type: 'string' }, defaultValue: 'var(--cc-weak-border)' },
      conditionallyRender: { key: 'listStyle', value: 'bordered' },
      accordian: 'Records',
    },
    recordBorderColor: {
      type: 'colorSwatches',
      displayName: 'Border',
      validation: { schema: { type: 'string' }, defaultValue: 'var(--cc-weak-border)' },
      conditionallyRender: { key: 'listStyle', value: 'container' },
      accordian: 'Records',
    },
    recordBorderRadius: {
      type: 'numberInput',
      displayName: 'Border radius',
      validation: { schema: { type: 'union', schemas: [{ type: 'string' }, { type: 'number' }] }, defaultValue: 6 },
      prefixIcon: 'corners',
      staticText: '',
      conditionallyRender: { key: 'listStyle', value: 'container' },
      accordian: 'Records',
    },
    // No default: a missing value means no shadow, since the shadow field cannot parse 'none'.
    recordBoxShadow: {
      type: 'boxShadow',
      displayName: 'Box shadow',
      validation: { schema: { type: 'union', schemas: [{ type: 'string' }, { type: 'number' }] } },
      conditionallyRender: { key: 'listStyle', value: 'container' },
      accordian: 'Records',
    },
    backgroundColor: {
      type: 'colorSwatches',
      displayName: 'Background',
      validation: {
        schema: { type: 'string' },
        defaultValue: 'var(--cc-surface1-surface)',
      },
      accordian: 'Container',
    },
    borderColor: {
      type: 'colorSwatches',
      displayName: 'Border',
      validation: {
        schema: { type: 'string' },
        defaultValue: 'var(--cc-weak-border)',
      },
      accordian: 'Container',
    },
    borderRadius: {
      type: 'numberInput',
      displayName: 'Border radius',
      validation: {
        schema: { type: 'union', schemas: [{ type: 'string' }, { type: 'number' }] },
        defaultValue: 6,
      },
      accordian: 'Container',
      prefixIcon: 'corners',
      staticText: '',
    },
    boxShadow: {
      type: 'boxShadow',
      displayName: 'Box shadow',
      validation: { schema: { type: 'union', schemas: [{ type: 'string' }, { type: 'number' }] } },
      accordian: 'Container',
    },
  },
  exposedVariables: {
    data: [{}],
    isVisible: true,
    isDisabled: false,
    isLoading: false,
    pageIndex: 1,
    selectedRecordIndex: undefined,
  },
  actions: [
    {
      handle: 'setVisibility',
      displayName: 'Set visibility',
      params: [{ handle: 'setVisibility', displayName: 'Value', defaultValue: '{{true}}', type: 'toggle' }],
    },
    {
      handle: 'setDisable',
      displayName: 'Set disable',
      params: [{ handle: 'setDisable', displayName: 'Value', defaultValue: '{{false}}', type: 'toggle' }],
    },
    {
      handle: 'setLoading',
      displayName: 'Set loading',
      params: [{ handle: 'setLoading', displayName: 'Value', defaultValue: '{{false}}', type: 'toggle' }],
    },
    {
      handle: 'setPage',
      displayName: 'Set page',
      params: [{ handle: 'page', displayName: 'Page', defaultValue: '{{1}}' }],
    },
  ],
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

      collapseWhenHidden: { value: '{{false}}' },
      disabledState: { value: '{{false}}' },
      tooltip: { value: '' },
      tooltipFormat: { value: 'plainText' },
      showBorder: { value: '{{true}}' },
      rowsPerPage: { value: '{{10}}' },
      enablePagination: { value: '{{false}}' },
      // Old look: the server merges these under every saved ListView; no gridRecordHeight, so saved grids keep rowHeight.
      showHeader: { value: '{{false}}' },
      serverSidePagination: { value: '{{false}}' },
      totalRecords: { value: '{{10}}' },
      disableRecords: { value: '{{false}}' },
    },
    events: [],
    styles: {
      backgroundColor: { value: 'var(--cc-surface1-surface)' },
      borderColor: { value: 'var(--cc-weak-border)' },
      borderRadius: { value: '{{6}}' },
      boxShadow: { value: '0px 0px 0px 0px #00000040' },
      // No record colour/border/shadow defaults: the legacy style renders from the widget's own styles.
      listStyle: { value: 'legacy' },
      gap: { value: '{{0}}' },
      recordBorderRadius: { value: '{{0}}' },
      headerBackgroundColor: { value: 'transparent' },
      headerDividerColor: { value: 'var(--cc-weak-border)' },
    },
  },
  // New look, merged over `definition` only on drop so saved ListViews keep the old one.
  creationDefinition: {
    properties: {
      data: {
        value: `{{[
    { imageURL: 'https://randomuser.me/api/portraits/men/32.jpg', name: 'Henry, Arthur', company: 'Big Kahuna Burger Ltd.', role: 'Project manager' },
    { imageURL: 'https://randomuser.me/api/portraits/women/44.jpg', name: 'Cooper, Kristin', company: 'Barone LLC.', role: 'Chief executive officer' },
    { imageURL: 'https://randomuser.me/api/portraits/men/75.jpg', name: 'Black, Marvin', company: 'Abstergo Ltd.', role: 'Systems analyst' },
    { imageURL: 'https://randomuser.me/api/portraits/women/12.jpg', name: 'Nguyen, Shane', company: 'Binford Ltd.', role: 'Marketing director' },
    { imageURL: 'https://randomuser.me/api/portraits/women/65.jpg', name: 'Flores, Juanita', company: 'Acme Co.', role: 'Sociologist' },
    { imageURL: 'https://randomuser.me/api/portraits/women/26.jpg', name: 'Miles, Esther', company: 'Biffco Enterprises Ltd.', role: 'Photographer' },
    { imageURL: 'https://randomuser.me/api/portraits/women/33.jpg', name: 'Flores, Juanita', company: 'Barone LLC.', role: 'Waitress' },
    { imageURL: 'https://randomuser.me/api/portraits/women/90.jpg', name: 'Miles, Esther', company: 'Binford Ltd.', role: 'Flight engineer' },
  ]}}`,
      },
      showHeader: { value: '{{true}}' },
      rowHeight: { value: '80' },
      gridRecordHeight: { value: '170' },
    },
    styles: {
      listStyle: { value: 'bordered' },
      gap: { value: '{{12}}' },
      recordBackgroundColor: { value: 'var(--cc-surface1-surface)' },
      recordDividerColor: { value: 'var(--cc-weak-border)' },
      recordBorderColor: { value: 'var(--cc-weak-border)' },
      recordBorderRadius: { value: '{{6}}' },
    },
  },
};
