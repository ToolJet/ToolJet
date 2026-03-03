import toast from 'react-hot-toast';
import moment from 'moment';
import _ from 'lodash';
import axios from 'axios';

/**
 * Executes UMD/IIFE source code and captures the exported module.
 * Creates a sandboxed environment with fake module/exports/define to capture
 * the library export without polluting the global scope.
 */
function executeUMD(source) {
  const module = { exports: {} };
  const exports = module.exports;
  let amdResult = null;

  const define = Object.assign(
    (...args) => {
      // Handle: define(factory), define(deps, factory), define(id, deps, factory)
      const factory = args.find((a) => typeof a === 'function');
      if (factory) {
        amdResult = factory();
        return;
      }
      // Handle: define(value) — plain object/string export
      const value = args[args.length - 1];
      if (typeof value !== 'string') {
        amdResult = value;
      }
    },
    { amd: true }
  );

  const fn = new Function('module', 'exports', 'define', 'self', '"use strict";\n' + source);
  fn(module, exports, define, {});

  // Priority: AMD result > reassigned module.exports > properties added to exports
  if (amdResult != null) return amdResult;
  if (module.exports !== exports) return module.exports; // was reassigned (e.g. module.exports = factory())
  if (Object.keys(exports).length > 0) return exports;  // properties were added to original object
  return null;
}

/**
 * Fetches a JS library from a URL and loads it using the UMD shim.
 * Returns the exported module object.
 */
export async function loadLibraryFromURL(url) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch library from ${url}: ${response.status} ${response.statusText}`);
  }
  const source = await response.text();
  return executeUMD(source);
}

/**
 * Initializes all JS libraries from the globalSettings.jsLibraries array.
 * Returns a registry object mapping library names to their exports.
 */
export async function initializeLibraries(jsLibraries = []) {
  const registry = {};
  const enabledLibraries = jsLibraries.filter((lib) => lib.enabled);

  // Load all libraries in parallel for faster startup
  const results = await Promise.allSettled(
    enabledLibraries.map(async (lib) => {
      const module = await loadLibraryFromURL(lib.url);
      return { name: lib.name, module };
    })
  );

  results.forEach((result, index) => {
    const lib = enabledLibraries[index];
    if (result.status === 'fulfilled') {
      if (result.value.module != null) {
        registry[result.value.name] = result.value.module;
      } else {
        console.warn(`Library "${lib.name}" loaded but exported nothing. Ensure it's a UMD/IIFE build.`);
      }
    } else {
      console.error(`Failed to load library "${lib.name}" from ${lib.url}:`, result.reason);
      toast.error(`Failed to load JS library "${lib.name}"`);
    }
  });

  return registry;
}

/**
 * Executes the setup script with all loaded libraries in scope.
 * Only library names are available — no access to components, queries, globals, etc.
 */
export async function executeSetupScript(code, libraryRegistry = {}) {
  if (!code?.trim()) return;

  try {
    const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor;
    const fnParams = ['moment', '_', 'axios', ...Object.keys(libraryRegistry)];
    const fnArgs = [moment, _, axios, ...Object.values(libraryRegistry)];
    const fn = new AsyncFunction(...fnParams, code);
    await fn(...fnArgs);
  } catch (error) {
    console.error('Setup script execution failed:', error);
    toast.error('JS Libraries setup script failed: ' + error.message);
  }
}
