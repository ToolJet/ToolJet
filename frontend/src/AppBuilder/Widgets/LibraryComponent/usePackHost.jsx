import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { isEqual } from 'lodash';
import { shallow } from 'zustand/shallow';

import { ListviewSubcontainer } from '@/AppBuilder/Widgets/Listview/ListviewSubcontainer';
import { useSubcontainerContext } from '@/AppBuilder/_contexts/SubcontainerContext';
import { useModuleContext } from '@/AppBuilder/_contexts/ModuleContext';
import useStore from '@/AppBuilder/_stores/store';
import { extractAndReplaceReferencesFromString } from '@/AppBuilder/_stores/ast';
import { resolveDynamicValues } from '@/AppBuilder/_stores/utils';
import { useFormClear, useShowValidationOnFormSubmit } from '@/AppBuilder/Widgets/Form/FormSignalContext';
import { getEffectiveLayout, resolveWidgetVisibility } from '@/AppBuilder/_stores/utils/dynamicHeightReflow';
import { UI2_ROW_CHROME } from '@/AppBuilder/_helpers/dynamicHeightPolicy';
import { ROW_VARIABLES } from './inlineRuntime';
import { useMeasuredWidth } from './useMeasuredWidth';

/* Pack contract v2: what the LibraryComponent host gives a pack component beyond the base SDK (inlineRuntime.ts
   PackHost). The validation, rows and popup drop areas live here; the control state is the widget's own. */

// Events one widget may fire before the page runs again (usePackHost's fireHostEvent): above any real burst (the action
// fuzz fires 50 in one frame, the packs' own self-toggle cap is 100).
const EVENT_BURST = 200;

const filled = (value) =>
  !(value === undefined || value === null || value === '' || (Array.isArray(value) && !value.length));

// The widget's Validation section judged on the component's value, as native inputs do: isValid and isMandatory are
// published, and the error shows once the field was touched. 0 and false are values.
// `rule` is the component's own check (a format or range message, '' when it passes), checked before the section's.
export const useHostValidation = (latest, value, present, rule) => {
  const { validate, validation, setExposedVariable, exposed, judged } = latest.current;
  // Which exposed variable this is the value of, so an event fired right after the value changes can judge the new
  // value first (see fireHostEvent).
  if (exposed && judged) {
    let key = exposed.has('value') && Object.is(exposed.get('value'), value) ? 'value' : null;
    if (!key) for (const [k, v] of exposed) if (k !== 'isValid' && k !== 'isMandatory' && Object.is(v, value)) key = k;
    judged.current = { key: key ?? judged.current.key, value };
  }
  const status = (typeof validate === 'function' ? validate(present ?? filled(value) ? value : undefined) : null) || {};
  const isValid = status.isValid !== false && !rule;
  const isMandatory = validation?.mandatory === true;
  const [touched, setTouched] = useState(false);
  // A Form around the field shows its message after a failed submit, and clearForm hides it again.
  useShowValidationOnFormSubmit(setTouched);
  useFormClear(() => setTouched(false));
  useEffect(() => {
    setExposedVariable('isValid', isValid);
  }, [isValid, setExposedVariable]);
  useEffect(() => {
    setExposedVariable('isMandatory', isMandatory);
  }, [isMandatory, setExposedVariable]);
  return useMemo(
    () => ({
      isValid,
      error: touched && !isValid ? rule || status.validationError || 'Invalid value' : '',
      required: isMandatory,
      touch: () => setTouched(true),
    }),
    [isValid, touched, rule, status.validationError, isMandatory]
  );
};

// ---- per-row bindings (ToolJet.useRowResolver) -----------------------------------------------------------------------

const isRowTemplate = (value) =>
  typeof value === 'string' && value.includes('{{') && value.includes('}}') && ROW_VARIABLES.test(value);

// A structured value (an array of column objects set as data, as the native Table stores its columns): the resolved
// value with the definition's row templates put back where they were. Unchanged parts keep their identity.
const withRowTemplates = (raw, resolved) => {
  if (isRowTemplate(raw)) return raw;
  if (Array.isArray(raw)) {
    const base = Array.isArray(resolved) ? resolved : [];
    let changed = !Array.isArray(resolved) || base.length !== raw.length;
    const out = raw.map((item, i) => {
      const next = withRowTemplates(item, base[i]);
      if (next !== base[i]) changed = true;
      return next;
    });
    return changed ? out : resolved;
  }
  if (raw && typeof raw === 'object') {
    const base = resolved && typeof resolved === 'object' && !Array.isArray(resolved) ? resolved : {};
    let changed = base !== resolved;
    const out = { ...base };
    Object.keys(raw).forEach((key) => {
      const next = withRowTemplates(raw[key], base[key]);
      if (next !== base[key]) {
        out[key] = next;
        changed = true;
      }
    });
    return changed ? out : resolved;
  }
  return resolved;
};

// A code value ({{[{ key: 'status', textColor: "{{rowData.status === 'Late' ? 'red' : ''}}" }]}}): the inner row
// templates would end the outer binding early, so they are swapped for placeholders, the code is resolved, and the
// placeholders are swapped back.
const OUTER_BINDING = /^\s*\{\{([\s\S]*)\}\}\s*$/;
const INNER_BINDING = /\{\{[\s\S]*?\}\}/g;
const PLACEHOLDER = /__tj_row_(\d+)__/g;
const maskRowTemplates = (raw) => {
  const outer = typeof raw === 'string' ? OUTER_BINDING.exec(raw) : null;
  if (!outer) return null;
  const templates = [];
  const code = outer[1].replace(INNER_BINDING, (template) => {
    if (!ROW_VARIABLES.test(template)) return template;
    templates.push(template);
    return `__tj_row_${templates.length - 1}__`;
  });
  return templates.length ? { code: `{{${code}}}`, templates } : null;
};
const unmask = (value, templates) => {
  if (typeof value === 'string') return value.replace(PLACEHOLDER, (all, i) => templates[Number(i)] ?? all);
  if (Array.isArray(value)) return value.map((item) => unmask(item, templates));
  if (value && typeof value === 'object')
    return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, unmask(item, templates)]));
  return value;
};

/** The row-scoped props (manifest `rowScoped`, or named by ToolJet.useRowResolver) with their row templates kept
 *  unresolved: the values to use instead of the resolved ones, or null when nothing differs. */
export const useRowTemplates = ({ id, properties, manifestComponent }) => {
  const { moduleId } = useModuleContext();
  const [marked, setMarked] = useState(() => new Set());
  const markRowScoped = useCallback(
    (names) => setMarked((prev) => (names.every((n) => prev.has(n)) ? prev : new Set([...prev, ...names]))),
    []
  );
  const declared = manifestComponent?.props;
  const names = useMemo(
    () => [
      ...new Set([
        ...(Array.isArray(declared) ? declared.filter((p) => p?.rowScoped === true).map((p) => p.name) : []),
        ...marked,
      ]),
    ],
    [declared, marked]
  );
  const raws = useStore((state) => {
    if (!names.length) return null;
    const definition = state.getComponentDefinition(id, moduleId)?.component?.definition?.properties;
    return names.map((name) => definition?.[name]?.value);
  }, shallow);
  const masks = useMemo(() => raws?.map(maskRowTemplates) ?? [], [raws]);
  // A code value is resolved here, so it follows the app's state; a structured one follows the resolved properties.
  const exposed = useStore((state) =>
    masks.some(Boolean) ? state.resolvedStore.modules[moduleId]?.exposedValues : null
  );
  const overrides = useMemo(() => {
    if (!raws) return null;
    const out = {};
    names.forEach((name, i) => {
      const raw = raws[i];
      if (masks[i]) {
        try {
          const value = useStore.getState().getResolvedValue(masks[i].code, {}, moduleId);
          out[name] = unmask(value, masks[i].templates);
        } catch {
          // A broken binding stays as the host resolved it.
        }
      } else if (raw && typeof raw === 'object') {
        const merged = withRowTemplates(raw, properties[name]);
        if (merged !== properties[name]) out[name] = merged;
      }
    });
    return Object.keys(out).length ? out : null;
    // eslint-disable-next-line react-hooks/exhaustive-deps -- exposed: a code value re-resolves on app state changes
  }, [raws, masks, names, properties, exposed, moduleId]);
  return { overrides, markRowScoped };
};

// resolve(template, { rowData, cellValue, rowIndex }) with the app's state. Only templates that read a row variable
// are evaluated (everything else was resolved by the host already); results are memoised per template, row and cell
// until the app's state changes, and a template's references are prepared once.
const useRowResolve = (moduleId) =>
  useMemo(() => {
    let cache = { exposed: undefined, names: undefined, prepared: new Map(), byRow: new WeakMap(), loose: new Map() };
    return (template, context = {}) => {
      if (!isRowTemplate(template)) return template;
      const state = useStore.getState();
      const exposed = state.resolvedStore.modules[moduleId]?.exposedValues;
      const mappings = state.modules?.[moduleId];
      if (cache.exposed !== exposed || cache.names !== mappings?.componentNameIdMapping) {
        cache = {
          exposed,
          names: mappings?.componentNameIdMapping,
          prepared: cache.names === mappings?.componentNameIdMapping ? cache.prepared : new Map(),
          byRow: new WeakMap(),
          loose: new Map(),
        };
      }
      const { rowData, cellValue, rowIndex } = context ?? {};
      // Object cells are not memoised (no stable key); rows are, by identity.
      const cellKey = cellValue !== null && typeof cellValue === 'object' ? null : `${typeof cellValue}:${cellValue}`;
      const rowIsObject = rowData !== null && typeof rowData === 'object';
      let bucket = null;
      const memoKey = `${template}\u0000${cellKey}\u0000${rowIndex ?? ''}${rowIsObject ? '' : `\u0000${rowData}`}`;
      if (cellKey !== null) {
        if (rowIsObject) {
          bucket = cache.byRow.get(rowData);
          if (!bucket) {
            bucket = new Map();
            cache.byRow.set(rowData, bucket);
          }
        } else bucket = cache.loose;
        if (bucket.has(memoKey)) return bucket.get(memoKey);
      }
      let prepared = cache.prepared.get(template);
      if (prepared === undefined) {
        prepared = extractAndReplaceReferencesFromString(
          template,
          mappings?.componentNameIdMapping,
          mappings?.queryNameIdMapping
        ).valueWithBrackets;
        cache.prepared.set(template, prepared);
      }
      let result;
      try {
        result = resolveDynamicValues(prepared, exposed, { rowData, cellValue, rowIndex }, false, []);
      } catch {
        result = undefined;
      }
      bucket?.set(memoKey, result);
      return result;
    };
  }, [moduleId]);

export const rowSlotAttr = (id, index) => `tj-row-${id}-${index}`;

// The height a fitted row (a Kanban card) is drawn at: the lowest bottom of its components as the reflow placed them in
// this row (a Text that wraps in a narrow column grows and pushes the ones below it down), plus the space UI 2.0's
// Kanban keeps under a card's lowest component, and never below the pack's row height. The native List view sizes its
// rows from the same per-row layouts (dynamicHeightReflow getListviewTemplateHeight). Measured here rather than read
// from the row's own temporary layout: the reflow sizes a LibraryComponent's row as a plain container, floored at the
// whole widget's height. A component hidden on this card (a button shown only for some cards) is left out, slot and all,
// as UI 2.0's Kanban leaves it out: the row canvas does not draw it.
export const fittedRowHeight = ({
  childIds,
  components,
  temporaryLayouts,
  currentLayout,
  rowContext,
  moduleId,
  rowHeight,
  isVisible = () => true,
}) => {
  const bottom = (childIds || []).reduce((max, childId) => {
    if (!isVisible(childId)) return max;
    const layout = getEffectiveLayout(childId, currentLayout, components, temporaryLayouts, rowContext, moduleId);
    return layout ? Math.max(max, (Number(layout.top) || 0) + (Number(layout.height) || 0)) : max;
  }, 0);
  return bottom > 0 ? Math.max(rowHeight, Math.ceil(bottom + UI2_ROW_CHROME)) : rowHeight;
};

const useRowHeight = ({ id, index, moduleId, rowHeight, currentLayout, parentIndices, fitRows }) => {
  const rowContext = useMemo(() => [...parentIndices, index], [parentIndices, index]);
  return useStore((state) =>
    fitRows
      ? fittedRowHeight({
          childIds: state.containerChildrenMapping?.[id],
          components: state.getCurrentPageComponents?.(moduleId),
          temporaryLayouts: state.temporaryLayouts,
          currentLayout,
          rowContext,
          moduleId,
          rowHeight,
          isVisible: (childId) =>
            resolveWidgetVisibility({
              componentId: childId,
              contextIndices: rowContext,
              currentLayout,
              getResolvedComponent: (cid, ctx) => state.getResolvedComponent?.(cid, ctx, moduleId),
              getExposedPropertyForAdditionalActions: (cid, ctx, prop) =>
                state.getExposedPropertyForAdditionalActions?.(cid, ctx, prop, moduleId),
            }) !== false,
        })
      : rowHeight
  );
};

// One row's canvas, as wide as the pack lays the row out: a grid cell or a kanban card, not the whole widget (a
// 4-column list drew each row's components across the full width, clipped by the cell). A fitted row (fitRows: the
// pack asked for it, a Kanban card) grows with its components and the pack's card, which wraps the row's slot, follows.
const PackRow = ({
  slot,
  id,
  index,
  moduleId,
  rowHeight,
  darkMode,
  widgetWidth,
  fit,
  fitRows,
  parentIndices,
  items,
  currentLayout,
  visibility,
  height,
}) => {
  const ref = useRef(null);
  const measured = useMeasuredWidth(ref);
  const drawnHeight = useRowHeight({ id, index, moduleId, rowHeight, currentLayout, parentIndices, fitRows });
  return (
    <div ref={ref} slot={slot} className="tw-block tw-w-full">
      <ListviewSubcontainer
        id={id}
        index={index}
        moduleId={moduleId}
        mode="list"
        rowHeight={drawnHeight}
        positiveColumns={1}
        showBorder={false}
        onRecordOrRowClicked={() => {}}
        computeCanvasBackgroundColor={() => 'transparent'}
        darkMode={darkMode}
        width={measured ?? widgetWidth}
        isDynamicHeightEnabled={fit && !fitRows}
        data={items}
        currentLayout={currentLayout}
        visibility={visibility}
        parentHeight={height}
        componentType="LibraryComponent"
      />
    </div>
  );
};

/** The rows a pack list draws as ToolJet canvases ({{listItem}}), with the native List view's row plumbing. */
const usePackRows = ({ id, width, height, currentLayout, visibility, fit, darkMode, enabled, rowVariable }) => {
  const { moduleId } = useModuleContext();
  const { contextPath } = useSubcontainerContext();
  const parentIndices = useMemo(() => contextPath.map((s) => s.index), [contextPath]);
  const updateCustomResolvables = useStore((s) => s.updateCustomResolvables);
  const initExposedValueArrayForChildren = useStore((s) => s.initExposedValueArrayForChildren);
  const updateDependencyValues = useStore((s) => s.updateDependencyValues);
  const [rows, setRowsState] = useState({ items: [], rowHeight: 72, fit: false });
  const setRows = useCallback(
    (items, rowHeight, options) =>
      setRowsState((prev) => {
        const fitRows = options?.fit === true;
        return isEqual(prev.items, items) && (!rowHeight || rowHeight === prev.rowHeight) && fitRows === prev.fit
          ? prev
          : { items, rowHeight: rowHeight || prev.rowHeight, fit: fitRows };
      }),
    []
  );
  useLayoutEffect(() => {
    if (!enabled) return;
    // Each row is {{listItem}}, and also the name the pack's slot gives it ({{cardData}} on a kanban card): a card
    // template written for UI 2.0's Kanban read cardData and drew blank cards.
    const alias = rowVariable && rowVariable !== 'listItem' ? rowVariable : undefined;
    if (rows.items.length) {
      updateCustomResolvables(
        id,
        rows.items.map((listItem) => (alias ? { listItem, [alias]: listItem } : { listItem })),
        'listItem',
        moduleId,
        parentIndices
      );
      if (alias) updateDependencyValues(`components.${id}.${alias}`, moduleId, parentIndices);
    }
    initExposedValueArrayForChildren(id, rows.items.length, moduleId, parentIndices);
  }, [
    enabled,
    rows.items,
    rowVariable,
    id,
    moduleId,
    parentIndices,
    updateCustomResolvables,
    updateDependencyValues,
    initExposedValueArrayForChildren,
  ]);

  const light = enabled
    ? rows.items.map((_item, index) => (
        <PackRow
          key={index}
          slot={rowSlotAttr(id, index)}
          id={id}
          index={index}
          moduleId={moduleId}
          rowHeight={rows.rowHeight}
          darkMode={darkMode}
          widgetWidth={width}
          fit={fit}
          fitRows={rows.fit}
          parentIndices={parentIndices}
          items={rows.items}
          currentLayout={currentLayout}
          visibility={visibility}
          height={height}
        />
      ))
    : null;
  return { setRows, light };
};

export const usePackHost = (
  props,
  { disabled, loading, rowsEnabled, rowVariable, fit, visibility, formField = false, markRowScoped }
) => {
  const { id, validate, validation, setExposedVariable, fireEvent, width, height, currentLayout, darkMode } = props;
  const { moduleId } = useModuleContext();
  const resolveRow = useRowResolve(moduleId);
  // The latest value of each variable the component exposed, and the value its validation last judged.
  const exposed = useRef(new Map());
  const judged = useRef({ key: null, value: undefined });
  const latest = useRef({ validate, validation, setExposedVariable });
  latest.current = { validate, validation, setExposedVariable, exposed: exposed.current, judged };
  const exposeVariable = useCallback((key, value) => {
    exposed.current.set(key, value);
    latest.current.setExposedVariable(key, value);
  }, []);
  // A component sets its value and fires its event in one go, before it renders again, while isValid follows the
  // render: an onChange that cleared a required field read isValid true. The new value is judged before the event.
  // Booleans are left to the render, as their "present" rule is the component's own.
  // A handler that changes its own widget (onChange running clear or setValue on the field it came from) loops:
  // the host runs a handler's actions as microtasks, so the page never got a turn (Codex PERF-01: Input clear,
  // Ant resetFields, MUI TextField clear). No user action fires this many events from one widget before the page
  // runs again, so past EVENT_BURST the rest of the burst is dropped, once, with a warning naming the loop.
  const burst = useRef({ count: 0, warned: false });
  const fireHostEvent = useCallback(
    (name, options) => {
      const b = burst.current;
      if (b.count === 0)
        setTimeout(() => {
          burst.current = { count: 0, warned: false };
        }, 0);
      b.count += 1;
      if (b.count > EVENT_BURST) {
        if (!b.warned) {
          b.warned = true;
          console.warn(
            `[LibraryComponent] ${id}: more than ${EVENT_BURST} "${name}" events without the page running; a handler ` +
              'probably changes the widget that fired it. The rest of this burst is skipped.'
          );
        }
        return Promise.resolve();
      }
      const { key, value } = judged.current;
      const judge = latest.current.validate;
      if (typeof judge === 'function' && key && exposed.current.has(key)) {
        const now = exposed.current.get(key);
        if (!Object.is(now, value) && typeof now !== 'boolean') {
          // Only the Validation section can judge the new value here: the component's own rule (useValidation's
          // `rule`) is worked out as it renders, so it applies once the component draws the new value.
          const status = judge(filled(now) ? now : undefined) || {};
          latest.current.setExposedVariable('isValid', status.isValid !== false);
        }
      }
      return fireEvent?.(name, options);
    },
    [fireEvent, id]
  );

  const { setRows, light } = usePackRows({
    id,
    width,
    height,
    currentLayout,
    visibility,
    fit,
    darkMode,
    enabled: rowsEnabled,
    rowVariable,
  });

  const [popupSlotNames, setPopupSlotNames] = useState([]);
  const registerPopupSlot = useCallback((name) => {
    setPopupSlotNames((names) => (names.includes(name) ? names : [...names, name]));
    return () => setPopupSlotNames((names) => names.filter((n) => n !== name));
  }, []);

  const host = useMemo(
    () => ({
      disabled,
      loading,
      fieldId: `tj-pack-${id}`,
      // eslint-disable-next-line react-hooks/rules-of-hooks -- called by ToolJet.useValidation on every render of the component
      useValidation: (value, present, rule) => useHostValidation(latest, value, present, rule),
      setRows,
      rowSlotAttr: (index) => rowSlotAttr(id, index),
      registerPopupSlot,
      popupSlotAttr: (name) => `tj-slot-${id}-${name}`,
      formField,
      markRowScoped,
      resolveRow,
      widgetId: id,
      // As the native Button: a click announces itself, and the Form whose buttonToSubmit it is submits.
      submitForm: () =>
        document.dispatchEvent(
          new CustomEvent('submitForm', { detail: { buttonComponentId: id, buttonModuleId: moduleId } })
        ),
    }),
    [disabled, loading, id, setRows, registerPopupSlot, formField, markRowScoped, resolveRow, moduleId]
  );
  return { host, light, popupSlotNames, exposeVariable, fireHostEvent };
};
