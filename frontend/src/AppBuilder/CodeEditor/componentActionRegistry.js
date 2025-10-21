// Builds metadata for component actions to power IntelliSense like components.button1.setText()
// We cannot (and should not) import every widget file dynamically here to avoid bundle bloat.
// Instead, we expose an API to hydrate the registry from widget configs already loaded elsewhere
// (e.g., when the editor loads widget definitions, call registerWidgetActions(widgetConfig, instanceNames)).

import { widgets } from '../WidgetManager/configs/widgetConfig';

const componentActionMap = new Map();
const actionHandleIndex = new Map(); // handle -> [{component, params, displayName, deprecated}]

// Generic action description generator
function generateActionDescription(widget, act) {
  if (!act || typeof act !== 'object') return '';
  const baseName = widget.displayName || widget.name || widget.component || 'widget';
  const dn = (act.displayName || act.handle || '').replace(/\(deprecated\)/i, '').trim();
  const handle = act.handle || '';
  if (/^set/i.test(handle)) {
    const target = handle.replace(/^set/i, '').replace(/^[A-Z]/, (c) => c.toLowerCase());
    return `Set ${target} on the ${baseName}.`;
  }
  if (handle === 'click') return `Trigger a click on the ${baseName}.`;
  if (/visibility/i.test(handle)) return `Control visibility of the ${baseName}.`;
  if (/loading/i.test(handle)) return `Toggle loading state of the ${baseName}.`;
  if (/disable|disabled/i.test(handle)) return `Enable or disable the ${baseName}.`;
  return dn ? `${dn} action on ${baseName}.` : '';
}

function enrichParam(p) {
  if (!p) return p;
  if (!p.description) {
    const h = p.handle || '';
    if (/text/i.test(h)) p.description = 'Text value to use.';
    else if (/visible|visibility/i.test(h)) p.description = 'Boolean visibility flag.';
    else if (/disable|disabled/i.test(h)) p.description = 'Boolean disable flag.';
    else if (/loading/i.test(h)) p.description = 'Boolean loading state.';
    else if (/value/i.test(h)) p.description = 'Value to assign.';
  }
  return p;
}

function augmentWidget(widget) {
  if (!widget || !Array.isArray(widget.actions)) return widget;
  widget.actions.forEach((act) => {
    if (!act.description) act.description = generateActionDescription(widget, act);
    if (Array.isArray(act.params)) act.params = act.params.map(enrichParam);
  });
  return widget;
}

widgets.forEach((raw) => {
  const w = augmentWidget(raw);
  if (!w || !Array.isArray(w.actions)) return;
  const base = w.component || w.name;
  w.actions.forEach((act) => {
    const params = (act.params || []).map((p) => p.handle);
    const arr = actionHandleIndex.get(act.handle) || [];
    arr.push({
      component: base,
      handle: act.handle,
      displayName: act.displayName || act.handle,
      description: act.description || act.doc || act.displayName || '',
      params,
      deprecated: /deprecated/i.test(act.displayName || ''),
    });
    actionHandleIndex.set(act.handle, arr);
  });
});

// key shape: `${componentName}.${actionHandle}` -> metadata

export function registerWidgetActions(widgetConfig, instanceNames = []) {
  if (!widgetConfig || !Array.isArray(widgetConfig.actions)) return;
  const baseName = widgetConfig.component || widgetConfig.name;
  widgetConfig.actions.forEach((act) => {
    const actionKey = `${baseName}.${act.handle}`;
    const params = (act.params || []).map((p) => p.handle);
    componentActionMap.set(actionKey, {
      component: baseName,
      handle: act.handle,
      displayName: act.displayName || act.handle,
      description: act.description || act.doc || act.displayName || '',
      params,
      deprecated: /deprecated/i.test(act.displayName || ''),
    });
  });

  instanceNames.forEach((inst) => {
    widgetConfig.actions.forEach((act) => {
      const actionKey = `${inst}.${act.handle}`;
      if (!componentActionMap.has(actionKey)) {
        componentActionMap.set(actionKey, {
          component: baseName,
          instance: inst,
          handle: act.handle,
          displayName: act.displayName || act.handle,
          description: act.description || act.doc || act.displayName || '',
          params: (act.params || []).map((p) => p.handle),
          deprecated: /deprecated/i.test(act.displayName || ''),
        });
      }
    });
  });
}

export function getComponentAction(fullName) {
  return componentActionMap.get(fullName);
}

export function getComponentActionsByHandle(handle) {
  return actionHandleIndex.get(handle) || [];
}

export function getAllComponentActions() {
  return Array.from(componentActionMap.entries()).map(([fullName, meta]) => ({ fullName, ...meta }));
}

export function formatComponentActionSignature(meta) {
  if (!meta) return '';
  const base = meta.instance ? `components.${meta.instance}.${meta.handle}` : `components.<name>.${meta.handle}`;
  return `${base}(${meta.params.join(', ')})`;
}
