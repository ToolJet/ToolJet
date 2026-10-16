# ToolJet UI 2.0 widgets: names

Event ids, action names, exposed value names and property keys are saved in apps (event handlers, `{{ }}` bindings,
query code), so each is settled once and never renamed without a data migration. `__tests__/packConfigs.spec.js`
checks the rules below against every config.

## Rules

1. **One name per thing.** An event, action, exposed value or property has exactly one name. No second name for the
   same thing, no runtime aliases (the older `visibility()`, `disable()` and `loading()` are gone; every widget has
   `setVisibility`, `setDisable` and `setLoading`).
2. **The native widget's name** where the UI 2.0 widget has a native counterpart: ListView uses Listview's
   `onRecordClicked`, `selectedRecord` and `selectedRecordId`; Kanban uses `onCardSelected`, `updatedCardData`,
   `lastCardMovement`; Select and the pickers fire `onSelect`; Radio group fires `onSelectionChange`. Where the native
   widget keeps a deprecated duplicate, the non-deprecated name. A later "one widget, several looks" merge into the
   native type then changes only the type, never a name.
3. **An input's current value is `value`** (what a Form collects), even where the native widget names it otherwise
   (Color picker, Toggle group). Tags input and Multiselect expose the list as `values`; File upload as `file`.
4. **Everything else follows one grammar.**
   - An event about the widget as a whole: `on<Verb>` (`onClick`, `onChange`, `onSelect`, `onOpen`, `onSubmit`,
     `onComplete`, `onFinish`).
   - An event about one part of the widget: `on<Part><PastTense>` (`onItemClicked`, `onCardClicked`,
     `onSlideChanged`, `onMonthChanged`, `onMapClicked`, `onBookingClicked`).
   - Actions: a verb, usually `set<Thing>` / `clear<Thing>` (`setValue`, `clearValue`, `setPage`, `selectItem`).
   - A clicked data item in a list-like widget: `selectedItem` and `selectedItemId` (its `idField` value).

Two events on one widget may both fire for one click only when they mean different things (Checkbox `onChange` and
`onCheck`; Button group `onClick` and, when the selection changed, `onChange`; Accordion `onExpand`/`onCollapse` and
`onChange`).

## Retired names

The names used before these rules are in `legacyNames.ts` (old name to new). Saved apps are rewritten by the server
data migration `server/data-migrations/*-RenameUi2PackNames.ts`, and exported apps on import
(`server/src/modules/apps/services/ui2-legacy-names.ts`, the same table; a spec checks the copies agree). The MCP
catalog, its lint and the agent's page compiler use only the current names.

## Event dispatch

ToolJet's event dispatcher (`onEvent` in `_stores/slices/eventsSlice.js`) runs handlers only for event names on a
fixed list; a widget event missing from it never runs its handlers, with no error. Every UI 2.0 event is on it, and
`_stores/__tests__/integration/everyWidgetEventDispatches.spec.js` fails for any config event left out.

## Native gaps the UI 2.0 widgets fill

- Native Checkbox's `setValue` fires `onCheck`/`onUnCheck` but not `onChange`, and its `toggle` fires `onChange`
  only. The UI 2.0 Checkbox fires what a click fires for both.
- Events a native counterpart lacks: Textarea `onEnterPressed`; OTP `onComplete`; Table `onRowHovered`,
  `onHeaderClick`, `onSelectionChanged`; Breadcrumb `onItemClicked` with `lastClickedItem`; charts `onDoubleClick`.

## Not carried over from the native widgets

- Date and time picker time zones (`setDisplayTimezone`, `setStoreTimezone`): the UI 2.0 picker works in local time.
- Currency input `setCountryCode`: the currency is picked by ISO code (`setCurrency`, or `setValue`'s second
  argument).
- Table `onExpand`, `onNewRowsAdded`, `discardNewlyAddedRows`: no expandable rows or add-row form. The native Table in
  the UI 2.0 look has both.
- Key-value list edit events: the UI 2.0 list is read-only.
