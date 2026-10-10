// GENERATED from WidgetManager/antDesignSource.js by scripts-antd-literals.mjs. Do not edit by hand.
export const antTreeConfig = {
  name: 'AntTree',
  displayName: 'Tree',
  description: 'Ant Design tree (hierarchies, folders, org charts)',
  component: 'AntTree',
  defaultSize: {
    width: 12,
    height: 240,
  },
  others: {
    showOnDesktop: {
      type: 'toggle',
      displayName: 'Show on desktop',
    },
    showOnMobile: {
      type: 'toggle',
      displayName: 'Show on mobile',
    },
  },
  properties: {
    treeData: {
      type: 'code',
      displayName: 'Tree',
      validation: {
        schema: {
          type: 'array',
        },
        defaultValue: [],
      },
      placeholder: "[{ title: 'Fleet', value: 'fleet', children: [{ title: 'Seraphine', value: 'seraphine' }] }]",
    },
    checkable: {
      type: 'toggle',
      displayName: 'Checkboxes',
      validation: {
        schema: {
          type: 'boolean',
        },
        defaultValue: false,
      },
    },
    showLine: {
      type: 'toggle',
      displayName: 'Show lines',
      validation: {
        schema: {
          type: 'boolean',
        },
        defaultValue: false,
      },
    },
    defaultExpandAll: {
      type: 'toggle',
      displayName: 'Expand all by default',
      validation: {
        schema: {
          type: 'boolean',
        },
        defaultValue: false,
      },
    },
    dynamicHeight: {
      type: 'toggle',
      displayName: 'Dynamic height',
      validation: {
        schema: {
          type: 'boolean',
        },
        defaultValue: false,
      },
      section: 'additionalActions',
    },
    loadingState: {
      type: 'toggle',
      displayName: 'Loading state',
      validation: {
        schema: {
          type: 'boolean',
        },
        defaultValue: false,
      },
      section: 'additionalActions',
    },
    visibility: {
      type: 'toggle',
      displayName: 'Visibility',
      validation: {
        schema: {
          type: 'boolean',
        },
        defaultValue: true,
      },
      section: 'additionalActions',
    },
    disabledState: {
      type: 'toggle',
      displayName: 'Disable',
      validation: {
        schema: {
          type: 'boolean',
        },
        defaultValue: false,
      },
      section: 'additionalActions',
    },
  },
  events: {
    onSelect: {
      displayName: 'On select',
    },
    onCheck: {
      displayName: 'On check',
    },
  },
  styles: {
    boxShadow: {
      type: 'boxShadow',
      displayName: 'Box shadow',
      validation: {
        schema: {
          type: 'union',
          schemas: [
            {
              type: 'string',
            },
            {
              type: 'number',
            },
          ],
        },
        defaultValue: '0px 0px 0px 0px #00000040',
      },
      accordian: 'Container',
    },
  },
  exposedVariables: {
    isVisible: true,
    isLoading: false,
    isDisabled: false,
    selectedValue: '',
    selectedNode: {},
    checkedValues: [],
  },
  actions: [],
  definition: {
    others: {
      showOnDesktop: {
        value: '{{true}}',
      },
      showOnMobile: {
        value: '{{false}}',
      },
    },
    properties: {
      treeData: {
        value:
          "{{[{ title: 'Marina North', value: 'north', children: [{ title: 'Berth A1', value: 'a1' }, { title: 'Berth A2', value: 'a2' }] }, { title: 'Marina South', value: 'south', children: [{ title: 'Berth B1', value: 'b1' }] }]}}",
      },
      checkable: {
        value: '{{false}}',
      },
      showLine: {
        value: '{{false}}',
      },
      defaultExpandAll: {
        value: '{{false}}',
      },
      dynamicHeight: {
        value: '{{false}}',
      },
      loadingState: {
        value: '{{false}}',
      },
      visibility: {
        value: '{{true}}',
      },
      disabledState: {
        value: '{{false}}',
      },
    },
    events: [],
    styles: {
      boxShadow: {
        value: '0px 0px 0px 0px #00000040',
      },
    },
  },
};
