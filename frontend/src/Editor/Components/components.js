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
      serverSidePagination: { type: 'toggle', displayName: 'Server-side pagination'},
      serverSideSearch: { type: 'toggle', displayName: 'Server-side search'},
      actionButtonBackgroundColor: { type: 'color', displayName: 'Background color'},
      actionButtonTextColor: { type: 'color', displayName: 'Text color'}
    },
    others: {
      showOnDesktop: { type: 'toggle', displayName: 'Show on desktop? '},
      showOnMobile: { type: 'toggle', displayName: 'Show on mobile?'},
    },
    defaultSize: {
      width: 810,
      height: 300
    },
    events: {
      onRowClicked: { displayName: 'On row clicked'},
      onBulkUpdate: { displayName: 'Bulk update query'},
      onPageChanged: { displayName: 'On page changed'},
      onSearch: { displayName: 'On search'}
    },
    styles: {
      textColor: { type: 'color', displayName: 'Text Color' }
    },
    exposedVariables: {
      selectedRow: {},
      changeSet: {},
      dataUpdates: [],
      pageIndex: 0,
      searchText: ''
    },
    definition: {
      others: {
        showOnDesktop: { value: true },
        showOnMobile: { value : false }
      },
      properties: {
        title: { value: 'Table' },
        visible: { value: true },
        loadingState: { value: false },
        data: { value: '{{[]}}' },
        serverSidePagination: { value: false },
        columns: {
          value: [
            { name: 'id' },
            { name: 'name' },
            { name: 'email' }
          ]
        }
      },
      events: {
        onRowClicked: {
          options: {

          }
        },
        onBulkUpdate: {
            options: {
  
            }
        },
        onPageChanged: {
            options: {
  
            }
        },
        onSearch: {
          options: {

          }
        }
      },
      styles: {
        textColor: { value: '' }
      }
    }
  },
  {
    name: 'Button',
    displayName: 'Button',
    description: 'Trigger actions: queries, alerts etc',
    component: 'Button',
    defaultSize: {
      width: 120,
      height: 30
    },
    others: {
      showOnDesktop: { type: 'toggle', displayName: 'Show on desktop? '},
      showOnMobile: { type: 'toggle', displayName: 'Show on mobile?'},
    },
    properties: {
      text: { type: 'code', displayName: 'Button Text' },
      loadingState: { type: 'code', displayName: 'Loading State'}
    },
    events: {
      onClick: { displayName: 'On click'},
    },
    styles: {
      backgroundColor: { type: 'color', displayName: 'Background color' },
      textColor: { type: 'color', displayName: 'Text color' }
    },
    exposedVariables: {},
    definition: {
      others: {
        showOnDesktop: { value: true },
        showOnMobile: { value : false }
      },
      properties: {
        text: { value: `Button` },
        visible: { value: true },
        loadingState: { value: `{{false}}` }
      },
      events: {
        onClick: {
          options: {

          }
        }
      },
      styles: {
        backgroundColor: { value: '#3c92dc' },
        textColor: { value: '#fff' }
      }
    }
  },
  {
    name: 'Chart',
    displayName: 'Chart',
    description: 'Display charts',
    component: 'Chart',
    defaultSize: {
      width: 600,
      height: 400
    },
    others: {
      showOnDesktop: { type: 'toggle', displayName: 'Show on desktop? '},
      showOnMobile: { type: 'toggle', displayName: 'Show on mobile?'},
    },
    properties: {
      title: { type: 'string', displayName: 'Title' },
      data: { type: 'json', displayName: 'Data' },
      loadingState: { type: 'code', displayName: 'Loading State'},
      markerColor: { type: 'color', displayName: 'Marker color'},
      showGridLines: { type: 'toggle', displayName: 'Show grid lines'},
      type: { type: 'select', displayName: 'Chart type', options: [
        { name: 'Line', value: 'line' },
        { name: 'Bar', value: 'bar' },
        { name: 'Pie', value: 'pie' }
      ] },
    },
    events: {},
    styles: {

    },
    exposedVariables: {
      show: null
    },
    definition: {
      others: {
        showOnDesktop: { value: true },
        showOnMobile: { value : false }
      },
      properties: {
        title: { value: 'This title can be changed' },
        markerColor: { value: '#CDE1F8' },
        showGridLines: { value: true },
        loadingState: { value: `{{false}}` },
        type: { value: `line` },
        data: { value: `[
  { "x": 100, "y": "Jan"},
  { "x": 80, "y": "Feb"}, 
  { "x": 40, "y": "Mar"}
]`}
      },
      events: {

      },
      styles: {

      }
    }
  },
  {
    name: 'Modal',
    displayName: 'Modal',
    description: 'Modal triggered by events',
    component: 'Modal',
    defaultSize: {
      width: 600,
      height: 400
    },
    others: {
      showOnDesktop: { type: 'toggle', displayName: 'Show on desktop? '},
      showOnMobile: { type: 'toggle', displayName: 'Show on mobile?'},
    },
    properties: {
      title: { type: 'string', displayName: 'Title' },
      size: { type: 'select', displayName: 'Modal size', options: [
        { name: 'small', value: 'sm' },
        { name: 'medium', value: 'md' },
        { name: 'large', value: 'lg' }
      ] },
    },
    events: {},
    styles: {

    },
    exposedVariables: {
      show: null
    },
    definition: {
      others: {
        showOnDesktop: { value: true },
        showOnMobile: { value : false }
      },
      properties: {
        title: { value: 'This title can be changed' },
        size: { value: 'md' },
      },
      events: {

      },
      styles: {

      }
    }
  },
  {
    name: 'TextInput',
    displayName: 'Text Input',
    description: 'Text field for forms',
    component: 'TextInput',
    defaultSize: {
      width: 200,
      height: 30
    },
    others: {
      showOnDesktop: { type: 'toggle', displayName: 'Show on desktop? '},
      showOnMobile: { type: 'toggle', displayName: 'Show on mobile?'},
    },
    properties: {
      placeholder: { type: 'code', displayName: 'Placeholder' }
    },
    events: {},
    styles: {

    },
    exposedVariables: {
      value: {}
    },
    definition: {
      others: {
        showOnDesktop: { value: true },
        showOnMobile: { value : false }
      },
      properties: {
        placeholder: { value: 'Placeholder text' }
      },
      events: {

      },
      styles: {

      }
    }
  },
  {
    name: 'Datepicker',
    displayName: 'Date Picker',
    description: 'Select a date and time',
    component: 'Datepicker',
    defaultSize: {
      width: 150,
      height: 30
    },
    others: {
      showOnDesktop: { type: 'toggle', displayName: 'Show on desktop? '},
      showOnMobile: { type: 'toggle', displayName: 'Show on mobile?'},
    },
    properties: {
      format: { type: 'code', displayName: 'Format' },
      enableTime: { type: 'code', displayName: 'Enable time selection?' },
      enableDate: { type: 'code', displayName: 'Enable date selection?' }
    },
    events: {},
    styles: {

    },
    exposedVariables: {
      value: {}
    },
    definition: {
      others: {
        showOnDesktop: { value: true },
        showOnMobile: { value : false }
      },
      properties: {
        format: { value: 'DD/MM/YYYY' },
        enableTime: { value: '{{false}}' },
        enableDate: { value: '{{true}}' }
      },
      events: {

      },
      styles: {

      }
    }
  },
  {
    name: 'Checkbox',
    displayName: 'Checkbox',
    description: 'A single checkbox',
    component: 'Checkbox',
    defaultSize: {
      width: 200,
      height: 25
    },
    others: {
      showOnDesktop: { type: 'toggle', displayName: 'Show on desktop? '},
      showOnMobile: { type: 'toggle', displayName: 'Show on mobile?'},
    },
    properties: {
      label: { type: 'code', displayName: 'Label' }
    },
    events: {
        onCheck: { displayName: 'On check'},
        onUnCheck: { displayName: 'On uncheck'},
    },
    styles: {
      textColor: { type: 'color', displayName: 'Text Color' }
    },
    exposedVariables: {},
    definition: {
      others: {
        showOnDesktop: { value: true },
        showOnMobile: { value : false }
      },
      properties: {
        label: { value: 'Checkbox label' }
      },
      events: {
        onCheck: {
          options: {

          }
        },
        onUnCheck: {
          options: {

          }
        }
      },
      styles: {
        textColor: { value: '#000' }
      }
    }
  },
  //drop
  {
    name: 'Radio-button',
    displayName: 'Radio Button',
    description: 'A single radio button',
    component: 'RadioButton',
    defaultSize: {
      width: 300,
      height: 25
    },
    others: {
      showOnDesktop: { type: 'toggle', displayName: 'Show on desktop? '},
      showOnMobile: { type: 'toggle', displayName: 'Show on mobile?'},
    },
    properties: {
      label: { type: 'code', displayName: 'Label' },
      value: { type: 'code', displayName: 'Default value' },
      values: { type: 'code', displayName: 'Option values' },
      display_values: { type: 'code', displayName: 'Option labels' }
    },
    events: {
      onCheck: { displayName: 'On select'},
   },
    styles: {
      textColor: { type: 'color', displayName: 'Text Color' }
    },
    exposedVariables: {},
    definition: {
      others: {
        showOnDesktop: { value: true },
        showOnMobile: { value : false }
      },
      properties: {
        label: { value: 'Select' },
        value: { value: '' },
        values: { value: '{{[1,2,3]}}' },
        display_values: { value: '{{["one", "two", "three"]}}' },
        visible: { value: true }
      },
      events: {
        onCheck: { 
          options: {

          }
        },
      },
      styles: {
        textColor: { value: '#000' }
      }
    }
  },
  {
    name: 'Textarea',
    displayName: 'Textarea',
    description: 'Text area form field',
    component: 'TextArea',
    defaultSize: {
      width: 250,
      height: 100
    },
    others: {
      showOnDesktop: { type: 'toggle', displayName: 'Show on desktop? '},
      showOnMobile: { type: 'toggle', displayName: 'Show on mobile?'},
    },
    properties: {
      value: { type: 'code', displayName: 'Default value' },
      placeholder: { type: 'code', displayName: 'Placeholder' }
    },
    events: {},
    styles: {

    },
    exposedVariables: {
      value: {}
    },
    definition: {
      others: {
        showOnDesktop: { value: true },
        showOnMobile: { value : false }
      },
      properties: {
        value: { value: '' },
        placeholder: { value: 'Placeholder text' }
      },
      events: {

      },
      styles: {

      }
    }
  },
  {
    name: 'DateRangePicker',
    displayName: 'Range Picker',
    description: 'Select a date range',
    component: 'DaterangePicker',
    defaultSize: {
      width: 300,
      height: 32
    },
    others: {
      showOnDesktop: { type: 'toggle', displayName: 'Show on desktop? '},
      showOnMobile: { type: 'toggle', displayName: 'Show on mobile?'},
    },
    properties: {
      format: { type: 'code', displayName: 'Format' }
    },
    events: {},
    styles: {

    },
    exposedVariables: {
      endDate: {},
      startDate: {}
    },
    definition: {
      others: {
        showOnDesktop: { value: true },
        showOnMobile: { value : false }
      },
      properties: {
        format: { value: 'DD/MM/YYYY' }
      },
      events: {

      },
      styles: {

      }
    }
  },
  {
    name: 'Text',
    displayName: 'Text',
    description: 'Display markdown or HTML',
    component: 'Text',
    others: {
      showOnDesktop: { type: 'toggle', displayName: 'Show on desktop? '},
      showOnMobile: { type: 'toggle', displayName: 'Show on mobile?'},
    },
    properties: {
      text: { type: 'code', displayName: 'Text' },
      loadingState: { type: 'code', displayName: 'Show loading state' }
    },
    defaultSize: {
      width: 200,
      height: 30
    },
    events: [

    ],
    styles: {
      textColor: { type: 'color', displayName: 'Text Color' }
    },
    exposedVariables: {},
    definition: {
      others: {
        showOnDesktop: { value: true },
        showOnMobile: { value : false }
      },
      properties: {
        text: { value: 'Text goes here !' },
        visible: { value: true },
        loadingState: { value: false }
      },
      events: {
        onClick: { }
      },
      styles: {
        textColor: { value: '#000' }
      }
    }
  },
  {
    name: 'Image',
    displayName: 'Image',
    description: 'Display an Image',
    defaultSize: {
      width: 200,
      height: 200
    },
    component: 'Image',
    others: {
      showOnDesktop: { type: 'toggle', displayName: 'Show on desktop? '},
      showOnMobile: { type: 'toggle', displayName: 'Show on mobile?'},
    },
    properties: {
      source: { type: 'code', displayName: 'URL' },
    },
    events: {
        onClick: { displayName: 'On click'},
    },
    styles: {

    },
    exposedVariables: {},
    definition: {
      others: {
        showOnDesktop: { value: true },
        showOnMobile: { value : false }
      },
      properties: {
        source: { value: 'https://www.svgrepo.com/show/34217/image.svg' },
        visible: { value: true }
      },
      events: {
        onClick: { }
      },
      styles: {

      }
    }
  },
  {
    name: 'Container',
    displayName: 'Container',
    description: 'Wrapper for multiple components',
    defaultSize: {
      width: 200,
      height: 200
    },
    component: 'Container',
    others: {
      showOnDesktop: { type: 'toggle', displayName: 'Show on desktop? '},
      showOnMobile: { type: 'toggle', displayName: 'Show on mobile?'},
    },
    properties: {
    },
    events: {},
    styles: {
      backgroundColor: { type: 'color' }
    },
    exposedVariables: {},
    definition: {
      others: {
        showOnDesktop: { value: true },
        showOnMobile: { value : false }
      },
      properties: {
        visible: { value: true }
      },
      events: { },
      styles: {
        backgroundColor: { value: '#fff' }
      }
    }
  },
  {
    name: 'Dropdown',
    displayName: 'Dropdown',
    description: 'Select one value from options',
    defaultSize: {
      width: 200,
      height: 37
    },
    component: 'DropDown',
    others: {
      showOnDesktop: { type: 'toggle', displayName: 'Show on desktop? '},
      showOnMobile: { type: 'toggle', displayName: 'Show on mobile?'},
    },
    properties: {
      label: { type: 'code', displayName: 'Label' },
      value: { type: 'code', displayName: 'Default value' },
      values: { type: 'code', displayName: 'Option values' },
      display_values: { type: 'code', displayName: 'Option labels' }
    },
    events: {
        onSelect: { displayName: 'On select'},
    },
    styles: {

    },
    exposedVariables: {
      value: null
    },
    definition: {
      others: {
        showOnDesktop: { value: true },
        showOnMobile: { value : false }
      },
      properties: {
        label: { value: 'Select' },
        value: { value: '' },
        values: { value: '{{[1,2,3]}}' },
        display_values: { value: '{{["one", "two", "three"]}}' },
        visible: { value: true }
      },
      events: {
        onSelect: { }
      },
      styles: {

      }
    }
  },
  {
    name: 'Multiselect',
    displayName: 'Multiselect',
    description: 'Select multiple values from options',
    defaultSize: {
      width: 200,
      height: 60
    },
    component: 'Multiselect',
    others: {
      showOnDesktop: { type: 'toggle', displayName: 'Show on desktop? '},
      showOnMobile: { type: 'toggle', displayName: 'Show on mobile?'},
    },
    properties: {
        label: { type: 'code', displayName: 'Label' },
        value: { type: 'code', displayName: 'Default value' },
        values: { type: 'code', displayName: 'Option values' },
        display_values: { type: 'code', displayName: 'Option labels' }
    },
    events: {
        onSelect: { displayName: 'On select'},
    },
    styles: {

    },
    exposedVariables: {
      values: {}
    },
    definition: {
      others: {
        showOnDesktop: { value: true },
        showOnMobile: { value : false }
      },
      properties: {
        label: { value: 'Select' },
        values: { value: '[]' },
        option_values: { value: '[1,2,3]' },
        display_values: { value: '["one", "two", "three"]' },
        visible: { value: true }
      },
      events: {
        onSelect: { }
      },
      styles: {

      }
    }
  },
  {
    name: 'RichTextEditor',
    displayName: 'Text Editor',
    description: 'Rich text editor',
    component: 'RichTextEditor',
    defaultSize: {
      width: 600,
      height: 210
    },
    others: {
      showOnDesktop: { type: 'toggle', displayName: 'Show on desktop? '},
      showOnMobile: { type: 'toggle', displayName: 'Show on mobile?'},
    },
    properties: {
      placeholder: { type: 'code', displayName: 'Placeholder' }
    },
    events: {},
    styles: {

    },
    exposedVariables: {
        value: {}
    },
    definition: {
      others: {
        showOnDesktop: { value: true },
        showOnMobile: { value : false }
      },
      properties: {
        placeholder: { value: 'Placeholder text' }
      },
      events: {
        
      },
      styles: {

      }
    }
  },
  {
    name: 'Map',
    displayName: 'Map',
    description: 'Display Google Maps',
    component: 'Map',
    defaultSize: {
      width: 400,
      height: 400
    },
    others: {
      showOnDesktop: { type: 'toggle', displayName: 'Show on desktop? '},
      showOnMobile: { type: 'toggle', displayName: 'Show on mobile?'},
    },
    properties: {
      initialLocation: { type: 'code', displayName: 'Initial location', tip: 'This location will be the initial center of the map', options: { 
        mode: 'javascript',
        theme: 'duotone-light',
        className: 'map-location-input pr-2'
      }},
      defaultMarkers: { type: 'code', displayName: 'Default markers', options: { 
        mode: 'javascript',
        theme: 'duotone-light',
        className: 'map-location-input pr-2'
      }},
      addNewMarkers: { type: 'toggle', displayName: 'Add new markers'},
      canSearch: { type: 'toggle', displayName: 'Search for places'},
    },
    events: {
      onBoundsChange: { displayName: 'On bounds change'},
      onCreateMarker: { displayName: 'On create marker'},
      onMarkerClick: { displayName: 'On marker click'},
  },
    styles: {

    },
    exposedVariables: {
        center: {}
    },
    definition: {
      others: {
        showOnDesktop: { value: true },
        showOnMobile: { value : false }
      },
      properties: {
        initialLocation: { value: `{
  "lat": 40.7128,
  "lng": -73.935242
}`},
defaultMarkers: { value: `[{
  "lat": 40.7128,
  "lng": -73.935242
}]`}
      },
      addNewMarkers: { value: '{{false}}'},
      events: {
        
      },
      styles: {

      }
    }
  },
];
