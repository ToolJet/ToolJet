# Frontend Context — App Builder

## Glossary

### Universal props (`universalProps`)
Schema fields merged into **every** widget by `combineProperties()` in
`src/AppBuilder/WidgetManager/componentTypes.js`. Has sub-buckets: `general`
(properties — e.g. `tooltip`), `generalStyles` (styles — e.g. `boxShadow`).
Adding a field here applies it to all widgets at once, no per-widget edits.

### CSS Class (widget-level)
A user-authored className (or space-separated classNames) applied to a single
widget instance's root DOM node so the client can target it from
workspace/app-level custom CSS. Distinct from **Custom CSS** (the CSS *text*),
which already exists at app/workspace scope via `customStylesService` →
`workspace-custom-css` <style> tag.

## Decisions log
- Widget CSS Class is added **globally** via `universalProps`, not per-widget. (2026-06-15)
- CSS Class field lives in the **Styles** tab under a new **Advanced** accordion (not Properties). (2026-06-15)
- The class is applied to the **inner** `canvas-component _tooljet-{name}` node in `RenderWidget.jsx`, not the outer `WidgetWrapper` (avoids fighting the layout engine). (2026-06-15)
- Field type `code` (supports `{{}}` bindings), single space-separated string, multiple classes allowed. (2026-06-15)
- CSS authoring reuses existing app/workspace **custom CSS** (`customStylesService`); this feature ships only the class hook. (2026-06-15)
- Class applies in **both** editor canvas and viewer/public app. (2026-06-15)
- Field added to `universalProps.**styles**` (NOT `generalStyles`) in **both** `frontend/.../componentTypes.js` AND `server/.../widget-config/index.js` (independently maintained). **No DB migration** — `lodash.merge` injects default at load (`appUtils.js:211`). (2026-06-16)
  - **Why styles, not generalStyles** (grill correction): `generalStyles` ignores the `accordian` key and is only rendered for non-revamped widgets (`buildGeneralStyle()` hardcodes a "General" group). `styles` rides `RenderStyleOptions`, which groups by `accordian` and uses the title raw — so `accordian: 'Advanced'` yields an "Advanced" accordion on all 57 revamped widgets with no registration.
- Injection point: `RenderWidget.jsx:302`, `resolvedStyles?.cssClass` (trimmed) appended to className. (2026-06-16)
- Schema key `cssClass`, label "CSS class", accordion "Advanced" (pinned **last** in `RenderStyleOptions`). Sanitize = trim + collapse whitespace only, no blocklist. (2026-06-16)
- Legacy/non-revamped widgets (~24, mostly deprecated V1 duplicates): field works + applies but renders as a top-level control, not grouped — accepted, no wiring on the sunsetting path. (2026-06-16)
- v1 = static + `{{}}`-bound class via the field. Imperative runtime control (CSA `setCustomClass`) deferred to **v2**. (2026-06-16)
- **Enterprise gating**: the whole feature sits behind the `customStyling` license flag (same flag as app/workspace Custom CSS, which it depends on). Read via `useStore((s) => s.license.featureAccess?.customStyling)`. Two gates: (1) Inspector `RenderStyleOptions` hides the Advanced group / `cssClass` control when false; (2) `RenderWidget.jsx` skips appending `cssClass` to the DOM when false. **The saved value is never erased** — re-enabling the license restores the classes (no migration/cleanup). (2026-06-18)
