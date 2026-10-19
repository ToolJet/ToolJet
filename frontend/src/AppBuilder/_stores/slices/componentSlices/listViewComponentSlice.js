import { sameValue } from '@/AppBuilder/_engines/data/equality';
import { removeFunctionObjects } from '@/_helpers/appUtils';
import { deepClone } from '@/_helpers/utilities/utils.helpers';
import {
  actionKindOf,
  descendantsOf,
  forgetListviewRows,
  handleOf,
  hasReplay,
  holdRowMounted,
  isRowOf,
  keepsRow,
  liveExposure,
  markRowSettled,
  nextRowChange,
  plainArgs,
  readRow,
  reconcileSettledRows,
  recordingAction,
  resolveRowChildInput as resolveChildInput,
  rowChangesOf,
  rowScopeBase,
  settleRows,
  uncomputedRowChildren,
  unsettledRowValues,
  wrapRowActions,
  wrapRows,
} from '@/AppBuilder/_engines/materialize/rows';
import { exposureOf } from '@/AppBuilder/_engines/materialize/widgets';
import {
  estimate,
  forgetEstimate,
  profileListview,
  rowChangesWritten,
} from '@/AppBuilder/_engines/materialize/estimate';
import { materializeAll } from '@/AppBuilder/_engines/materialize/materialize';
import { forgetListviewReads, readByTemplates } from '@/AppBuilder/_engines/materialize/prepare';

export const listViewComponentSlice = (set, get, api) => {
  // Microtask dedup for _deriveListviewChain calls outside an explicit batch window.
  // Multiple setExposedVariables calls for the same (listview, row) in the same JS tick
  // (e.g. TableExposedVariables' ~15 useEffect hooks all firing on mount) collapse into
  // a single _deriveListviewChain call per unique (listviewId, rowIndices, moduleId).
  const _pendingDeriveChain = new Map();
  let _deriveChainScheduled = false;
  // While a flush derives many rows, the dependency paths they touch (`components.<lv>.children` …) are collected
  // here and updated once at the end: N rows used to run 2N dependency passes over the same two paths.
  let _deferredDependencyPaths = null;
  const updateDependency = (path, moduleId) => {
    if (_deferredDependencyPaths) _deferredDependencyPaths.set(`${moduleId}\u0000${path}`, { path, moduleId });
    else get().updateDependencyValues(path, moduleId, []);
  };

  // The rows to derive for a child write at `indices`: its row in the nearest ListView, then the matching row in each
  // ListView/Kanban above it. A Table acts as a subcontainer for expandable rows but doesn't expose ListView-style
  // children/data, so it is walked through without a row of its own.
  const chainRows = (nearestListviewId, indices, moduleId) => {
    const { findNearestSubcontainerAncestor, getComponentDefinition } = get();
    const rows = [];
    let currentLV = nearestListviewId;
    let currentIndices = [...indices];
    while (currentLV && currentIndices.length > 0) {
      const lvDef = getComponentDefinition(currentLV, moduleId);
      const outerIndices = currentIndices.slice(0, -1);
      if (lvDef?.component?.component !== 'Table') {
        rows.push({
          listviewId: currentLV,
          rowIndex: currentIndices[currentIndices.length - 1],
          outerIndices,
          moduleId,
        });
      }
      const lvParent = lvDef?.component?.parent;
      currentLV = lvParent ? findNearestSubcontainerAncestor(lvParent, moduleId) : null;
      currentIndices = outerIndices;
    }
    return rows;
  };

  // A row's data: each child component's exposed values for that row. A windowed ListView's (rows drawn in slots, see
  // slotsOf) are its row's: their functions run the action on that data row (_engines/materialize/rows.js), not on
  // the widget, which unmounts when the row scrolls away.
  // A drawn row with changes not yet replayed onto its widgets (just drawn again) shows them already
  // (rows.js unsettledRowValues): its widgets' first values are their props.
  const buildRow = ({ listviewId, rowIndex, dataRow, outerIndices, moduleId }) => {
    const windowed = !!slotsOf(listviewId, outerIndices, moduleId);
    const unsettled = windowed ? unsettledRowValues(get, listviewId, rowIndex, dataRow, moduleId) : null;
    const { getContainerChildrenMapping, getComponentNameFromId } = get();
    const exposedComponents = get().resolvedStore.modules[moduleId]?.exposedValues?.components;
    const rowData = {};
    getContainerChildrenMapping(listviewId).forEach((childId) => {
      const childName = getComponentNameFromId(childId, moduleId);
      let childExposed = exposedComponents?.[childId];
      // Navigate through outer indices for nested ListViews
      for (const idx of outerIndices) {
        if (!Array.isArray(childExposed)) {
          childExposed = undefined;
          break;
        }
        childExposed = childExposed[idx];
      }
      // Now childExposed is the array of rows at this nesting level
      if (Array.isArray(childExposed) && childExposed[rowIndex]) {
        const values = unsettled?.has(childId)
          ? { ...childExposed[rowIndex], ...unsettled.get(childId) }
          : childExposed[rowIndex];
        rowData[childName] = {
          ...(windowed ? wrapRowActions(get, listviewId, dataRow, childId, values, moduleId, true) : values),
          id: childId,
        };
      }
    });
    return { rowData, clonedRowData: removeFunctionObjects(deepClone(rowData)) };
  };

  // A ListView with many rows renders only a window of them in a few slots (see Listview.jsx): its children's per-row
  // values are stored by slot, and slot s shows data row `slots[s]`. Its children/data stay keyed by data row. Null for
  // any other ListView (rows and slots are the same).
  const slotsOf = (listviewId, outerIndices, moduleId) =>
    outerIndices.length === 0 ? (get().resolvedStore.modules[moduleId]?.listviewSlots?.[listviewId] ?? null) : null;

  // Writes a derived row into the draft; true when it is the ListView's selected row (kept in sync).
  const writeRow = (state, { listviewId, dataRow, outerIndices, moduleId }, { rowData, clonedRowData }) => {
    const rowIndex = dataRow;
    const exposed = state.resolvedStore.modules[moduleId].exposedValues.components;

    // Navigate to the correct target for this ListView's exposed values
    let target;
    if (outerIndices.length === 0) {
      // Top-level ListView: exposed values are a plain object
      if (!exposed[listviewId]) exposed[listviewId] = {};
      // If it's an array (shouldn't happen for top-level), skip
      if (Array.isArray(exposed[listviewId])) return false;
      target = exposed[listviewId];
    } else {
      // Nested ListView: navigate through outerIndices
      if (!Array.isArray(exposed[listviewId])) return false;
      target = exposed[listviewId];
      for (const idx of outerIndices) {
        if (!Array.isArray(target)) return false; // Can't navigate
        if (!target[idx]) target[idx] = {};
        target = target[idx];
      }
      if (!target || typeof target !== 'object' || Array.isArray(target)) return false;
    }

    // Ensure children/data are plain objects (not arrays).
    // The widget config initializes data as [{}] (array), but production format is an object
    // keyed by row index: { 0: {...}, 1: {...} }. Without this check, the array persists
    // because ![] is false (arrays are truthy), and numeric indices get set on the array.
    if (!target.children || Array.isArray(target.children)) target.children = {};
    if (!target.data || Array.isArray(target.data)) target.data = {};
    target.children[rowIndex] = rowData;
    target.data[rowIndex] = clonedRowData;

    // Keep selectedRecord/selectedRow in sync when the selected row's children
    // update AFTER the click snapshot. onRecordOrRowClicked runs on the capture
    // phase, so a child's own click handler (e.g. a table row selection) updates
    // its exposed values after selectedRecord was already snapshotted — without
    // this, selectedRecord stays one update behind until the next row click.
    if (target.selectedRecordId === rowIndex || target.selectedRowId === rowIndex) {
      target.selectedRecord = rowData;
      target.selectedRow = rowData;
      return true;
    }
    return false;
  };

  /**
   * Derives `rows` ({ listviewId, rowIndex, outerIndices, moduleId }) with one store write per nesting level, not one
   * per row: each write copies the ListView's `children` and `data` (one key per row), so a write per row made N rows
   * cost N². Deepest first: an outer ListView's row reads its inner ListViews' rows, derived just before.
   */
  const deriveRows = (allRows) => {
    const levels = new Map();
    const rows = [];
    allRows.forEach((row) => {
      const slots = slotsOf(row.listviewId, row.outerIndices, row.moduleId);
      const dataRow = slots ? slots[row.rowIndex] : row.rowIndex;
      // A slot showing no row (freed while scrolling) has nothing to write.
      if (dataRow !== undefined && dataRow >= 0) rows.push({ ...row, dataRow });
    });
    rows.forEach((row) => {
      const depth = row.outerIndices.length;
      if (!levels.has(depth)) levels.set(depth, new Map());
      levels.get(depth).set(`${row.moduleId}|${row.listviewId}|${row.outerIndices.join(',')}|${row.rowIndex}`, row);
    });
    [...levels.keys()]
      .sort((a, b) => b - a)
      .forEach((depth) => {
        const level = [...levels.get(depth).values()];
        const built = level.map(buildRow);
        const selected = new Set();
        set((state) => {
          level.forEach((row, i) => {
            if (writeRow(state, row, built[i])) selected.add(`${row.moduleId}|${row.listviewId}`);
          });
        });
        const written = new Map(level.map((row) => [`${row.moduleId}|${row.listviewId}`, row]));
        written.forEach(({ listviewId, moduleId }, key) => notifyRowsWritten(listviewId, moduleId, selected.has(key)));
        // A row drawn again gets the changes made to it while it wasn't (once its widgets have mounted).
        settleRows(get, level);
      });
  };

  // The rows each windowed ListView last showed (refreshListviewEstimate): `${moduleId}|${listviewId}` → rows.
  const _notifiedRows = new Map();

  // Dependents of a ListView's children/data re-resolve (and of its selected row, when that was written).
  const notifyRowsWritten = (listviewId, moduleId, selectedWritten) => {
    updateDependency(`components.${listviewId}.children`, moduleId);
    updateDependency(`components.${listviewId}.data`, moduleId);
    if (selectedWritten) {
      updateDependency(`components.${listviewId}.selectedRecord`, moduleId);
      updateDependency(`components.${listviewId}.selectedRow`, moduleId);
    }
  };

  // Keeps the change a state action made to a child of a row of a windowed ListView (rows.js nextRowChange).
  const recordRowChange = (state, { listviewId, dataRow, childId, change, moduleId }) => {
    const mod = state.resolvedStore.modules[moduleId];
    if (!mod.listviewRowChanges) mod.listviewRowChanges = {};
    const rows = (mod.listviewRowChanges[listviewId] ??= {});
    (rows[dataRow] ??= {})[childId] = change;
  };

  // Records the change a state action makes to a drawn row's child (rows.js nextRowChange), before its widget runs it.
  const recordDrawnRowAction = ({ listviewId, dataRow, slot, childId, action, args, exposure, moduleId }) => {
    const current = get().resolvedStore.modules[moduleId].exposedValues.components[childId]?.[slot] ?? {};
    const plain = plainArgs(args);
    const input = resolveChildInput(get, listviewId, dataRow, childId, moduleId);
    const initial = exposure.initial(input);
    const changes = rowChangesOf(get, listviewId, dataRow, moduleId);
    const patch = exposure.actions[action](current, plain, input);
    const change = nextRowChange({ exposure, change: changes?.[childId], initial, input, action, args: plain, patch });
    set((state) => recordRowChange(state, { listviewId, dataRow, childId, change, moduleId }), false, {
      type: 'runRowAction',
    });
    rowChangesWritten(get, listviewId, dataRow, moduleId);
    // Its widget shows the change: not to be replayed onto it (unless the row was still to be restored).
    if (!hasReplay(changes)) markRowSettled(listviewId, slot, dataRow, moduleId);
  };

  // A drawn row's state actions record what they change whoever runs them (its children wrapper, an event's
  // control-component action, a script), so the row shows it again once it's drawn again: a windowed ListView's child
  // exposes them, in its slot, as recordingActions (the widget's own run after the record). Any other values as given.
  const recordingActions = (componentId, values, indices, moduleId) => {
    if (indices.length !== 1 || !Object.values(values).some((value) => typeof value === 'function')) return values;
    const definition = get().getComponentDefinition(componentId, moduleId)?.component;
    const listviewId = definition?.parent;
    const slot = indices[0];
    const dataRow = listviewId ? slotsOf(listviewId, [], moduleId)?.[slot] : undefined;
    const exposure = dataRow >= 0 ? exposureOf(definition.component) : undefined;
    if (!exposure) return values;
    const wrapped = { ...values };
    Object.keys(exposure.actions).forEach((action) => {
      const run = values[action];
      if (typeof run !== 'function') return;
      wrapped[action] = recordingAction(run, (args) => {
        const slots = slotsOf(listviewId, [], moduleId);
        if (!slots) return run(...args);
        // Its widget is gone (the row left its slot, or its widgets unmounted in it): it runs on the row.
        if (slots[slot] !== dataRow || !liveExposure(get, listviewId, dataRow, componentId, moduleId))
          return get().runRowAction(listviewId, dataRow, componentId, action, args, moduleId);
        recordDrawnRowAction({ listviewId, dataRow, slot, childId: componentId, action, args, exposure, moduleId });
        return run(...args);
      });
    });
    return wrapped;
  };

  // State actions on rows that aren't drawn, applied together a microtask after the first: one write records their
  // changes and one writes their rows into children/data, with one dependency pass per ListView. A write per call
  // made k calls cost k copies of the children and data maps.
  let _pendingRowActions = [];
  const runUndrawnStateAction = (call) =>
    new Promise((resolve, reject) => {
      _pendingRowActions.push({ ...call, resolve, reject });
      if (_pendingRowActions.length === 1) queueMicrotask(flushRowActions);
    });

  const flushRowActions = () => {
    const calls = _pendingRowActions;
    _pendingRowActions = [];
    const reads = new Map(); // `${moduleId}|${listviewId}|${dataRow}` → { listviewId, dataRow, moduleId, read }
    const bases = new Map(); // `${moduleId}|${listviewId}` → rowScopeBase: what each undrawn row resolves in
    const baseOf = (listviewId, moduleId) => {
      const key = `${moduleId}|${listviewId}`;
      if (!bases.has(key)) bases.set(key, rowScopeBase(get, listviewId, moduleId));
      return bases.get(key);
    };
    const changes = new Map(); // `${rowKey}|${childId}` → recordRowChange's payload
    const done = [];
    calls.forEach((call) => {
      const { listviewId, dataRow, childId, action, args, moduleId, exposure } = call;
      try {
        if (!isRowOf(get, listviewId, dataRow, moduleId)) throw new RangeError(`Row ${dataRow} is not in the list`);
        const rowKey = `${moduleId}|${listviewId}|${dataRow}`;
        if (!reads.has(rowKey)) {
          const read = readRow(get, listviewId, dataRow, moduleId, true, baseOf(listviewId, moduleId));
          reads.set(rowKey, { listviewId, dataRow, moduleId, read });
        }
        const { read } = reads.get(rowKey);
        // Drawn since it was called: its widget runs it.
        if (!read.computed?.inputs.has(childId)) {
          call.resolve(get().runRowAction(listviewId, dataRow, childId, action, args, moduleId));
          return;
        }
        const name = get().getComponentNameFromId(childId, moduleId);
        const input = read.computed.inputs.get(childId);
        const initial = read.computed.initials.get(childId);
        const patch = exposure.actions[action](read.row[name], args, input);
        // A later call in this flush sees it.
        read.row[name] = { ...read.row[name], ...patch };
        const changeKey = `${rowKey}|${childId}`;
        const change = changes.get(changeKey)?.change ?? rowChangesOf(get, listviewId, dataRow, moduleId)?.[childId];
        changes.set(changeKey, {
          listviewId,
          dataRow,
          childId,
          moduleId,
          change: nextRowChange({ exposure, change, initial, input, action, args, patch }),
        });
        done.push(call);
      } catch (error) {
        call.reject(error);
      }
    });
    if (!done.length) return;
    try {
      set((state) => changes.forEach((payload) => recordRowChange(state, payload)), false, {
        type: 'runRowAction',
      });
      reads.forEach(({ listviewId, dataRow, moduleId }) => rowChangesWritten(get, listviewId, dataRow, moduleId));
      // The rows as they read now: a child reading a changed sibling is computed again (rows.js computeRow).
      const rows = [...reads.values()].map(({ listviewId, dataRow, moduleId, read }) => {
        const rowData = read.computed?.dependent
          ? readRow(get, listviewId, dataRow, moduleId, true, baseOf(listviewId, moduleId)).row
          : read.row;
        return { listviewId, dataRow, moduleId, rowData };
      });
      const selected = new Map();
      set((state) => {
        rows.forEach(({ listviewId, dataRow, moduleId, rowData }) => {
          const written = writeRow(
            state,
            { listviewId, dataRow, outerIndices: [], moduleId },
            { rowData, clonedRowData: removeFunctionObjects(deepClone(rowData)) }
          );
          const key = `${moduleId}|${listviewId}`;
          selected.set(key, { listviewId, moduleId, written: written || !!selected.get(key)?.written });
        });
      });
      selected.forEach(({ listviewId, moduleId, written }) => notifyRowsWritten(listviewId, moduleId, written));
    } catch (error) {
      done.forEach((call) => call.reject(error));
      return;
    }
    done.forEach((call) => call.resolve());
  };

  // Rows written inside an exposed-value batch (a ListView mounting its rows) are derived together once the batch is
  // applied: one callback per module collects them all, where a callback per row meant a store write per row.
  const _batchedDeriveChains = new Map(); // moduleId → Map(key → chain)
  const deriveChainAfterBatch = (nearestListviewId, indices, moduleId) => {
    if (!_batchedDeriveChains.has(moduleId)) _batchedDeriveChains.set(moduleId, new Map());
    _batchedDeriveChains.get(moduleId).set(`${nearestListviewId}|${indices.join(',')}`, { nearestListviewId, indices });
    get().bufferExposedValuePostFlush(
      () => {
        const chains = [...(_batchedDeriveChains.get(moduleId)?.values() ?? [])];
        _batchedDeriveChains.delete(moduleId);
        deriveRows(chains.flatMap(({ nearestListviewId: lvId, indices: idx }) => chainRows(lvId, idx, moduleId)));
      },
      moduleId,
      `listviewDeriveRows|${moduleId}`
    );
  };

  const scheduleDeriveChain = (nearestListviewId, indices, moduleId) => {
    const key = `${nearestListviewId}|${indices.join(',')}|${moduleId}`;
    _pendingDeriveChain.set(key, { nearestListviewId, indices, moduleId });
    if (!_deriveChainScheduled) {
      _deriveChainScheduled = true;
      queueMicrotask(() => {
        _deriveChainScheduled = false;
        const pending = [..._pendingDeriveChain.values()];
        _pendingDeriveChain.clear();
        _deferredDependencyPaths = new Map();
        try {
          deriveRows(
            pending.flatMap(({ nearestListviewId: lvId, indices: idx, moduleId: mid }) => chainRows(lvId, idx, mid))
          );
        } finally {
          const paths = [..._deferredDependencyPaths.values()];
          _deferredDependencyPaths = null;
          paths.forEach(({ path, moduleId: mid }) => get().updateDependencyValues(path, mid, []));
        }
      });
    }
  };

  // Microtask batch for setExposedValuesPerRow outside an explicit batch window.
  // Coalesces all setExposedVariables calls from multiple ListView children (e.g.
  // 50 Tables mounting simultaneously) in the same JS tick into ONE Zustand set()
  // instead of N×effects individual set() calls.
  const _pendingPerRow = new Map(); // key → { componentId, values: merged, indices, moduleId }
  let _perRowFlushScheduled = false;

  const scheduleExposedValuesPerRow = (componentId, values, indices, moduleId) => {
    const key = `${componentId}|${indices.join('.')}|${moduleId}`;
    const existing = _pendingPerRow.get(key);
    if (existing) {
      Object.assign(existing.values, values);
    } else {
      _pendingPerRow.set(key, { componentId, values: { ...values }, indices, moduleId });
    }
    if (!_perRowFlushScheduled) {
      _perRowFlushScheduled = true;
      queueMicrotask(() => {
        _perRowFlushScheduled = false;
        const pending = [..._pendingPerRow.values()];
        _pendingPerRow.clear();

        const skipKeysMap = new Map();
        set(
          (state) => {
            for (const { componentId: cid, values: cvalues, indices: cidx, moduleId: cmod } of pending) {
              const skipKeys = new Set();
              skipKeysMap.set(`${cid}|${cidx.join('.')}|${cmod}`, skipKeys);
              const components = state.resolvedStore.modules[cmod].exposedValues.components;
              if (!Array.isArray(components[cid])) components[cid] = [];
              let current = components[cid];
              for (let i = 0; i < cidx.length - 1; i++) {
                const idx = cidx[i];
                if (!current[idx]) current[idx] = [];
                else if (!Array.isArray(current[idx])) current[idx] = [current[idx]];
                current = current[idx];
              }
              const lastIdx = cidx[cidx.length - 1];
              if (!current[lastIdx] || typeof current[lastIdx] !== 'object' || Array.isArray(current[lastIdx])) {
                current[lastIdx] = {};
              }
              Object.entries(cvalues).forEach(([k, v]) => {
                if (sameValue(v, current[lastIdx][k])) {
                  skipKeys.add(k);
                } else {
                  current[lastIdx][k] = v;
                }
              });
            }
          },
          false,
          { type: 'scheduleExposedValuesPerRow_flush' }
        );

        for (const { componentId: cid, values: cvalues, indices: cidx, moduleId: cmod } of pending) {
          const skipKeys = skipKeysMap.get(`${cid}|${cidx.join('.')}|${cmod}`) ?? new Set();
          Object.entries(cvalues).forEach(([k, v]) => {
            if (typeof v !== 'function' && !skipKeys.has(k)) {
              get().updateDependencyValues(`components.${cid}.${k}`, cmod, []);
            }
          });
          const parentId = get().getComponentDefinition(cid, cmod)?.component?.parent;
          const nearestListviewId = parentId ? get().findNearestSubcontainerAncestor(parentId, cmod) : null;
          if (nearestListviewId) {
            scheduleDeriveChain(nearestListviewId, cidx, cmod);
          }
        }
      });
    }
  };

  return {
    // Per-row exposed value write for ListView children.
    // After writing, derives the parent ListView's children/data directly in the store.
    setExposedValuePerRow: (componentId, property, value, indices, moduleId = 'canvas') => {
      if (typeof value === 'function') {
        value = recordingActions(componentId, { [property]: value }, indices, moduleId)[property];
      }
      if (typeof value !== 'function' && get().isExposedValueBatching()) {
        // Only register a dep path when this is an update to an existing row slot.
        // Brand-new row slots have no downstream dependents yet, so dep traversal is a no-op.
        const existingComponents = get().resolvedStore.modules[moduleId]?.exposedValues?.components;
        const lastIdx = indices[indices.length - 1];
        let existingRow = Array.isArray(existingComponents?.[componentId]) ? existingComponents[componentId] : null;
        for (let i = 0; existingRow && i < indices.length - 1; i++) existingRow = existingRow[indices[i]];
        const isUpdate = existingRow?.[lastIdx]?.[property] !== undefined;

        get().bufferExposedValueMutation(
          (state) => {
            const components = state.resolvedStore.modules[moduleId].exposedValues.components;
            if (!Array.isArray(components[componentId])) components[componentId] = [];
            let current = components[componentId];
            for (let i = 0; i < indices.length - 1; i++) {
              const idx = indices[i];
              if (!current[idx]) current[idx] = [];
              else if (!Array.isArray(current[idx])) current[idx] = [current[idx]];
              current = current[idx];
            }
            if (!current[lastIdx] || typeof current[lastIdx] !== 'object' || Array.isArray(current[lastIdx])) {
              current[lastIdx] = {};
            }
            current[lastIdx][property] = value;
          },
          moduleId,
          isUpdate ? [{ path: `components.${componentId}.${property}`, moduleId }] : []
        );
        // _deriveListviewChain reads from the store — it must run after all buffered mutations
        // are flushed. Register once per (listview, row) via dedupeKey.
        const parentId = get().getComponentDefinition(componentId, moduleId)?.component?.parent;
        const nearestListviewId = parentId ? get().findNearestSubcontainerAncestor(parentId, moduleId) : null;
        if (nearestListviewId) {
          deriveChainAfterBatch(nearestListviewId, indices, moduleId);
        }
        return;
      }

      scheduleExposedValuesPerRow(componentId, { [property]: value }, indices, moduleId);
    },

    // Batch per-row exposed value write for ListView children.
    setExposedValuesPerRow: (componentId, exposedValues, indices, moduleId = 'canvas') => {
      const values = recordingActions(componentId, exposedValues, indices, moduleId);
      if (get().isExposedValueBatching()) {
        const existingComponents = get().resolvedStore.modules[moduleId]?.exposedValues?.components;
        const lastIdx = indices[indices.length - 1];
        let existingRow = Array.isArray(existingComponents?.[componentId]) ? existingComponents[componentId] : null;
        for (let i = 0; existingRow && i < indices.length - 1; i++) existingRow = existingRow[indices[i]];
        const isNewSlot = !existingRow || existingRow[lastIdx] === undefined;

        const depPaths = isNewSlot
          ? []
          : Object.keys(values)
              .filter((key) => typeof values[key] !== 'function')
              .map((key) => ({ path: `components.${componentId}.${key}`, moduleId }));
        get().bufferExposedValueMutation(
          (state) => {
            const components = state.resolvedStore.modules[moduleId].exposedValues.components;
            if (!Array.isArray(components[componentId])) components[componentId] = [];
            let current = components[componentId];
            for (let i = 0; i < indices.length - 1; i++) {
              const idx = indices[i];
              if (!current[idx]) current[idx] = [];
              else if (!Array.isArray(current[idx])) current[idx] = [current[idx]];
              current = current[idx];
            }
            const lastIdx = indices[indices.length - 1];
            if (!current[lastIdx] || typeof current[lastIdx] !== 'object' || Array.isArray(current[lastIdx])) {
              current[lastIdx] = {};
            }
            Object.entries(values).forEach(([key, value]) => {
              current[lastIdx][key] = value;
            });
          },
          moduleId,
          depPaths
        );
        const parentId = get().getComponentDefinition(componentId, moduleId)?.component?.parent;
        const nearestListviewId = parentId ? get().findNearestSubcontainerAncestor(parentId, moduleId) : null;
        if (nearestListviewId) {
          deriveChainAfterBatch(nearestListviewId, indices, moduleId);
        }
        return;
      }

      scheduleExposedValuesPerRow(componentId, values, indices, moduleId);
    },

    // Clears every exposed variable (except id) for ONE row of a ListView child —
    // the per-row counterpart to resolvedSlice's resetComponentExposedValues, which
    // would blindly overwrite the whole per-row array (all rows) with a single flat
    // object. Walks `indices` the same way setExposedValuePerRow does to reach the
    // leaf row object.
    resetComponentExposedValuesPerRow: (componentId, indices, moduleId = 'canvas') => {
      const components = get().resolvedStore.modules[moduleId]?.exposedValues?.components;
      const lastIdx = indices[indices.length - 1];
      let existingRow = Array.isArray(components?.[componentId]) ? components[componentId] : null;
      for (let i = 0; existingRow && i < indices.length - 1; i++) existingRow = existingRow[indices[i]];
      const existing = existingRow?.[lastIdx];

      if (!existing || Object.keys(existing).length === 0) return;

      const { id, ...rest } = existing;
      const keys = Object.keys(rest);

      if (keys.length === 0) return;

      set(
        (state) => {
          let current = state.resolvedStore.modules[moduleId].exposedValues.components[componentId];
          for (let i = 0; i < indices.length - 1; i++) current = current[indices[i]];
          current[lastIdx] = id !== undefined ? { id } : {};
        },
        false,
        { type: 'resetComponentExposedValuesPerRow', payload: { componentId, indices, moduleId } }
      );

      keys.forEach((key) => get().updateDependencyValues(`components.${componentId}.${key}`, moduleId, []));

      const parentId = get().getComponentDefinition(componentId, moduleId)?.component?.parent;
      const nearestListviewId = parentId ? get().findNearestSubcontainerAncestor(parentId, moduleId) : null;
      if (nearestListviewId) {
        get()._deriveListviewChain(nearestListviewId, indices, moduleId);
      }
    },

    // Initialize exposed value arrays for all children of a ListView
    // `keepRows`: rows of the ListView's own children/data to keep (its data rows; more than `rowCount` when it renders
    // its rows in slots).
    initExposedValueArrayForChildren: (
      listviewId,
      rowCount,
      moduleId = 'canvas',
      parentIndices = [],
      keepRows = rowCount
    ) => {
      const { getContainerChildrenMapping } = get();
      const childComponents = getContainerChildrenMapping(listviewId, moduleId);
      let pruned = false;
      // A windowed ListView's rows past the end lose their changes, settled slots and wrappers: walked only when its rows
      // were cut shorter since the last write (rows.js forgetListviewRows).
      const cut = !!slotsOf(listviewId, parentIndices, moduleId) && forgetListviewRows(listviewId, moduleId, keepRows);
      set((state) => {
        const components = state.resolvedStore.modules[moduleId].exposedValues.components;
        childComponents.forEach((childId) => {
          if (parentIndices.length === 0) {
            if (!Array.isArray(components[childId])) {
              components[childId] = [];
            }
            const arr = components[childId];
            if (arr.length < rowCount) {
              for (let i = arr.length; i < rowCount; i++) {
                if (!arr[i]) arr[i] = {};
              }
            }
            arr.length = rowCount;
          } else {
            if (!Array.isArray(components[childId])) {
              components[childId] = [];
            }
            let current = components[childId];
            for (let i = 0; i < parentIndices.length; i++) {
              const idx = parentIndices[i];
              if (!current[idx]) {
                current[idx] = [];
              } else if (!Array.isArray(current[idx])) {
                current[idx] = [current[idx]];
              }
              current = current[idx];
            }
            if (current.length < rowCount) {
              for (let i = current.length; i < rowCount; i++) {
                if (!current[i]) current[i] = {};
              }
            }
            current.length = rowCount;
          }
        });

        // Also clean up stale rows from the ListView's own children/data. A nested
        // ListView keeps one exposed object per outer row, so walk parentIndices to it.
        let lvExposed = components[listviewId];
        for (const idx of parentIndices) {
          lvExposed = Array.isArray(lvExposed) ? lvExposed[idx] : undefined;
        }
        const rowChanges = cut && state.resolvedStore.modules[moduleId].listviewRowChanges?.[listviewId];
        Object.keys(rowChanges || {}).forEach((key) => {
          if (parseInt(key) >= keepRows) delete rowChanges[key];
        });
        if (lvExposed && !Array.isArray(lvExposed) && lvExposed.children) {
          Object.keys(lvExposed.children).forEach((key) => {
            if (parseInt(key) >= keepRows) {
              delete lvExposed.children[key];
              if (lvExposed.data) delete lvExposed.data[key];
              pruned = true;
            }
          });
        }
      });

      if (!pruned) return;
      // Runs during the ListView's render, so notify dependents after it. Bindings to
      // this ListView's children/data re-resolve, and an outer ListView re-derives the
      // row that holds this one so its own children stop carrying the removed rows.
      queueMicrotask(() => {
        get().updateDependencyValues(`components.${listviewId}.children`, moduleId, []);
        get().updateDependencyValues(`components.${listviewId}.data`, moduleId, []);
        if (parentIndices.length > 0) {
          const parentId = get().getComponentDefinition(listviewId, moduleId)?.component?.parent;
          const outerListviewId = parentId ? get().findNearestSubcontainerAncestor(parentId, moduleId) : null;
          if (outerListviewId) get()._deriveListviewChain(outerListviewId, parentIndices, moduleId);
        }
      });
    },

    /**
     * A ListView rendering a window of its rows in slots: `slots[s]` is the data row slot s shows (-1: none). Slots in
     * `resetSlots` changed rows: their children's values for the previous row are cleared, so nothing of it is read as
     * the new row's before the new row's widgets have mounted. The previous row keeps its derived children/data.
     */
    setListviewSlots: (listviewId, slots, resetSlots = [], moduleId = 'canvas') => {
      const childComponents = get().getContainerChildrenMapping(listviewId, moduleId);
      // Starting to draw its rows in slots: what its children/data hold was written with the functions of widgets that
      // unmount now. They become its rows' wrappers (rows.js), as buildRow writes them from here on. Nothing is settled
      // in its slots yet (its rows mount afresh).
      const entering = !slotsOf(listviewId, [], moduleId);
      if (entering) forgetListviewRows(listviewId, moduleId);
      const rewrapped = entering ? wrapRows(get, listviewId, moduleId) : null;
      set(
        (state) => {
          const mod = state.resolvedStore.modules[moduleId];
          if (!mod.listviewSlots) mod.listviewSlots = {};
          mod.listviewSlots[listviewId] = slots;
          const lvExposed = mod.exposedValues.components[listviewId];
          if (rewrapped && lvExposed?.children && !Array.isArray(lvExposed)) {
            Object.assign(lvExposed.children, rewrapped);
            const selected = rewrapped[lvExposed.selectedRecordId] ?? rewrapped[lvExposed.selectedRowId];
            if (selected) {
              lvExposed.selectedRecord = selected;
              lvExposed.selectedRow = selected;
            }
          }
          if (!resetSlots.length) return;
          const exposed = mod.exposedValues.components;
          childComponents.forEach((childId) => {
            const rows = exposed[childId];
            if (!Array.isArray(rows)) return;
            resetSlots.forEach((slot) => {
              if (slot < rows.length) rows[slot] = {};
            });
          });
        },
        false,
        { type: 'setListviewSlots', payload: { listviewId, moduleId } }
      );
      reconcileSettledRows(listviewId, slots, moduleId);
      // Its rows' profile, for estimating reading them all: started (in the background) once it has data, then kept
      // current through the store (estimate.js).
      profileListview(get, api.subscribe, listviewId, moduleId);
    },

    // The ListView shows other rows (Listview.jsx, after it renders them): its rows' profile follows even when the
    // store didn't change after it rendered (data reloaded with the same content). Once a template read rows of it
    // that it doesn't draw (_engines/materialize/prepare.js readByTemplates), which its children/data don't hold, what
    // reads its children/data is resolved again too; nothing more for a ListView no template read so.
    refreshListviewEstimate: (listviewId, moduleId = 'canvas') => {
      profileListview(get, api.subscribe, listviewId, moduleId);
      const key = `${moduleId}|${listviewId}`;
      const rows = handleOf(moduleId, listviewId)?.rows;
      if (!rows || _notifiedRows.get(key) === rows) return;
      const first = !_notifiedRows.has(key);
      _notifiedRows.set(key, rows);
      if (!first && readByTemplates(listviewId, moduleId)) notifyRowsWritten(listviewId, moduleId, false);
    },

    // `resetRows`: also clear the children's per-row values the slots held (they would be read as data rows).
    clearListviewSlots: (listviewId, moduleId = 'canvas', resetRows = false) => {
      const slots = get().resolvedStore.modules[moduleId]?.listviewSlots?.[listviewId];
      // The engine's per-row bookkeeping goes with the ListView even when its slots are already gone (the module's
      // resolved state replaced while it was mounted).
      forgetListviewRows(listviewId, moduleId);
      forgetEstimate(listviewId, moduleId);
      forgetListviewReads(listviewId, moduleId);
      _notifiedRows.delete(`${moduleId}|${listviewId}`);
      if (!slots) return;
      const childComponents = resetRows ? get().getContainerChildrenMapping(listviewId, moduleId) : [];
      set(
        (state) => {
          const mod = state.resolvedStore.modules[moduleId];
          delete mod.listviewSlots[listviewId];
          if (mod.listviewRowChanges) delete mod.listviewRowChanges[listviewId];
          childComponents.forEach((childId) => {
            const rows = mod.exposedValues.components[childId];
            if (!Array.isArray(rows)) return;
            for (let slot = 0; slot < Math.min(slots.length, rows.length); slot++) rows[slot] = {};
          });
        },
        false,
        { type: 'clearListviewSlots', payload: { listviewId, moduleId } }
      );
    },

    // ─── Rows on demand (see _engines/materialize/rows.js) ─────────────────────────────────────────────────────────

    /** Replaces a row's changes (rows.js: without what no longer counts), unless they changed since they were `seen`. */
    replaceListviewRowChanges: (listviewId, dataRow, seen, changes, moduleId = 'canvas') => {
      if (rowChangesOf(get, listviewId, dataRow, moduleId) !== seen) return;
      set(
        (state) => {
          const rows = state.resolvedStore.modules[moduleId].listviewRowChanges?.[listviewId];
          if (!rows) return;
          if (Object.keys(changes).length) rows[dataRow] = changes;
          else delete rows[dataRow];
        },
        false,
        { type: 'replaceListviewRowChanges', payload: { listviewId, dataRow, moduleId } }
      );
      rowChangesWritten(get, listviewId, dataRow, moduleId);
    },

    /**
     * What reading every row of the ListView at once would cost (_engines/materialize/estimate.js): `{ ready, rows,
     * timeMs, resultBytes, jsonChars, drawnWidgets … }`. `options.json`: the rows are to be serialized.
     */
    estimateListviewRows: (listviewId, options = {}, moduleId = 'canvas') =>
      estimate(get, listviewId, moduleId, options),

    /**
     * Every row of the ListView, `{ children, data }` keyed by data row, as if it drew them all (deep-frozen, not
     * stored): a promise (`options.mode` 'background', the default) or the value ('sync'). Throws a
     * MaterializationError saying why when reading them all doesn't fit (_engines/materialize/materialize.js).
     */
    materializeListviewRows: (listviewId, options = {}, moduleId = 'canvas') =>
      materializeAll(get, api.subscribe, listviewId, moduleId, options),

    /** A row's data, like `children[dataRow]`, whether or not the row is drawn. */
    readListviewRow: (listviewId, dataRow, moduleId = 'canvas') => readRow(get, listviewId, dataRow, moduleId).row,

    /**
     * The ids of the row's children that readListviewRow can't compute (not drawn, and no exposure module): it reads
     * what they exposed when the row was last drawn, or nothing.
     */
    uncomputedRowChildren: (listviewId, dataRow, moduleId = 'canvas') =>
      uncomputedRowChildren(get, listviewId, dataRow, moduleId),

    /** A row child's input (props, styles, validation, validate) as its widget would receive it in that row. */
    resolveRowChildInput: (listviewId, dataRow, childId, moduleId = 'canvas') =>
      resolveChildInput(get, listviewId, dataRow, childId, moduleId),

    /**
     * Resolves once the row is drawn and its widgets have mounted: a windowed ListView pins it (it stays drawn as a
     * row the user clicked). Rejects when the row leaves the list or the ListView unmounts first.
     */
    ensureRowMounted: (listviewId, dataRow, moduleId = 'canvas') =>
      holdRowMounted(get, api.subscribe, listviewId, dataRow, moduleId).then((release) => {
        const handle = handleOf(moduleId, listviewId);
        if (handle?.windowed) handle.pinRow(dataRow);
        release();
      }),

    /**
     * Runs a child's action on a row, whether or not the row is drawn; resolves to the action's result. A drawn row's
     * widget runs it (a state action records its change, see recordingActions). On a row that isn't drawn a state action
     * (one that only changes exposed values) is applied to the row's data and kept for when it's drawn; any other action
     * draws the row first, and holds it drawn while it runs. In a windowed ListView an action that leaves something
     * only the widget keeps (TextInput's setText) keeps its row drawn, and one on a child with no exposure module pins
     * it (as a row the user clicked: nothing would restore what it did). Rejects when the action can't run (the row
     * left the list, the ListView unmounted, no such action).
     */
    runRowAction: (listviewId, dataRow, childId, action, args = [], moduleId = 'canvas') => {
      // A widget deeper in the row (in a container of it) runs drawn, the row kept drawn: only the row's own children
      // are read, and their changes kept, while it isn't.
      const { exposure, isState } = get().getContainerChildrenMapping(listviewId, moduleId).includes(childId)
        ? actionKindOf(get, childId, action, moduleId)
        : {};
      const windowed = !!slotsOf(listviewId, [], moduleId);
      const keep = () => {
        const handle = handleOf(moduleId, listviewId);
        if (!handle?.windowed) return;
        if (keepsRow(exposure, action)) handle.keepRow(dataRow);
        else if (!exposure) handle.pinRow(dataRow);
      };
      const live = liveExposure(get, listviewId, dataRow, childId, moduleId);

      if (typeof live?.[action] === 'function') {
        if (windowed) keep();
        return Promise.resolve(live[action](...args));
      }
      if (windowed && isState && !live) {
        return runUndrawnStateAction({
          listviewId,
          dataRow,
          childId,
          action,
          args: plainArgs(args),
          moduleId,
          exposure,
        });
      }
      return holdRowMounted(get, api.subscribe, listviewId, dataRow, moduleId).then(async (release) => {
        try {
          const run = liveExposure(get, listviewId, dataRow, childId, moduleId)?.[action];
          if (typeof run !== 'function') {
            const name = get().getComponentNameFromId(childId, moduleId) ?? childId;
            throw new TypeError(`${name} has no action ${action} in row ${dataRow}`);
          }
          keep();
          return await run(...args);
        } finally {
          release();
        }
      });
    },

    // ─── Row-Scoped Component Resolution ───────────────────────────────────────
    //
    // PROBLEM:
    //   Inside a ListView, components like checkbox1 store their exposed values as
    //   per-row arrays: components['checkbox-uuid'] = [{ value: false }, { value: true }, ...]
    //   But when resolving an expression like {{components.checkbox1.value}} for a button
    //   in row 2, we need the resolver to see the single row-2 object { value: true },
    //   not the full array.
    //
    // SOLUTION:
    //   We create a lightweight overlay object using Object.create(components).
    //   - The overlay inherits ALL entries from state.components via the prototype chain.
    //   - We then override ONLY the ListView's descendant entries on the overlay,
    //     replacing their arrays with the specific row's object.
    //   - When the resolver accesses a descendant (e.g., checkbox-uuid), it hits the
    //     overlay's own property → gets the row-specific value.
    //   - When the resolver accesses a non-descendant (e.g., a canvas-level button),
    //     it falls through the prototype → gets the global value from state.components.
    //
    // ──────────────────────────────────────────────────────────────────────────────

    // Called ONCE before the row loop. Collects descendant IDs and creates the
    // prototype overlay. Returns null if the ListView has no descendants.
    prepareRowScope: (components, listviewId, moduleId = 'canvas') => {
      // Recursively collect ALL descendant component IDs of this ListView.
      // This includes components nested inside sub-containers (Form, Container, Tabs, etc.).
      // Example: ListView → [Checkbox, Button, Form → [TextInput, Dropdown]]
      //   → allDescendants = [Checkbox, Button, Form, TextInput, Dropdown]
      const allDescendants = descendantsOf(get, listviewId, moduleId);

      if (allDescendants.length === 0) return null;

      // Create a new object whose prototype is state.components.
      // Any property not explicitly set on `scoped` will fall through to state.components.
      const scoped = Object.create(components);

      // Pre-create writable own properties for each descendant.
      // WHY Object.defineProperty instead of plain assignment (scoped[childId] = {})?
      //   Immer freezes state.components after each store update, which makes all its
      //   properties non-writable. In JavaScript strict mode, if a prototype has a
      //   non-writable property, you CANNOT create a same-named own property on a
      //   derived object via plain assignment — it throws TypeError. But
      //   Object.defineProperty bypasses this restriction and creates the own property.
      //   After this, the own property is writable:true, so updateRowScope can use
      //   plain assignment (scoped[childId] = ...) without issues.
      for (const childId of allDescendants) {
        Object.defineProperty(scoped, childId, {
          value: {},
          writable: true,
          enumerable: true,
          configurable: true,
        });
      }

      return { scoped, descendantIds: allDescendants, components };
    },

    // Called PER ROW inside the loop. Mutates the same `scoped` object in place —
    // overwrites each descendant's own property with the row-specific value.
    // Uses plain assignment (fast) because prepareRowScope already created writable
    // own properties via Object.defineProperty.
    //
    // Example for row 2:
    //   components['checkbox-uuid'] = [{ value: false }, { value: false }, { value: true }]
    //   → scoped['checkbox-uuid'] = { value: true }   (the row-2 entry)
    //
    // The scoped object is shared across rows — we just overwrite the values each iteration.
    // This works because resolveDynamicValues is synchronous and doesn't hold references.
    updateRowScope: (scopeCtx, rowIndex) => {
      const { scoped, descendantIds, components } = scopeCtx;
      for (const childId of descendantIds) {
        const val = components[childId];
        if (Array.isArray(val)) {
          scoped[childId] = val[rowIndex] ?? {};
        }
      }
    },

    // Derive a single row's data for a ListView and write to the store.
    // For outerIndices=[] (top-level): writes to exposedValues.components[listviewId].children[rowIndex]
    // For outerIndices=[i] (nested): writes to exposedValues.components[listviewId][i].children[rowIndex]
    deriveListviewExposedData: (listviewId, rowIndex, outerIndices, moduleId = 'canvas') => {
      deriveRows([{ listviewId, rowIndex, outerIndices, moduleId }]);
    },

    // Walk up the ListView ancestor chain, deriving children/data at each level.
    // indices = the per-row indices from the child write (e.g., [outerRow, innerRow])
    _deriveListviewChain: (nearestListviewId, indices, moduleId = 'canvas') => {
      deriveRows(chainRows(nearestListviewId, indices, moduleId));
    },
  };
};
