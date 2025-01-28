export const formConfig = {
  name: 'Form',
  displayName: 'Form',
  description: 'Wrapper for multiple components',
  defaultSize: {
    width: 13,
    height: 620,
  },
  defaultChildren: [
    {
      componentName: 'TextInput',
      layout: {
        top: 120,
        left: 10,
        height: 40,
        width: 25,
      },
      properties: ['placeholder', 'label'],
      styles: ['alignment', 'width'],
      defaultValue: {
        placeholder: 'Enter your name',
        label: 'Name',
        width: 40,
        alignment: 'top',
      },
    },
    {
      componentName: 'NumberInput',
      layout: {
        top: 200,
        left: 10,
        height: 40,
        width: 25,
      },
      styles: ['alignment', 'width'],
      properties: ['value', 'label'],
      defaultValue: {
        value: 24,
        label: 'Age',
        width: 40,
        alignment: 'top',
      },
    },
    {
      componentName: 'TextInput',
      layout: {
        top: 280,
        left: 10,
        height: 40,
        width: 25,
      },
      properties: ['label', 'placeholder'],
      styles: ['alignment', 'width'],
      defaultValue: {
        label: 'Name of your first pet?',
        width: 40,
        labelWidth: 100,
        alignment: 'top',
        value: 'Tommy',
      },
    },
    {
      componentName: 'TextInput',
      layout: {
        top: 360,
        left: 10,
        height: 40,
        width: 25,
      },
      properties: ['label', 'placeholder'],
      styles: ['alignment', 'width'],
      defaultValue: {
        label: 'Your favorite color?',
        width: 40,
        labelWidth: 100,
        alignment: 'top',
        placeholder: 'Orange',
      },
    },
  ],
  component: 'Form',
  others: {
    showOnDesktop: { type: 'toggle', displayName: 'Show on desktop' },
    showOnMobile: { type: 'toggle', displayName: 'Show on mobile' },
  },
  properties: {
    buttonToSubmit: {
      type: 'select',
      displayName: 'Button to submit form',
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
    loadingState: {
      type: 'toggle',
      displayName: 'Loading state',
      validation: {
        schema: { type: 'boolean' },
        defaultValue: false,
      },
    },
    advanced: {
      type: 'toggle',
      displayName: ' Use custom schema',
    },
    JSONSchema: {
      type: 'code',
      displayName: 'JSON Schema',
      conditionallyRender: {
        key: 'advanced',
        value: true,
      },
    },
  },
  events: {
    onSubmit: { displayName: 'On submit' },
    onInvalid: { displayName: 'On invalid' },
  },
  styles: {
    backgroundColor: {
      type: 'color',
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
        defaultValue: 0,
      },
    },
    borderColor: {
      type: 'color',
      displayName: 'Border color',
      validation: {
        schema: { type: 'string' },
        defaultValue: '#fff',
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
  },
  exposedVariables: {
    data: {},
    isValid: true,
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
  ],
  definition: {
    others: {
      showOnDesktop: { value: '{{true}}' },
      showOnMobile: { value: '{{false}}' },
    },
    properties: {
      loadingState: { value: '{{false}}' },
      advanced: { value: '{{false}}' },
      JSONSchema: {
        value:
          "{{ {title: 'User registration form', properties: {firstname: {type: 'textinput',value: 'Maria',label:'First name', validation:{maxLength:6}, styles: {backgroundColor: '#f6f5ff',textColor: 'black'},},lastname:{type: 'textinput',value: 'Doe', label:'Last name', styles: {backgroundColor: '#f6f5ff',textColor: 'black'},},age:{type:'number', label:'Age'},}, submitButton: {value: 'Submit', styles: {backgroundColor: '#3a433b',borderColor:'#595959'}}} }}",
      },
      buttonToSubmit: { value: '{{"none"}}' },
    },
    events: [],
    styles: {
      backgroundColor: { value: '#fff' },
      borderRadius: { value: '0' },
      borderColor: { value: '#fff' },
      visibility: { value: '{{true}}' },
      disabledState: { value: '{{false}}' },
    },
  },
};
