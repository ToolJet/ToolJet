export const componentTypes = [
  {
    icon: 'https://www.svgrepo.com/show/54455/table.svg',
    name: 'Table',
    displayName: 'Table',
    description: 'Display paginated tabular data',
    component: 'Table',
    properties: {
      title: { type: 'string' },
      data: { type: 'code' },
      visible: { type: 'string' },
      loadingState: { type: 'string' },
      columns: { type: 'array' }
    },
    defaultSize: {
      width: 800,
      height: 300
    },
    events: [
      'onRowClicked',
      'onBulkUpdate'
    ],
    styles: {
      textColor: { type: 'color' }
    },
    exposedVariables: {
      selectedRow: {},
      changeSet: {},
      dataUpdates: []
    },
    definition: {
      properties: {
        title: { value: 'Table' },
        visible: { value: true },
        loadingState: { value: false },
        data: { value: '{{[]}}' },
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
        }
      },
      styles: {
        textColor: { value: '' }
      }
    }
  },
  {
    icon: 'https://www.svgrepo.com/show/255901/cursor-click.svg',
    name: 'Button',
    displayName: 'Button',
    description: 'Trigger actions: queries, alerts etc',
    component: 'Button',
    defaultSize: {
      width: 80,
      height: 30
    },
    properties: {
      text: { type: 'string' },
      visible: { type: 'string' },
      loadingState: { type: 'string' }
    },
    events: [
      'onClick'
    ],
    styles: {
      backgroundColor: { type: 'color' },
      textColor: { type: 'color' }
    },
    exposedVariables: {},
    definition: {
      properties: {
        text: { value: 'Button' },
        visible: { value: true },
        loadingState: { value: false }
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
    icon: 'https://www.svgrepo.com/show/38828/text.svg',
    name: 'TextInput',
    displayName: 'Text Input',
    description: 'Text field for forms',
    component: 'TextInput',
    defaultSize: {
      width: 200,
      height: 30
    },
    properties: {
      placeholder: { type: 'string' }
    },
    events: [

    ],
    styles: {

    },
    exposedVariables: {
      value: {}
    },
    definition: {
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
    icon: 'https://www.svgrepo.com/show/14690/calendar.svg',
    name: 'Datepicker',
    displayName: 'Date Picker',
    description: 'Select a date and time',
    component: 'Datepicker',
    defaultSize: {
      width: 100,
      height: 60
    },
    properties: {
      format: { type: 'string' },
      enableTime: { type: 'string' },
      enableDate: { type: 'string' }
    },
    events: [

    ],
    styles: {

    },
    exposedVariables: {
      value: {}
    },
    definition: {
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
    icon: 'https://www.svgrepo.com/show/14690/calendar.svg',
    name: 'DateRangePicker',
    displayName: 'Date Range Picker',
    description: 'Select a date range',
    component: 'DaterangePicker',
    defaultSize: {
      width: 300,
      height: 32
    },
    properties: {
      format: { type: 'string' }
    },
    events: [

    ],
    styles: {

    },
    exposedVariables: {
      endDate: {},
      startDate: {}
    },
    definition: {
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
    icon: 'https://www.svgrepo.com/show/309414/checkbox-checked.svg',
    name: 'Checkbox',
    displayName: 'Checkbox',
    description: 'A single checkbox',
    component: 'Checkbox',
    defaultSize: {
      width: 100,
      height: 60
    },
    properties: {
      label: { type: 'string' }
    },
    events: [
      'onCheck', 'onUnCheck'
    ],
    styles: {

    },
    exposedVariables: {},
    definition: {
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

      }
    }
  },
  {
    icon: 'https://www.svgrepo.com/show/317958/editor-left.svg',
    name: 'Textarea',
    displayName: 'Textarea',
    description: 'Text area form field',
    component: 'TextArea',
    defaultSize: {
      width: 250,
      height: 100
    },
    properties: {
      value: { type: 'string' },
      placeholder: { type: 'string' }
    },
    events: [

    ],
    styles: {

    },
    exposedVariables: {
      value: {}
    },
    definition: {
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
    icon: 'https://www.svgrepo.com/show/219344/text.svg',
    name: 'Text',
    displayName: 'Text',
    description: 'Display markdown or HTML',
    component: 'Text',
    properties: {
      text: { type: 'code' },
      visible: { type: 'string' },
      loadingState: { type: 'string' }
    },
    defaultSize: {
      width: 100,
      height: 60
    },
    events: [

    ],
    styles: {
      textColor: { type: 'color' }
    },
    exposedVariables: {},
    definition: {
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
    icon: 'https://www.svgrepo.com/show/35088/image.svg',
    name: 'Image',
    displayName: 'Image',
    description: 'Display an Image',
    defaultSize: {
      width: 200,
      height: 200
    },
    component: 'Image',
    properties: {
      source: { type: 'string' },
      visible: { type: 'string' }
    },
    events: [
      'onClick'
    ],
    styles: {

    },
    exposedVariables: {},
    definition: {
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
    icon: 'https://www.svgrepo.com/show/14343/table.svg',
    name: 'Container',
    displayName: 'Container',
    description: 'Wrapper for multiple components',
    defaultSize: {
      width: 200,
      height: 200
    },
    component: 'Container',
    properties: {
      visible: { type: 'string' }
    },
    events: [

    ],
    styles: {
      backgroundColor: { type: 'color' }
    },
    exposedVariables: {},
    definition: {
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
    icon: 'https://www.svgrepo.com/show/46775/drop-down-list.svg',
    name: 'Dropdown',
    displayName: 'Dropdown Selector',
    description: 'Select one value from options',
    defaultSize: {
      width: 200,
      height: 60
    },
    component: 'DropDown',
    properties: {
      label: { type: 'string' },
      value: { type: 'string' },
      values: { type: 'json' },
      display_values: { type: 'string' }
    },
    events: [
      'onSelect'
    ],
    styles: {

    },
    exposedVariables: {
      value: {}
    },
    definition: {
      properties: {
        label: { value: 'Select' },
        value: { value: '' },
        values: { value: '[1,2,3]' },
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
    icon: 'https://www.svgrepo.com/show/16187/multiple-shots.svg',
    name: 'Multiselect',
    displayName: 'Multiselect',
    description: 'Select multiple values from options',
    defaultSize: {
      width: 200,
      height: 60
    },
    component: 'Multiselect',
    properties: {
      label: { type: 'string' },
      values: { type: 'string' },
      option_values: { type: 'string' },
      display_values: { type: 'string' }
    },
    events: [
      'onSelect'
    ],
    styles: {

    },
    exposedVariables: {
      values: {}
    },
    definition: {
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
    icon: 'https://www.svgrepo.com/show/16476/map.svg',
    name: 'Map',
    displayName: 'Map',
    description: 'Display maps with markers.',
    component: 'Map',
    properties: {
      label: { type: 'string' },
      values: { type: 'string' },
      display_values: { type: 'string' }
    },
    events: [
      'onMarkerClick', 'onMarkerCreate'
    ],
    styles: {

    },
    exposedVariables: {},
    definition: {
      properties: {
        label: { value: 'https://www.svgrepo.com/show/46775/drop-down-list.svg' },
        values: [1, 2, 3],
        display_values: ['one', 'two', 'three'],
        visible: { value: true }
      },
      events: {
        onMarkerClick: { },
        onMarkerCreate: { }
      },
      styles: {

      }
    }
  },
  {
    icon: 'https://www.svgrepo.com/show/5908/text-document.svg',
    name: 'RichTextEditor',
    displayName: 'Rich Text Editor',
    description: 'Rich text editor',
    component: 'RichTextEditor',
    defaultSize: {
      width: 250,
      height: 100
    },
    properties: {
      placeholder: { type: 'string' }
    },
    events: [

    ],
    styles: {

    },
    exposedVariables: {},
    definition: {
      properties: {
        placeholder: { value: 'Placeholder text' }
      },
      events: {

      },
      styles: {

      }
    }
  }
];
