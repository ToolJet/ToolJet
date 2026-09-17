# Plan: Per-Widget Custom CSS Class

> Source: `.scratch/prd-widget-css-class.md` · Context: `frontend/CONTEXT.md` · ADR: `frontend/docs/adr/0001-widget-css-class-target-node.md`

## Architectural decisions

Durable decisions that apply across all phases:

- **CE/EE/Cloud scope**: **CE / root repo only.** No EE submodules (`server/ee`, `frontend/ee`), no Cloud-specific gating.
- **Submodule impact**: root only — frontend (`frontend/src/AppBuilder/...`) and server (`server/src/modules/apps/services/widget-config/...`).
- **CASL abilities**: none — no new authorization surface.
- **TypeORM entities**: none — **no DB migration.** `lodash.merge(componentMeta.definition.generalStyles, saved.generalStyles)` at `appUtils.js:211` injects the new `cssClass` default into existing component records at load time (same path boxShadow used).
- **Global mechanism**: field is added once to `universalProps`; `combineProperties()` propagates it to all 81 widgets. No per-widget schema edits.
- **Schema bucket**: `cssClass` goes in `universalProps.**styles**`, NOT `generalStyles`. (Grill correction — `generalStyles` ignores the `accordian` key and isn't rendered for revamped widgets; `styles` rides `RenderStyleOptions` which honors `accordian`.)
- **Target node**: applied to the **inner** `canvas-component _tooljet-{name}` node (`RenderWidget.jsx:302`), not the outer `WidgetWrapper`. See ADR 0001.
- **Schema is mirrored**: `universalProps` exists independently in frontend `componentTypes.js` AND server `widget-config/index.js` (server bucket `styles: {}` + `definition.styles: {}` confirmed present) — both must be kept in sync.
- **Enterprise gating (`customStyling`)**: the feature is gated by the `customStyling` license flag (same flag as the app/workspace Custom CSS panel it depends on), read via `useStore((s) => s.license.featureAccess?.customStyling)`. Gate at the **ends only** — hide the field in the inspector and skip DOM application when false; **never erase the stored value** so it returns on re-enable. No schema/migration change (the field stays in the schema regardless of license). (PM correction, 2026-06-18)

---

## Phase 1: CSS class hook (v1, end-to-end)

**User stories**: As an app builder, I can tag a widget with custom class(es) so my app/workspace Custom CSS can target that widget reliably (in both the editor and the published app).
**Type**: AFK
**Blocked by**: —
**Repos**: root (frontend + server)

### What to build

A universal `cssClass` field on every widget. The builder enters one or more
space-separated class names (with optional `{{}}` bindings) in the widget's
Styles → Advanced section. The resolved value is applied to the widget's inner
root DOM node in both the editor canvas and the viewer/public app, so CSS
authored in the existing Custom CSS panel can target it. No new CSS authoring
surface is added.

### Layers

- **Migration**: none. Defaults are merged at load; existing apps get an empty `cssClass` automatically.
- **Server**: add `cssClass` (`type: code`, label "CSS class", `accordian: 'Advanced'`) to `universalProps.styles` and its default (`{ value: '' }`) to `universalProps.definition.styles` in `widget-config/index.js`. Schema mirror only — no service/controller/endpoint changes.
- **Frontend**:
  - Mirror the same `cssClass` additions in `componentTypes.js` `universalProps.styles` + `definition.styles`.
  - Append the resolved class to the inner `canvas-component` node at `RenderWidget.jsx:302`, trimmed + whitespace-collapsed (`(resolvedStyles?.cssClass ?? '').trim().replace(/\s+/g, ' ')`).
  - In `RenderStyleOptions` (revamped path), pin the **Advanced** accordion **last** in the group order (universal styles are spread first in `combineProperties`, so without this it would render at the top).
  - Accept that non-revamped/legacy widgets render `cssClass` as a top-level style control (not grouped) — no extra wiring on that sunsetting path.
- **Tests**:
  - Field appears in Styles → Advanced for representative widgets.
  - Static class string lands on the widget root node in the editor and in the published/viewer app.
  - `{{}}`-bound class expression resolves to the correct class at render.
  - Leading/trailing/duplicate whitespace is trimmed/collapsed.
  - An app saved before this change loads with an empty default (no crash, no migration).

### Acceptance criteria

- [ ] Every revamped widget shows a "CSS class" field under a new "Advanced" group, pinned at the bottom of the Styles tab. (Legacy widgets show it as a top-level control — acceptable.)
- [ ] Entering one or more space-separated classes applies them to the widget's inner root node (`canvas-component _tooljet-{name}`) in the editor.
- [ ] The same classes apply in the published/public viewer app.
- [ ] `{{}}` bindings in the field resolve dynamically (e.g. conditional class from a component value).
- [ ] Custom CSS authored in the existing Custom CSS panel targeting the class visibly styles the widget.
- [ ] Surrounding/duplicate whitespace in the value is normalized; no blocklist/validation rejects input.
- [ ] Existing apps (saved before this change) load without migration and with an empty default.
- [ ] With `customStyling` license flag **false**: the "CSS class" field / Advanced group is hidden in the inspector, and any previously-saved class is NOT applied to the DOM. With the flag **true** again: the saved class re-appears in the field and re-applies — value was never erased.
- [ ] Spot-check special render paths: Modal / ModalV2 (portal) and a container widget (Container/Form/Tabs/ListView) receive the class correctly; CircularProgressBar's box-shadow exclusion does not swallow `cssClass`.

---

## Phase 2: `setCustomClass` CSA (v2) — future / planned separately

**User stories**: As an app builder, I can change a widget's class imperatively at runtime from RunJS or an event handler.
**Type**: AFK
**Blocked by**: Phase 1
**Repos**: root (frontend)

> Deferred. Dynamic `{{}}` binding in Phase 1 covers reactive class changes; this
> phase adds imperative control. Scope and acceptance criteria to be detailed when
> v2 work starts.

### What to build

A component-specific action (CSA) — e.g. `setCustomClass` (and possibly
`addClass` / `removeClass`) — that lets builders set the widget's custom class
from event handlers and RunJS.

### Layers

- **Frontend**: register the CSA on widgets and wire the handler to update the
  resolved `cssClass`. No server changes expected.
- **Tests**: action appears for widgets; invoking it updates the applied class at runtime.

### Acceptance criteria

- [ ] To be defined at v2 kickoff.
