import { sameValue } from '@/AppBuilder/_engines/data/equality';
import { removeFunctionObjects } from '@/_helpers/appUtils';
import { deepClone } from '@/_helpers/utilities/utils.helpers';

export const listViewComponentSlice = (set, get) => {
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

  // A row's data: each child component's exposed values for that row.
  const buildRow = ({ listviewId, rowIndex, outerIndices, moduleId }) => {
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
        rowData[childName] = { ...childExposed[rowIndex], id: childId };
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
        written.forEach(({ listviewId, moduleId }, key) => {
          updateDependency(`components.${listviewId}.children`, moduleId);
          updateDependency(`components.${listviewId}.data`, moduleId);
          if (selected.has(key)) {
            updateDependency(`components.${listviewId}.selectedRecord`, moduleId);
            updateDependency(`components.${listviewId}.selectedRow`, moduleId);
          }
        });
      });
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
    setExposedValuesPerRow: (componentId, values, indices, moduleId = 'canvas') => {
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
      set(
        (state) => {
          const mod = state.resolvedStore.modules[moduleId];
          if (!mod.listviewSlots) mod.listviewSlots = {};
          mod.listviewSlots[listviewId] = slots;
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
    },

    // `resetRows`: also clear the children's per-row values the slots held (they would be read as data rows).
    clearListviewSlots: (listviewId, moduleId = 'canvas', resetRows = false) => {
      const slots = get().resolvedStore.modules[moduleId]?.listviewSlots?.[listviewId];
      if (!slots) return;
      const childComponents = resetRows ? get().getContainerChildrenMapping(listviewId, moduleId) : [];
      set(
        (state) => {
          const mod = state.resolvedStore.modules[moduleId];
          delete mod.listviewSlots[listviewId];
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
      const { getContainerChildrenMapping, containerChildrenMapping } = get();

      // Pre-build a map from base UUID → children that are stored under slot IDs.
      // Some containers (e.g. Tabs) render their SubContainer with a slot suffix:
      //   <SubContainer id={`${id}-${tab.id}`} />
      // so their children have parent="tabs-uuid-tab0" and are stored in
      // containerChildrenMapping["tabs-uuid-tab0"], NOT under "tabs-uuid".
      // This map lets collectDescendants find those children when traversing down.
      const slotChildrenByBase = {};
      for (const key of Object.keys(containerChildrenMapping)) {
        const match = key.match(/([a-fA-F0-9-]{36})-.+/);
        if (match) {
          const baseId = match[1];
          if (!slotChildrenByBase[baseId]) slotChildrenByBase[baseId] = [];
          slotChildrenByBase[baseId].push(...(containerChildrenMapping[key] || []));
        }
      }

      // Recursively collect ALL descendant component IDs of this ListView.
      // This includes components nested inside sub-containers (Form, Container, Tabs, etc.).
      // Example: ListView → [Checkbox, Button, Form → [TextInput, Dropdown]]
      //   → allDescendants = [Checkbox, Button, Form, TextInput, Dropdown]
      const allDescendants = [];
      const collectDescendants = (containerId) => {
        const children = getContainerChildrenMapping(containerId, moduleId);
        const slotChildren = slotChildrenByBase[containerId] || [];
        // Combine direct children (base ID) and slot-keyed children (e.g. Tabs).
        // A child can only have one parent so there is no overlap between the two arrays.
        const allChildren = children.length > 0 ? children : slotChildren;
        for (const childId of allChildren) {
          allDescendants.push(childId);
          collectDescendants(childId);
        }
      };
      collectDescendants(listviewId);

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
