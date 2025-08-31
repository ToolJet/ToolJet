export const tagsConfig = {
  name: 'Tags',
  displayName: 'Tags',
  description: 'Display tag labels',
  component: 'Tags',
  defaultSize: {
    width: 8,
    height: 30,
  },
  others: {
    showOnDesktop: { type: 'toggle', displayName: 'Show on desktop' },
    showOnMobile: { type: 'toggle', displayName: 'Show on mobile' },
  },
  properties: {
    advanced: {
      type: 'toggle',
      displayName: 'Dynamic tags',
      validation: {
        schema: { type: 'boolean' },
        defaultValue: false,
      },
      accordian: 'Options',
    },
    data: {
      type: 'code',
      displayName: 'Tags',
      conditionallyRender: {
        key: 'advanced',
        value: false,
      },
      validation: {
        schema: {
          type: 'array',
          element: {
            type: 'object',
            object: { title: { type: 'string' }, color: { type: 'string' }, textColor: { type: 'string' } },
          },
        },
        defaultValue:
          "{{ [{ title: 'success', color: '#2fb344', textColor: '#fff' }, { title: 'info', color: '#206bc4', textColor: '#fff'  }] }}",
      },
    },
    schema: {
      type: 'code',
      displayName: 'Schema',
      conditionallyRender: {
        key: 'advanced',
        value: true,
      },
      accordian: 'Options',
    },
    overflow: {
      type: 'switch',
      displayName: 'Overflow',
      validation: { schema: { type: 'string' }, defaultValue: 'wrap' },
      options: [
        { displayName: 'Scroll', value: 'scroll' },
        { displayName: 'Wrap', value: 'wrap' },
      ],
      accordian: 'Options',
      isFxNotRequired: true,
    },
    tagColor: {
      type: 'switch',
      displayName: 'Tag color',
      validation: { schema: { type: 'string' }, defaultValue: 'Color' },
      options: [
        { displayName: 'Monochrome', value: 'monochrome' },
        { displayName: 'Color', value: 'color' },
      ],
      accordian: 'Options',
      isFxNotRequired: true,
    },
    loadingState: {
      type: 'toggle',
      displayName: 'Tag loading state',
      validation: { schema: { type: 'boolean' }, defaultValue: true },
      section: 'additionalActions',
    },
    visibility: {
      type: 'toggle',
      displayName: 'Visibility',
      validation: { schema: { type: 'boolean' }, defaultValue: true },

      section: 'additionalActions',
    },
    disabledState: {
      type: 'toggle',
      displayName: 'Disable',
      validation: { schema: { type: 'boolean' }, defaultValue: true },
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
    },
  },
  events: {},
  styles: {
    size: {
      type: 'switch',
      displayName: 'Size',
      validation: {
        schema: { type: 'union', schemas: [{ type: 'string' }, { type: 'number' }] },
        defaultValue: 'large',
      },
      options: [
        { displayName: 'Small', value: 'small' },
        { displayName: 'Large', value: 'large' },
      ],
      accordian: 'pills',
    },
    borderRadius: {
      type: 'input',
      displayName: 'Border radius',
      validation: { schema: { type: 'union', schemas: [{ type: 'string' }, { type: 'number' }] }, defaultValue: '8' },
      accordian: 'pills',
    },
    padding: {
      type: 'switch',
      displayName: 'Padding',
      validation: {
        schema: { type: 'union', schemas: [{ type: 'string' }, { type: 'number' }] },
        defaultValue: 'default',
      },
      options: [
        { displayName: 'Default', value: 'default' },
        { displayName: 'None', value: 'none' },
      ],
      accordian: 'container',
    },
  },
  exposedVariables: {},
  definition: {
    others: {
      showOnDesktop: { value: '{{true}}' },
      showOnMobile: { value: '{{false}}' },
    },
    properties: {
      advanced: { value: '{{false}}' },
      data: {
        value:
          "{{ [ \n\t\t{ title: 'success', color: '#2fb344', textColor: '#fff' }, \n\t\t{ title: 'info', color: '#206bc4', textColor: '#fff'  }, \n\t\t{ title: 'warning', color: '#f59f00', textColor: '#fff'  }, \n\t\t{ title: 'danger', color: '#d63939', textColor: '#fff' } ] }}",
      },
      options: {
        value: [
          {
            title: 'success',
            backgroundColor: { value: '#2fb344' },
            textColor: { value: '#fff' },
            icon: { value: 'IconHome2' },
            visible: { value: true },
          },
          {
            title: 'info',
            backgroundColor: { value: '#206bc4' },
            textColor: { value: '#fff' },
            icon: { value: 'IconInfo' },
            visible: { value: true },
          },
          {
            title: 'warning',
            backgroundColor: { value: '#f59f00' },
            textColor: { value: '#fff' },
            icon: { value: 'IconWarning' },
            visible: { value: true },
          },
          {
            title: 'danger',
            backgroundColor: { value: '#d63939' },
            textColor: { value: '#fff' },
            icon: { value: 'IconDanger' },
            visible: { value: true },
          },
        ],
      },
      overflow: { value: 'wrap' },
      tagColor: { value: 'color' },
      visibility: { value: '{{true}}' },
      disabledState: { value: '{{false}}' },
      loadingState: { value: '{{false}}' },
      tooltip: { value: '' },
    },
    events: [],
    styles: {
      padding: { value: 'default' },
      size: { value: 'large' },
      borderRadius: { value: '8' },
    },
  },
};
