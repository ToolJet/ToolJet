// GENERATED from WidgetManager/shadcnSource.map.js by scripts-shadcn-literals.mjs. Do not edit by hand.
export const shadMapConfig = {
  name: 'ShadMap',
  displayName: 'Map',
  description:
    "Map with markers from rows, on open map tiles (no API key): delivery stops, stores, sites, field assets, incidents. data: rows read through latField and lngField (numbers or numeric text; rows without valid coordinates, or at exactly 0, 0, are skipped and counted in a footnote), titleField, subtitleField (a second line: the address), statusField (the pin's colour, toned by its words: Delivered green, Delayed or Pending amber, Failed red, Open, Scheduled or In transit blue; or a tone name success | warning | danger | info) and idField. A click on a marker selects it (selectedMarker: its row, selectedMarkerId), opens a popup with the title, status and popupFields (a comma list of field specs as the Record list's metaFields: 'driver', 'eta:ETA {}', 'total|currency', 'due|date:Due {}'; showPopup off for none) and fires onMarkerClick; a click on the map clears it, exposes clickedLocation { lat, lng } and fires onMapClick. clusterMarkers groups nearby markers into counts (on by default; keeps thousands of rows smooth; a click on a count zooms in). fitToMarkers (on by default) opens the map on all markers and refits when data changes; off, it opens on defaultCenter ({ lat, lng }, [lat, lng] or 'lat, lng') at defaultZoom (1 to 18; 12 is a city, 15 a street). Exposes center { lat, lng }, zoom and bounds { northEast, southWest } after every move; onBoundsChange fires when the user pans or zooms. Actions: setCenter(lat, lng, zoom), setZoom(zoom), fitBounds() (back to all markers), selectMarker(id) (opens its popup and brings it into view), clearSelection(). Tiles follow the app theme (light or dark basemap); tileUrl ({z}/{x}/{y} template) and tileAttribution override them for one widget. Height: fixed (the map fills it); give it 320 to 640px, the full height of a page column beside a list",
  component: 'ShadMap',
  defaultSize: {
    width: 20,
    height: 420,
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
    data: {
      type: 'code',
      displayName: 'Data (rows with coordinates)',
      validation: {
        schema: {
          type: 'array',
        },
        defaultValue: [],
      },
      placeholder: "[{ id: 1, name: 'Ferry Building', lat: 37.7955, lng: -122.3937, status: 'Delivered' }]",
    },
    latField: {
      type: 'code',
      displayName: 'Latitude field',
      validation: {
        schema: {
          type: 'string',
        },
        defaultValue: 'lat',
      },
    },
    lngField: {
      type: 'code',
      displayName: 'Longitude field',
      validation: {
        schema: {
          type: 'string',
        },
        defaultValue: 'lng',
      },
    },
    titleField: {
      type: 'code',
      displayName: 'Title field',
      validation: {
        schema: {
          type: 'string',
        },
        defaultValue: 'name',
      },
    },
    subtitleField: {
      type: 'code',
      displayName: 'Second line field',
      validation: {
        schema: {
          type: 'string',
        },
        defaultValue: '',
      },
    },
    statusField: {
      type: 'code',
      displayName: 'Status field (pin colour, toned by its words)',
      validation: {
        schema: {
          type: 'string',
        },
        defaultValue: 'status',
      },
    },
    idField: {
      type: 'code',
      displayName: 'Id field',
      validation: {
        schema: {
          type: 'string',
        },
        defaultValue: 'id',
      },
    },
    popupFields: {
      type: 'code',
      displayName: "Popup fields (comma list; 'eta:ETA {}', 'total|currency')",
      validation: {
        schema: {
          type: 'string',
        },
        defaultValue: '',
      },
    },
    showPopup: {
      type: 'toggle',
      displayName: 'Show a popup on marker click',
      validation: {
        schema: {
          type: 'boolean',
        },
        defaultValue: true,
      },
    },
    clusterMarkers: {
      type: 'toggle',
      displayName: 'Group nearby markers',
      validation: {
        schema: {
          type: 'boolean',
        },
        defaultValue: true,
      },
    },
    fitToMarkers: {
      type: 'toggle',
      displayName: 'Fit the view to the markers',
      validation: {
        schema: {
          type: 'boolean',
        },
        defaultValue: true,
      },
    },
    defaultCenter: {
      type: 'code',
      displayName: 'Default center ({ lat, lng })',
      validation: {
        schema: {
          type: 'union',
          schemas: [
            {
              type: 'string',
            },
            {
              type: 'array',
            },
            {
              type: 'object',
            },
          ],
        },
        defaultValue: '',
      },
      placeholder: '{{ { lat: 37.7749, lng: -122.4194 } }}',
    },
    defaultZoom: {
      type: 'code',
      displayName: 'Default zoom (1 to 18)',
      validation: {
        schema: {
          type: 'number',
        },
        defaultValue: 12,
      },
    },
    emptyText: {
      type: 'code',
      displayName: 'Empty text',
      validation: {
        schema: {
          type: 'string',
        },
        defaultValue: 'No locations to show',
      },
    },
    tileUrl: {
      type: 'code',
      displayName: 'Tile URL (empty for the default basemap)',
      validation: {
        schema: {
          type: 'string',
        },
        defaultValue: '',
      },
      placeholder: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
    },
    tileAttribution: {
      type: 'code',
      displayName: 'Tile attribution',
      validation: {
        schema: {
          type: 'string',
        },
        defaultValue: '',
      },
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
    collapseWhenHidden: {
      type: 'toggle',
      displayName: 'Collapse when hidden',
      validation: {
        schema: {
          type: 'boolean',
        },
        defaultValue: false,
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
    tooltipFormat: {
      type: 'switch',
      displayName: 'Tooltip',
      options: [
        {
          displayName: 'Plain text',
          value: 'plainText',
        },
        {
          displayName: 'Markdown',
          value: 'markdown',
        },
        {
          displayName: 'HTML',
          value: 'html',
        },
      ],
      isFxNotRequired: true,
      defaultValue: {
        value: 'plainText',
      },
      fullWidth: true,
      newLine: true,
      section: 'additionalActions',
    },
    tooltip: {
      type: 'code',
      displayName: 'Tooltip',
      validation: {
        schema: {
          type: 'string',
        },
      },
      section: 'additionalActions',
      placeholder: 'Enter tooltip text',
      showLabel: false,
    },
  },
  events: {
    onMarkerClick: {
      displayName: 'On marker click',
    },
    onMapClick: {
      displayName: 'On map click',
    },
    onBoundsChange: {
      displayName: 'On bounds change',
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
    backgroundColor: {
      type: 'colorSwatches',
      displayName: 'Background (behind the tiles)',
      validation: {
        schema: {
          type: 'string',
        },
      },
    },
    borderColor: {
      type: 'colorSwatches',
      displayName: 'Border color',
      validation: {
        schema: {
          type: 'string',
        },
      },
    },
    accentColor: {
      type: 'colorSwatches',
      displayName: 'Accent (pins without a status, groups, the selection)',
      validation: {
        schema: {
          type: 'string',
        },
      },
    },
    borderRadius: {
      type: 'numberInput',
      displayName: 'Radius',
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
      },
    },
  },
  exposedVariables: {
    isVisible: true,
    isLoading: false,
    isDisabled: false,
    selectedMarker: {},
    selectedMarkerId: null,
    clickedLocation: {},
    center: {},
    zoom: 12,
    bounds: {},
  },
  actions: [
    {
      handle: 'setCenter',
      displayName: 'Set center',
      params: [
        {
          handle: 'lat',
          displayName: 'Latitude',
          defaultValue: '{{37.7749}}',
        },
        {
          handle: 'lng',
          displayName: 'Longitude',
          defaultValue: '{{-122.4194}}',
        },
        {
          handle: 'zoom',
          displayName: 'Zoom (optional)',
          defaultValue: '',
        },
      ],
    },
    {
      handle: 'setZoom',
      displayName: 'Set zoom',
      params: [
        {
          handle: 'zoom',
          displayName: 'Zoom',
          defaultValue: '{{14}}',
        },
      ],
    },
    {
      handle: 'fitBounds',
      displayName: 'Fit to markers',
    },
    {
      handle: 'selectMarker',
      displayName: 'Select marker',
      params: [
        {
          handle: 'id',
          displayName: 'Marker id',
          defaultValue: '',
        },
      ],
    },
    {
      handle: 'clearSelection',
      displayName: 'Clear selection',
    },
    {
      handle: 'setVisibility',
      displayName: 'Set visibility',
      params: [
        {
          handle: 'value',
          displayName: 'Value',
          defaultValue: '{{true}}',
          type: 'toggle',
        },
      ],
    },
    {
      handle: 'setDisable',
      displayName: 'Set disable',
      params: [
        {
          handle: 'value',
          displayName: 'Value',
          defaultValue: '{{true}}',
          type: 'toggle',
        },
      ],
    },
    {
      handle: 'setLoading',
      displayName: 'Set loading',
      params: [
        {
          handle: 'value',
          displayName: 'Value',
          defaultValue: '{{true}}',
          type: 'toggle',
        },
      ],
    },
  ],
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
      data: {
        value:
          "{{[{ id: 'S-101', customer: 'Ferry Building Market', address: '1 Ferry Building', status: 'Delivered', eta: '9:10 AM', driver: 'Maya Chen', lat: 37.7955, lng: -122.3937 }, { id: 'S-102', customer: 'Dolores Bakery', address: '3498 18th St', status: 'Delivered', eta: '9:40 AM', driver: 'Maya Chen', lat: 37.7614, lng: -122.4269 }, { id: 'S-103', customer: 'Mission Bay Labs', address: '1700 Owens St', status: 'In transit', eta: '10:25 AM', driver: 'Owen Hart', lat: 37.7683, lng: -122.3934 }, { id: 'S-104', customer: 'Sunset Florist', address: '1101 Irving St', status: 'Delayed', eta: '11:05 AM', driver: 'Owen Hart', lat: 37.7641, lng: -122.4703 }, { id: 'S-105', customer: 'Wharf Seafood Co.', address: '2800 Leavenworth St', status: 'Scheduled', eta: '11:30 AM', driver: 'Priya Nair', lat: 37.8063, lng: -122.4182 }, { id: 'S-106', customer: 'Union Square Books', address: '345 Stockton St', status: 'Failed', eta: '10:50 AM', driver: 'Priya Nair', lat: 37.7881, lng: -122.4065 }, { id: 'S-107', customer: 'Hayes Valley Cafe', address: '432 Octavia St', status: 'Delivered', eta: '9:55 AM', driver: 'Leo Martins', lat: 37.7764, lng: -122.4241 }, { id: 'S-108', customer: 'Presidio Outfitters', address: '50 Moraga Ave', status: 'Pending', eta: '12:15 PM', driver: 'Leo Martins', lat: 37.7989, lng: -122.4662 }]}}",
      },
      latField: {
        value: 'lat',
      },
      lngField: {
        value: 'lng',
      },
      titleField: {
        value: 'customer',
      },
      subtitleField: {
        value: 'address',
      },
      statusField: {
        value: 'status',
      },
      idField: {
        value: 'id',
      },
      popupFields: {
        value: 'eta:ETA {}, driver',
      },
      showPopup: {
        value: '{{true}}',
      },
      clusterMarkers: {
        value: '{{true}}',
      },
      fitToMarkers: {
        value: '{{true}}',
      },
      defaultCenter: {
        value: '',
      },
      defaultZoom: {
        value: '{{12}}',
      },
      emptyText: {
        value: 'No locations to show',
      },
      tileUrl: {
        value: '',
      },
      tileAttribution: {
        value: '',
      },
      loadingState: {
        value: '{{false}}',
      },
      visibility: {
        value: '{{true}}',
      },
      collapseWhenHidden: {
        value: '{{false}}',
      },
      disabledState: {
        value: '{{false}}',
      },
      tooltipFormat: {
        value: 'plainText',
      },
      tooltip: {
        value: '',
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
