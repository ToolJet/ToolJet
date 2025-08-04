export const formConfig = {
  name: 'Form',
  displayName: 'Form',
  description: 'Wrapper for multiple components',
  defaultSize: {
    width: 15,
    height: 450,
  },
  defaultChildren: [
    {
      componentName: 'Text',
      slotName: 'header',
      layout: {
        top: 10,
        left: 1,
        height: 40,
      },
      properties: ['text'],
      accessorKey: 'text',
      styles: ['fontWeight', 'textSize', 'textColor', 'boxShadow'],
      defaultValue: {
        text: 'Form title',
        textSize: 16,
        textColor: 'var(--cc-primary-text)',
        fontWeight: 'bold',
        boxShadow: '0px 0px 0px 0px #00000090',
      },
    },
    {
      componentName: 'Button',
      slotName: 'footer',
      layout: {
        top: 10,
        left: 29,
        height: 40,
        width: 13,
      },
      properties: ['text'],
      defaultValue: {
        text: 'Submit',
        padding: 'none',
      },
    },
  ],
  component: 'Form',
  others: {
    showOnDesktop: { type: 'toggle', displayName: 'Show on desktop' },
    showOnMobile: { type: 'toggle', displayName: 'Show on mobile' },
  },
  properties: {
    showHeader: { type: 'toggle', displayName: 'Header' },
    showFooter: { type: 'toggle', displayName: 'Footer' },
    buttonToSubmit: {
      type: 'select',
      displayName: 'Submit button',
      options: [{ name: 'None', value: 'none' }],
      validation: {
        schema: { type: 'string' },
        defaultValue: 'none',
      },
      conditionallyRender: {
        key: 'advanced',
        value: false,
      },
    },
    generateFormFrom: {
      type: 'dropdownMenu',
      displayName: 'Generate form from',
      options: [
        { name: 'Raw JSON', value: 'rawJson' },
        { name: 'JSON schema', value: 'jsonSchema' },
      ],
      section: 'data',
      validation: { schema: { type: 'union', schemas: [{ type: 'string' }, { type: 'object' }] } },
      newLine: true,
    },
    JSONData: {
      type: 'code',
      displayName: '',
      conditionallyRender: {
        key: 'generateFormFrom',
        value: 'rawJson',
      },
      section: 'data',
      showLabel: false,
      validation: {
        schema: { type: 'object' },
        defaultValue:
          "{ 'name': 'John Doe', 'age': 35, 'isActive': true, 'dob': '01-01-1990', 'hobbies': ['reading', 'gaming', 'cycling'], 'address': { 'street': '123 Main Street', 'city': 'New York' } }",
      },
    },
    newJsonSchema: {
      type: 'code',
      displayName: '',
      conditionallyRender: {
        key: 'generateFormFrom',
        value: 'jsonSchema',
      },
      section: 'data',
      showLabel: false,
      validation: {
        schema: { type: 'object' },
      },
    },
    fields: {
      type: 'array',
      displayName: 'Table Columns',
    },
    validateOnSubmit: {
      type: 'toggle',
      displayName: 'Validate all fields on submission',
      section: 'additionalActions',
      validation: {
        schema: { type: 'boolean' },
        defaultValue: true,
      },
    },
    resetOnSubmit: {
      type: 'toggle',
      displayName: 'Reset form on submission',
      section: 'additionalActions',
      validation: {
        schema: { type: 'boolean' },
        defaultValue: true,
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
    // dynamicHeight: {
    //   type: 'toggle',
    //   displayName: 'Dynamic height',
    //   validation: {
    //     schema: { type: 'boolean' },
    //     defaultValue: false,
    //   },
    //   section: 'additionalActions',
    // },
    advanced: {
      type: 'toggle',
      displayName: ' Use custom schema',
      section: 'deprecated',
    },
    JSONSchema: {
      type: 'code',
      displayName: 'JSON Schema',
      section: 'deprecated',
      conditionallyRender: {
        key: 'advanced',
        value: true,
      },
    },
    headerHeight: {
      type: 'numberInput',
      displayName: 'Header height',
      isHidden: true,
      validation: { schema: { type: 'union', schemas: [{ type: 'string' }, { type: 'number' }] }, defaultValue: 80 },
    },
    canvasHeight: {
      type: 'numberInput',
      displayName: 'Canvas height',
      isHidden: true,
      validation: { schema: { type: 'union', schemas: [{ type: 'string' }, { type: 'number' }] }, defaultValue: 80 },
    },
    footerHeight: {
      type: 'numberInput',
      displayName: 'Footer height',
      isHidden: true,
      validation: { schema: { type: 'union', schemas: [{ type: 'string' }, { type: 'number' }] }, defaultValue: 80 },
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
      validation: { schema: { type: 'string' } },
      section: 'additionalActions',
      placeholder: 'Enter tooltip text',
    },
  },
  events: {
    onSubmit: { displayName: 'On submit' },
    onInvalid: { displayName: 'On invalid' },
  },
  styles: {
    headerBackgroundColor: {
      type: 'colorSwatches',
      displayName: 'Header background color',
      validation: {
        schema: { type: 'string' },
        defaultValue: 'var(--cc-surface1-surface)',
      },
    },
    footerBackgroundColor: {
      type: 'colorSwatches',
      displayName: 'Footer background color',
      validation: {
        schema: { type: 'string' },
        defaultValue: 'var(--cc-surface1-surface)',
      },
    },
    backgroundColor: {
      type: 'colorSwatches',
      displayName: 'Background color',
      validation: {
        schema: { type: 'string' },
      },
    },
    borderRadius: {
      type: 'code',
      displayName: 'Border radius',
      validation: {
        schema: {
          type: 'union',
          schemas: [{ type: 'string' }, { type: 'number' }],
        },
        defaultValue: 6,
      },
    },
    borderColor: {
      type: 'colorSwatches',
      displayName: 'Border color',
      validation: {
        schema: { type: 'string' },
        defaultValue: '#fff',
      },
    },
  },
  exposedVariables: {
    data: {},
    isValid: true,
    isVisible: true,
    isDisabled: false,
    isLoading: false,
  },
  actions: [
    {
      handle: 'submitForm',
      displayName: 'Submit Form',
    },
    {
      handle: 'resetForm',
      displayName: 'Reset Form',
    },
    {
      handle: 'setVisibility',
      displayName: 'Set visibility',
      params: [{ handle: 'setVisibility', displayName: 'Set Visibility', defaultValue: '{{true}}', type: 'toggle' }],
    },
    {
      handle: 'setDisable',
      displayName: 'Set Disable',
      params: [{ handle: 'setDisable', displayName: 'Set Disable', defaultValue: '{{false}}', type: 'toggle' }],
    },
    {
      handle: 'setLoading',
      displayName: 'Set Loading',
      params: [{ handle: 'setLoading', displayName: 'Set Loading', defaultValue: '{{false}}', type: 'toggle' }],
    },
  ],
  definition: {
    others: {
      showOnDesktop: { value: '{{true}}' },
      showOnMobile: { value: '{{false}}' },
    },
    properties: {
      loadingState: { value: '{{false}}' },
      // dynamicHeight: { value: '{{false}}' },
      advanced: { value: '{{false}}' },
      JSONSchema: {
        value:
          "{{ {title: 'User registration form', properties: {firstname: {type: 'textinput',value: 'Maria',label:'First name', validation:{maxLength:6}, styles: {backgroundColor: '#f6f5ff',textColor: 'black'},},lastname:{type: 'textinput',value: 'Doe', label:'Last name', styles: {backgroundColor: '#f6f5ff',textColor: 'black'},},age:{type:'number', label:'Age'},}, submitButton: {value: 'Submit', styles: {backgroundColor: '#3a433b',borderColor:'#595959'}}} }}",
      },
      newJsonSchema: {
        value:
          "{{ {title: 'User registration form', properties: {firstname: {type: 'textinput',value: 'Maria',label:'First name', validation:{maxLength:6}, styles: {backgroundColor: '#f6f5ff',textColor: 'black'},},lastname:{type: 'textinput',value: 'Doe', label:'Last name', styles: {backgroundColor: '#f6f5ff',textColor: 'black'},},age:{type:'number', label:'Age'},}, submitButton: {value: 'Submit', styles: {backgroundColor: '#3a433b',borderColor:'#595959'}}} }}",
      },
      showHeader: { value: '{{true}}' },
      showFooter: { value: '{{true}}' },
      visibility: { value: '{{true}}' },
      disabledState: { value: '{{false}}' },
      headerHeight: { value: 60 },
      footerHeight: { value: 60 },
      validateOnSubmit: { value: '{{true}}' },
      resetOnSubmit: { value: '{{true}}' },
      generateFormFrom: {
        value: '',
      },
      JSONData: {
        value: {},
      },
    },
    events: [],
    styles: {
      headerBackgroundColor: { value: 'var(--cc-surface1-surface)' },
      footerBackgroundColor: { value: 'var(--cc-surface1-surface)' },
      backgroundColor: { value: 'var(--cc-surface1-surface)' },
      borderRadius: { value: '6' },
      borderColor: { value: 'var(--cc-default-border)' },
    },
  },
};
