// Selectors for the Tags display widget (frontend/src/AppBuilder/Widgets/Tags/Tags.jsx) and its custom
// inspector (frontend/src/AppBuilder/RightSideBar/Inspector/Components/Tags.jsx).
// Pass the runtime name (e.g. "tags1"). RenderWidget passes dataCy = componentName.
//
// NOTE: `[data-cy="draggable-widget-<name>"]` matches TWO nodes for Tags: RenderWidget's `.canvas-component`
// box (the one that moves/resizes) and Tags' own `.tag-comp-wrapper` (Tags.jsx:300-302). Qualify by class.
const slug = (text) =>
  String(text)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, ""); // mirrors generateCypressDataCy (modules/common/helpers/cypressHelpers.js)

export const tagsSelector = {
  // RenderWidget `.canvas-component` — the grid box whose height dynamic height changes
  widgetBox: (name) => `.canvas-component[data-cy="draggable-widget-${name}"]`,
  // Tags.jsx:291-298 — outer `role=region` div carrying the inline box-shadow
  region: (name) => `.canvas-component[data-cy="draggable-widget-${name}"] [role="region"]`,
  // Tags.jsx:299-308 — flex wrapper: wrap/scroll overflow, scrollbars, dynamic-height `height:auto`
  wrapper: (name) => `.tag-comp-wrapper[data-cy="draggable-widget-${name}"]`,
  // Tags.jsx:321-324 / 349-352 — the tag collection
  container: (name) => `[data-cy="${name}-tags-container"]`,
  // Tags.jsx:275-283 — every rendered badge, in DOM order
  badges: (name) => `[data-cy="${name}-tags-container"] .badge`,
  // Tags.jsx:224 — `${dataCy}-tag-${title}` through generateCypressDataCy
  badge: (name, title) => `[data-cy="${name}-tag-${slug(title)}"]`,
  // Tags.jsx:205 — the TablerIcon <svg> inside a badge
  badgeIcon: (name, title) => `[data-cy="${name}-tag-${slug(title)}-icon"]`,
};

// Inspector › Properties › Options — the static-tag editor (Inspector/Components/Tags.jsx).
export const tagsInspectorSelector = {
  // Tags.jsx:391 AddNewButton dataCy
  addOption: '[data-cy="add-new-tag-option"]',
  // Tags.jsx:330 — one rbd draggable per option; `data-list-item-id` = id, else title (tagIdentity)
  optionItems: "[data-list-item-id]",
  optionItem: (title) => `[data-list-item-id="${title}"]`,
  // Tags.jsx:348-358 — the ListGroup row (hover target) and its title cell (click → popover)
  optionRow: (title) => `[data-list-item-id="${title}"] .list-group-item`,
  optionLabel: (title) => `[data-list-item-id="${title}"] .cursor-pointer`,
  // Tags.jsx:362-375 — rendered only while the row is hovered
  deleteButton: (title) => `[data-list-item-id="${title}"] .delete-icon-btn`,
  // Tags.jsx:211 — the option popover (react-bootstrap)
  popover: ".popover",
  // Tags.jsx:266-285 — Icon field: picker trigger, current-icon <svg>, eye toggle (CodeBuilder/Elements/Icon.jsx, Visibility.jsx)
  iconField: '.popover [data-cy="input-and-label-tag-icon"]',
  iconPickerTrigger: '.popover [data-cy="input-and-label-tag-icon"] [role="button"]',
  iconOnPanel: '.popover [data-cy="icon-on-side-panel"]',
  iconVisibilityButton: '.popover [data-cy="icon-visibility-button"]',
  // CodeBuilder/Elements/Icon.jsx:40-83 — icon picker popover: search box + virtualised grid
  iconSearch: ".icon-widget-popover input",
  iconElements: ".icon-widget-popover .icon-element",
  // Tags.jsx:287-306 — Tag visibility (fx-capable toggle)
  tagVisibilityFx: '.popover [data-cy="tag-visibility-fx-button"]',
  tagVisibilityToggle: '.popover [data-cy="tag-visibility-toggle-button"]',
  tagVisibilityInput: '.popover [data-cy="tag-visibility-input-field"]',
};

// Styles tab controls used by the Tags styles facet.
export const tagsStyleSelector = {
  // tags.js:119-124 borderRadius (type 'input') → CodeBuilder Input
  borderRadiusInput: '[data-cy="border-radius-input"]',
};
