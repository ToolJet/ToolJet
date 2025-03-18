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
      tip: 'This location will be the initial center of the map',
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
    },
    events: [],
    styles: {
      visibility: { value: '{{true}}' },
      disabledState: { value: '{{false}}' },
    },
  },
};
