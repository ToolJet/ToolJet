import { isEqual } from 'lodash';
import { removeFunctionObjects } from '@/_helpers/appUtils';
import { deepClone } from '@/_helpers/utilities/utils.helpers';
import { getContract } from '@/AppBuilder/_engine/contracts';

// Per-listviewId set of every row index ever passed to
// ensureListviewRowsResolved — used only to decide whether a given window
// contains anything new (so a repeat call over an already-visited window is
// a no-op), independent of the ACTIVE (bounded) lazyRowIndices set. See
// ensureListviewRowsResolved for why these are two different things.
const _everRequestedRowIndices = new Map();

// Applies one row's derived data to its ListView's exposed `children`/`data`
// object — mutates the draft `exposed` in place inside a set() producer.
// Returns true if selectedRecord/selectedRow also needed updating. Shared by
// deriveListviewExposedData (standalone, one row → one set()) and
// _applyDeriveChainBatch (many rows combined into ONE set()) so both apply
// exactly the same target-navigation/selection-sync semantics.
const applyRowDataToTarget = (exposed, listviewId, outerIndices, rowIndex, rowData, clonedRowData) => {
  let target;
  if (outerIndices.length === 0) {
    // Top-level ListView: exposed values are a plain object
    if (!exposed[listviewId] || Array.isArray(exposed[listviewId])) {
      if (!exposed[listviewId]) exposed[listviewId] = {};
      // If it's an array (shouldn't happen for top-level), skip
      if (Array.isArray(exposed[listviewId])) return false;
    }
    target = exposed[listviewId];
  } else {
    // Nested ListView: navigate through outerIndices
    if (!Array.isArray(exposed[listviewId])) return false;
    target = exposed[listviewId];
    for (const idx of outerIndices) {
      if (Array.isArray(target)) {
        if (!target[idx]) target[idx] = {};
        target = target[idx];
      } else {
        return false; // Can't navigate
      }
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

export const listViewComponentSlice = (set, get) => {
  // Microtask dedup for _deriveListviewChain calls outside an explicit batch window.
  // Multiple setExposedVariables calls for the same (listview, row) in the same JS tick
  // (e.g. TableExposedVariables' ~15 useEffect hooks all firing on mount) collapse into
  // a single derive PASS per unique (listviewId, rowIndices, moduleId) — and, critically,
  // ALL pending rows across ALL listviews in this tick are applied via ONE combined set()
  // (applyDeriveChainBatch below), not one set() per row. deriveListviewExposedData used to
  // call its own set() every time it ran; every set() triggers a full app-wide Zustand
  // selector re-evaluation (every useStore subscriber re-runs), so N rows meant N such
  // storms — profiled as the dominant cost at scale (500 rows ≈ 10s, 57.6% of total time,
  // almost entirely this mechanism). Batching the writes, not just the scheduling, is what
  // actually fixes it.
  const _pendingDeriveChain = new Map();
  let _deriveChainScheduled = false;

  const scheduleDeriveChain = (nearestListviewId, indices, moduleId) => {
    const key = `${nearestListviewId}|${indices.join(',')}|${moduleId}`;
    _pendingDeriveChain.set(key, { nearestListviewId, indices, moduleId });
    if (!_deriveChainScheduled) {
      _deriveChainScheduled = true;
      queueMicrotask(() => {
        _deriveChainScheduled = false;
        const pending = [..._pendingDeriveChain.values()];
        _pendingDeriveChain.clear();
        get()._applyDeriveChainBatch(pending);
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
                if (isEqual(v, current[lastIdx][k])) {
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
          isUpdate ? [{ path: `components.${componentId}.${property}`, moduleId }] : []
        );
        // The derive reads from the store — it must run after all buffered
        // mutations are flushed. Register once per (listview, row) via
        // dedupeKey, and go through scheduleDeriveChain (not
        // _deriveListviewChain directly) so every row pending across this
        // flush gets combined into ONE set() instead of one per row.
        const parentId = get().getComponentDefinition(componentId, moduleId)?.component?.parent;
        const nearestListviewId = parentId ? get().findNearestSubcontainerAncestor(parentId, moduleId) : null;
        if (nearestListviewId) {
          get().bufferExposedValuePostFlush(
            () => scheduleDeriveChain(nearestListviewId, indices, moduleId),
            `${nearestListviewId}|${indices.join(',')}|${moduleId}`
          );
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
        get().bufferExposedValueMutation((state) => {
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
        }, depPaths);
        const parentId = get().getComponentDefinition(componentId, moduleId)?.component?.parent;
        const nearestListviewId = parentId ? get().findNearestSubcontainerAncestor(parentId, moduleId) : null;
        if (nearestListviewId) {
          get().bufferExposedValuePostFlush(
            () => scheduleDeriveChain(nearestListviewId, indices, moduleId),
            `${nearestListviewId}|${indices.join(',')}|${moduleId}`
          );
        }
        return;
      }

      scheduleExposedValuesPerRow(componentId, values, indices, moduleId);
    },

    // Ensures PROPERTY resolution (not exposed values — see
    // resolvedSlice.js's getAllExposedValues for that layer) has run for the
    // given row indices of a lazy-resolvable ListView (see
    // updateCustomResolvablesLazy, resolvedSlice.js — marks
    // lazyResolvableParents so updateChildComponentResolvedValues's cascade
    // scopes to lazyRowIndices instead of every row).
    //
    // lazyRowIndices is REPLACED with this call's window (+ row 0), not
    // accumulated across the whole scroll session. An earlier version merged
    // (grew the tracked set forever) on the reasoning that "a resolved row
    // never needs re-resolving" — true, but irrelevant:
    // updateChildComponentResolvedValues's cascade re-resolves its ENTIRE
    // tracked set on every trigger, not just new entries. Accumulating meant
    // every scroll tick re-resolved every row ever visited THIS SESSION,
    // making each tick slower than the last — the actual cause of the scroll
    // stutter this was built to fix. Replacing keeps each trigger's cost
    // bounded by the window size (~visible + overscan), never by how far
    // the user has scrolled so far. Once a row's properties are written to
    // resolvedStore.components[childId][i], they stay there even after that
    // index leaves lazyRowIndices — nothing here or in
    // updateChildComponentResolvedValues ever deletes a resolved row, it just
    // stops being in the set that gets ACTIVELY re-resolved on future
    // triggers, which is exactly what bounds the cost.
    //
    // Row 0 is always included: updateChildComponentResolvedValues creates a
    // not-yet-resolved row's entry using row 0 as the template for default
    // fields (styles/validation/etc. — see its `template = entityStore[0]`
    // fallback). If the visible range never happens to include 0 (e.g. a
    // deep link scrolling straight to row 5000), that template would be
    // missing and every newly-created row would end up with only the one
    // property being resolved, dropping its other defaults.
    //
    // Only re-triggers the {{listItem}} cascade if this window contains at
    // least one row never previously requested (tracked via a separate
    // ever-requested set, since the ACTIVE lazyRowIndices set no longer
    // remembers rows once they've scrolled out of the window) — repeatedly
    // calling with an already-fully-visited window is then a cheap no-op.
    // Used both for the virtualizer's visible+overscan range (Listview.jsx,
    // on mount and every scroll-driven range change) and for on-demand
    // single-row resolution when an expression references a row outside the
    // current window (resolvedSlice.js's lazy-read Proxy).
    ensureListviewRowsResolved: (listviewId, rowIndices, moduleId = 'canvas', parentIndices = []) => {
      const window_ = [...new Set([0, ...rowIndices])];
      const everRequested = _everRequestedRowIndices.get(listviewId) ?? new Set();
      const hasNew = window_.some((i) => !everRequested.has(i));
      window_.forEach((i) => everRequested.add(i));
      _everRequestedRowIndices.set(listviewId, everRequested);

      set((state) => {
        const m = state.resolvedStore.modules[moduleId];
        if (!m.lazyRowIndices) m.lazyRowIndices = {};
        m.lazyRowIndices[listviewId] = window_;
      });
      if (!hasNew) return; // every row in this window was already resolved at least once
      get().updateDependencyValues(`components.${listviewId}.listItem`, moduleId, parentIndices);
    },

    // Initialize exposed value arrays for all children of a ListView
    initExposedValueArrayForChildren: (listviewId, rowCount, moduleId = 'canvas', parentIndices = []) => {
      const { getContainerChildrenMapping } = get();
      const childComponents = getContainerChildrenMapping(listviewId, moduleId);

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

        // Also clean up stale rows from the ListView's own children/data
        const lvExposed = components[listviewId];
        if (lvExposed && !Array.isArray(lvExposed)) {
          if (lvExposed.children) {
            Object.keys(lvExposed.children).forEach((key) => {
              if (parseInt(key) >= rowCount) {
                delete lvExposed.children[key];
                if (lvExposed.data) delete lvExposed.data[key];
              }
            });
          }
        }
      });

      // No proactive fill here anymore — see getAllExposedValues /
      // _wrapExposedComponentsForLazyListviewRead (resolvedSlice.js). A row
      // that never mounts and is never referenced by an expression simply
      // never gets computed, instead of every row being eagerly computed up
      // front (still ~4s of background work for 1500 rows, would only get
      // worse at 10k-100k). The lazy Proxy resolves an off-screen row on
      // actual access instead, at O(1) cost per access — the only way this
      // genuinely scales to large datasets.
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

    // Build one row's data for a ListView — pure read, no store write. Shared
    // by deriveListviewExposedData (the reactive per-write path, called only
    // for rows that actually mounted something) and initExposedValueArrayForChildren's
    // proactive fill below (called for EVERY row on row-count/data change, so
    // off-screen rows that never mount still get an entry — see Phase 4 notes).
    _buildListviewRowData: (childIds, outerIndices, rowIndex, moduleId = 'canvas') => {
      const { getComponentNameFromId } = get();
      const exposedComponents = get().resolvedStore.modules[moduleId]?.exposedValues?.components;
      const rowData = {};
      childIds.forEach((childId) => {
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
          return;
        }

        // Bucket A fallback: this row's widgets never mounted (virtualized
        // off-screen), but the resolved properties/styles for every row are
        // fresh regardless of mount — reconstruct the mount-snapshot via the
        // component type's own contract (`deriveExposed`, `_engine/contracts.ts`
        // + `contractGroups/*.ts`) instead of leaving this row's data
        // undefined. Types without a `deriveExposed` (heavy Bucket-C widgets
        // whose real value depends on mounted-library state, e.g. Table,
        // Kanban, Modal) correctly stay mount-required.
        const componentType = get().getComponentDefinition(childId, moduleId)?.component?.component;
        const deriveExposed = getContract(componentType)?.deriveExposed;
        if (!deriveExposed) return;

        // Use the canonical getResolvedComponent (resolvedSlice.js) instead
        // of hand-rolled array indexing — it already implements the correct
        // fallback chain: a level that isn't an array is a resolved LEAF
        // (same value for every row — a fully static widget with no
        // {{listItem...}} binding never gets array-ified at all); a missing
        // index within an array (a row the resolution cascade hasn't visited
        // yet — arrays can be sparse) falls back to index 0 rather than
        // undefined. Re-deriving this by hand missed the sparse-array case,
        // which silently dropped some widgets from some rows' fallback.
        const rowResolved = get().getResolvedComponent(childId, [...outerIndices, rowIndex], moduleId);
        if (rowResolved?.properties) {
          rowData[childName] = { ...deriveExposed(rowResolved.properties, rowResolved.styles), id: childId };
        }
      });
      return rowData;
    },

    // Derive a single row's data for a ListView and write to the store.
    // For outerIndices=[] (top-level): writes to exposedValues.components[listviewId].children[rowIndex]
    // For outerIndices=[i] (nested): writes to exposedValues.components[listviewId][i].children[rowIndex]
    // Standalone, single-row, single-set() — used directly it does one set()
    // per call. When multiple rows need deriving in the same tick (the
    // common case at scale), go through scheduleDeriveChain instead, which
    // combines them all into one set() via _applyDeriveChainBatch below.
    deriveListviewExposedData: (listviewId, rowIndex, outerIndices, moduleId = 'canvas') => {
      const { getContainerChildrenMapping, _buildListviewRowData } = get();
      const childIds = getContainerChildrenMapping(listviewId);
      const rowData = _buildListviewRowData(childIds, outerIndices, rowIndex, moduleId);
      const clonedRowData = removeFunctionObjects(deepClone(rowData));

      let selectionUpdated = false;
      set((state) => {
        const exposed = state.resolvedStore.modules[moduleId].exposedValues.components;
        selectionUpdated = applyRowDataToTarget(exposed, listviewId, outerIndices, rowIndex, rowData, clonedRowData);
      });

      get().updateDependencyValues(`components.${listviewId}.children`, moduleId, []);
      get().updateDependencyValues(`components.${listviewId}.data`, moduleId, []);
      if (selectionUpdated) {
        get().updateDependencyValues(`components.${listviewId}.selectedRecord`, moduleId, []);
        get().updateDependencyValues(`components.${listviewId}.selectedRow`, moduleId, []);
      }
    },

    // Combines derive requests for potentially many (listview, row) pairs —
    // each walked up its full ancestor chain exactly like _deriveListviewChain
    // does — into ONE set() call and one deduped round of
    // updateDependencyValues, instead of one set() per row. This is the fix
    // for the dominant cost profiled at scale: every individual set() call
    // triggers a full app-wide Zustand selector re-evaluation, so N rows
    // mounting (e.g. 500-row ListView) meant N such storms.
    _applyDeriveChainBatch: (pending) => {
      const {
        findNearestSubcontainerAncestor,
        getComponentDefinition,
        getContainerChildrenMapping,
        _buildListviewRowData,
      } = get();

      const rowUpdates = [];
      const seenRows = new Set();
      const depKeys = new Set(); // `${listviewId}|${moduleId}`

      pending.forEach(({ nearestListviewId, indices, moduleId }) => {
        let currentLV = nearestListviewId;
        let currentIndices = [...indices];

        while (currentLV && currentIndices.length > 0) {
          const lvDef = getComponentDefinition(currentLV, moduleId);
          const componentType = lvDef?.component?.component;
          const rowIndex = currentIndices[currentIndices.length - 1];
          const outerIndices = currentIndices.slice(0, -1);

          // Table acts as a subcontainer for expandable rows but should not
          // expose ListView-style children/data variables on the table itself.
          if (componentType !== 'Table') {
            const rowKey = `${currentLV}|${moduleId}|${outerIndices.join(',')}|${rowIndex}`;
            if (!seenRows.has(rowKey)) {
              seenRows.add(rowKey);
              const childIds = getContainerChildrenMapping(currentLV);
              const rowData = _buildListviewRowData(childIds, outerIndices, rowIndex, moduleId);
              const clonedRowData = removeFunctionObjects(deepClone(rowData));
              rowUpdates.push({ listviewId: currentLV, outerIndices, rowIndex, moduleId, rowData, clonedRowData });
              depKeys.add(`${currentLV}|${moduleId}`);
            }
          }

          // Move up to outer ListView/Kanban (Table may itself be nested inside one)
          const lvParent = lvDef?.component?.parent;
          currentLV = lvParent ? findNearestSubcontainerAncestor(lvParent, moduleId) : null;
          currentIndices = outerIndices;
        }
      });

      if (rowUpdates.length === 0) return;

      const selectionKeys = new Set(); // `${listviewId}|${moduleId}`
      set((state) => {
        rowUpdates.forEach(({ listviewId, outerIndices, rowIndex, moduleId, rowData, clonedRowData }) => {
          const exposed = state.resolvedStore.modules[moduleId].exposedValues.components;
          const updated = applyRowDataToTarget(exposed, listviewId, outerIndices, rowIndex, rowData, clonedRowData);
          if (updated) selectionKeys.add(`${listviewId}|${moduleId}`);
        });
      });

      depKeys.forEach((key) => {
        const [listviewId, moduleId] = key.split('|');
        get().updateDependencyValues(`components.${listviewId}.children`, moduleId, []);
        get().updateDependencyValues(`components.${listviewId}.data`, moduleId, []);
      });
      selectionKeys.forEach((key) => {
        const [listviewId, moduleId] = key.split('|');
        get().updateDependencyValues(`components.${listviewId}.selectedRecord`, moduleId, []);
        get().updateDependencyValues(`components.${listviewId}.selectedRow`, moduleId, []);
      });
    },

    // Walk up the ListView ancestor chain, deriving children/data at each level.
    // indices = the per-row indices from the child write (e.g., [outerRow, innerRow])
    _deriveListviewChain: (nearestListviewId, indices, moduleId = 'canvas') => {
      const { findNearestSubcontainerAncestor, getComponentDefinition, deriveListviewExposedData } = get();

      let currentLV = nearestListviewId;
      let currentIndices = [...indices];

      while (currentLV && currentIndices.length > 0) {
        const lvDef = getComponentDefinition(currentLV, moduleId);
        const componentType = lvDef?.component?.component;
        const rowIndex = currentIndices[currentIndices.length - 1];
        const outerIndices = currentIndices.slice(0, -1);

        // Table acts as a subcontainer for expandable rows but should not expose
        // ListView-style children/data variables on the table itself.
        if (componentType !== 'Table') {
          deriveListviewExposedData(currentLV, rowIndex, outerIndices, moduleId);
        }

        // Move up to outer ListView/Kanban (Table may itself be nested inside one)
        const lvParent = lvDef?.component?.parent;
        currentLV = lvParent ? findNearestSubcontainerAncestor(lvParent, moduleId) : null;
        currentIndices = outerIndices;
      }
    },
  };
};
