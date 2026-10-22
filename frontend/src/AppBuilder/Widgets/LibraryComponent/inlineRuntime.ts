import * as React from 'react';
import * as ReactDOM from 'react-dom';
import * as ReactDOMClient from 'react-dom/client';
import * as ReactJSXRuntime from 'react/jsx-runtime';
import { init as initLexer, parse as parseImports } from 'es-module-lexer';

/* POC: run a published custom-component bundle in the host page instead of the sandboxed shell iframe.

   The CLI bundle (tooljet library build) is ESM with `react`, `react-dom` and `react/jsx-runtime` left
   as bare imports, and reads the SDK from `window.__tj_ToolJet` when it is evaluated. In the iframe the
   shell's import map resolves those imports to a vendored React and owns one window per instance.
   Here the bare imports are rewritten to blob-URL shims re-exporting the HOST React (one React, so
   hooks and context work), and the SDK hooks resolve their instance through React context, since one
   evaluated module is now shared by every instance on the canvas.

   Trust model: the bundle runs with the viewer's full origin privileges (DOM, storage, API calls).
*/

export type LibraryRuntime = 'inline' | 'iframe';

const RUNTIME_STORAGE_KEY = 'tj-cc-runtime';

// localStorage.setItem('tj-cc-runtime', 'iframe') switches back to the shell iframe for comparison.
export const getLibraryComponentRuntime = (): LibraryRuntime => {
  try {
    return window.localStorage.getItem(RUNTIME_STORAGE_KEY) === 'iframe' ? 'iframe' : 'inline';
  } catch {
    return 'inline';
  }
};

type ActionHandler = (...args: unknown[]) => unknown;

export interface LibraryInstance {
  props: Record<string, unknown>;
  // Inspector Styles-tab values. Read-only for the bundle and never exposed.
  styles: Record<string, unknown>;
  setExposedVariable: (key: string, value: unknown) => void;
  fireEvent: (name: string) => void;
  actions: Map<string, ActionHandler>;
  // A mounted ToolJet.Slot asks the host for a drop area; the returned function releases it.
  registerSlot: (name: string) => () => void;
}

// Slot names become part of the child canvas id (`<componentId>-<name>`), which the editor splits on
// the last '-', so they stay to letters, digits and underscores.
const SLOT_NAME = /^[A-Za-z][A-Za-z0-9_]*$/;

export const slotAttributeName = (name: string): string => `tj-slot-${name}`;

export const LibraryInstanceContext = React.createContext<LibraryInstance | null>(null);

const useLibraryInstance = (hookName: string): LibraryInstance => {
  const instance = React.useContext(LibraryInstanceContext);
  if (!instance) throw new Error(`ToolJet.${hookName} must be called inside a ToolJet custom component`);
  return instance;
};

// Same semantics as shell.html's useTjState: an Inspector-set prop overrides local state, and every
// value change is reported as an exposed variable.
const makeStateHook = (hookName: string) =>
  function useTjState({ name, initialValue }: { name: string; initialValue?: unknown }) {
    const instance = useLibraryInstance(hookName);
    const external = instance.props[name];
    const [value, setValue] = React.useState(external !== undefined ? external : initialValue);
    const valueRef = React.useRef(value);
    const lastExternal = React.useRef(external);
    if (lastExternal.current !== external) {
      lastExternal.current = external;
      if (external !== undefined && external !== value) {
        valueRef.current = external;
        setValue(external);
      }
    }

    React.useEffect(() => {
      instance.setExposedVariable(name, valueRef.current);
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [value]);

    const setAndSync = React.useCallback(
      (next: unknown) => {
        const resolved = typeof next === 'function' ? next(valueRef.current) : next;
        valueRef.current = resolved;
        // Synchronous store write, so an event fired on the author's next line already sees it.
        instance.setExposedVariable(name, resolved);
        setValue(resolved);
      },
      [instance, name]
    );
    return [value, setAndSync] as const;
  };

// Styles are builder-controlled: the hook returns the Inspector value, or initialValue while it is unset.
// `expose: true` also reports that value as a read-only exposed variable; by default styles stay private.
const makeStyleHook = (hookName: string) =>
  function useTjStyle({ name, initialValue, expose }: { name: string; initialValue?: unknown; expose?: boolean }) {
    const instance = useLibraryInstance(hookName);
    const raw = instance.styles[name];
    const value = raw === undefined || raw === '' ? initialValue : raw;
    // The instance object changes with every prop change; report only when the value itself changes.
    const instanceRef = React.useRef(instance);
    instanceRef.current = instance;

    React.useEffect(() => {
      if (expose) instanceRef.current.setExposedVariable(name, value);
    }, [expose, name, value]);
    return value;
  };

// <ToolJet.Slot name="content" /> marks where builders can drop ToolJet components. It renders a native
// shadow-DOM <slot>; the host renders the drop area as a light-DOM child of the shadow host, so the editor's
// document-level drag and drop lookups still find it, and the browser lays it out at this position.
const Slot = ({ name, className, style }: { name: string; className?: string; style?: React.CSSProperties }) => {
  const instance = useLibraryInstance('Slot');
  const isValid = SLOT_NAME.test(name ?? '');

  React.useLayoutEffect(() => {
    if (!isValid) {
      console.warn(`[ToolJet.Slot] invalid name "${name}": use letters, digits and underscores only.`);
      return;
    }
    return instance.registerSlot(name);
  }, [instance, name, isValid]);

  return React.createElement(
    'div',
    { className, style: { position: 'relative', minWidth: 0, minHeight: 0, ...style }, 'data-tj-slot': name },
    isValid ? React.createElement('slot', { name: slotAttributeName(name) }) : null
  );
};

// The `ToolJet` object a bundle's `import { ToolJet } from '@tooljet/custom-component-sdk'` resolves to.
export const toolJetSdk = {
  useStateString: makeStateHook('useStateString'),
  useStateNumber: makeStateHook('useStateNumber'),
  useStateBoolean: makeStateHook('useStateBoolean'),
  useStateObject: makeStateHook('useStateObject'),
  useStateArray: makeStateHook('useStateArray'),
  useStateEnumeration: makeStateHook('useStateEnumeration'),
  useEventCallback: function useTjEvent({ name }: { name: string }) {
    const instance = useLibraryInstance('useEventCallback');
    return React.useCallback(() => instance.fireEvent(name), [instance, name]);
  },
  useAction: function useTjAction({ name }: { name: string }, handler: ActionHandler) {
    const instance = useLibraryInstance('useAction');
    const ref = React.useRef(handler);
    ref.current = handler;
    React.useEffect(() => {
      if (!name) {
        console.warn('[useAction] called without a "name" — this action will not be reachable.');
        return;
      }
      instance.actions.set(name, (...args) => ref.current?.(...args));
      return () => {
        instance.actions.delete(name);
      };
    }, [instance, name]);
  },
  useStyleString: makeStyleHook('useStyleString'),
  useStyleNumber: makeStyleHook('useStyleNumber'),
  useStyleBoolean: makeStyleHook('useStyleBoolean'),
  useStyleEnumeration: makeStyleHook('useStyleEnumeration'),
  Slot,
  // Build-time only (manifest-generator reads defaultWidth/Height); no runtime effect.
  useComponentSettings: () => {},
};

const HOST_MODULES: Record<string, Record<string, unknown>> = {
  react: React,
  'react-dom': ReactDOM,
  'react-dom/client': ReactDOMClient,
  'react/jsx-runtime': ReactJSXRuntime,
};

const installGlobals = () => {
  const w = window as any;
  if (w.__tj_ToolJet === toolJetSdk) return;
  w.__tj_hostModules = HOST_MODULES;
  w.__tj_ToolJet = toolJetSdk;
  // Shell parity: the documented globals some bundles read directly.
  w.__tj_React = React;
  w.__tj_ReactDOM = ReactDOMClient;
  w.__tj_ReactJSXRuntime = ReactJSXRuntime;
};

const IDENTIFIER = /^[A-Za-z_$][\w$]*$/;
const shimUrls = new Map<string, string>();

// An ES module re-exporting one host module, so a bundle's `import { useState } from "react"` binds to
// the host React instead of a second copy.
const shimUrlFor = (specifier: string): string => {
  const cached = shimUrls.get(specifier);
  if (cached) return cached;
  const mod = HOST_MODULES[specifier];
  const access = `window.__tj_hostModules[${JSON.stringify(specifier)}]`;
  const named = Object.keys(mod)
    .filter((key) => key !== 'default' && key !== '__esModule' && IDENTIFIER.test(key))
    .map((key) => `export const ${key} = m[${JSON.stringify(key)}];`)
    .join('\n');
  const source = `const m = ${access};\nexport default m.default ?? m;\n${named}\n`;
  const url = URL.createObjectURL(new Blob([source], { type: 'text/javascript' }));
  shimUrls.set(specifier, url);
  return url;
};

const rewriteBareImports = async (source: string): Promise<string> => {
  await initLexer;
  const [imports] = parseImports(source);
  let out = '';
  let last = 0;
  for (const imp of imports) {
    if (imp.n === undefined || imp.n === null) continue;
    if (!HOST_MODULES[imp.n]) {
      if (!imp.n.startsWith('blob:') && !/^(https?:|\.{0,2}\/)/.test(imp.n)) {
        throw new Error(`bundle imports "${imp.n}", which the host does not provide`);
      }
      continue;
    }
    const url = shimUrlFor(imp.n);
    // Static imports span the bare specifier; a dynamic import(...) of a literal spans the quotes too.
    out += source.slice(last, imp.s) + (imp.d === -1 ? url : JSON.stringify(url));
    last = imp.e;
  }
  return out + source.slice(last);
};

const moduleCache = new Map<string, Promise<Record<string, unknown>>>();
const cssCache = new Map<string, Promise<string | null>>();

// cacheKey: published revisions are immutable; a dev slot appends its push nonce so a push re-imports.
export const loadLibraryModule = (bundleUrl: string, cacheKey: string): Promise<Record<string, unknown>> => {
  installGlobals();
  let pending = moduleCache.get(cacheKey);
  if (!pending) {
    pending = (async () => {
      const res = await fetch(bundleUrl, { cache: 'no-store' });
      if (!res.ok) throw new Error(`failed to fetch bundle (${res.status})`);
      const source = await rewriteBareImports(await res.text());
      const url = URL.createObjectURL(new Blob([source], { type: 'text/javascript' }));
      try {
        return await import(/* webpackIgnore: true */ url);
      } finally {
        URL.revokeObjectURL(url);
      }
    })();
    pending.catch(() => moduleCache.delete(cacheKey));
    moduleCache.set(cacheKey, pending);
  }
  return pending;
};

export const loadLibraryCss = (cssUrl: string, cacheKey: string): Promise<string | null> => {
  let pending = cssCache.get(cacheKey);
  if (!pending) {
    pending = fetch(cssUrl, { cache: 'no-store' })
      .then((r) => (r.ok ? r.text() : null))
      .catch(() => null);
    cssCache.set(cacheKey, pending);
  }
  return pending;
};
