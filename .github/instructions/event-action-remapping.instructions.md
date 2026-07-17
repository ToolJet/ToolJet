---
applyTo: |
  server/src/modules/versions/services/create.service.ts
  server/src/modules/apps/services/app-import-export.service.ts
  frontend/src/AppBuilder/RightSideBar/Inspector/ActionTypes.js
  frontend/src/AppBuilder/_stores/slices/eventsSlice.js
---

# Event Action ID Remapping

When an app version is cloned (draft creation, version creation) or an app is imported, every
`EventHandler` row is duplicated. The `event` JSONB column inside each row stores plain UUIDs
that reference components, queries, and pages **from the source version**. These UUIDs must be
remapped to the corresponding IDs in the new version.

## Where remapping happens

| Flow | File | Function |
|---|---|---|
| Version / draft creation | `server/src/modules/versions/services/create.service.ts` | `updateEventActionsForNewVersionWithNewMappingIds` |
| App import | `server/src/modules/apps/services/app-import-export.service.ts` | (same-named function, ~line 2716) |

Both functions follow the same pattern: iterate every `EventHandler`, switch on `actionId`, and
replace the stale UUID field with the new one from the appropriate mapping object.

## Current remapping table

| `actionId` | Field remapped | Mapping used |
|---|---|---|
| `run-query` / `reset-query` / `abort-query` | `queryId` | `oldDataQueryToNewMapping` |
| `control-component` | `componentId` | `oldComponentToNewComponentMapping` |
| `scroll-component-into-view` | `componentId` | `oldComponentToNewComponentMapping` |
| `show-modal` / `close-modal` | `modal` | `oldComponentToNewComponentMapping` |
| `set-table-page` | `table` | `oldComponentToNewComponentMapping` |
| `switch-page` | `pageId` | `oldPageToNewPageMapping` |

## Rule: adding a new action type

Whenever a new `actionId` is added to `ActionTypes.js` **and** it stores a component ID, query ID,
or page ID as a plain UUID field (i.e. not a `{{...}}` binding), you **must** add a remapping block
in **both** files above.

Checklist when adding a new action:

1. **`ActionTypes.js`** — note the `id` and any option whose value is a UUID reference
   (component, query, or page).
2. **`eventsSlice.js`** — confirm the exact field name used at runtime (e.g. `event.componentId`,
   `event.table`, `event.modal`). The option name in `ActionTypes.js` and the runtime field name
   sometimes differ.
3. **`create.service.ts` → `updateEventActionsForNewVersionWithNewMappingIds`** — add:
   ```ts
   if (eventDefinition?.actionId === '<your-new-action-id>') {
     eventDefinition.<fieldName> = oldComponentToNewComponentMapping[eventDefinition.<fieldName>];
   }
   ```
4. **`app-import-export.service.ts`** — add the same block (with the existence-guard pattern
   already used there):
   ```ts
   if (
     eventDefinition?.actionId === '<your-new-action-id>' &&
     oldComponentToNewComponentMapping[eventDefinition.<fieldName>]
   ) {
     eventDefinition.<fieldName> = oldComponentToNewComponentMapping[eventDefinition.<fieldName>];
   }
   ```

> `updateEntityReferences` (called just before the explicit blocks) only rewrites `{{...}}`
> template bindings — it does **not** remap plain UUID strings. The explicit `if` blocks are
> always required for plain UUID fields.
