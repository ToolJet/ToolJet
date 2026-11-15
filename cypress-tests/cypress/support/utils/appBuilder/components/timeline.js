/**
 * MODULE — appBuilder/components/timeline: browser-only helpers for the Timeline widget.
 * FOR AI: addTimelinesViaApi seeds Timelines (timeline.js definition defaults merged) plus any helper widgets in
 * one components POST — including container children via `parent` + a pinned `id`; timelineDataExpr builds a
 * `data` binding with N items (N may be an expression, e.g. a TextInput value); timelineBoxes reads plain-object
 * geometry of the WidgetWrapper, the RenderWidget box, the `.card` root (inline height / min-height, computed
 * overflow / display / box-shadow, scroll sizes), its list and items; expectHugsContent / expectFixedHeight are
 * the dynamic-height vs authored-height contracts (Timeline.jsx:24,41-51); expectStackedBelow checks a sibling
 * keeps its authored gap under a widget.
 */
import { timelineText } from "Texts/appBuilder/components/timeline";

const T = timelineText;
const PX = 1.5; // sub-pixel layout tolerance

/**
 * @tjBlock  contexts
 * @tjUsage  addTimelinesViaApi([{ name: 'tl1', layout: { top: 40, left: 2, width: 12, height: 150 }, properties: { dynamicHeight: { value: '{{true}}' } } }, { type: 'Container', id: CID, name: 'c1', layout: {…} }, { name: 'tl2', parent: CID, layout: {…} }])
 * @tjDom    GET /api/apps/<appId> (editing version + home page) → POST /api/v2/apps/<appId>/versions/<v>/components.
 *           An item without `type` is a Timeline and gets timeline.js:87-108 definition defaults under its
 *           properties/styles/others; any other `type` posts only what is passed (the app loader fills the rest).
 *           `id` pins the component id so a later item can name it as its `parent`.
 */
export const addTimelinesViaApi = (items, { appId: appIdArg } = {}) =>
  cy.getCookie("tj_auth_token").then((cookie) => {
    // resolve lazily: apiCreateApp sets Cypress.env('appId') only when its request completes
    const appId = appIdArg || Cypress.env("appId");
    const api = `${Cypress.env("server_host")}/api`;
    const headers = {
      "Content-Type": "application/json",
      "Tj-Workspace-Id": Cypress.env("workspaceId"),
      Cookie: `tj_auth_token=${cookie.value}`,
    };
    return cy.request({ method: "GET", url: `${api}/apps/${appId}`, headers }).then((res) => {
      const { id: versionId, home_page_id: pageId } = res.body.editing_version;
      Cypress.env("editingVersionId", versionId);
      const D = T.definition;
      const diff = {};
      items.forEach((item) => {
        const isTimeline = !item.type || item.type === T.componentType;
        const layout = { top: 40, left: 2, width: 12, height: isTimeline ? 150 : 40, ...item.layout };
        diff[item.id || crypto.randomUUID()] = {
          name: item.name,
          type: item.type || T.componentType,
          ...(item.parent ? { parent: item.parent } : {}),
          layouts: { desktop: layout, mobile: { ...layout, ...item.mobileLayout } },
          properties: isTimeline ? { ...D.properties, ...item.properties } : item.properties || {},
          styles: isTimeline ? { ...D.styles, ...item.styles } : item.styles || {},
          others: isTimeline ? { ...D.others, ...item.others } : item.others || {},
          validation: {},
        };
      });
      cy.request({
        method: "POST",
        url: `${api}/v2/apps/${appId}/versions/${versionId}/components`,
        headers,
        body: { is_user_switched_version: false, pageId, diff },
        failOnStatusCode: false,
      }).then((r) => expect(r.status, `create components: ${JSON.stringify(r.body)}`).to.eq(201));
    });
  });

/**
 * @tjBlock  contexts
 * @tjUsage  properties: { data: { value: timelineDataExpr('Number(components.count.value) || 1', 'Launch') } }
 * @tjDom    `{{ Array.from({ length: <countExpr> }, (_, i) => ({ title, subTitle, date, iconBackgroundColor })) }}` —
 *           every item has all four keys (Timeline.jsx:57-67); `word` prefixes the title/subtitle text
 */
export const timelineDataExpr = (countExpr, word) =>
  `{{ Array.from({ length: ${countExpr} }, (_, i) => ({ title: '${word} ' + (i + 1), subTitle: '${word} subtitle ' + (i + 1), date: '0' + ((i % 9) + 1) + '/10/2021', iconBackgroundColor: 'var(--cc-primary-brand)' })) }}`;

const rectOf = (el) => {
  if (!el) return null;
  const r = el.getBoundingClientRect();
  return { left: r.left, right: r.right, top: r.top, bottom: r.bottom, width: r.width, height: r.height };
};

const readTimeline = (box) => {
  const win = box.ownerDocument.defaultView;
  const name = box.getAttribute("data-cy").replace("draggable-widget-", "");
  const card = box.querySelector(`.card[data-cy="${name}"]`);
  const list = card && card.querySelector("ul.list-timeline");
  const items = list ? [...list.children] : [];
  const cs = card ? win.getComputedStyle(card) : null;
  const body = card && card.querySelector(".card-body");
  const bodyCs = body ? win.getComputedStyle(body) : null;
  return {
    wrapper: rectOf(box.parentElement),
    box: rectOf(box),
    card: rectOf(card),
    cardInlineHeight: card ? card.style.height : null,
    cardMinHeight: card ? card.style.minHeight : null,
    cardDisplay: cs ? cs.display : null,
    cardOverflowY: cs ? cs.overflowY : null,
    cardShadow: cs ? cs.boxShadow : null,
    scrollHeight: card ? card.scrollHeight : null,
    clientHeight: card ? card.clientHeight : null,
    scrollTop: card ? card.scrollTop : null,
    body: rectOf(body),
    // natural content height: card top → the lowest margin-box bottom inside the list (the last subtitle <p>'s
    // bottom margin collapses through the <li>/<ul>, so the <ul> rect alone is short), plus the card-body's bottom
    // padding and the card's bottom border. The card-body itself stretches to the card, so it is not a measure.
    contentHeight: list
      ? Math.max(
          list.getBoundingClientRect().bottom,
          ...[...list.querySelectorAll("*")].map(
            (el) => el.getBoundingClientRect().bottom + parseFloat(win.getComputedStyle(el).marginBottom)
          )
        ) -
        card.getBoundingClientRect().top +
        parseFloat(bodyCs.paddingBottom) +
        parseFloat(cs.borderBottomWidth)
      : 0,
    listClass: list ? String(list.className) : null,
    itemCount: items.length,
    lastItem: rectOf(items[items.length - 1]),
    dateCount: card ? card.querySelectorAll(".list-timeline-time").length : 0,
    titles: card ? [...card.querySelectorAll(".list-timeline-title")].map((t) => t.textContent) : [],
  };
};

/**
 * @tjBlock  canvas
 * @tjUsage  timelineBoxes('tl1', (b) => expect(b.itemCount).to.eq(3))
 * @tjDom    retries the callback with plain objects: wrapper (WidgetWrapper `.ele-<id>` = grid box), box
 *           (`draggable-widget-<name>`), card (`.card[data-cy=<name>]`: rect, inline height / min-height, computed
 *           display / overflow-y / box-shadow, scroll + client height, scrollTop), body (`.card-body`), contentHeight (natural list height + body padding), list class,
 *           item count, last item rect, date count, title texts
 */
export const timelineBoxes = (name, assertFn) =>
  cy
    .get(`[data-cy="draggable-widget-${name}"]`, { timeout: 30000 })
    .first()
    .should(($box) => assertFn(readTimeline($box[0])));

/**
 * @tjBlock  canvas
 * @tjUsage  timelineBoxes('tl1', (b) => expectHugsContent(b, 150, 'viewer'))
 * @tjDom    dynamic-height contract on a timelineBoxes() snapshot (Timeline.jsx:24,45-47 + useDynamicHeight): the card
 *           is height:auto with min-height = authored - 4 and overflow visible; it measures max(min, content) — the
 *           natural list height + card-body padding — so nothing scrolls or clips; the grid box (WidgetWrapper) follows the card (+ BOX_PADDING)
 */
export const expectHugsContent = (b, authoredHeight, label = "") => {
  const min = authoredHeight - 2 * T.boxPadding;
  expect(b.cardDisplay, `${label}: card displayed`).to.not.eq("none");
  expect(b.cardInlineHeight, `${label}: card height auto`).to.eq("auto");
  expect(b.cardMinHeight, `${label}: card min-height = authored - 4`).to.eq(`${min}px`);
  expect(b.cardOverflowY, `${label}: dynamic card never scrolls`).to.eq(T.dynamicOverflow);
  expect(b.card.height, `${label}: card = max(authored floor, content)`).to.be.closeTo(Math.max(min, b.contentHeight), PX);
  expect(b.scrollHeight, `${label}: no inner scroll`).to.be.lte(b.clientHeight + 1);
  expect(b.lastItem.bottom, `${label}: last item inside the card`).to.be.lte(b.card.bottom + PX);
  expect(b.box.height, `${label}: widget box = card + padding`).to.be.closeTo(b.card.height + 2 * T.boxPadding, PX);
  expect(b.wrapper.height, `${label}: grid box follows the content`).to.be.closeTo(b.box.height, PX);
};

/**
 * @tjBlock  canvas
 * @tjUsage  timelineBoxes('tl1', (b) => expectFixedHeight(b, 150, 'editor'))
 * @tjDom    authored-height contract (Timeline.jsx:45-47 non-dynamic path, and the editor even with dynamic height
 *           on): grid box = authored height, card = authored - 4 with overflow auto (the content scrolls inside)
 */
export const expectFixedHeight = (b, authoredHeight, label = "") => {
  expect(b.cardDisplay, `${label}: card displayed`).to.not.eq("none");
  expect(b.cardInlineHeight, `${label}: card inline height`).to.eq(`${authoredHeight - 2 * T.boxPadding}px`);
  expect(b.cardOverflowY, `${label}: fixed card scrolls`).to.eq(T.fixedOverflow);
  expect(b.wrapper.height, `${label}: grid box keeps the authored height`).to.be.closeTo(authoredHeight, PX);
  expect(b.card.height, `${label}: card = authored - 4`).to.be.closeTo(authoredHeight - 2 * T.boxPadding, PX);
};

/**
 * @tjBlock  canvas
 * @tjUsage  expectStackedBelow('tl1', 'text1', 10, 'after growth')
 * @tjDom    retries: the lower widget's draggable box starts `gap` px below the upper widget's draggable box
 *           (dynamic-height sibling reflow keeps the authored gap)
 */
export const expectStackedBelow = (upper, lower, gap, label = "") =>
  cy.document().should((doc) => {
    const u = doc.querySelector(`[data-cy="draggable-widget-${upper}"]`);
    const l = doc.querySelector(`[data-cy="draggable-widget-${lower}"]`);
    expect(u, `${label}: ${upper} rendered`).to.exist;
    expect(l, `${label}: ${lower} rendered`).to.exist;
    const gapNow = l.getBoundingClientRect().top - u.getBoundingClientRect().bottom;
    expect(gapNow, `${label}: ${lower} keeps a ${gap}px gap under ${upper}`).to.be.closeTo(gap, PX);
  });

/**
 * @tjBlock  canvas
 * @tjUsage  widgetTop('text1').then((top) => …)
 * @tjDom    yields the draggable box's viewport top (a number, not a DOM element)
 */
export const widgetTop = (name) =>
  cy.get(`[data-cy="draggable-widget-${name}"]`).first().then(($el) => $el[0].getBoundingClientRect().top);
