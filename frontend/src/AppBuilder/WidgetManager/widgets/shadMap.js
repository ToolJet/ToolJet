export const shadMapConfig = {
  name: 'ShadMap',
  displayName: 'Map',
  description:
    "Map with markers from rows, on open map tiles (no API key): delivery stops and routes, field jobs and service zones, stores, sites, listings, incidents. data: rows read through latField and lngField (numbers or numeric text; rows without valid coordinates, or at exactly 0, 0, are skipped and counted in a footnote), titleField, subtitleField (a second line: the address), statusField and idField. Pins are coloured by status: by its words (Delivered or Done green, Delayed or Pending amber, Failed or Overdue red, Open, Scheduled or In transit blue; or a tone name success | warning | danger | info), or by statusColors ({ 'Under offer': '#d97706', Open: 'warning' }); showLegend (on) lists the colours with counts. labelField puts a short value in the pin (a stop number) or, longer, a price pill ('€450k'); iconField puts a lucide icon in the pin ('snowflake', 'droplets', 'zap'); markerIcon sets one icon for every pin (iconField wins per row). headingField (degrees, 0 north, clockwise) turns the icon or image to where a vehicle is going, best with 'navigation' or 'plane'. imageField shows an image per row (an https URL, a path or a data URI, SVG included; it should point north for heading) instead of the pin, with a ring of its status colour; a broken or unsafe URL keeps the pin. markerSize: small, medium (default) or large. Routes: connectMarkers draws a line through the markers in routeOrderField order, one per routeField value (a driver, a van), from routeStart (a depot { lat, lng }) when given; routes (a second dataset) draws lines from rows { name, path: [[lat, lng], ...] or a GeoJSON LineString, color or status }; routeColors names each line's colour. Areas (zones, territories, geofences): areas rows with an outline (areaShapeField: [[lat, lng], ...], a GeoJSON Polygon or its JSON text) or a circle (lat, lng and areaRadiusField in metres), titled by areaTitleField and filled by areaStatusField's tone (or the row's color). A click on a marker selects it (selectedMarker: its row, selectedMarkerId), opens a popup with the title, status and popupFields (a comma list of field specs as the Record list's metaFields: 'driver', 'eta:ETA {}', 'total|currency'; showPopup off for none) and fires onMarkerClick; a click on a line or area exposes selectedShape (its row) and selectedShapeType ('route' | 'area') and fires onShapeClicked; a click on the map clears the selection, exposes clickedLocation { lat, lng } and fires onMapClicked. pickLocation lets the user click (or drag a pin) to choose a spot: pickedLocation { lat, lng, address } and onLocationPicked (defaultPickedLocation starts it); showSearch adds an address search box (OpenStreetMap Nominatim by default, rate-limited; geocoderUrl and reverseGeocoderUrl, with {query} or {lat} and {lng}, point it at another geocoder). display 'heat' (or 'both') draws density instead of pins, weighted by heatField. clusterMarkers groups crowded pins into counts (on by default; keeps thousands of rows smooth). fitToMarkers (on by default) opens on everything drawn and refits when data changes; off, the map opens on defaultCenter ({ lat, lng }, [lat, lng] or 'lat, lng') at defaultZoom (1 to 18; 12 is a city, 15 a street). scrollWheelZoom is off by default (the page scrolls past the map; Ctrl or Cmd with the wheel zooms); showFullscreen adds a fullscreen button; mapStyle 'satellite' shows imagery and showStyleSwitch a Map | Satellite toggle. Exposes center, zoom and bounds after every move; onBoundsChange fires when the user pans or zooms. Actions: setCenter(lat, lng, zoom), setZoom, fitBounds, selectMarker(id), clearSelection, setPickedLocation(lat, lng), clearPickedLocation, setMapStyle('streets' | 'satellite'). Height: fixed (the map fills it); give it 320 to 640px",
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
          optional: true,
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
          optional: true,
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
          optional: true,
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
          optional: true,
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
          optional: true,
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
          optional: true,
        },
        defaultValue: 'status',
      },
    },
    statusColors: {
      type: 'code',
      displayName: 'Status colours ({ Open: "#2563eb" } or tone names)',
      validation: {
        schema: {
          type: 'object',
          optional: true,
        },
        defaultValue: {},
      },
      placeholder: "{ 'Under offer': '#d97706', Reserved: 'neutral' }",
    },
    idField: {
      type: 'code',
      displayName: 'Id field',
      validation: {
        schema: {
          type: 'string',
          optional: true,
        },
        defaultValue: 'id',
      },
    },
    labelField: {
      type: 'code',
      displayName: 'Pin label field (a stop number, a price)',
      validation: {
        schema: {
          type: 'string',
          optional: true,
        },
        defaultValue: '',
      },
    },
    iconField: {
      type: 'code',
      displayName: 'Pin icon field (a lucide icon name)',
      validation: {
        schema: {
          type: 'string',
          optional: true,
        },
        defaultValue: '',
      },
    },
    markerIcon: {
      type: 'code',
      displayName: 'Icon for every pin (a lucide icon name)',
      validation: {
        schema: {
          type: 'string',
          optional: true,
        },
        defaultValue: '',
      },
    },
    headingField: {
      type: 'code',
      displayName: 'Heading field (degrees, 0 is north; turns the icon)',
      validation: {
        schema: {
          type: 'string',
          optional: true,
        },
        defaultValue: '',
      },
    },
    imageField: {
      type: 'code',
      displayName: 'Marker image field (an image URL in place of the pin)',
      validation: {
        schema: {
          type: 'string',
          optional: true,
        },
        defaultValue: '',
      },
    },
    markerSize: {
      type: 'switch',
      displayName: 'Marker size',
      options: [
        {
          displayName: 'Small',
          value: 'small',
        },
        {
          displayName: 'Medium',
          value: 'medium',
        },
        {
          displayName: 'Large',
          value: 'large',
        },
      ],
      validation: {
        schema: {
          type: 'string',
          optional: true,
        },
        defaultValue: 'medium',
      },
      isFxNotRequired: true,
      fullWidth: true,
    },
    popupFields: {
      type: 'code',
      displayName: "Popup fields (comma list; 'eta:ETA {}', 'total|currency')",
      validation: {
        schema: {
          type: 'union',
          schemas: [
            {
              type: 'array',
            },
            {
              type: 'string',
            },
          ],
          optional: true,
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
          optional: true,
        },
        defaultValue: true,
      },
    },
    showLegend: {
      type: 'toggle',
      displayName: 'Show a legend of the colours',
      validation: {
        schema: {
          type: 'boolean',
          optional: true,
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
          optional: true,
        },
        defaultValue: true,
      },
    },
    connectMarkers: {
      type: 'toggle',
      displayName: 'Connect the markers as routes',
      validation: {
        schema: {
          type: 'boolean',
          optional: true,
        },
        defaultValue: false,
      },
    },
    routeField: {
      type: 'code',
      displayName: 'Route field (one line per value)',
      validation: {
        schema: {
          type: 'string',
          optional: true,
        },
        defaultValue: '',
      },
    },
    routeOrderField: {
      type: 'code',
      displayName: 'Route order field',
      validation: {
        schema: {
          type: 'string',
          optional: true,
        },
        defaultValue: '',
      },
    },
    routeStart: {
      type: 'code',
      displayName: 'Routes start at ({ lat, lng })',
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
          optional: true,
        },
        defaultValue: '',
      },
      placeholder: '{{ { lat: 41.8868, lng: -87.6517 } }}',
    },
    routes: {
      type: 'code',
      displayName: 'Route lines (rows with a path)',
      validation: {
        schema: {
          type: 'array',
          optional: true,
        },
        defaultValue: [],
      },
      placeholder: "[{ name: 'Van 1', path: [[41.88, -87.65], [41.92, -87.64]] }]",
    },
    routeColors: {
      type: 'code',
      displayName: 'Route colours ({ "Van 1": "#4f46e5" })',
      validation: {
        schema: {
          type: 'object',
          optional: true,
        },
        defaultValue: {},
      },
    },
    areas: {
      type: 'code',
      displayName: 'Areas (zones, territories, geofences)',
      validation: {
        schema: {
          type: 'array',
          optional: true,
        },
        defaultValue: [],
      },
      placeholder: "[{ name: 'North', status: 'Busy', outline: [[30.33, -97.8], [30.45, -97.8], [30.45, -97.62]] }]",
    },
    areaShapeField: {
      type: 'code',
      displayName: 'Area outline field',
      validation: {
        schema: {
          type: 'string',
          optional: true,
        },
        defaultValue: 'outline',
      },
    },
    areaTitleField: {
      type: 'code',
      displayName: 'Area title field',
      validation: {
        schema: {
          type: 'string',
          optional: true,
        },
        defaultValue: 'name',
      },
    },
    areaStatusField: {
      type: 'code',
      displayName: 'Area status field (fill colour)',
      validation: {
        schema: {
          type: 'string',
          optional: true,
        },
        defaultValue: 'status',
      },
    },
    areaRadiusField: {
      type: 'code',
      displayName: 'Area radius field (metres, with lat and lng)',
      validation: {
        schema: {
          type: 'string',
          optional: true,
        },
        defaultValue: 'radius',
      },
    },
    display: {
      type: 'switch',
      displayName: 'Show',
      options: [
        {
          displayName: 'Pins',
          value: 'markers',
        },
        {
          displayName: 'Heat',
          value: 'heat',
        },
        {
          displayName: 'Both',
          value: 'both',
        },
      ],
      validation: {
        schema: {
          type: 'string',
          optional: true,
        },
        defaultValue: 'markers',
      },
      isFxNotRequired: true,
      fullWidth: true,
    },
    heatField: {
      type: 'code',
      displayName: 'Heat weight field (empty: each row counts once)',
      validation: {
        schema: {
          type: 'string',
          optional: true,
        },
        defaultValue: '',
      },
    },
    heatRadius: {
      type: 'code',
      displayName: 'Heat radius (px)',
      validation: {
        schema: {
          type: 'number',
          optional: true,
        },
        defaultValue: 28,
      },
    },
    pickLocation: {
      type: 'toggle',
      displayName: 'Let the user pick a location',
      validation: {
        schema: {
          type: 'boolean',
          optional: true,
        },
        defaultValue: false,
      },
    },
    defaultPickedLocation: {
      type: 'code',
      displayName: 'Picked location to start with ({ lat, lng })',
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
          optional: true,
        },
        defaultValue: '',
      },
    },
    showSearch: {
      type: 'toggle',
      displayName: 'Show an address search box',
      validation: {
        schema: {
          type: 'boolean',
          optional: true,
        },
        defaultValue: false,
      },
    },
    searchPlaceholder: {
      type: 'code',
      displayName: 'Search placeholder',
      validation: {
        schema: {
          type: 'string',
          optional: true,
        },
        defaultValue: 'Search for an address',
      },
    },
    geocoderUrl: {
      type: 'code',
      displayName: 'Geocoder URL ({query}; empty for OpenStreetMap Nominatim)',
      validation: {
        schema: {
          type: 'string',
          optional: true,
        },
        defaultValue: '',
      },
    },
    reverseGeocoderUrl: {
      type: 'code',
      displayName: 'Reverse geocoder URL ({lat}, {lng})',
      validation: {
        schema: {
          type: 'string',
          optional: true,
        },
        defaultValue: '',
      },
    },
    fitToMarkers: {
      type: 'toggle',
      displayName: 'Fit the view to what is drawn',
      validation: {
        schema: {
          type: 'boolean',
          optional: true,
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
          optional: true,
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
          optional: true,
        },
        defaultValue: 12,
      },
    },
    mapStyle: {
      type: 'switch',
      displayName: 'Map style',
      options: [
        {
          displayName: 'Streets',
          value: 'streets',
        },
        {
          displayName: 'Satellite',
          value: 'satellite',
        },
      ],
      validation: {
        schema: {
          type: 'string',
          optional: true,
        },
        defaultValue: 'streets',
      },
      isFxNotRequired: true,
      fullWidth: true,
    },
    showStyleSwitch: {
      type: 'toggle',
      displayName: 'Show a Map | Satellite switch',
      validation: {
        schema: {
          type: 'boolean',
          optional: true,
        },
        defaultValue: false,
      },
    },
    showFullscreen: {
      type: 'toggle',
      displayName: 'Show a fullscreen button',
      validation: {
        schema: {
          type: 'boolean',
          optional: true,
        },
        defaultValue: true,
      },
    },
    scrollWheelZoom: {
      type: 'toggle',
      displayName: 'Zoom with the mouse wheel',
      validation: {
        schema: {
          type: 'boolean',
          optional: true,
        },
        defaultValue: false,
      },
    },
    emptyText: {
      type: 'code',
      displayName: 'Empty text',
      validation: {
        schema: {
          type: 'string',
          optional: true,
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
          optional: true,
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
          optional: true,
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
          optional: true,
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
          optional: true,
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
          optional: true,
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
          optional: true,
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
          optional: true,
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
    onMapClicked: {
      displayName: 'On map clicked',
    },
    onShapeClicked: {
      displayName: 'On shape clicked',
    },
    onLocationPicked: {
      displayName: 'On location picked',
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
          optional: true,
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
          optional: true,
        },
      },
    },
    borderColor: {
      type: 'colorSwatches',
      displayName: 'Border color',
      validation: {
        schema: {
          type: 'string',
          optional: true,
        },
      },
    },
    accentColor: {
      type: 'colorSwatches',
      displayName: 'Accent (pins without a status, the selection)',
      validation: {
        schema: {
          type: 'string',
          optional: true,
        },
      },
    },
    clusterColor: {
      type: 'colorSwatches',
      displayName: 'Group count color',
      validation: {
        schema: {
          type: 'string',
          optional: true,
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
          optional: true,
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
    selectedShape: {},
    selectedShapeType: null,
    clickedLocation: {},
    pickedLocation: {},
    mapStyle: 'streets',
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
      handle: 'setPickedLocation',
      displayName: 'Set picked location',
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
      ],
    },
    {
      handle: 'clearPickedLocation',
      displayName: 'Clear picked location',
    },
    {
      handle: 'setMapStyle',
      displayName: 'Set map style',
      params: [
        {
          handle: 'style',
          displayName: 'Style (streets or satellite)',
          defaultValue: 'satellite',
        },
      ],
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
      statusColors: {
        value: '{{{}}}',
      },
      idField: {
        value: 'id',
      },
      labelField: {
        value: '',
      },
      iconField: {
        value: '',
      },
      markerIcon: {
        value: '',
      },
      headingField: {
        value: '',
      },
      imageField: {
        value: '',
      },
      markerSize: {
        value: 'medium',
      },
      popupFields: {
        value: 'eta:ETA {}, driver',
      },
      showPopup: {
        value: '{{true}}',
      },
      showLegend: {
        value: '{{true}}',
      },
      clusterMarkers: {
        value: '{{true}}',
      },
      connectMarkers: {
        value: '{{false}}',
      },
      routeField: {
        value: '',
      },
      routeOrderField: {
        value: '',
      },
      routeStart: {
        value: '',
      },
      routes: {
        value: '{{[]}}',
      },
      routeColors: {
        value: '{{{}}}',
      },
      areas: {
        value: '{{[]}}',
      },
      areaShapeField: {
        value: 'outline',
      },
      areaTitleField: {
        value: 'name',
      },
      areaStatusField: {
        value: 'status',
      },
      areaRadiusField: {
        value: 'radius',
      },
      display: {
        value: 'markers',
      },
      heatField: {
        value: '',
      },
      heatRadius: {
        value: '{{28}}',
      },
      pickLocation: {
        value: '{{false}}',
      },
      defaultPickedLocation: {
        value: '',
      },
      showSearch: {
        value: '{{false}}',
      },
      searchPlaceholder: {
        value: 'Search for an address',
      },
      geocoderUrl: {
        value: '',
      },
      reverseGeocoderUrl: {
        value: '',
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
      mapStyle: {
        value: 'streets',
      },
      showStyleSwitch: {
        value: '{{false}}',
      },
      showFullscreen: {
        value: '{{true}}',
      },
      scrollWheelZoom: {
        value: '{{false}}',
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
