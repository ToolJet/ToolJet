// Renderable stand-in for `@react-google-maps/api` (the Google Maps wrapper).
//
// Why a stub and not a transform: the real components wrap the Google Maps JS SDK
// - they read `window.public_config.GOOGLE_MAPS_API_KEY`, inject an external
// script, and call `window.google.maps.*` - none of which jsdom provides, so a
// real map never renders under jest. Per the Map testing contract (D-01/D-03 in
// ee/test/app-builder/widgets/Map/TESTING.md) real tiles/pan/zoom/drag geometry and
// the Places service are QA/browser-owned; the engineering layer drives the
// widget's OWN handlers (onLoad, marker/polygon/map clicks, drag, search) through
// the captured props. `__getMapProps()` exposes the latest captured props so a spec
// can invoke onLoad/onClick/onDragEnd/onPlaceChanged (and read the GoogleMap `center`
// prop) without a real map. Marker/Polygon clicks are also wired to the rendered
// DOM node so a spec can `fireEvent.click` them.
const React = require('react');

let latestProps = { googleMap: {}, markers: [], polygon: {}, autocomplete: {}, loader: null };
const __getMapProps = () => latestProps;
const __resetMapProps = () => {
  latestProps = { googleMap: {}, markers: [], polygon: {}, autocomplete: {}, loader: null };
  loaderState = { isLoaded: true, loadError: undefined };
};

// useJsApiLoader fidelity: the real hook is a window-level singleton keyed by `id`
// — every Map instance shares ONE script load (the LoadScript component it replaces
// broke when a second instance mounted, e.g. a Map inside a Modal). The mock
// captures the options and returns a controllable {isLoaded, loadError} so specs
// can pin the not-yet-loaded placeholder branch.
let loaderState = { isLoaded: true, loadError: undefined };
const __setLoaderState = (next) => {
  loaderState = { isLoaded: true, loadError: undefined, ...next };
};
const useJsApiLoader = (options) => {
  latestProps.loader = options;
  return loaderState;
};

const LoadScript = ({ children }) => React.createElement(React.Fragment, null, children);

const GoogleMap = ({ children, onLoad, onClick, onDragEnd, center, ...rest }) => {
  // Lib fidelity: the real GoogleMap (componentDidUpdate -> applyUpdaterToNextProps)
  // pushes a `center` prop whose IDENTITY changed to the SDK via map.setCenter -
  // even when the coordinates are unchanged. The instance is whatever the spec hands
  // to onLoad; a fake without setCenter opts out of modeling the SDK's reaction.
  const instanceRef = React.useRef(null);
  const appliedCenterRef = React.useRef(center);
  React.useEffect(() => {
    if (appliedCenterRef.current === center) return;
    appliedCenterRef.current = center;
    instanceRef.current?.setCenter?.(center);
  });
  const handleLoad = (instance) => {
    instanceRef.current = instance;
    return onLoad?.(instance);
  };
  latestProps.googleMap = { onLoad: handleLoad, onClick, onDragEnd, center, ...rest };
  // Markers re-push on every render; reset here (the parent renders before its
  // children) so the array reflects only the current render's markers.
  latestProps.markers = [];
  return React.createElement('div', { 'data-testid': 'google-map' }, children);
};

const Marker = ({ onClick, position, label }) => {
  latestProps.markers.push({ onClick, position, label });
  return React.createElement('div', { 'data-testid': 'map-marker', onClick });
};

const Polygon = ({ onClick, path }) => {
  latestProps.polygon = { onClick, path };
  return React.createElement('div', { 'data-testid': 'map-polygon', onClick });
};

const Autocomplete = ({ children, onPlaceChanged, onLoad }) => {
  latestProps.autocomplete = { onPlaceChanged, onLoad };
  return React.createElement(React.Fragment, null, children);
};

module.exports = {
  LoadScript,
  GoogleMap,
  Marker,
  Polygon,
  Autocomplete,
  useJsApiLoader,
  __getMapProps,
  __resetMapProps,
  __setLoaderState,
};
