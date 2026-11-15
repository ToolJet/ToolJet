// Selectors for the Map widget (frontend/src/AppBuilder/Widgets/Map/Map.jsx).
// Pass the runtime name (e.g. "map1"). RenderWidget passes dataCy = componentName.
const widget = (name) => `[data-cy="draggable-widget-${name}"]`;
const container = (name) => `[data-cy="${name}"].map-widget`;

export const mapSelector = {
  // WidgetWrapper grid box — the one the layout engine sizes and moves
  draggableWidget: widget,
  // Map.jsx:238-247 — the widget root (data-disabled, inline height/display/boxShadow)
  container,
  // Map.jsx:248-256 — the centre overlay and its marker.svg image
  overlay: (name) => `${container(name)} > .map-center`,
  overlayImg: (name) => `${container(name)} > .map-center img`,
  // Map.jsx:258-269 — GoogleMap's container div (mapContainerStyle) — the real map viewport
  mapViewport: (name) => `${container(name)} > div:not(.map-center)`,
  // Google Maps SDK root inside the viewport
  gmRoot: (name) => `${container(name)} .gm-style`,
  // SDK raster tiles (maps.googleapis.com/maps/vt)
  tiles: (name) => `${container(name)} .gm-style img[src*="/maps/vt"]`,
  // SDK default (legacy google.maps.Marker) icon — one per rendered Marker (Map.jsx:282-284)
  googleMarkers: (name) => `${container(name)} .gm-style img[src*="spotlight-poi"]`,
  // Map.jsx:274-279 — the Places search input (theme.scss .place-search-input)
  searchInput: (name) => `${container(name)} .place-search-input`,
  // SDK camera control (Maps JS 3.58+): opens Zoom in / Zoom out / Move <dir> buttons
  cameraControls: (name) => `${container(name)} button[aria-label="Map camera controls"]`,
  cameraButton: (name, label) => `${container(name)} button[aria-label="${label}"]`,
  // SDK Places Autocomplete dropdown (portalled to <body>) and its rows
  pacContainer: ".pac-container",
  pacItem: ".pac-item",
  // SDK "This page can't load Google Maps correctly" dialog (unbilled / invalid key) — its OK button
  devDialogDismiss: ".dismissButton",
};
