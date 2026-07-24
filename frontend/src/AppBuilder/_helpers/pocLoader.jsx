// ---- POC (throwaway): MANIFEST-DRIVEN registration of externally-built components ----
// A component ships { default: Component, manifest } in its bundle. This registers it with
// ZERO per-component ToolJet code: builds the widget config from the manifest and injects it
// into the same maps the built-in widgets use.
import React, { useRef, useEffect } from 'react';
import config from 'config';
import ReactDOM from 'react-dom';
import { createRoot } from 'react-dom/client';
import * as ReactJSXRuntime from 'react/jsx-runtime'; // real components (MUI etc.) require this, not just 'react'
import * as PocSDK from '@tooljet/component-sdk'; // symlinked package; host provides the single instance
import { AllComponents } from './editorHelpers';
import {
  componentTypes,
  componentTypeDefinitionMap,
  universalProps,
  combineProperties,
} from '@/AppBuilder/WidgetManager/componentTypes';
import sectionConfig from '@/AppBuilder/RightSideBar/ComponentManagerTab/sectionConfig';

window.React = React;
window.ReactDOM = ReactDOM;

const USE_SHADOW = true; // Shadow DOM style isolation (proven)

// A REAL React root INSIDE the shadow root (not a portal) → React attaches its event listeners
// inside the shadow, so complex components (MUI slider/button) get native events. The component
// owns its own emotion and points it at this shadow root. ToolJet stays emotion-free.
function ShadowMount({ children }) {
  const hostRef = useRef(null);
  const rootRef = useRef(null);
  useEffect(() => {
    const host = hostRef.current;
    if (!host || host.shadowRoot) return undefined;
    const shadow = host.attachShadow({ mode: 'open' });
    const mount = document.createElement('div');
    shadow.appendChild(mount);
    rootRef.current = createRoot(mount);
    // The component handles the pointerdown in its OWN (shadow) React root first; then we stop it
    // from bubbling out to the canvas Moveable, so an interactive drag (MUI Slider) moves the control,
    // not the widget. (Real feature: scope this to interactive zones, or move via a drag handle.)
    const stop = (e) => e.stopPropagation();
    host.addEventListener('pointerdown', stop);
    host.addEventListener('mousedown', stop);
    return () => {
      host.removeEventListener('pointerdown', stop);
      host.removeEventListener('mousedown', stop);
      const r = rootRef.current;
      rootRef.current = null;
      if (r) setTimeout(() => r.unmount(), 0);
    };
  }, []);
  useEffect(() => {
    rootRef.current?.render(children); // re-render inner root on prop change → prop flow preserved
  });
  return <div ref={hostRef} style={{ display: 'block' }} />;
}

// manifest.props: [{ name, type, default, displayName }]  ->  ToolJet widget config
function buildConfig(manifest) {
  const properties = {};
  const defProperties = {};
  (manifest.props || []).forEach((p) => {
    properties[p.name] = { type: p.type || 'code', displayName: p.displayName || p.name };
    defProperties[p.name] = { value: p.default ?? '' };
  });
  return {
    name: manifest.name,
    displayName: manifest.displayName || manifest.name,
    description: manifest.description || 'Custom component',
    component: manifest.name,
    properties,
    defaultSize: manifest.defaultSize || { width: 10, height: 40 },
    others: {
      showOnDesktop: { type: 'toggle', displayName: 'Show on desktop' },
      showOnMobile: { type: 'toggle', displayName: 'Show on mobile' },
    },
    events: manifest.events || {},
    styles: {
      visibility: {
        type: 'toggle',
        displayName: 'Visibility',
        validation: { schema: { type: 'boolean' }, defaultValue: true },
        accordian: 'container',
      },
    },
    exposedVariables: manifest.exposedVariables || {},
    definition: {
      others: { showOnDesktop: { value: '{{true}}' }, showOnMobile: { value: '{{false}}' } },
      properties: defProperties,
      events: [],
      styles: { visibility: { value: '{{true}}' } },
    },
  };
}

function registerFromManifest(manifest, Component) {
  const cfg = buildConfig(manifest);
  const merged = {
    ...combineProperties(cfg, universalProps),
    definition: combineProperties(cfg.definition, universalProps.definition, true),
  };
  // Inject into the exact maps the built-in widgets use — same shape, same everything.
  componentTypes.push(merged); // ponytail: push won't re-trigger the panel's [componentTypes] memo — reopen the Components tab if not listed (real build registers during bootstrap, before the panel mounts)
  componentTypeDefinitionMap[cfg.component] = merged;
  sectionConfig.custom.valueSet.add(cfg.component);

  AllComponents[cfg.component] = (props) => {
    const api = {
      props: props?.properties || {},
      fireEvent: props?.fireEvent,
      setExposedVariable: props?.setExposedVariable,
    };
    // Provider wraps the component so SDK hooks (useStateString/useEventCallback/...) read the instance API.
    // It must sit INSIDE the shadow's separate React root (context doesn't cross roots) — so we wrap
    // here and hand the whole thing to ShadowMount. Raw props still passed for pre-SDK components.
    const el = (
      <PocSDK.ToolJetProvider value={api}>
        <Component {...api.props} fireEvent={api.fireEvent} setExposedVariable={api.setExposedVariable} />
      </PocSDK.ToolJetProvider>
    );
    return USE_SHADOW ? <ShadowMount>{el}</ShadowMount> : el;
  };
  // eslint-disable-next-line no-console
  console.log(
    `[POC] registered "${cfg.component}" from manifest (${(manifest.props || []).length} props, ${
      Object.keys(manifest.events || {}).length
    } events)`
  );
}

// Resolve the whole React family to the HOST's instances (real bundles need jsx-runtime too).
function requireShim(m) {
  switch (m) {
    case 'react':
      return window.React;
    case 'react-dom':
    case 'react-dom/client':
      return window.ReactDOM;
    case 'react/jsx-runtime':
    case 'react/jsx-dev-runtime':
      return ReactJSXRuntime;
    case '@tooljet/component-sdk':
      return PocSDK;
    default:
      throw new Error(`[POC] bundle required an un-shimmed module: "${m}" (must be externalized in the author build)`);
  }
}

async function loadOne(url) {
  const src = await fetch(url).then((r) => r.text());
  const mod = { exports: {} };
  // eslint-disable-next-line no-new-func
  new Function('module', 'exports', 'require', src)(mod, mod.exports, requireShim);
  const Component = mod.exports.default || mod.exports;
  const manifest = mod.exports.manifest || Component?.tjManifest; // export const manifest OR defineComponent()
  if (!manifest?.name) return console.warn('[POC] bundle has no manifest export:', url);
  registerFromManifest(manifest, Component);
}

let loaded = false;
export async function loadPocButton() {
  if (loaded) return;
  loaded = true;
  // MANIFEST-DRIVEN: ask the backend which components exist, then load each. Adding a component = build it;
  // it shows up here with zero code changes. GET {apiUrl}/custom-components/manifest.json -> { components: [...] }.
  const base = `${config.apiUrl}/custom-components`;
  const { components = [] } = await fetch(`${base}/manifest.json`).then((r) => r.json());
  await Promise.all(components.map((file) => loadOne(`${base}/${file}`)));
  window.dispatchEvent(new Event('poc-registered')); // refresh the widget panel (see ComponentsManagerTab)
}
