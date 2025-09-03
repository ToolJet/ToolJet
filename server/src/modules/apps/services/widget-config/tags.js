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
  events: {
    setVisibility: { displayName: 'Set visibility' },
    setLoading: { displayName: 'Set loading' },
    setDisable: { displayName: 'Set disable' },
  },
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
          "{{ [ \n\t\t{ title: 'success', color: '#34A94733', textColor: '#34A947' }, \n\t\t{ title: 'info', color: '#405DE61A', textColor: '#405DE6'  }, \n\t\t{ title: 'warning', color: '#F357171A', textColor: '#F35717'  }, \n\t\t{ title: 'danger', color: '#EB2E3933', textColor: '#EB2E39' } ] }}",
      },
      options: {
        value: [
          {
            title: 'success',
            textColor: { value: '#34A947' },
            backgroundColor: { value: '#34A94733' },
            icon: { value: 'IconHome2' },
            visible: { value: true },
          },
          {
            title: 'info',
            textColor: { value: '#405DE6' },
            backgroundColor: { value: '#405DE61A' },
            icon: { value: 'IconInfo' },
            visible: { value: true },
          },
          {
            title: 'warning',
            textColor: { value: '#F35717' },
            backgroundColor: { value: '#F357171A' },
            icon: { value: 'IconWarning' },
            visible: { value: true },
          },
          {
            title: 'danger',
            textColor: { value: '#EB2E39' },
            backgroundColor: { value: '#EB2E3933' },
            icon: { value: 'IconDanger' },
            visible: { value: true },
          },
        ],
      },
      overflow: { value: 'wrap' },
      visibility: { value: '{{true}}' },
      disabledState: { value: '{{false}}' },
      loadingState: { value: '{{false}}' },
      tooltip: { value: '' },
    },
    events: [],
    styles: {
      padding: { value: 'default' },
      size: { value: 'small' },
      borderRadius: { value: '8' },
    },
  },
};
