// What a pack component needs from the browser and the host to render in jsdom, so a pack spec tests the component and
// not the test environment: Ant reads window.matchMedia on mount, the Map and Slider observe their size, Ant's charts
// draw on a canvas, the Map draws routes in SVG, and lists, kanbans and dialogs call the host's row and popup slots
// (usePackHost.jsx).

import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { toolJetSdk } from '@/AppBuilder/Widgets/LibraryComponent/inlineRuntime';

// Stand-ins for the SDK's hooks while a component renders alone (no ToolJet host around it), as the CLI's build
// renders it: each returns what the hook would hand over with nothing set.
const standIn = (name) => {
  if (/^useState/.test(name)) return (options) => [options?.initialValue, () => {}];
  if (/^useStyle/.test(name)) return (options) => options?.initialValue;
  if (name === 'useEventCallback') return () => () => {};
  if (name === 'useControlState') return () => ({ disabled: false, loading: false });
  if (name === 'useValidation') return () => ({ isValid: true, error: '', required: false, touch: () => {} });
  if (name === 'useRowResolver') return () => (template) => template;
  if (/Slot$/.test(name)) return () => null;
  return () => undefined;
};

/**
 * What a pack component declares with ToolJet.useComponentSettings (its role, usage and role mappings), read the way
 * the CLI's build reads it: by rendering it once.
 */
export const componentSettings = (Component) => {
  let settings;
  const spies = Object.keys(toolJetSdk)
    .filter((name) => typeof toolJetSdk[name] === 'function')
    .map((name) =>
      jest.spyOn(toolJetSdk, name).mockImplementation(
        name === 'useComponentSettings'
          ? (options) => {
              settings ??= options;
            }
          : standIn(name)
      )
    );
  const quiet = jest.spyOn(console, 'error').mockImplementation(() => {});
  try {
    renderToStaticMarkup(React.createElement(Component));
  } catch {
    // What it declared before a part that needs the browser is enough.
  } finally {
    spies.forEach((spy) => spy.mockRestore());
    quiet.mockRestore();
  }
  return settings ?? {};
};

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
