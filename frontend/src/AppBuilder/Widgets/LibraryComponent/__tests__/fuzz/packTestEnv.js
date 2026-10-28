// What a pack component needs from the browser and the host to render in jsdom, so a pack spec tests the component and
// not the test environment: Ant reads window.matchMedia on mount, the Map and Slider observe their size, Ant's charts
// draw on a canvas, the Map draws routes in SVG, and lists, kanbans and dialogs call the host's row and popup slots
// (usePackHost.jsx).

export const installBrowserStubs = () => {
  if (!window.matchMedia) {
    window.matchMedia = (query) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    });
  }
  if (!window.ResizeObserver) {
    window.ResizeObserver = class {
      observe() {}
      unobserve() {}
      disconnect() {}
    };
  }
  // A 2D context whose every method is a no-op and every property reads as one: enough for a chart to draw nothing.
  const noop = () => {};
  const context = new Proxy(
    {},
    {
      get: (_, key) =>
        key === 'measureText' ? () => ({ width: 0 }) : key === 'getImageData' ? () => ({ data: [] }) : noop,
      set: () => true,
    }
  );
  HTMLCanvasElement.prototype.getContext = () => context;
  // Leaflet draws routes and areas in SVG only where the browser has createSVGRect (every real one; jsdom lacks it),
  // and without a renderer it throws on the first line. Read when the pack loads, so this runs before that.
  if (window.SVGSVGElement && !window.SVGSVGElement.prototype.createSVGRect)
    window.SVGSVGElement.prototype.createSVGRect = () => ({ x: 0, y: 0, width: 0, height: 0 });
};

/** A host as usePackHost builds it, with no store behind it. */
export const makeHost = (name, entry) => ({
  disabled: false,
  loading: false,
  fieldId: `tj-pack-${name}`,
  useValidation: () => ({ isValid: true, error: '', required: false, touch: () => {} }),
  setRows: () => {},
  rowSlotAttr: (index) => `tj-row-${name}-${index}`,
  registerPopupSlot: () => () => {},
  popupSlotAttr: (slot) => `tj-slot-${name}-${slot}`,
  formField: !!entry?.validation,
  markRowScoped: () => {},
  resolveRow: (template) => template,
  widgetId: name,
  submitForm: () => {},
});
