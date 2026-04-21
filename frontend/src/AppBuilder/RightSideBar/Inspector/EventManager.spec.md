# EventManager — Design Revamp Spec
<!-- figma: https://www.figma.com/design/AZCPfXi2lWjvbYuaMfcIuD/01-LC---properties-panel?node-id=1112-9298 -->
<!-- tracking issue: https://github.com/ToolJet/tj-ee/issues/4936 -->
<!-- synced: 2026-04-20 -->
<!-- target ship: 2026-04-21 -->

## Scope

**This is a design revamp, not a refactor.** Keep the existing `EventManager.jsx` structure. Do NOT extract hooks, split into multiple files, build a registry pattern, or migrate anything outside what the design requires. The goal is minimal-diff: swap markup + HOCs, add 3 new interactions, land tomorrow.

### In scope
- Migrate `OverlayTrigger` + `react-bootstrap` Popover → Rocket `Popover` / `PopoverTrigger` / `PopoverContent`
- Popover header: "Edit event" title + Duplicate icon + Delete icon
- Event list row redesigned (two-line card with Switch)
- Add-handler flow: button click → opens Rocket Popover with event-trigger menu → pick → push new handler
- Empty state: Rocket `Empty` component
- Loading state: spinner replaces Switch on the row
- Row hover tooltips (name + event→action line)
- Rocket HOC migration for Select, Switch, Button (icon), Tooltip, Empty used inside this file
- **Change default-name fallback** from `${sourceName} ${eventDisplayName}` to `Event #N` (issue #4936) — only affects newly-created handlers; existing handlers keep their stored names

### Out of scope (do NOT do)
- Extracting action panels into a registry
- Splitting file into `EventHandlersList` / `EventPopover` / hooks
- Touching `ActionConfigurationPanels/*` (GotoApp, SwitchPage, RunjsParameters) beyond what's visually required
- `CodeHinter` internals — keep as-is
- `react-beautiful-dnd` — keep
- Cypress selectors — preserve all existing `data-cy` values
- Dark mode — Figma only gave light; token bridge handles dark automatically
- "Events" collapsible section header — parent Inspector owns it, not this file

## Design deltas vs. current

| Area | Current | New |
|---|---|---|
| Popover lib | `react-bootstrap` + `OverlayTrigger` | Rocket `Popover` (controlled via `open` / `onOpenChange`) |
| Popover width | 350px | **303px** (`tw-w-[303px]`) |
| Popover header | none | 44px bar: "Edit event" (`tw-font-title-large`) + Duplicate + Delete icon buttons, divider below |
| Popover body padding | loose rows | 16px padding, 12px gap between field groups |
| Field layout | bootstrap `col-3 label / col-9 control` | flex row: label left, control right `tw-w-[168px]` |
| "Action options" divider | `hr-text` | sub-section header: `Configure action` text with leading + following horizontal lines, text = `tw-text-placeholder tw-font-caption` |
| Delete | list row button | popover header trash icon; closes popover on click |
| Duplicate | ✗ | **NEW** — popover header copy icon; clones current event config, inserts at `index + 1`, closes popover |
| Event list row | single-line + delete btn | 2-line card: row1 = name + Switch; row2 = event type + arrow-right + action name |
| Row bg | plain | `rgba(136,144,153,0.08)` (interactive/default), `tw-rounded-md`, `tw-p-2`, `tw-w-[268px]` |
| Row hover | — | tooltips on truncated name and on truncated event→action line |
| Row Switch | ✗ | toggles `event.disabled`; clicking Switch must NOT open popover (stop propagation) |
| Loading (per row) | loader flags via `ManageEventButton` | spinner replaces Switch on affected row; thin blue gradient bar at row bottom |
| Empty state | `NoListItem` text | Rocket `Empty` with pointer-click icon in `bg-background-surface-layer-02` tile + title + description |
| Add handler btn | `AddNewButton` | Rocket `Button` outline variant, 12px icon, matches Figma `Text` frame styling |
| Add handler flow | instant create with `defaultEventId` | click → popover opens with event-trigger list menu → user picks eventId → push new handler with picked eventId (and default `show-alert` action) |

## New interactions (detailed)

### 1. Duplicate
Popover header copy icon (lucide `Copy`, 14px). On click:
- `deepClone` the source event handler
- Strip `id` (backend assigns a new one) and set `index: events.length` — **appends at end for v1**; user can drag to reorder. (The store's `createAppVersionEventHandlers(event, moduleId)` has no insert-at-index support — verified in `eventsSlice.js:149`. Exact-position insert needs a follow-up that calls `reorderEvents` post-create; out of scope for tomorrow.)
- Name: `${source.name} copy` (unconditional — simpler than detecting user-set vs auto-generated)
- Call `createAppVersionEventHandlers(clone)`
- Close popover (set `focusedEventIndex` to null)

### 2. Delete in popover header
Trash icon (lucide `Trash`, 14px). On click:
- Call existing `removeHandler(index)`
- Close popover (set `focusedEventIndex` to null)

### 3. Row Switch
On row, right-aligned. On toggle:
- `e.stopPropagation()` — must not open popover
- `handlerChanged(index, 'disabled', !currentValue)`
- Shows `loading` spinner variant during `eventsUpdatedLoader` / `actionsUpdatedLoader`

### 4. Add handler flow
"Add new event handler" Button is now a `PopoverTrigger`. Clicking it opens a popover containing a menu of available events (`possibleEvents` from `eventMetaDefinition.events`).

- Menu item: `tw-px-2 tw-py-1.5 tw-rounded-md hover:tw-bg-interactive-hover`, typography `tw-font-body-default`, label = `eventDisplayName`
- 180px wide, scrollable if overflow (Rocket scroll or native)
- On pick: call existing `addHandler` logic **but pass the selected eventId** instead of defaulting to `Object.keys(eventMetaDefinition.events)[0]`
- Close menu
- Do NOT auto-open the event-edit popover for the new row (user opens it by clicking the row if they want)

### 5. Default event name (issue #4936)
Change `getDefaultEventName` (line 436) signature and body:
- **Old:** `getDefaultEventName(eventId) → ${sourceName} ${eventDisplayName}` (stale when eventId changes)
- **New:** `getDefaultEventName() → Event #${events.length + 1}` (stable, not tied to event type)
- Only the fallback changes. The "Event name" CodeHinter in the popover still lets users override with custom names — `event.name` is a top-level field persisted via `handlerChanged(index, 'name', value)`.
- Duplicate follows the " copy" suffix rule above, which composes naturally (`Event #3 copy`, `On save copy`).

## Component inventory (Rocket HOCs to use)

| Rocket | Where |
|---|---|
| `Popover`, `PopoverTrigger`, `PopoverContent` | main event-edit popover + add-handler menu popover |
| `Button` (outline variant, icon size) | "Add new event handler", Duplicate + Delete icons in popover header |
| `Switch` | on row + in popover |
| `Select` | Event + Action + Alert type + Modal + Query + Table + App Mode + Scroll behavior/block dropdowns |
| `Tooltip` | row hover tooltips |
| `Empty` | empty state |
| `Spinner` | row loading state |
| `Label` | form labels in popover |

Icons (lucide-react, via Rocket): `Copy`, `Trash`, `Plus`, `ArrowRight` (row), `MousePointerClick` (empty state).

## Token / typography reference

| Token | ToolJet class |
|---|---|
| surface-layer-01 (popover bg) | `tw-bg-background-surface-layer-01` |
| surface-layer-02 (empty-state icon tile) | `tw-bg-background-surface-layer-02` |
| border/weak (dividers) | `tw-border-border-weak` |
| border/default (inputs) | `tw-border-border-default` |
| text/default | `tw-text-text-default` |
| text/placeholder (secondary labels, event type in row) | `tw-text-text-placeholder` |
| interactive/default (row bg) | `tw-bg-interactive-default` (verify token name) |
| interactive/hover | `tw-bg-interactive-hover` |
| controls/switch-bg-on | `tw-bg-controls-switch-bg-on` (Switch HOC handles) |
| Elevations/100 (list rows, button shadow) | `tw-shadow-elevation-100` |
| Elevations/400 (popover, menu, tooltip) | `tw-shadow-elevation-400` |
| IBM 12/18 medium (popover title, row name) | `tw-font-title-default` |
| IBM 12/18 regular (form labels, menu items) | `tw-font-body-default` |
| IBM 11/16 medium ("Configure action" sub-header) | `tw-font-title-small` |
| IBM 12/20 regular (row event-type / action text) | `tw-font-body-default` + `tw-leading-5` if the 2px line-height delta shows |
| IBM Mono 12/16 (input text) | `tw-font-code-regular` — CodeHinter already styles its own input |

Available font utilities (from `tailwind.config.js:151–295`): `font-display-small`, `font-title-heavy-{xx,x,}large`, `font-title-heavy-medium`, `font-title-heavy-small`, `font-title-{xx,x,}large`, `font-title-{default,small,section-title}`, `font-body-{xx,x,}large`, `font-body-{large,default,small}`, `font-code-regular`. No `font-caption`. Font family is Inter (not IBM Plex) — intentional Rocket decision.

## Surgical change list for `EventManager.jsx`

Target: minimal-diff. Keep functions, keep store calls, keep DnD. Change markup + wrap in Rocket.

1. **Replace OverlayTrigger pattern (lines 1299–1351)**
   - Swap to `<Popover open={focusedEventIndex === index} onOpenChange={...}>`
   - `PopoverTrigger asChild` wraps the row
   - `PopoverContent` holds the existing `eventPopover(event, index)` body, now with a header

2. **Add popover header** inside `eventPopover()` (line 547): new div before first field row, with Duplicate + Delete icon buttons.

3. **Update list row markup** (the trigger, currently `ManageEventButton` at line 1332): new two-line layout with Switch + tooltips.

4. **Remove delete from `ManageEventButton`** — it's now in popover header. Can leave the component in place, just skip the delete slot.

5. **Empty state (line 1384 block)**: replace `NoListItem` with Rocket `Empty`. Also **delete the unreachable duplicate empty block at lines 1395–1414.**

6. **Add-handler button (line 1366)**: wrap in `Popover` + event-trigger menu. Modify `addHandler` to accept a `selectedEventId` param.

7. **Duplicate handler**: new function `duplicateHandler(index)` — deepClones event, calls `createAppVersionEventHandlers` (+ reorder if needed), closes popover.

8. **Remove global `mousedown` listener (lines 124–132)** — replace with `onInteractOutside` on `PopoverContent` that calls `preventDefault` when `event.target` is inside `.cm-completionListIncompleteBottom`.

9. **Remove `shouldSkipOnToggle` hack (lines 1306–1323)** — not needed with Radix.

10. **Drop `usePopoverObserver` (lines 1375–1382)** — Radix auto-repositions. Verify scroll inside `.query-details` before merging; keep if it regresses.

11. **Replace each inline `Select` with Rocket `Select`**. Replace bootstrap checkbox toggle with Rocket `Switch`. Leave `CodeHinter`, `ToggleGroup`, and extracted panel components (`GotoApp`, `SwitchPage`, `RunjsParameters`) alone.

## What stays unchanged

- `useStore` selectors, `useEventActions`, all store-shaped calls
- All action-panel branch logic inside `eventPopover` (show-alert, open-webpage, etc.) — only the wrapping markup changes
- `CodeHinter` usage and props
- `react-beautiful-dnd` DnD
- All `data-cy` attributes (preserve exactly — testing team handoff depends on it)
- `ManageEventButton` file lives; delete-button slot disappears, Switch slot appears

## Cypress handoff summary (for testing team)

**Selectors preserved:** all existing `data-cy` values (`popover-card`, `event-disabled-toggle`, `event-name-input`, `action-selection`, `query-selection-field`, `add-event-handler`, `no-event-handler-message`, etc.)

**New selectors introduced:**
- `data-cy="event-duplicate-btn"` — popover header duplicate icon
- `data-cy="event-delete-btn"` — popover header delete icon
- `data-cy="event-row-switch"` — switch on list row
- `data-cy="event-row-{index}"` — wraps each row (replaces/alongside `${sourceId}-${index}` id)
- `data-cy="add-event-menu"` — the popover opened by Add handler
- `data-cy="event-trigger-option-{eventId}"` — each menu item
- `data-cy="event-row-tooltip-name"` / `event-row-tooltip-action` — row tooltips

**Interaction changes the team must test:**
1. Delete now lives inside the popover — tests that click a row-level delete will break
2. Adding a handler requires **2 clicks** (button → pick event) instead of 1
3. Duplicate is brand new — needs new coverage
4. Row Switch is new — toggling it must not open the popover
5. Empty state copy changed: "No event handlers" → "No events added yet."

## Resolved decisions (locked 2026-04-20)

1. **Duplicate position** — append at end (`index: events.length`). No insert-at-index API support. Reorder is a follow-up.
2. **Duplicate name** — unconditional ` copy` suffix on source name. No need to detect user-set vs auto-generated.
3. **Default name fallback** — `Event #${events.length + 1}`. Only affects newly-created handlers.
4. **Tokens verified** — `tw-bg-interactive-default` ✓, `tw-bg-interactive-hover` ✓. `tw-font-caption` does NOT exist; use `tw-font-title-small` for the sub-header (11/16 medium). See font table above.

## Still open (answer during build)

1. **Row tooltip trigger** — show on truncation only (CSS check via `scrollWidth > clientWidth`), or always on hover? Design implies always. Recommend always for simplicity.
2. **Loading gradient bar on row** — the thin blue line at row bottom (#3e63dd with transparent fade). Nice-to-have, skip if time-tight.
3. **PopoverTrigger + Draggable** — no existing precedent. Pattern (verified conceptually):
   ```jsx
   <Draggable>{(provided, snapshot) => (
     <Popover open={focusedEventIndex === index} onOpenChange={handleToggle}>
       <PopoverTrigger asChild>
         <div ref={provided.innerRef}
              {...provided.draggableProps}
              {...provided.dragHandleProps}>
           {row}
         </div>
       </PopoverTrigger>
       <PopoverContent>...</PopoverContent>
     </Popover>
   )}</Draggable>
   ```
   Radix `Slot` (`asChild`) merges refs + event handlers. `Draggable` injects `onMouseDown`/`onKeyDown` — mousedown is drag-start, mouseup/click opens the popover. Existing drag-close hack (EventManager.jsx:1294–1297) carries over by also reading `snapshot.isDragging` to suppress open during drag.

## Acceptance criteria (tomorrow's ship)

- [ ] Popover matches Figma `1112:9299` at 303px wide, header visible with Copy + Trash icons
- [ ] Duplicate creates a clone at index+1 and closes popover
- [ ] Delete removes handler and closes popover
- [ ] Event list rows match Figma `1112:9574` (two-line, Switch right, row bg tinted)
- [ ] Row Switch toggles `disabled` without opening popover
- [ ] Add handler flow: button click → event menu popover → pick → handler created
- [ ] Empty state uses Rocket `Empty`
- [ ] Loading shows spinner in place of row Switch
- [ ] All existing `data-cy` selectors still resolve
- [ ] No dark-mode regressions (Storybook quick check)
- [ ] Cypress suite: no net new failures; updated tests for removed row delete + new add flow
