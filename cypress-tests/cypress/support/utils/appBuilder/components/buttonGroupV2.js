/**
 * MODULE — appBuilder/components/buttonGroupV2: browser-only helpers for the Button Group (ButtonGroupV2) widget.
 * FOR AI: addButtonGroupsViaApi seeds fully-configured Button Groups (plus any helper widgets) in one components
 * POST — buttonGroupV2.js definition defaults merged with per-item overrides; mappedButtons builds the `advanced`
 * + `schema` pair for N mapped buttons (N may be an expression, e.g. a TextInput value); buttonGroupBoxes reads
 * plain-object geometry of the WidgetWrapper, the RenderWidget box, the role=group root, the label, the content
 * wrapper (inline height / min-height, computed overflow / justify-content, scroll sizes) and every button;
 * expectHugsButtons / expectFixedButtons are the dynamic-height vs authored-height contracts
 * (ButtonGroupV2.jsx:107,258-273); tabSequence records the focused button per real Tab press.
 */
import { buttonGroupV2Text } from "Texts/appBuilder/components/buttonGroupV2";
import { addDividersViaApi } from "Support/utils/appBuilder/components/divider";

const T = buttonGroupV2Text;
const PX = 1.5; // sub-pixel layout tolerance

/**
 * @tjBlock  contexts
 * @tjUsage  addButtonGroupsViaApi([{ name: 'bg1', layout: { top: 40, left: 2, width: 12, height: 80 }, properties: { layout: { value: 'column' } } }, { type: 'TextInput', name: 'count', layout: {…} }])
 * @tjDom    delegates to addDividersViaApi → addIconsViaApi (GET app → POST components diff → POST events). Items
 *           without a `type` become ButtonGroupV2 with buttonGroupV2.js:383-463 definition properties/styles/others
 *           merged under the item's own; items with another `type` pass through unchanged. `parent` + `id` are
 *           not supported here (use addTimelinesViaApi for container children).
 */
export const addButtonGroupsViaApi = (items, opts = {}) =>
  addDividersViaApi(items, { type: T.componentType, definition: T.definition, ...opts });

/**
 * @tjBlock  properties
 * @tjUsage  properties: { ...mappedButtons('Number(components.count.value) || 1', 'Go') }
 * @tjDom    `advanced: {{true}}` + `schema: {{ Array.from({ length: <countExpr> }, (_, i) => ({ label, value, default,
 *           disable, iconVisibility })) }}` — value is String(i + 1) and the first button is the default
 *           (ButtonGroupV2.jsx:72-91 reads label/value/disable/default from the schema)
 */
export const mappedButtons = (countExpr, word) => ({
  advanced: { value: "{{true}}" },
  schema: {
    value: `{{ Array.from({ length: ${countExpr} }, (_, i) => ({ label: '${word} ' + (i + 1), value: String(i + 1), default: i === 0, disable: false, iconVisibility: false })) }}`,
  },
});

const rectOf = (el) => {
  if (!el) return null;
  const r = el.getBoundingClientRect();
  return { left: r.left, right: r.right, top: r.top, bottom: r.bottom, width: r.width, height: r.height };
};

const readButtonGroup = (box, name) => {
  const win = box.ownerDocument.defaultView;
  const root = box.querySelector(`.button-group-widget[data-cy="${name}"]`);
  const label = box.querySelector(`[data-cy="${name}-label"]`);
  const wrapper = box.querySelector(".button-group-content-wrapper");
  const group = box.querySelector(".button-group-content");
  const buttons = group ? [...group.querySelectorAll("button.button-group-button")] : [];
  const wCs = wrapper ? win.getComputedStyle(wrapper) : null;
  const gCs = group ? win.getComputedStyle(group) : null;
  return {
    grid: rectOf(box.parentElement),
    box: rectOf(box),
    root: rectOf(root),
    rootClass: root ? String(root.className) : null,
    rootDisplay: root ? win.getComputedStyle(root).display : null,
    label: rectOf(label),
    wrapper: rectOf(wrapper),
    wrapperInlineHeight: wrapper ? wrapper.style.height : null,
    wrapperMinHeight: wrapper ? wrapper.style.minHeight : null,
    overflowX: wCs ? wCs.overflowX : null,
    overflowY: wCs ? wCs.overflowY : null,
    justify: wCs ? wCs.justifyContent : null,
    scrollWidth: wrapper ? wrapper.scrollWidth : null,
    clientWidth: wrapper ? wrapper.clientWidth : null,
    scrollHeight: wrapper ? wrapper.scrollHeight : null,
    clientHeight: wrapper ? wrapper.clientHeight : null,
    scrollLeft: wrapper ? wrapper.scrollLeft : null,
    scrollTop: wrapper ? wrapper.scrollTop : null,
    group: rectOf(group),
    groupDirection: gCs ? gCs.flexDirection : null,
    groupWrap: gCs ? gCs.flexWrap : null,
    groupJustify: gCs ? gCs.justifyContent : null,
    buttons: buttons.map((b) => ({
      ...rectOf(b),
      text: b.textContent.trim(),
      color: win.getComputedStyle(b).color,
      background: win.getComputedStyle(b).backgroundColor,
    })),
    // distinct visual rows (rounded tops) — wrap layout
    rowTops: [...new Set(buttons.map((b) => Math.round(b.getBoundingClientRect().top)))],
  };
};

/**
 * @tjBlock  canvas
 * @tjUsage  buttonGroupBoxes('bg1', (b) => expect(b.buttons).to.have.length(3))
 * @tjDom    retries the callback with plain objects: grid (WidgetWrapper `.ele-<id>` = grid box), box
 *           (`draggable-widget-<name>`), root (`.button-group-widget`: rect, class, display), label
 *           (`[data-cy=<name>-label]`), wrapper (`.button-group-content-wrapper`: rect, inline height / min-height,
 *           computed overflow-x/-y and justify-content, scroll + client sizes, scrollLeft/Top), group
 *           (`.button-group-content`: rect, flex direction / wrap / justify), buttons (rect, text, colour,
 *           background), rowTops (distinct button row tops)
 */
export const buttonGroupBoxes = (name, assertFn) =>
  cy
    .get(`[data-cy="draggable-widget-${name}"]`, { timeout: 30000 })
    .first()
    .should(($box) => assertFn(readButtonGroup($box[0], name)));

/**
 * @tjBlock  canvas
 * @tjUsage  buttonGroupBoxes('bg1', (b) => expectHugsButtons(b, 80, 'viewer'))
 * @tjDom    dynamic-height contract (ButtonGroupV2.jsx:107,268-271 + useDynamicHeight): the content wrapper is
 *           height:auto with min-height = authored - 4 and overflow visible; it measures max(min, group height)
 *           so nothing scrolls or clips; the grid box (WidgetWrapper) follows the content (+ BOX_PADDING)
 */
export const expectHugsButtons = (b, authoredHeight, label = "") => {
  const min = authoredHeight - 2 * T.boxPadding;
  expect(b.rootDisplay, `${label}: group displayed`).to.not.eq("none");
  expect(b.wrapperInlineHeight, `${label}: wrapper height auto`).to.eq("auto");
  expect(b.wrapperMinHeight, `${label}: wrapper min-height = authored - 4`).to.eq(`${min}px`);
  expect(b.overflowY, `${label}: dynamic wrapper never scrolls`).to.eq(T.dynamicOverflow);
  expect(b.wrapper.height, `${label}: wrapper = max(authored floor, buttons)`).to.be.closeTo(Math.max(min, b.group.height), PX);
  expect(b.scrollHeight, `${label}: no inner scroll`).to.be.lte(b.clientHeight + 1);
  const lastBottom = Math.max(...b.buttons.map((x) => x.bottom));
  expect(lastBottom, `${label}: last button inside the wrapper`).to.be.lte(b.wrapper.bottom + PX);
  expect(b.box.height, `${label}: widget box = wrapper + padding`).to.be.closeTo(b.wrapper.height + 2 * T.boxPadding, PX);
  expect(b.grid.height, `${label}: grid box follows the content`).to.be.closeTo(b.box.height, PX);
};

/**
 * @tjBlock  canvas
 * @tjUsage  buttonGroupBoxes('bg1', (b) => expectFixedButtons(b, 80, 'editor'))
 * @tjDom    authored-height contract (ButtonGroupV2.jsx:258,268 non-dynamic path — row, editor, dynamic height
 *           off): grid box = authored height, content wrapper inline height = authored - 4
 */
export const expectFixedButtons = (b, authoredHeight, label = "") => {
  expect(b.rootDisplay, `${label}: group displayed`).to.not.eq("none");
  expect(b.wrapperInlineHeight, `${label}: wrapper inline height`).to.eq(`${authoredHeight - 2 * T.boxPadding}px`);
  expect(b.wrapperMinHeight, `${label}: no min-height floor`).to.eq("");
  expect(b.grid.height, `${label}: grid box keeps the authored height`).to.be.closeTo(authoredHeight, PX);
  expect(b.wrapper.height, `${label}: wrapper = authored - 4`).to.be.closeTo(authoredHeight - 2 * T.boxPadding, PX);
};

/**
 * @tjBlock  userflow
 * @tjUsage  tabSequence('[data-cy="draggable-widget-start"] input', 4).should('deep.equal', ['bg1-button-0', …])
 * @tjDom    focuses the start element, sends `count` real Tab presses (CDP) and yields, per press, the focused
 *           element's data-cy (Button Group buttons carry `<name>-button-<i>`), else its widget's runtime name,
 *           else the tag name / "body"
 */
export const tabSequence = (startSelector, count) => {
  const seen = [];
  cy.get(startSelector).first().focus();
  for (let i = 0; i < count; i++) {
    cy.realPress("Tab");
    cy.document().then((doc) => {
      const el = doc.activeElement;
      if (!el || el === doc.body) return seen.push("body");
      if (el.tagName === "BUTTON" && el.getAttribute("data-cy")) return seen.push(el.getAttribute("data-cy"));
      const widget = el.closest('[data-cy^="draggable-widget-"]');
      seen.push(widget ? widget.getAttribute("data-cy").replace("draggable-widget-", "") : el.tagName.toLowerCase());
    });
  }
  return cy.wrap(seen, { log: false });
};
