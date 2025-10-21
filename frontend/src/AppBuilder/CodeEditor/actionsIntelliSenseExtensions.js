/*
 * CodeMirror 6 extensions providing hover + signature help + basic keymaps for:
 *  - actions.functionName
 *  - components.instanceName.actionHandle
 * Includes deprecation styling.
 */
import { hoverTooltip, showTooltip, keymap } from '@codemirror/view';
import { StateField } from '@codemirror/state';
import { getActionFunctionsMap, formatSignature } from './actionFunctionRegistry';
import { getComponentAction, getComponentActionsByHandle } from './componentActionRegistry';

function resolveComponentAction(instanceName, actionHandle) {
  // Direct instance scoped registration
  const inst = getComponentAction(`${instanceName}.${actionHandle}`);
  if (inst) {
    return {
      params: inst.params || [],
      displayName: inst.displayName,
      deprecated: inst.deprecated,
    };
  }
  // Generic by handle across all widgets (choose first just for signature)
  const generic = getComponentActionsByHandle(actionHandle);
  if (generic && generic.length) {
    return {
      params: generic[0].params || [],
      displayName: generic[0].displayName,
      deprecated: generic.some((g) => g.deprecated),
      availableOn: Array.from(new Set(generic.map((g) => g.component))),
    };
  }
  // Runtime metadata (optional injection on window)
  const comps = (typeof window !== 'undefined' && window.__TJ_COMPONENTS_META) || {};
  const instMeta = comps[instanceName];
  if (instMeta && Array.isArray(instMeta.actions)) {
    const act = instMeta.actions.find((a) => a.handle === actionHandle);
    if (act) {
      return {
        params: (act.params || []).map((p) => p.handle),
        displayName: act.displayName || act.handle,
        deprecated: /deprecated/i.test(act.displayName || ''),
      };
    }
  }
  return null;
}

function findActionInvocation(state, pos) {
  const win = 160;
  const from = Math.max(0, pos - win);
  const before = state.sliceDoc(from, pos);
  // actions.fn(
  let match = /(actions\.(\w+))\s*\(([^(]*)$/.exec(before);
  if (match) return { fullName: match[1], paramsFragment: match[3] || '' };
  // components.instance.action(
  match = /(components\.(\w+)\.(\w+))\s*\(([^(]*)$/.exec(before);
  if (match) return { fullName: match[1], paramsFragment: match[4] || '' };
  return null;
}

export const actionsHover = hoverTooltip((view, pos) => {
  const line = view.state.doc.lineAt(pos);
  const text = line.text;
  const re = /(actions\.(\w+))|(components\.(\w+)\.(\w+))/g;
  let m;
  while ((m = re.exec(text))) {
    const start = line.from + m.index;
    const token = m[0];
    const end = start + token.length;
    if (start <= pos && pos <= end) {
      let html = '';
      if (token.startsWith('actions.')) {
        const def = getActionFunctionsMap().get(token);
        if (!def) return null;
        const deprecated = /deprecated/i.test(def.description || '') || def.deprecated;
        html = `
          <div style="font-size:12px;line-height:1.3;">
            <code style="font-weight:600;${
              deprecated ? 'text-decoration:line-through;opacity:0.7;' : ''
            }">${formatSignature(def)}</code><br/>
            <div>${def.description || ''}${deprecated ? ' (deprecated)' : ''}</div>
            ${def.examples?.length ? `<div style="margin-top:4px;color:#888">e.g. ${def.examples[0]}</div>` : ''}
          </div>`;
      } else if (token.startsWith('components.')) {
        const parts = token.split('.');
        if (parts.length === 3) {
          const instance = parts[1];
          const handle = parts[2];
          const meta = resolveComponentAction(instance, handle);
          if (meta) {
            const sig = `components.${instance}.${handle}(${meta.params.join(', ')})`;
            const deprecated = meta.deprecated;
            const availableOnNote =
              meta.availableOn && meta.availableOn.length > 1
                ? `<div style="margin-top:4px;color:#888">Available on: ${meta.availableOn.slice(0, 5).join(', ')}${
                    meta.availableOn.length > 5 ? '…' : ''
                  }</div>`
                : '';
            html = `
              <div style="font-size:12px;line-height:1.3;">
                <code style="font-weight:600;${
                  deprecated ? 'text-decoration:line-through;opacity:0.7;' : ''
                }">${sig}</code><br/>
                <div>${meta.displayName || ''}${deprecated ? ' (deprecated)' : ''}</div>
                ${availableOnNote}
              </div>`;
          }
        }
      }
      if (!html) return null;
      return {
        pos: start,
        end,
        create() {
          const dom = document.createElement('div');
          dom.className = 'cm-tooltip-actions-doc';
          dom.innerHTML = html;
          return { dom };
        },
      };
    }
  }
  return null;
});

function buildSignatureTooltip(state) {
  const pos = state.selection.main.head;
  const invocation = findActionInvocation(state, pos);
  if (!invocation) return null;
  let def = getActionFunctionsMap().get(invocation.fullName);
  if (!def && invocation.fullName.startsWith('components.')) {
    const parts = invocation.fullName.split('.');
    if (parts.length === 3) {
      const meta = resolveComponentAction(parts[1], parts[2]);
      if (meta) def = { fullName: invocation.fullName, params: meta.params };
    }
  }
  if (!def) return null;
  let activeIndex = 0;
  if (invocation.paramsFragment.trim()) {
    activeIndex = invocation.paramsFragment.split(',').length - 1;
  }
  const highlighted = def.params
    .map((p, i) => (i === activeIndex ? `<span class="cm-active-param">${p}</span>` : p))
    .join(', ');
  const signature = `${def.fullName}(${highlighted})`;
  return {
    pos,
    above: true,
    strictSide: false,
    create: () => {
      const dom = document.createElement('div');
      dom.className = 'cm-tooltip-actions-signature';
      dom.innerHTML = `<code style="font-size:12px;">${signature}</code>`;
      return { dom };
    },
  };
}

const signatureField = StateField.define({
  create: () => null,
  update(value, tr) {
    if (tr.docChanged || tr.selection) return buildSignatureTooltip(tr.state);
    return value;
  },
  provide: (f) => showTooltip.from(f),
});

export const actionsSignatureHelp = [signatureField];

export const actionsNavigationKeymap = keymap.of([
  { key: 'F12', run: () => true },
  { key: 'Shift-F12', run: () => true },
]);

export const actionsIntelliSense = [actionsHover, ...actionsSignatureHelp, actionsNavigationKeymap];
