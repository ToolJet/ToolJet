export const mapConfig = {
  name: 'Map',
  displayName: 'Map',
  description: 'Display map locations',
  component: 'Map',
  defaultSize: {
    width: 16,
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
      options: {
        mode: 'javascript',
        theme: 'duotone-light',
        className: 'map-location-input pr-2',
      },
      validation: {
        schema: {
          type: 'union',
          schemas: [{ type: 'array', element: { type: 'object' } }, { type: 'object' }],
        },
        defaultValue: `{{ {"lat": 40.7128, "lng": -73.935242} }}`,
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
      validation: {
        schema: {
          type: 'union',
          schemas: [{ type: 'array', element: { type: 'object' } }, { type: 'object' }],
        },
        defaultValue: `{{ [{"lat": 40.7128, "lng": -73.935242}] }}`,
      },
    },
    polygonPoints: {
      type: 'code',
      displayName: 'Polygon points',
      options: {
        mode: 'javascript',
        theme: 'duotone-light',
        className: 'map-location-input pr-2',
      },
      validation: {
        schema: {
          type: 'union',
          schemas: [{ type: 'array', element: { type: 'object' } }, { type: 'object' }],
        },
        defaultValue: `{{[{"lat": 40.7032, "lng": -73.975242},{"lat": 40.7532, "lng": -73.943242},{"lat": 40.7032, "lng": -73.916242}]}}`,
      },
    },
    addNewMarkers: {
      type: 'toggle',
      displayName: 'Add new markers',
      validation: {
        schema: {
          type: 'boolean',
        },
        defaultValue: true,
      },
    },
    canSearch: {
      type: 'toggle',
      displayName: 'Search for places',
      validation: {
        schema: {
          type: 'boolean',
        },
        defaultValue: true,
      },
    },
    visibility: {
      type: 'toggle',
      displayName: 'Visibility',
      validation: { schema: { type: 'boolean' }, defaultValue: true },
      section: 'additionalActions',
    },
    collapseWhenHidden: {
      type: 'toggle',
      displayName: 'Collapse when hidden',
      validation: { schema: { type: 'boolean' }, defaultValue: false },
      section: 'additionalActions',
    },
    disabledState: {
      type: 'toggle',
      displayName: 'Disable',
      validation: { schema: { type: 'boolean' }, defaultValue: false },
      section: 'additionalActions',
    },
    tooltipFormat: {
      type: 'switch',
      displayName: 'Tooltip',
      options: [
        { displayName: 'Plain text', value: 'plainText' },
        { displayName: 'Markdown', value: 'markdown' },
        { displayName: 'HTML', value: 'html' },
      ],
      isFxNotRequired: true,
      defaultValue: { value: 'plainText' },
      fullWidth: true,
      newLine: true,
      section: 'additionalActions',
    },
    tooltip: {
      type: 'code',
      displayName: 'Tooltip',
      validation: { schema: { type: 'string' }, defaultValue: 'Tooltip text' },
      section: 'additionalActions',
      placeholder: 'Enter tooltip text',
      showLabel: false,
    },
  },
  events: {
    onBoundsChange: { displayName: 'On bounds change' },
    onCreateMarker: { displayName: 'On create marker' },
    onMarkerClick: { displayName: 'On marker click' },
    onPolygonClick: { displayName: 'On polygon click' },
  },
  actions: [
    {
      handle: 'setLocation',
      displayName: 'Set Location',
      params: [
        { handle: 'lat', displayName: 'Latitude' },
        { handle: 'lng', displayName: 'Longitude' },
      ],
    },
  ],
  styles: {
    boxShadow: {
      type: 'boxShadow',
      displayName: 'Box shadow',
      validation: {
        schema: { type: 'union', schemas: [{ type: 'string' }, { type: 'number' }] },
        defaultValue: '0px 0px 0px 0px #00000040',
      },
      accordian: 'General',
    },
  },
  exposedVariables: {
    center: {},
  },
  definition: {
    others: {
      showOnDesktop: { value: '{{true}}' },
      showOnMobile: { value: '{{false}}' },
    },
    properties: {
      initialLocation: {
        value: `{{ {"lat": 40.7128, "lng": -73.935242} }}`,
      },
      defaultMarkers: {
        value: `{{ [{"lat": 40.7128, "lng": -73.935242}] }}`,
      },
      polygonPoints: {
        value: `{{[\n\t\t{"lat": 40.7032, "lng": -73.975242},\n\t\t{"lat": 40.7532, "lng": -73.943242},\n\t\t{"lat": 40.7032, "lng": -73.916242}\n]}}`,
      },
      canSearch: {
        value: `{{true}}`,
      },
      addNewMarkers: { value: `{{true}}` },
      visibility: { value: '{{true}}' },
      collapseWhenHidden: { value: '{{false}}' },
      disabledState: { value: '{{false}}' },
      tooltipFormat: { value: 'plainText' },
      tooltip: { value: '' },
    },
    events: [],
    styles: {
      boxShadow: { value: '0px 0px 0px 0px #00000040' },
    },
  },
};
