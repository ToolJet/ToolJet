// Texts for the Map widget. Config: packages/widget-definitions/src/widgets/map.js
// Runtime: frontend/src/AppBuilder/Widgets/Map/Map.jsx (over @react-google-maps/api + the Google Maps JS SDK).
export const mapText = {
  displayName: "Map", // map.js:3
  defaultWidgetName: "map1",
  widgetPrefix: "map",
  defaultSize: { width: 16, height: 420 }, // map.js:6-9
  defaultLocation: { lat: 40.7128, lng: -73.935242 }, // map.js:144
  // Map.jsx — shown instead of the map when the server has no GOOGLE_MAPS_API_KEY
  noKeyTitle: "Add a Google Maps API key to show this map",
  noKeyHint: "Set GOOGLE_MAPS_API_KEY in the server environment, or use the ToolJet UI 2.0 Map, which needs no key.",

  // Saved definition defaults — merged under every Map that addMapsViaApi posts (map.js:137-163)
  definition: {
    others: {
      showOnDesktop: { value: "{{true}}" }, // map.js:139
      showOnMobile: { value: "{{false}}" }, // map.js:140
    },
    properties: {
      initialLocation: { value: `{{ {"lat": 40.7128, "lng": -73.935242} }}` }, // map.js:144
      defaultMarkers: { value: `{{ [{"lat": 40.7128, "lng": -73.935242}] }}` }, // map.js:147
      polygonPoints: {
        value: `{{[{"lat": 40.7032, "lng": -73.975242},{"lat": 40.7532, "lng": -73.943242},{"lat": 40.7032, "lng": -73.916242}]}}`,
      }, // map.js:150
      canSearch: { value: "{{true}}" }, // map.js:153
      addNewMarkers: { value: "{{true}}" }, // map.js:155
      collapseWhenHidden: { value: "{{false}}" }, // map.js:156
    },
    styles: {
      visibility: { value: "{{true}}" }, // map.js:160
      disabledState: { value: "{{false}}" }, // map.js:161
    },
  },

  // Runtime literals
  zoom: 12, // Map.jsx:262 GoogleMap zoom={12}
  tileSize: 256, // Google Maps world tile size (Web Mercator, 256px at zoom 0)
  searchMaxWidth: 240, // theme.scss .map-widget .place-search-input width: min(240px, calc(100% - 16px))
  searchInset: 16, // theme.scss — the calc(100% - 16px) inset
  searchPlaceholder: "Search", // Map.jsx:276 t('globals.search', 'Search')
  searchDarkClasses: ["text-light", "bg-dark", "dark-theme-placeholder"], // Map.jsx:278
  // Map.jsx:249-256 — the centre overlay: right = width*0.5 - 18, top = height*0.5 - 50, a 24x64 marker.svg
  overlay: { rightOffset: 18, topOffset: 50, imgWidth: 24, imgHeight: 64 },
  // frontend/assets/images/icons/marker.svg — viewBox 189x294, the pin tip is the bottom point (~94.9, 295)
  markerSvg: { width: 189, height: 294, tipX: 94.9, tipY: 295 },
  eventOnBoundsChange: "onBoundsChange", // map.js:96
  eventOnCreateMarker: "onCreateMarker", // map.js:97

  // Every colour of darkModeStyles (frontend/src/AppBuilder/Widgets/Map/styles.js:7-133). Map.jsx:263 hands the
  // array to the SDK as options.styles; the SDK encodes it into each styled raster tile request.
  darkStyleColors: ["#ffffff", "#000000", "#144b53", "#08304b", "#0c4152", "#0b434f", "#0b3d51", "#146474", "#021019"],

  // Places Autocomplete prediction request (Google Maps JS SDK, legacy places.Autocomplete — Map.jsx:273)
  placesPredictionPath: "/maps/api/place/js/AutocompletionService.GetPredictions",
  tilePath: "/maps/vt",
};
