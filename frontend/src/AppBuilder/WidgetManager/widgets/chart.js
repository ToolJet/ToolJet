export const chartConfig = {
  name: 'Chart',
  displayName: 'Chart',
  description: 'Visualize data',
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
    title: {
      type: 'code',
      displayName: 'Title',
      validation: {
        schema: {
          type: 'string',
        },
        defaultValue: 'This title can be changed',
      },
    },
    data: {
      type: 'json',
      displayName: 'Data',
      validation: {
        schema: { type: 'union', schemas: [{ type: 'string' }, { type: 'array' }] },
        defaultValue: '',
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
    markerColor: {
      type: 'colorSwatches',
      displayName: 'Marker color',
      validation: {
        schema: {
          type: 'string',
        },
        defaultValue: 'var(--cc-primary-brand)',
      },
    },
    showAxes: {
      type: 'toggle',
      displayName: 'Show axes',
      validation: {
        schema: {
          type: 'boolean',
        },
        defaultValue: true,
      },
    },
    showGridLines: {
      type: 'toggle',
      displayName: 'Show grid lines',
      validation: {
        schema: {
          type: 'boolean',
        },
        defaultValue: true,
      },
    },
    type: {
      type: 'select',
      displayName: 'Chart type',
      options: [
        { name: 'Line', value: 'line' },
        { name: 'Bar', value: 'bar' },
        { name: 'Pie', value: 'pie' },
      ],
      validation: {
        schema: {
          type: 'union',
          schemas: [{ type: 'string' }, { type: 'boolean' }, { type: 'number' }],
        },
        defaultValue: 'line',
      },
    },
    jsonDescription: {
      type: 'json',
      displayName: 'Json Description',
      validation: {
        schema: {
          type: 'union',
          schemas: [{ type: 'string' }, { type: 'object' }],
        },
        defaultValue: '{ "data": [ { "x": [ "Jan", "Feb", "Mar" ], "y": [ 100, 80, 40 ], "type": "bar" } ] }',
      },
    },
    plotFromJson: {
      type: 'toggle',
      displayName: 'Use Plotly JSON schema',
      validation: {
        schema: {
          type: 'boolean',
        },
        defaultValue: false,
      },
    },
    barmode: {
      type: 'select',
      displayName: 'Bar mode',
      options: [
        { name: 'Stack', value: 'stack' },
        { name: 'Group', value: 'group' },
        { name: 'Overlay', value: 'overlay' },
        { name: 'Relative', value: 'relative' },
      ],
      validation: {
        schema: {
          schemas: { type: 'string' },
        },
        defaultValue: 'group',
      },
    },
  },
  actions: [
    {
      handle: 'clearClickedPoint',
      displayName: 'Clear clicked point',
    },
  ],
  events: {
    onClick: { displayName: 'On data point click' },
    onDoubleClick: { displayName: 'On double click' },
  },
  styles: {
    backgroundColor: {
      type: 'colorSwatches',
      displayName: 'Background color',
      validation: { schema: { type: 'string' }, defaultValue: '#fff' },
    },
    padding: {
      type: 'code',
      displayName: 'Padding',
      validation: {
        schema: {
          type: 'union',
          schemas: [{ type: 'number' }, { type: 'string' }],
        },
        defaultValue: 50,
      },
    },
    borderRadius: {
      type: 'number',
      displayName: 'Border radius',
      validation: {
        schema: { type: 'number' },
        defaultValue: 4,
      },
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
    },
  },
  exposedVariables: {
    show: null,
    chartTitle: null,
    xAxisTitle: null,
    yAxisTitle: null,
    clickedDataPoint: {},
  },
  definition: {
    others: {
      showOnDesktop: { value: '{{true}}' },
      showOnMobile: { value: '{{false}}' },
    },
    properties: {
      title: { value: 'This title can be changed' },
      markerColor: { value: 'var(--cc-primary-brand)' },
      showAxes: { value: '{{true}}' },
      showGridLines: { value: '{{true}}' },
      plotFromJson: { value: '{{false}}' },
      loadingState: { value: `{{false}}` },
      barmode: { value: `group` },
      jsonDescription: {
        value: `{
              "data": [
                  {
                      "x": [
                          "Jan",
                          "Feb",
                          "Mar"
                      ],
                      "y": [
                          100,
                          80,
                          40
                      ],
                      "type": "bar"
                  }
              ]
          }`,
      },
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
      backgroundColor: { value: '#fff' },
      padding: { value: '50' },
      borderRadius: { value: '{{4}}' },
      visibility: { value: '{{true}}' },
      disabledState: { value: '{{false}}' },
    },
  },
};
