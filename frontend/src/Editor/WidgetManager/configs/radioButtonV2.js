export const radiobuttonV2Config = {
    name: 'Radio-button',
    displayName: 'Radio Button',
    description: 'Select one from multiple choices',
    component: 'RadioButtonV2',
    defaultSize: {
      width: 12,
      height: 40,
    },
    others: {
      showOnDesktop: { type: 'toggle', displayName: 'Show on desktop' },
      showOnMobile: { type: 'toggle', displayName: 'Show on mobile' },
    },
    validation: {
      customRule: { type: 'code', displayName: 'Custom validation' },
      mandatory: { type: 'toggle', displayName: 'Make this field mandatory' },
    },
    properties: {
      label: {
        type: 'code',
        displayName: 'Label',
        validation: {
          schema: { type: 'string' },
        },
      },
      advanced: {
        type: 'toggle',
        displayName: 'Dynamic options',
        validation: {
          schema: { type: 'boolean' },
        },
        accordian: 'Options',
      },
      value: {
        type: 'code',
        displayName: 'Default value',
        validation: {
          schema: { type: 'union', schemas: [{ type: 'string' }, { type: 'number' }, { type: 'boolean' }] },
        },
        accordian: 'Options',
      },
      values: {
        type: 'code',
        displayName: 'Option values',
        validation: {
          schema: {
            type: 'array',
            element: { type: 'union', schemas: [{ type: 'string' }, { type: 'number' }, { type: 'boolean' }] },
          },
        },
        accordian: 'Options',
      },
      display_values: {
        type: 'code',
        displayName: 'Option labels',
        validation: {
          schema: { type: 'array', element: { type: 'union', schemas: [{ type: 'string' }, { type: 'number' }] } },
        },
        accordian: 'Options',
      },
      optionsLoadingState: {
        type: 'toggle',
        displayName: 'Options loading state',
        validation: {
          schema: { type: 'boolean' },
        },
        accordian: 'Options',
      },
      loadingState: {
        type: 'toggle',
        displayName: 'Show loading state',
        validation: {
          schema: { type: 'boolean' },
        },
        section: 'additionalActions',
      },
      visibility: {
        type: 'toggle',
        displayName: 'Visibility',
        validation: {
          schema: { type: 'boolean' },
        },
        section: 'additionalActions',
      },
      disabledState: {
        type: 'toggle',
        displayName: 'Disable',
        validation: {
          schema: { type: 'boolean' },
        },
        section: 'additionalActions',
      },
      toolltip: {
        type: 'code',
        displayName: 'Tooltip',
        validation: { schema: { type: 'string' } },
        section: 'additionalActions',
      },
    },
    events: {
      onSelectionChange: { displayName: 'On select' },
    },
    styles: {
      textColor: {
        type: 'color',
        displayName: 'Color',
        validation: {
          schema: { type: 'string' },
        },
        accordian: 'label',
      },
      labelAlignment: {
        type: 'switch',
        displayName: 'Alignment',
        validation: { schema: { type: 'string' } },
        options: [
          { displayName: 'Side', value: 'side' },
          { displayName: 'Top', value: 'top' },
        ],
        accordian: 'label',
      },
      direction: {
        type: 'switch',
        displayName: 'Direction',
        validation: { schema: { type: 'string' } },
        showLabel: false,
        isIcon: true,
        options: [
          { displayName: 'alignleftinspector', value: 'alignLeft', iconName: 'alignleftinspector' },
          { displayName: 'alignrightinspector', value: 'alignRight', iconName: 'alignrightinspector' },
        ],
        accordian: 'label',
      },
      switchOffBorderColor: {
        type: 'color',
        displayName: 'Off border',
        validation: {
          schema: { type: 'string' },
        },
        accordian: 'switch',
      },
      switchOffBackgroundColor: {
        type: 'color',
        displayName: 'Off background',
        validation: {
          schema: { type: 'string' },
        },
        accordian: 'switch',
      },
      switchOnBorderColor: {
        type: 'color',
        displayName: 'On border',
        validation: {
          schema: { type: 'string' },
        },
        accordian: 'switch',
      },
      activeColor: {
        type: 'color',
        displayName: 'On background',
        validation: {
          schema: { type: 'string' },
        },
        accordian: 'switch',
      },
      handleColor: {
        type: 'color',
        displayName: 'Handle color',
        validation: {
          schema: { type: 'string' },
        },
        accordian: 'switch',
      },
      optionTextColor: {
        type: 'color',
        displayName: 'Color',
        validation: {
          schema: { type: 'string' },
        },
        accordian: 'Text',
      },
      optionAlignment: {
        type: 'switch',
        displayName: 'Alignment',
        validation: { schema: { type: 'string' } },
        options: [
          { displayName: 'Horizontal', value: 'horizontal' },
          { displayName: 'Vertical', value: 'vertical' },
        ],
        accordian: 'Text',
      },
      whileResizing: {
        type: 'switch',
        displayName: 'While Resizing',
        validation: { schema: { type: 'string' } },
        options: [
          { displayName: 'Wrap', value: 'wrap' },
          { displayName: 'Hide', value: 'hide' },
        ],
        accordian: 'Text',
      },
      padding: {
        type: 'switch',
        displayName: 'Padding',
        validation: { schema: { type: 'union', schemas: [{ type: 'string' }, { type: 'number' }] } },
        options: [
          { displayName: 'Default', value: 'default' },
          { displayName: 'None', value: 'none' },
        ],
        accordian: 'container',
      },
    },
    actions: [
      {
        handle: 'selectOption',
        displayName: 'Select Option',
        params: [
          {
            handle: 'option',
            displayName: 'Option',
          },
        ],
      },
    ],
    exposedVariables: {},
    definition: {
      others: {
        showOnDesktop: { value: '{{true}}' },
        showOnMobile: { value: '{{false}}' },
      },
      properties: {
        label: { value: 'Select' },
        value: { value: '{{"1"}}' },
        values: { value: '{{["1","2","3"]}}' },
        display_values: { value: '{{["Option1", "Option2", "Option3"]}}' },
        visibility: { value: '{{true}}' },
        disabledState: { value: '{{false}}' },
        loadingState: { value: '{{false}}' },
        optionsLoadingState: { value: '{{false}}' },
        optionVisibility: { value: '{{[true, true, true]}}' },
        optionDisable: { value: '{{[false, false, false]}}' },
        schema: {
          value:
            "{{[\t{label: 'Option1',value: '1',disable: false,visible: true,default: true},{label: 'Option2',value: '2',disable: false,visible: true},{label: 'Option3',value: '3',disable: false,visible: true}\t]}}",
        },
      },
      events: [],
      styles: {
        textColor: { value: '#11181C' },
        labelAlignment: { value: 'side' },
        direction: { value: 'alignLeft' },
        whileResizing: { value: 'wrap' },
        switchOffBorderColor: { value: '#F4F4F4' },
        switchOffBackgroundColor: { value: '#FFFFFF' },
        switchOnBorderColor: { value: '#3E63DD' },
        activeColor: { value: '#FFFFFF' },
        handleColor: { value: '#3E63DD' },
        optionTextColor: { value: '#11181C' },
        optionAlignment: { value: 'horizontal' },
        padding: { value: 'default' },
      },
    },
  }
  