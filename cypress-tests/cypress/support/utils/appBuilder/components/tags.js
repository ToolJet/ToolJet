/**
 * MODULE — appBuilder/components/tags: browser-only helpers for the Tags display widget.
 * FOR AI: addTagsViaApi seeds Tags (and any sibling widgets) in one components POST — the app loader fills
 * every key not passed from the Tags definition, so the default four static tags appear unless `options` is
 * overridden; expectTagsLayout reads the real layout boxes and scroll state the RTL suite cannot;
 * openTagOption / pickTagIcon / iconPaths drive the custom static-tag editor in the Inspector.
 */
import { tagsSelector, tagsInspectorSelector } from "Selectors/appBuilder/components/tags";
import { addLinksViaApi } from "Support/utils/appBuilder/components/link";
import { commonSelectors } from "Selectors/common";

/**
 * @tjBlock  contexts
 * @tjUsage  addTagsViaApi([{ name: 'tags1', layout: { top: 40, left: 2, width: 8, height: 40 }, properties: { overflow: { value: 'scroll' } } }])
 * @tjDom    addLinksViaApi with `type: 'Tags'` defaulted per item (pass `type` to seed a sibling widget instead)
 */
export const addTagsViaApi = (items, appId) => addLinksViaApi(items.map((item) => ({ type: "Tags", ...item })), appId);

/**
 * @tjBlock  canvas
 * @tjUsage  staticTags(['alpha', 'beta'])   // → options value for properties.options
 * @tjDom    builds the saved static-option shape (tags.js:186-220) with one colour pair and the icon hidden
 */
export const staticTags = (titles, { icon = null } = {}) =>
  titles.map((title) => ({
    title,
    textColor: { value: "#34A947" },
    backgroundColor: { value: "#34A94733" },
    ...(icon ? { icon: { value: icon }, iconVisibility: { value: "{{true}}" } } : {}),
    visible: { value: true },
  }));

/**
 * @tjBlock  canvas
 * @tjUsage  expectTagsLayout('tags1', (t) => expect(t.rows).to.be.gt(1))
 * @tjDom    retries the callback with rects of the `.canvas-component` box, the `.tag-comp-wrapper`, every badge
 *           (DOM order), the number of distinct badge rows, and the wrapper's scroll metrics
 */
export const expectTagsLayout = (name, assertFn) =>
  cy.get(tagsSelector.wrapper(name)).first().should(($w) => {
    const w = $w[0];
    const doc = w.ownerDocument;
    const rect = (el) => el.getBoundingClientRect();
    const badges = Array.from(doc.querySelectorAll(tagsSelector.badges(name))).map(rect);
    const rows = new Set(badges.map((b) => Math.round(b.top))).size;
    assertFn({
      box: rect(doc.querySelector(tagsSelector.widgetBox(name))),
      wrapper: rect(w),
      badges,
      rows,
      scrollLeft: w.scrollLeft,
      scrollWidth: w.scrollWidth,
      clientWidth: w.clientWidth,
      scrollHeight: w.scrollHeight,
      clientHeight: w.clientHeight,
      el: w,
    });
  });

/**
 * @tjBlock  canvas
 * @tjUsage  expectBadgeTitles('tags1', ['success', 'info'])
 * @tjDom    retries until the rendered badges' text, in DOM order, equals the list
 */
export const expectBadgeTitles = (name, titles) =>
  cy.get(tagsSelector.container(name)).should(($c) => {
    const actual = Array.from($c[0].querySelectorAll(".badge")).map((b) => b.textContent);
    expect(actual, `${name} badges`).to.deep.eq(titles);
  });

/**
 * @tjBlock  inspector
 * @tjUsage  expectOptionTitles(['success', 'info'])
 * @tjDom    retries until the Inspector option list (`data-list-item-id`, Tags.jsx:330) equals the list
 */
export const expectOptionTitles = (titles) =>
  cy.get(tagsInspectorSelector.optionItems).should(($items) => {
    expect(Array.from($items).map((el) => el.textContent.trim()), "inspector options").to.deep.eq(titles);
  });

/**
 * @tjBlock  inspector
 * @tjUsage  openTagOption('info')
 * @tjDom    clicks the option's title cell (OverlayTrigger trigger="click", Tags.jsx:336-347) → `.popover`
 */
export const openTagOption = (title) => {
  cy.get(tagsInspectorSelector.optionLabel(title)).click();
  cy.get(tagsInspectorSelector.popover).should("be.visible");
};

/**
 * @tjBlock  inspector
 * @tjUsage  closeTagOption()
 * @tjDom    Escape closes the rootClose popover (react-bootstrap OverlayTrigger)
 */
export const closeTagOption = () => {
  cy.get("body").type("{esc}");
  cy.get(tagsInspectorSelector.popover).should("not.exist");
};

/**
 * @tjBlock  inspector
 * @tjUsage  pickTagIcon('IconStarFilled')   // option popover must be open
 * @tjDom    opens the icon picker (CodeBuilder/Elements/Icon.jsx), searches the exact name (SearchBox, 300ms
 *           debounce, case-insensitive substring), clicks the first grid cell
 */
export const pickTagIcon = (iconName) => {
  cy.get(tagsInspectorSelector.iconPickerTrigger).click();
  cy.get(tagsInspectorSelector.iconSearch).should("be.visible").type(iconName);
  cy.get(tagsInspectorSelector.iconElements).should("have.length", 1).first().click();
};

/**
 * @tjBlock  styles
 * @tjUsage  iconPaths('[data-cy="tags1-tag-info-icon"]').then((d) => ...)
 * @tjDom    joined `d` attributes of every <path> in the first matching <svg> (TablerIcon rewrites className,
 *           so the drawn path is the only reliable identity of a Tabler icon)
 */
export const iconPaths = (selector) =>
  cy.get(selector).first().then(($svg) =>
    Array.from($svg[0].querySelectorAll("path"))
      .map((p) => p.getAttribute("d"))
      .join("|")
  );

// Tags renders `data-cy="draggable-widget-<name>"` twice (RenderWidget `.canvas-component` AND its own
// `.tag-comp-wrapper`, Tags.jsx:302), so the shared canvas helpers that count or trigger on that data-cy
// see two elements per widget. These variants scope to the `.canvas-component` box.

/**
 * @tjBlock  canvas
 * @tjUsage  verifyTagsWidgetCount('tags', 2)
 * @tjDom    `.canvas-component[data-cy^="draggable-widget-<prefix>"]` count (one per Tags widget)
 */
export const verifyTagsWidgetCount = (namePrefix, expectedCount) =>
  cy.get(`.canvas-component[data-cy^="draggable-widget-${namePrefix}"]`).should("have.length", expectedCount);

/**
 * @tjBlock  canvas
 * @tjUsage  moveTagsWidget('tags1', 650, 450)
 * @tjDom    same mouse sequence as cy.moveComponent, but mousedown on the `.canvas-component` box only
 */
export const moveTagsWidget = (name, x, y) => {
  cy.get(tagsSelector.widgetBox(name))
    .trigger("mouseover", { force: true })
    .trigger("mousedown", { which: 1, force: true });
  cy.get(commonSelectors.canvas)
    .trigger("mousemove", { which: 1, force: true, clientX: x, clientY: y, pageX: x, pageY: y, screenX: x, screenY: y })
    .trigger("mouseup", { force: true });
};

/**
 * @tjBlock  canvas
 * @tjUsage  multiSelectTagsWidgets(['tags1', 'tags2'])
 * @tjDom    click the first `.canvas-component`, shift+click the rest (multiSelectWidgets on the box only)
 */
export const multiSelectTagsWidgets = (names = []) => {
  cy.forceClickOnCanvas();
  names.forEach((name, i) =>
    cy.get(tagsSelector.widgetBox(name)).click(i === 0 ? { force: true } : { shiftKey: true, force: true })
  );
  cy.wait(300); // selection settles (same pause as multiSelectWidgets)
};
