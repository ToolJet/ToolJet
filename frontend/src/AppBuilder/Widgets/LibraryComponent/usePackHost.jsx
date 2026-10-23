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
import { ROW_VARIABLES } from './inlineRuntime';

/* Pack contract v2: what the LibraryComponent host gives a pack component beyond the base SDK (inlineRuntime.ts
   PackHost). The validation, rows and popup drop areas live here; the control state is the widget's own. */

const filled = (value) =>
  !(value === undefined || value === null || value === '' || (Array.isArray(value) && !value.length));

// The widget's Validation section judged on the component's value, as native inputs do: isValid and isMandatory are
// published, and the error shows once the field was touched. 0 and false are values.
const useHostValidation = (latest, value, present) => {
  const { validate, validation, setExposedVariable } = latest.current;
  const status =
    (typeof validate === 'function' ? validate((present ?? filled(value)) ? value : undefined) : null) || {};
  const isValid = status.isValid !== false;
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
      error: touched && !isValid ? status.validationError || 'Invalid value' : '',
      required: isMandatory,
      touch: () => setTouched(true),
    }),
    [isValid, touched, status.validationError, isMandatory]
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

/** The rows a pack list draws as ToolJet canvases ({{listItem}}), with the native List view's row plumbing. */
const usePackRows = ({ id, width, height, currentLayout, visibility, fit, darkMode, enabled }) => {
  const { moduleId } = useModuleContext();
  const { contextPath } = useSubcontainerContext();
  const parentIndices = useMemo(() => contextPath.map((s) => s.index), [contextPath]);
  const updateCustomResolvables = useStore((s) => s.updateCustomResolvables);
  const initExposedValueArrayForChildren = useStore((s) => s.initExposedValueArrayForChildren);
  const [rows, setRowsState] = useState({ items: [], rowHeight: 72 });
  const setRows = useCallback(
    (items, rowHeight) =>
      setRowsState((prev) =>
        isEqual(prev.items, items) && (!rowHeight || rowHeight === prev.rowHeight)
          ? prev
          : { items, rowHeight: rowHeight || prev.rowHeight }
      ),
    []
  );
  useLayoutEffect(() => {
    if (!enabled) return;
    if (rows.items.length)
      updateCustomResolvables(
        id,
        rows.items.map((listItem) => ({ listItem })),
        'listItem',
        moduleId,
        parentIndices
      );
    initExposedValueArrayForChildren(id, rows.items.length, moduleId, parentIndices);
  }, [enabled, rows.items, id, moduleId, parentIndices, updateCustomResolvables, initExposedValueArrayForChildren]);

  const light = enabled
    ? rows.items.map((_item, index) => (
        <div key={index} slot={rowSlotAttr(id, index)} className="tw-block tw-w-full">
          <ListviewSubcontainer
            id={id}
            index={index}
            moduleId={moduleId}
            mode="list"
            rowHeight={rows.rowHeight}
            positiveColumns={1}
            showBorder={false}
            onRecordOrRowClicked={() => {}}
            computeCanvasBackgroundColor={() => 'transparent'}
            darkMode={darkMode}
            width={width}
            isDynamicHeightEnabled={fit}
            data={rows.items}
            currentLayout={currentLayout}
            visibility={visibility}
            parentHeight={height}
            componentType="LibraryComponent"
          />
        </div>
      ))
    : null;
  return { setRows, light };
};

export const usePackHost = (
  props,
  { disabled, loading, rowsEnabled, fit, visibility, formField = false, markRowScoped }
) => {
  const { id, validate, validation, setExposedVariable, width, height, currentLayout, darkMode } = props;
  const { moduleId } = useModuleContext();
  const resolveRow = useRowResolve(moduleId);
  const latest = useRef({ validate, validation, setExposedVariable });
  latest.current = { validate, validation, setExposedVariable };

  const { setRows, light } = usePackRows({
    id,
    width,
    height,
    currentLayout,
    visibility,
    fit,
    darkMode,
    enabled: rowsEnabled,
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
      useValidation: (value, present) => useHostValidation(latest, value, present),
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
  return { host, light, popupSlotNames };
};
