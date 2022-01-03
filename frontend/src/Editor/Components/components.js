export const componentTypes = [
  {
    name: 'Table',
    displayName: 'Table',
    description: 'Display paginated tabular data',
    component: 'Table',
    properties: {
      title: { type: 'string', displayName: 'Title' },
      data: { type: 'code', displayName: 'Table data' },
      loadingState: { type: 'code', displayName: 'Loading state' },
      columns: { type: 'array', displayName: 'Table Columns' },
      serverSidePagination: { type: 'toggle', displayName: 'Server-side pagination' },
      clientSidePagination: { type: 'toggle', displayName: 'Client-side pagination' },
      serverSideSearch: { type: 'toggle', displayName: 'Server-side search' },
      actionButtonBackgroundColor: { type: 'color', displayName: 'Background color' },
      actionButtonTextColor: { type: 'color', displayName: 'Text color' },
      displaySearchBox: { type: 'toggle', displayName: 'Show search box' },
      showDownloadButton: { type: 'toggle', displayName: 'Show download button' },
      showFilterButton: { type: 'toggle', displayName: 'Show filter button' },
      showBulkUpdateActions: { type: 'toggle', displayName: 'Show bulk update actions' },
      showBulkSelector: { type: 'toggle', displayName: 'Bulk selection' },
      highlightSelectedRow: { type: 'toggle', displayName: 'Highlight selected row' },
    },
    others: {
      showOnDesktop: { type: 'toggle', displayName: 'Show on desktop ' },
      showOnMobile: { type: 'toggle', displayName: 'Show on mobile' },
    },
    defaultSize: {
      width: 20,
      height: 300,
    },
    events: {
      onRowClicked: { displayName: 'Row clicked' },
      onBulkUpdate: { displayName: 'Bulk update' },
      onPageChanged: { displayName: 'Page changed' },
      onSearch: { displayName: 'Search' },
    },
    styles: {
      textColor: { type: 'color', displayName: 'Text Color' },
      tableType: {
        type: 'select',
        displayName: 'Table type',
        options: [
          { name: 'Bordered', value: '' },
          { name: 'Borderless', value: 'table-borderless' },
          { name: 'Classic', value: 'table-classic' },
          { name: 'Striped', value: 'table-striped' },
          { name: 'Striped & bordered', value: 'table-striped table-bordered' },
        ],
      },
      cellSize: {
        type: 'select',
        displayName: 'Cell size',
        options: [
          { name: 'Compact', value: 'compact' },
          { name: 'Spacious', value: 'spacious' },
        ],
      },
      visibility: { type: 'code', displayName: 'Visibility' },
      disabledState: { type: 'code', displayName: 'Disable' },
    },
    exposedVariables: {
      selectedRow: {},
      changeSet: {},
      dataUpdates: [],
      pageIndex: 0,
      searchText: '',
      selectedRows: [],
    },
    definition: {
      others: {
        showOnDesktop: { value: true },
        showOnMobile: { value: false },
      },
      properties: {
        title: { value: 'Table' },
        visible: { value: true },
        loadingState: { value: '{{false}}' },
        data: {
          value:
            "{{ [ \n\t\t{ id: 1, name: 'Sarah', email: 'sarah@example.com'}, \n\t\t{ id: 2, name: 'Lisa', email: 'lisa@example.com'}, \n\t\t{ id: 3, name: 'Sam', email: 'sam@example.com'}, \n\t\t{ id: 4, name: 'Jon', email: 'jon@example.com'} \n] }}",
        },
        serverSidePagination: { value: false },
        clientSidePagination: { value: true },
        displaySearchBox: { value: true },
        showDownloadButton: { value: true },
        showFilterButton: { value: true },
        columns: {
          value: [
            { name: 'id', id: 'e3ecbf7fa52c4d7210a93edb8f43776267a489bad52bd108be9588f790126737' },
            { name: 'name', id: '5d2a3744a006388aadd012fcc15cc0dbcb5f9130e0fbb64c558561c97118754a' },
            { name: 'email', id: 'afc9a5091750a1bd4760e38760de3b4be11a43452ae8ae07ce2eebc569fe9a7f' },
          ],
        },
        showBulkUpdateActions: { value: true },
        showBulkSelector: { value: false },
        highlightSelectedRow: { value: false },
      },
      events: [],
      styles: {
        textColor: { value: undefined },
        visibility: { value: '{{true}}' },
        disabledState: { value: '{{false}}' },
        cellSize: { value: 'compact' },
      },
    },
  },
  {
    name: 'Button',
    displayName: 'Button',
    description: 'Trigger actions: queries, alerts etc',
    component: 'Button',
    defaultSize: {
      width: 3,
      height: 30,
    },
    others: {
      showOnDesktop: { type: 'toggle', displayName: 'Show on desktop' },
      showOnMobile: { type: 'toggle', displayName: 'Show on mobile' },
    },
    properties: {
      text: { type: 'code', displayName: 'Button Text' },
      loadingState: { type: 'code', displayName: 'Loading State' },
    },
    events: {
      onClick: { displayName: 'On click' },
    },
    styles: {
      backgroundColor: { type: 'color', displayName: 'Background color' },
      textColor: { type: 'color', displayName: 'Text color' },
      visibility: { type: 'code', displayName: 'Visibility' },
      disabledState: { type: 'code', displayName: 'Disable' },
      borderRadius: { type: 'code', displayName: 'Border radius' },
    },
    exposedVariables: {},
    definition: {
      others: {
        showOnDesktop: { value: true },
        showOnMobile: { value: false },
      },
      properties: {
        text: { value: `Button` },
        visible: { value: true },
        loadingState: { value: `{{false}}` },
      },
      events: [],
      styles: {
        backgroundColor: { value: '#375FCF' },
        textColor: { value: '#fff' },
        visibility: { value: '{{true}}' },
        borderRadius: { value: '{{0}}' },
        disabledState: { value: '{{false}}' },
      },
    },
  },
  {
    name: 'Chart',
    displayName: 'Chart',
    description: 'Display charts',
    component: 'Chart',
    defaultSize: {
      width: 20,
      height: 400,
    },
    others: {
      showOnDesktop: { type: 'toggle', displayName: 'Show on desktop' },
      showOnMobile: { type: 'toggle', displayName: 'Show on mobile' },
    },
    properties: {
      title: { type: 'code', displayName: 'Title' },
      data: { type: 'json', displayName: 'Data' },
      loadingState: { type: 'code', displayName: 'Loading State' },
      markerColor: { type: 'color', displayName: 'Marker color' },
      showGridLines: { type: 'toggle', displayName: 'Show grid lines' },
      type: {
        type: 'select',
        displayName: 'Chart type',
        options: [
          { name: 'Line', value: 'line' },
          { name: 'Bar', value: 'bar' },
          { name: 'Pie', value: 'pie' },
        ],
      },
    },
    events: {},
    styles: {
      visibility: { type: 'code', displayName: 'Visibility' },
      disabledState: { type: 'code', displayName: 'Disable' },
    },
    exposedVariables: {
      show: null,
    },
    definition: {
      others: {
        showOnDesktop: { value: true },
        showOnMobile: { value: false },
      },
      properties: {
        title: { value: 'This title can be changed' },
        markerColor: { value: '#CDE1F8' },
        showGridLines: { value: true },
        loadingState: { value: `{{false}}` },
        type: { value: `line` },
        data: {
          value: `[
  { "x": "Jan", "y": 100},
  { "x": "Feb", "y": 80},
  { "x": "Mar", "y": 40}
]`,
        },
      },
      events: [],
      styles: {
        visibility: { value: '{{true}}' },
        disabledState: { value: '{{false}}' },
      },
    },
  },
  {
    name: 'Modal',
    displayName: 'Modal',
    description: 'Modal triggered by events',
    component: 'Modal',
    defaultSize: {
      width: 10,
      height: 400,
    },
    others: {
      showOnDesktop: { type: 'toggle', displayName: 'Show on desktop' },
      showOnMobile: { type: 'toggle', displayName: 'Show on mobile' },
    },
    properties: {
      title: { type: 'code', displayName: 'Title' },
      size: {
        type: 'select',
        displayName: 'Modal size',
        options: [
          { name: 'small', value: 'sm' },
          { name: 'medium', value: 'md' },
          { name: 'large', value: 'lg' },
        ],
      },
    },
    events: {},
    styles: {
      disabledState: { type: 'code', displayName: 'Disable' },
    },
    exposedVariables: {
      show: null,
    },
    definition: {
      others: {
        showOnDesktop: { value: true },
        showOnMobile: { value: false },
      },
      properties: {
        title: { value: 'This title can be changed' },
        size: { value: 'md' },
      },
      events: [],
      styles: {
        disabledState: { value: '{{false}}' },
      },
    },
  },
  {
    name: 'TextInput',
    displayName: 'Text Input',
    description: 'Text field for forms',
    component: 'TextInput',
    defaultSize: {
      width: 4,
      height: 30,
    },
    others: {
      showOnDesktop: { type: 'toggle', displayName: 'Show on desktop' },
      showOnMobile: { type: 'toggle', displayName: 'Show on mobile' },
    },
    properties: {
      value: { type: 'code', displayName: 'Default value' },
      placeholder: { type: 'code', displayName: 'Placeholder' },
    },
    validation: {
      regex: { type: 'code', displayName: 'Regex' },
      minLength: { type: 'code', displayName: 'Min length' },
      maxLength: { type: 'code', displayName: 'Max length' },
      customRule: { type: 'code', displayName: 'Custom validation' },
    },
    events: {
      onChange: { displayName: 'On change' },
    },
    styles: {
      visibility: { type: 'code', displayName: 'Visibility' },
      disabledState: { type: 'code', displayName: 'Disable' },
    },
    exposedVariables: {
      value: '',
    },
    definition: {
      validation: {
        regex: { value: '' },
        minLength: { value: null },
        maxLength: { value: null },
        customRule: { value: null },
      },
      others: {
        showOnDesktop: { value: true },
        showOnMobile: { value: false },
      },
      properties: {
        value: { value: '' },
        placeholder: { value: 'Placeholder text' },
      },
      events: [],
      styles: {
        visibility: { value: '{{true}}' },
        disabledState: { value: '{{false}}' },
      },
    },
  },
  {
    name: 'NumberInput',
    displayName: 'Number Input',
    description: 'Number field for forms',
    component: 'NumberInput',
    defaultSize: {
      width: 4,
      height: 30,
    },
    others: {
      showOnDesktop: { type: 'toggle', displayName: 'Show on desktop' },
      showOnMobile: { type: 'toggle', displayName: 'Show on mobile' },
    },
    properties: {
      value: { type: 'code', displayName: 'Default value' },
      placeholder: { type: 'code', displayName: 'Placeholder' },
    },
    events: {},
    styles: {
      visibility: { type: 'code', displayName: 'Visibility' },
      disabledState: { type: 'code', displayName: 'Disable' },
    },
    exposedVariables: {
      value: 0,
    },
    definition: {
      others: {
        showOnDesktop: { value: true },
        showOnMobile: { value: false },
      },
      properties: {
        value: { value: '99' },
        placeholder: { value: '0' },
      },
      events: [],
      styles: {
        visibility: { value: '{{true}}' },
        disabledState: { value: '{{false}}' },
      },
    },
  },
  {
    name: 'PasswordInput',
    displayName: 'Password Input',
    description: 'Password input field for forms',
    component: 'PasswordInput',
    defaultSize: {
      width: 4,
      height: 30,
    },
    others: {
      showOnDesktop: { type: 'toggle', displayName: 'Show on desktop' },
      showOnMobile: { type: 'toggle', displayName: 'Show on mobile' },
    },
    properties: {
      placeholder: { type: 'code', displayName: 'Placeholder' },
    },
    validation: {
      regex: { type: 'code', displayName: 'Regex' },
      minLength: { type: 'code', displayName: 'Min length' },
      maxLength: { type: 'code', displayName: 'Max length' },
      customRule: { type: 'code', displayName: 'Custom validation' },
    },
    events: {},
    styles: {
      visibility: { type: 'code', displayName: 'Visibility' },
      disabledState: { type: 'code', displayName: 'Disable' },
    },
    exposedVariables: {
      value: '',
    },
    definition: {
      others: {
        showOnDesktop: { value: true },
        showOnMobile: { value: false },
      },
      properties: {
        placeholder: { value: 'password' },
      },
      validation: {
        regex: { value: '' },
        minLength: { value: null },
        maxLength: { value: null },
        customRule: { value: null },
      },
      events: [],
      styles: {
        visibility: { value: '{{true}}' },
        disabledState: { value: '{{false}}' },
      },
    },
  },
  {
    name: 'Datepicker',
    displayName: 'Date Picker',
    description: 'Select a date and time',
    component: 'Datepicker',
    defaultSize: {
      width: 4,
      height: 30,
    },
    validation: {
      customRule: { type: 'code', displayName: 'Custom validation' },
    },
    others: {
      showOnDesktop: { type: 'toggle', displayName: 'Show on desktop' },
      showOnMobile: { type: 'toggle', displayName: 'Show on mobile' },
    },
    properties: {
      defaultValue: { type: 'code', displayName: 'Default value' },
      format: { type: 'code', displayName: 'Format' },
      enableTime: { type: 'code', displayName: 'Enable time selection?' },
      enableDate: { type: 'code', displayName: 'Enable date selection?' },
    },
    events: {},
    styles: {
      visibility: { type: 'code', displayName: 'Visibility' },
      disabledState: { type: 'code', displayName: 'Disable' },
    },
    exposedVariables: {
      value: '',
    },
    definition: {
      others: {
        showOnDesktop: { value: true },
        showOnMobile: { value: false },
      },
      validation: {
        customRule: { value: null },
      },
      properties: {
        defaultValue: { value: '01/04/2021' },
        format: { value: 'DD/MM/YYYY' },
        enableTime: { value: '{{false}}' },
        enableDate: { value: '{{true}}' },
      },
      events: [],
      styles: {
        visibility: { value: '{{true}}' },
        disabledState: { value: '{{false}}' },
      },
    },
  },
  {
    name: 'Checkbox',
    displayName: 'Checkbox',
    description: 'A single checkbox',
    component: 'Checkbox',
    defaultSize: {
      width: 4,
      height: 30,
    },
    others: {
      showOnDesktop: { type: 'toggle', displayName: 'Show on desktop' },
      showOnMobile: { type: 'toggle', displayName: 'Show on mobile' },
    },
    properties: {
      label: { type: 'code', displayName: 'Label' },
    },
    events: {
      onCheck: { displayName: 'On check' },
      onUnCheck: { displayName: 'On uncheck' },
    },
    styles: {
      textColor: { type: 'color', displayName: 'Text Color' },
      checkboxColor: { type: 'color', displayName: 'Checkbox Color' },
      visibility: { type: 'code', displayName: 'Visibility' },
      disabledState: { type: 'code', displayName: 'Disable' },
    },
    exposedVariables: {},
    definition: {
      others: {
        showOnDesktop: { value: true },
        showOnMobile: { value: false },
      },
      properties: {
        label: { value: 'Checkbox label' },
      },
      events: [],
      styles: {
        textColor: { value: '#000' },
        checkboxColor: { value: '#3c92dc' },
        visibility: { value: '{{true}}' },
        disabledState: { value: '{{false}}' },
      },
    },
  },
  {
    name: 'Radio-button',
    displayName: 'Radio Button',
    description: 'Radio buttons',
    component: 'RadioButton',
    defaultSize: {
      width: 5,
      height: 30,
    },
    others: {
      showOnDesktop: { type: 'toggle', displayName: 'Show on desktop' },
      showOnMobile: { type: 'toggle', displayName: 'Show on mobile' },
    },
    properties: {
      label: { type: 'code', displayName: 'Label' },
      value: { type: 'code', displayName: 'Default value' },
      values: { type: 'code', displayName: 'Option values' },
      display_values: { type: 'code', displayName: 'Option labels' },
    },
    events: {
      onSelectionChange: { displayName: 'On select' },
    },
    styles: {
      textColor: { type: 'color', displayName: 'Text Color' },
      visibility: { type: 'code', displayName: 'Visibility' },
      disabledState: { type: 'code', displayName: 'Disable' },
    },
    exposedVariables: {},
    definition: {
      others: {
        showOnDesktop: { value: true },
        showOnMobile: { value: false },
      },
      properties: {
        label: { value: 'Select' },
        value: { value: '{{true}}' },
        values: { value: '{{[true,false]}}' },
        display_values: { value: '{{["yes", "no"]}}' },
        visible: { value: true },
      },
      events: [],
      styles: {
        textColor: { value: '#000' },
        visibility: { value: '{{true}}' },
        disabledState: { value: '{{false}}' },
      },
    },
  },
  {
    name: 'ToggleSwitch',
    displayName: 'Toggle Switch',
    description: 'Toggle Switch',
    component: 'ToggleSwitch',
    defaultSize: {
      width: 5,
      height: 30,
    },
    others: {
      showOnDesktop: { type: 'toggle', displayName: 'Show on desktop' },
      showOnMobile: { type: 'toggle', displayName: 'Show on mobile' },
    },
    properties: {
      label: { type: 'code', displayName: 'Label' },
    },
    events: {
      onChange: { displayName: 'On change' },
    },
    styles: {
      textColor: { type: 'color', displayName: 'Text Color' },
      toggleSwitchColor: { type: 'color', displayName: 'Toggle Switch Color' },
      visibility: { type: 'code', displayName: 'Visibility' },
      disabledState: { type: 'code', displayName: 'Disable' },
    },
    exposedVariables: {
      value: false,
    },
    definition: {
      others: {
        showOnDesktop: { value: true },
        showOnMobile: { value: false },
      },
      properties: {
        label: { value: 'Toggle label' },
      },
      events: [],
      styles: {
        textColor: { value: '#000' },
        toggleSwitchColor: { value: '#3c92dc' },
        visibility: { value: '{{true}}' },
        disabledState: { value: '{{false}}' },
      },
    },
  },
  {
    name: 'Textarea',
    displayName: 'Textarea',
    description: 'Text area form field',
    component: 'TextArea',
    defaultSize: {
      width: 6,
      height: 100,
    },
    others: {
      showOnDesktop: { type: 'toggle', displayName: 'Show on desktop' },
      showOnMobile: { type: 'toggle', displayName: 'Show on mobile' },
    },
    properties: {
      value: { type: 'code', displayName: 'Default value' },
      placeholder: { type: 'code', displayName: 'Placeholder' },
    },
    events: {},
    styles: {
      visibility: { type: 'code', displayName: 'Visibility' },
      disabledState: { type: 'code', displayName: 'Disable' },
    },
    exposedVariables: {
      value: {},
    },
    definition: {
      others: {
        showOnDesktop: { value: true },
        showOnMobile: { value: false },
      },
      properties: {
        value: {
          value:
            'ToolJet is an open-source low-code platform for building and deploying internal tools with minimal engineering efforts 🚀',
        },
        placeholder: { value: 'Placeholder text' },
      },
      events: [],
      styles: {
        visibility: { value: '{{true}}' },
        disabledState: { value: '{{false}}' },
      },
    },
  },
  {
    name: 'DateRangePicker',
    displayName: 'Range Picker',
    description: 'Select a date range',
    component: 'DaterangePicker',
    defaultSize: {
      width: 10,
      height: 30,
    },
    others: {
      showOnDesktop: { type: 'toggle', displayName: 'Show on desktop' },
      showOnMobile: { type: 'toggle', displayName: 'Show on mobile' },
    },
    properties: {
      format: { type: 'code', displayName: 'Format' },
    },
    events: {},
    styles: {
      visibility: { type: 'code', displayName: 'Visibility' },
      disabledState: { type: 'code', displayName: 'Disable' },
    },
    exposedVariables: {
      endDate: {},
      startDate: {},
    },
    definition: {
      others: {
        showOnDesktop: { value: true },
        showOnMobile: { value: false },
      },
      properties: {
        format: { value: 'DD/MM/YYYY' },
      },
      events: [],
      styles: {
        visibility: { value: '{{true}}' },
        disabledState: { value: '{{false}}' },
      },
    },
  },
  {
    name: 'Text',
    displayName: 'Text',
    description: 'Display markdown or HTML',
    component: 'Text',
    others: {
      showOnDesktop: { type: 'toggle', displayName: 'Show on desktop' },
      showOnMobile: { type: 'toggle', displayName: 'Show on mobile' },
    },
    properties: {
      text: { type: 'code', displayName: 'Text' },
      loadingState: { type: 'code', displayName: 'Show loading state' },
    },
    defaultSize: {
      width: 3,
      height: 30,
    },
    events: [],
    styles: {
      textColor: { type: 'color', displayName: 'Text Color' },
      visibility: { type: 'code', displayName: 'Visibility' },
      disabledState: { type: 'code', displayName: 'Disable' },
    },
    exposedVariables: {},
    definition: {
      others: {
        showOnDesktop: { value: true },
        showOnMobile: { value: false },
      },
      properties: {
        text: { value: 'Text goes here !' },
        visible: { value: true },
        loadingState: { value: `{{false}}` },
      },
      events: [],
      styles: {
        textColor: { value: '#000' },
        visibility: { value: '{{true}}' },
        disabledState: { value: '{{false}}' },
      },
    },
  },
  {
    name: 'Image',
    displayName: 'Image',
    description: 'Display an Image',
    defaultSize: {
      width: 5,
      height: 210,
    },
    component: 'Image',
    others: {
      showOnDesktop: { type: 'toggle', displayName: 'Show on desktop' },
      showOnMobile: { type: 'toggle', displayName: 'Show on mobile' },
    },
    properties: {
      source: { type: 'code', displayName: 'URL' },
    },
    events: {
      onClick: { displayName: 'On click' },
    },
    styles: {
      visibility: { type: 'code', displayName: 'Visibility' },
      disabledState: { type: 'code', displayName: 'Disable' },
    },
    exposedVariables: {},
    definition: {
      others: {
        showOnDesktop: { value: true },
        showOnMobile: { value: false },
      },
      properties: {
        source: { value: 'https://www.svgrepo.com/show/34217/image.svg' },
        visible: { value: true },
      },
      events: [],
      styles: {
        visibility: { value: '{{true}}' },
        disabledState: { value: '{{false}}' },
      },
    },
  },
  {
    name: 'Container',
    displayName: 'Container',
    description: 'Wrapper for multiple components',
    defaultSize: {
      width: 5,
      height: 200,
    },
    component: 'Container',
    others: {
      showOnDesktop: { type: 'toggle', displayName: 'Show on desktop' },
      showOnMobile: { type: 'toggle', displayName: 'Show on mobile' },
    },
    properties: {},
    events: {},
    styles: {
      backgroundColor: { type: 'color' },
      visibility: { type: 'code', displayName: 'Visibility' },
      disabledState: { type: 'code', displayName: 'Disable' },
    },
    exposedVariables: {},
    definition: {
      others: {
        showOnDesktop: { value: true },
        showOnMobile: { value: false },
      },
      properties: {
        visible: { value: true },
      },
      events: [],
      styles: {
        backgroundColor: { value: '#fff' },
        visibility: { value: '{{true}}' },
        disabledState: { value: '{{false}}' },
      },
    },
  },
  {
    name: 'Dropdown',
    displayName: 'Dropdown',
    description: 'Select one value from options',
    defaultSize: {
      width: 8,
      height: 30,
    },
    component: 'DropDown',
    others: {
      showOnDesktop: { type: 'toggle', displayName: 'Show on desktop' },
      showOnMobile: { type: 'toggle', displayName: 'Show on mobile' },
    },
    validation: {
      customRule: { type: 'code', displayName: 'Custom validation' },
    },
    properties: {
      label: { type: 'code', displayName: 'Label' },
      value: { type: 'code', displayName: 'Default value' },
      values: { type: 'code', displayName: 'Option values' },
      display_values: { type: 'code', displayName: 'Option labels' },
      loadingState: { type: 'code', displayName: 'Options loading state' },
    },
    events: {
      onSelect: { displayName: 'On select' },
      onSearchTextChanged: { displayName: 'On search text changed' },
    },
    styles: {
      visibility: { type: 'code', displayName: 'Visibility' },
      disabledState: { type: 'code', displayName: 'Disable' },
    },
    exposedVariables: {
      value: null,
      searchText: '',
    },
    definition: {
      others: {
        showOnDesktop: { value: true },
        showOnMobile: { value: false },
      },
      validation: {
        customRule: { value: null },
      },
      properties: {
        label: { value: 'Select' },
        value: { value: '{{2}}' },
        values: { value: '{{[1,2,3]}}' },
        display_values: { value: '{{["one", "two", "three"]}}' },
        visible: { value: true },
        loadingState: { value: '{{false}}' },
      },
      events: [],
      styles: {
        visibility: { value: '{{true}}' },
        disabledState: { value: '{{false}}' },
      },
    },
  },
  {
    name: 'Multiselect',
    displayName: 'Multiselect',
    description: 'Select multiple values from options',
    defaultSize: {
      width: 8,
      height: 30,
    },
    component: 'Multiselect',
    others: {
      showOnDesktop: { type: 'toggle', displayName: 'Show on desktop' },
      showOnMobile: { type: 'toggle', displayName: 'Show on mobile' },
    },
    properties: {
      label: { type: 'code', displayName: 'Label' },
      value: { type: 'code', displayName: 'Default value' },
      values: { type: 'code', displayName: 'Option values' },
      display_values: { type: 'code', displayName: 'Option labels' },
    },
    events: {
      onSelect: { displayName: 'On select' },
    },
    styles: {
      visibility: { type: 'code', displayName: 'Visibility' },
      disabledState: { type: 'code', displayName: 'Disable' },
    },
    exposedVariables: {
      values: {},
    },
    definition: {
      others: {
        showOnDesktop: { value: true },
        showOnMobile: { value: false },
      },
      properties: {
        label: { value: 'Select' },
        value: { value: '{{[2,3]}}' },
        values: { value: '{{[1,2,3]}}' },
        display_values: { value: '{{["one", "two", "three"]}}' },
        visible: { value: true },
      },
      events: [],
      styles: {
        visibility: { value: '{{true}}' },
        disabledState: { value: '{{false}}' },
      },
    },
  },
  {
    name: 'RichTextEditor',
    displayName: 'Text Editor',
    description: 'Rich text editor',
    component: 'RichTextEditor',
    defaultSize: {
      width: 16,
      height: 210,
    },
    others: {
      showOnDesktop: { type: 'toggle', displayName: 'Show on desktop' },
      showOnMobile: { type: 'toggle', displayName: 'Show on mobile' },
    },
    properties: {
      placeholder: { type: 'code', displayName: 'Placeholder' },
      defaultValue: { type: 'code', displayName: 'Default Value' },
    },
    events: {},
    styles: {
      visibility: { type: 'code', displayName: 'Visibility' },
      disabledState: { type: 'code', displayName: 'Disable' },
    },
    exposedVariables: {
      value: '',
    },
    definition: {
      others: {
        showOnDesktop: { value: true },
        showOnMobile: { value: false },
      },
      properties: {
        placeholder: { value: 'Placeholder text' },
        defaultValue: { value: '' },
      },
      events: [],
      styles: {
        visibility: { value: '{{true}}' },
        disabledState: { value: '{{false}}' },
      },
    },
  },
  {
    name: 'Map',
    displayName: 'Map',
    description: 'Display Google Maps',
    component: 'Map',
    defaultSize: {
      width: 12,
      height: 420,
    },
    others: {
      showOnDesktop: { type: 'toggle', displayName: 'Show on desktop' },
      showOnMobile: { type: 'toggle', displayName: 'Show on mobile' },
    },
    properties: {
      initialLocation: {
        type: 'code',
        displayName: 'Initial location',
        tip: 'This location will be the initial center of the map',
        options: {
          mode: 'javascript',
          theme: 'duotone-light',
          className: 'map-location-input pr-2',
        },
      },
      defaultMarkers: {
        type: 'code',
        displayName: 'Default markers',
        options: {
          mode: 'javascript',
          theme: 'duotone-light',
          className: 'map-location-input pr-2',
        },
      },
      addNewMarkers: { type: 'toggle', displayName: 'Add new markers' },
      canSearch: { type: 'toggle', displayName: 'Search for places' },
    },
    events: {
      onBoundsChange: { displayName: 'On bounds change' },
      onCreateMarker: { displayName: 'On create marker' },
      onMarkerClick: { displayName: 'On marker click' },
    },
    styles: {
      visibility: { type: 'code', displayName: 'Visibility' },
      disabledState: { type: 'code', displayName: 'Disable' },
    },
    exposedVariables: {
      center: {},
    },
    definition: {
      others: {
        showOnDesktop: { value: true },
        showOnMobile: { value: false },
      },
      properties: {
        initialLocation: {
          value: `{{ {"lat": 40.7128, "lng": -73.935242} }}`,
        },
        defaultMarkers: {
          value: `{{ [{"lat": 40.7128, "lng": -73.935242}] }}`,
        },
        canSearch: {
          value: `{{true}}`,
        },
        addNewMarkers: { value: `{{true}}` },
      },
      events: [],
      styles: {
        visibility: { value: '{{true}}' },
        disabledState: { value: '{{false}}' },
      },
    },
  },
  {
    name: 'QrScanner',
    displayName: 'QR Scanner',
    description: 'Scan QR codes and hold its data',
    component: 'QrScanner',
    defaultSize: {
      width: 10,
      height: 300,
    },
    others: {
      showOnDesktop: { type: 'toggle', displayName: 'Show on desktop' },
      showOnMobile: { type: 'toggle', displayName: 'Show on mobile' },
    },
    properties: {},
    events: {
      onDetect: { displayName: 'On detect' },
    },
    styles: {
      visibility: { type: 'code', displayName: 'Visibility' },
      disabledState: { type: 'code', displayName: 'Disable' },
    },
    exposedVariables: {
      lastDetectedValue: '',
    },
    definition: {
      others: {
        showOnDesktop: { value: true },
        showOnMobile: { value: true },
      },
      properties: {},
      events: [],
      styles: {
        visibility: { value: '{{true}}' },
        disabledState: { value: '{{false}}' },
      },
    },
  },
  {
    name: 'StarRating',
    displayName: 'Rating',
    description: 'Star rating',
    component: 'StarRating',
    defaultSize: {
      width: 8,
      height: 30,
    },
    others: {
      showOnDesktop: { type: 'toggle', displayName: 'Show on desktop' },
      showOnMobile: { type: 'toggle', displayName: 'Show on mobile' },
    },
    properties: {
      label: { type: 'code', displayName: 'Label' },
      maxRating: { type: 'code', displayName: 'Number of stars' },
      defaultSelected: { type: 'code', displayName: 'Default no of selected stars' },
      allowHalfStar: { type: 'toggle', displayName: 'Enable half star' },
      tooltips: { type: 'code', displayName: 'Tooltips' },
    },
    events: {
      onChange: { displayName: 'On Change' },
    },
    styles: {
      textColor: { type: 'color', displayName: 'Star Color' },
      labelColor: { type: 'color', displayName: 'Label Color' },
      visibility: { type: 'code', displayName: 'Visibility' },
      disabledState: { type: 'code', displayName: 'Disable' },
    },
    exposedVariables: {
      value: 0,
    },
    definition: {
      others: {
        showOnDesktop: { value: true },
        showOnMobile: { value: false },
      },
      properties: {
        label: { value: 'Select your rating' },
        maxRating: { value: '5' },
        defaultSelected: { value: '5' },
        allowHalfStar: { value: false },
        visible: { value: true },
        tooltips: { value: '{{[]}}' },
      },
      events: [],
      styles: {
        textColor: { value: '#ffb400' },
        labelColor: { value: '#333' },
        visibility: { value: '{{true}}' },
        disabledState: { value: '{{false}}' },
      },
    },
  },
  {
    name: 'Divider',
    displayName: 'Divider',
    description: 'Separator between components',
    component: 'Divider',
    defaultSize: {
      width: 10,
      height: 10,
    },
    others: {
      showOnDesktop: { type: 'toggle', displayName: 'Show on desktop' },
      showOnMobile: { type: 'toggle', displayName: 'Show on mobile' },
    },
    properties: {},
    events: {},
    styles: {
      dividerColor: { type: 'color', displayName: 'Divider Color' },
      visibility: { type: 'code', displayName: 'Visibility' },
    },
    exposedVariables: {
      value: {},
    },
    definition: {
      others: {
        showOnDesktop: { value: true },
        showOnMobile: { value: false },
      },
      properties: {},
      events: [],
      styles: {
        visibility: { value: '{{true}}' },
        dividerColor: { value: '#E7E8EA' },
      },
    },
  },
  {
    name: 'FilePicker',
    displayName: 'File Picker',
    description: 'File Picker',
    component: 'FilePicker',
    defaultSize: {
      width: 15,
      height: 100,
    },
    others: {
      showOnDesktop: { type: 'toggle', displayName: 'Show on desktop' },
      showOnMobile: { type: 'toggle', displayName: 'Show on mobile' },
    },
    properties: {
      enableDropzone: { type: 'code', displayName: 'Use Drop zone' },
      enablePicker: { type: 'code', displayName: 'Use File Picker' },
      enableMultiple: { type: 'code', displayName: 'Pick mulitple files' },
      maxFileCount: { type: 'code', displayName: 'Max file count' },
      fileType: { type: 'code', displayName: 'Accept file types' },
      maxSize: { type: 'code', displayName: 'Max size limit (Bytes)' },
      minSize: { type: 'code', displayName: 'Min size limit (Bytes)' },
    },
    events: { onFileSelected: { displayName: 'On File Selected' } },
    styles: {
      visibility: { type: 'code', displayName: 'Visibility' },
      disabledState: { type: 'code', displayName: 'Disable' },
    },
    exposedVariables: {
      file: [{ name: '', content: '', dataURL: '', type: '' }],
    },
    definition: {
      others: {
        showOnDesktop: { value: true },
        showOnMobile: { value: false },
      },
      properties: {
        enableDropzone: { value: '{{true}}' },
        enablePicker: { value: '{{true}}' },
        maxFileCount: { value: '{{2}}' },
        enableMultiple: { value: '{{false}}' },
        fileType: { value: '{{"image/*"}}' },
        maxSize: { value: '{{1048576}}' },
        minSize: { value: '{{50}}' },
      },
      events: [],
      styles: {
        visibility: { value: '{{true}}' },
        disabledState: { value: '{{false}}' },
      },
    },
  },
  {
    name: 'Calendar',
    displayName: 'Calendar',
    description: 'Calendar',
    component: 'Calendar',
    defaultSize: {
      width: 30,
      height: 600,
    },
    others: {
      showOnDesktop: { type: 'toggle', displayName: 'Show on desktop' },
      showOnMobile: { type: 'toggle', displayName: 'Show on mobile' },
    },
    properties: {
      dateFormat: { type: 'code', displayName: 'Date format' },
      defaultDate: { type: 'code', displayName: 'Default date' },
      events: { type: 'code', displayName: 'Events' },
      resources: { type: 'code', displayName: 'Resources' },
      defaultView: { type: 'code', displayName: 'Default view' },
      startTime: { type: 'code', displayName: 'Start time on week and day view' },
      endTime: { type: 'code', displayName: 'End time on week and day view' },
      displayToolbar: { type: 'toggle', displayName: 'Show toolbar' },
      displayViewSwitcher: { type: 'toggle', displayName: 'Show view switcher' },
      highlightToday: { type: 'toggle', displayName: 'Highlight today' },
      showPopOverOnEventClick: { type: 'toggle', displayName: 'Show popover when event is clicked' },
    },
    events: {
      onCalendarEventSelect: { displayName: 'On Event Select' },
      onCalendarSlotSelect: { displayName: 'On Slot Select' },
      onCalendarNavigate: { displayName: 'On Date Navigate' },
      onCalendarViewChange: { displayName: 'On View Change' },
    },
    styles: {
      visibility: { type: 'code', displayName: 'Visibility' },
      cellSizeInViewsClassifiedByResource: {
        type: 'select',
        displayName: 'Cell size in views classified by resource',
        options: [
          { name: 'Compact', value: 'compact' },
          { name: 'Spacious', value: 'spacious' },
        ],
      },
      weekDateFormat: { type: 'code', displayName: 'Header date format on week view' },
    },
    exposedVariables: {
      selectedEvent: {},
      selectedSlots: {},
      currentView: 'month',
      currentDate: undefined,
    },
    definition: {
      others: {
        showOnDesktop: { value: true },
        showOnMobile: { value: false },
      },
      properties: {
        dateFormat: {
          value: 'MM-DD-YYYY HH:mm:ss A Z',
        },
        defaultDate: {
          value: '{{moment().format("MM-DD-YYYY HH:mm:ss A Z")}}',
        },
        events: {
          value:
            "{{[\n\t\t{\n\t\t\t title: 'Sample event',\n\t\t\t start: `${moment().startOf('day').format('MM-DD-YYYY HH:mm:ss A Z')}`,\n\t\t\t end: `${moment().endOf('day').format('MM-DD-YYYY HH:mm:ss A Z')}`,\n\t\t\t allDay: false,\n\t\t\t color: '#4D72DA'\n\t\t}\n]}}",
        },
        resources: {
          value: '{{[]}}',
        },
        defaultView: {
          value: "{{'month'}}",
        },
        startTime: {
          value: "{{moment().startOf('day').format('MM-DD-YYYY HH:mm:ss A Z')}}",
        },
        endTime: {
          value: "{{moment().endOf('day').format('MM-DD-YYYY HH:mm:ss A Z')}}",
        },
        displayToolbar: {
          value: true,
        },
        displayViewSwitcher: {
          value: true,
        },
        highlightToday: {
          value: true,
        },
        showPopOverOnEventClick: {
          value: false,
        },
      },
      events: [],
      styles: {
        visibility: { value: '{{true}}' },
        cellSizeInViewsClassifiedByResource: { value: 'spacious' },
        weekDateFormat: { value: 'DD MMM' },
      },
    },
  },
  {
    name: 'Iframe',
    displayName: 'Iframe',
    description: 'Display an Iframe',
    defaultSize: {
      width: 10,
      height: 310,
    },
    component: 'IFrame',
    others: {
      showOnDesktop: { type: 'toggle', displayName: 'Show on desktop' },
      showOnMobile: { type: 'toggle', displayName: 'Show on mobile' },
    },
    properties: {
      source: { type: 'code', displayName: 'URL' },
    },
    events: {},
    styles: {
      visibility: { type: 'code', displayName: 'Visibility' },
      disabledState: { type: 'code', displayName: 'Disable' },
    },
    exposedVariables: {},
    definition: {
      others: {
        showOnDesktop: { value: true },
        showOnMobile: { value: false },
      },
      properties: {
        source: { value: 'https://tooljet.io/' },
        visible: { value: true },
      },
      events: [],
      styles: {
        visibility: { value: '{{true}}' },
        disabledState: { value: '{{false}}' },
      },
    },
  },
  {
    name: 'CodeEditor',
    displayName: 'Code Editor',
    description: 'Code Editor',
    component: 'CodeEditor',
    defaultSize: {
      width: 15,
      height: 120,
    },
    others: {
      showOnDesktop: { type: 'toggle', displayName: 'Show on desktop' },
      showOnMobile: { type: 'toggle', displayName: 'Show on mobile' },
    },
    properties: {
      enableLineNumber: { type: 'code', displayName: 'Show Line Number' },
      mode: { type: 'code', displayName: 'Mode' },
      placeholder: { type: 'code', displayName: 'Placeholder' },
    },
    events: {},
    styles: {
      visibility: { type: 'code', displayName: 'Visibility' },
      disabledState: { type: 'code', displayName: 'Disable' },
    },
    exposedVariables: {
      value: '',
    },
    definition: {
      others: {
        showOnDesktop: { value: true },
        showOnMobile: { value: false },
      },
      properties: {
        enableLineNumber: { value: '{{true}}' },
        mode: { value: 'javascript' },
        placeholder: { value: '' },
      },
      events: [],
      styles: {
        visibility: { value: '{{true}}' },
        disabledState: { value: '{{false}}' },
      },
    },
  },
  {
    name: 'Tabs',
    displayName: 'Tabs',
    description: 'Tabs component',
    defaultSize: {
      width: 30,
      height: 200,
    },
    component: 'Tabs',
    others: {
      showOnDesktop: { type: 'toggle', displayName: 'Show on desktop' },
      showOnMobile: { type: 'toggle', displayName: 'Show on mobile' },
    },
    properties: {
      tabs: { type: 'code', displayName: 'Tabs' },
      defaultTab: { type: 'code', displayName: 'Default tab' },
    },
    events: {},
    styles: {
      highlightColor: { type: 'color', displayName: 'Highlight Color' },
      visibility: { type: 'code', displayName: 'Visibility' },
      disabledState: { type: 'code', displayName: 'Disable' },
    },
    exposedVariables: {},
    definition: {
      others: {
        showOnDesktop: { value: true },
        showOnMobile: { value: false },
      },
      properties: {
        tabs: {
          value:
            "{{[ \n\t\t{ title: 'Home', id: '0' }, \n\t\t{ title: 'Profile', id: '1' }, \n\t\t{ title: 'Settings', id: '2' } \n ]}}",
        },
        defaultTab: { value: '0' },
      },
      events: [],
      styles: {
        highlightColor: { value: '#0565FE' },
        visibility: { value: '{{true}}' },
        disabledState: { value: '{{false}}' },
      },
    },
  },
  {
    name: 'Timer',
    displayName: 'Timer',
    description: 'timer',
    component: 'Timer',
    defaultSize: {
      width: 11,
      height: 128,
    },
    others: {
      showOnDesktop: { type: 'toggle', displayName: 'Show on desktop' },
      showOnMobile: { type: 'toggle', displayName: 'Show on mobile' },
    },
    properties: {
      value: { type: 'code', displayName: 'Default value' },
      type: {
        type: 'select',
        displayName: 'Timer type',
        options: [
          { name: 'Count Up', value: 'countUp' },
          { name: 'Count Down', value: 'countDown' },
        ],
      },
    },
    validation: {},
    events: {
      onStart: { displayName: 'On Start' },
      onResume: { displayName: 'On Resume' },
      onPause: { displayName: 'On Pause' },
      onCountDownFinish: { displayName: 'On Count Down Finish' },
      onReset: { displayName: 'On Reset' },
    },
    styles: {
      visibility: { type: 'code', displayName: 'Visibility' },
      disabledState: { type: 'code', displayName: 'Disable' },
    },
    exposedVariables: {
      value: '',
    },
    definition: {
      validation: {},
      others: {
        showOnDesktop: { value: true },
        showOnMobile: { value: false },
      },
      properties: {
        value: {
          value: '00:00:00:000',
        },
        type: {
          value: 'countUp',
        },
      },
      events: [],
      styles: {
        visibility: { value: '{{true}}' },
        disabledState: { value: '{{false}}' },
      },
    },
  },
];
