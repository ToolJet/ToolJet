/**
 * MODULE — appBuilder/components/keyValuePair: browser-only helpers for the Key Value Pair widget.
 * FOR AI: addKeyValuePairsViaApi seeds Key Value Pairs (and helper widgets) in one components POST — the app loader
 * fills the definition defaults for anything not passed; kvField builds a field definition; viewerGridWidth reads
 * the running app's grid column width so a widget can be seeded at an exact pixel width (layout width may be
 * fractional — WidgetWrapper.jsx:173 `gridWidth * width`); editStringField makes a real pending edit (changeset);
 * kvMetrics reads the real geometry of the root, the value list and the changeset bar.
 */
import { keyValuePairText } from "Texts/appBuilder/components/keyValuePair";
import { keyValuePairSelector } from "Selectors/appBuilder/components/keyValuePair";
import { openLinkAppInViewer } from "Support/utils/appBuilder/components/link";

const T = keyValuePairText;
const S = keyValuePairSelector;
const NO_OF_GRIDS = 43; // AppCanvas grid columns

/**
 * @tjBlock  contexts
 * @tjUsage  addKeyValuePairsViaApi([{ name: 'kv1', layout: { top: 40, left: 2, width: 12, height: 300 }, properties: { data: { value: '{{ {a: 1} }}' }, fields: { value: [kvField('a')] } } }, { type: 'Text', name: 'probe', properties: { text: { value: '{{…}}' } } }])
 * @tjDom    GET /api/apps/<appId> (editing version + home page) → POST /api/v2/apps/<appId>/versions/<v>/components.
 *           Items without `type` are KeyValuePair; only the passed properties/styles/others are saved (the app loader
 *           merges keyValuePair.js definition defaults for the rest). `id` pins the component id (for `parent`).
 */
export const addKeyValuePairsViaApi = (items, appIdArg) =>
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
      const diff = {};
      items.forEach((item) => {
        const type = item.type || T.componentType;
        const layout = { top: 40, left: 2, width: 12, height: type === T.componentType ? 300 : 40, ...item.layout };
        diff[item.id || crypto.randomUUID()] = {
          name: item.name,
          type,
          ...(item.parent ? { parent: item.parent } : {}),
          layouts: { desktop: layout, mobile: { ...layout, ...item.mobileLayout } },
          properties: item.properties || {},
          styles: item.styles || {},
          others: item.others || {},
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
 * @tjUsage  kvField('email', { fieldType: 'string', isEditable: '{{true}}' })
 * @tjDom    a `properties.fields.value[]` entry (keyValuePair.js:326-480 shape): id/name/key/fieldType
 */
export const kvField = (key, extra = {}) => ({
  id: `field-${key}`,
  name: key,
  key,
  fieldType: "string",
  fxActiveFields: [],
  ...extra,
});

/**
 * @tjBlock  canvas
 * @tjUsage  viewerGridWidth().then((g) => addKeyValuePairsViaApi([{ name: 'kv', layout: { width: 200 / g } }]))
 * @tjDom    `#real-canvas` width / 43 — the px width of one grid column in the page currently open
 */
export const viewerGridWidth = () =>
  cy.get("#real-canvas", { timeout: 30000 }).then(($c) => $c[0].getBoundingClientRect().width / NO_OF_GRIDS);

/**
 * @tjBlock  canvas
 * @tjUsage  seedAtPixelWidths((g) => [{ name: 'kv200', layout: { top: 60, left: 2, width: 200 / g, height: 220 } }])
 * @tjDom    seeds a Text `anchor` (top-right corner), opens the running app, reads the grid column width, seeds the
 *           items built from it in a second components POST and reloads the running app
 */
export const seedAtPixelWidths = (buildItems) => {
  addKeyValuePairsViaApi([
    { type: "Text", name: "anchor", layout: { top: 0, left: 36, width: 6, height: 30 }, properties: { text: { value: "anchor" } } },
  ]);
  openLinkAppInViewer('[data-cy="draggable-widget-anchor"]');
  viewerGridWidth().then((g) => addKeyValuePairsViaApi(buildItems(g)));
  cy.reload();
};

/**
 * @tjBlock  userflow
 * @tjUsage  editStringField('kv1', 0, 'X')   // appends X to the first row and commits it (Enter)
 * @tjDom    click the row's `.key-value-render-value` (KeyValueRow.jsx:199-207 handleEditClick) → the StringRenderer
 *           contenteditable gets focus → real type + Enter (blur-commit, onChange → KeyValuePair editedData)
 */
export const editStringField = (name, rowIndex, suffix) => {
  cy.get(S.valueCells(name)).eq(rowIndex).click({ force: true });
  cy.get(S.editingString(name)).should("be.focused");
  // real keys: Cypress' synthetic {enter} on a contenteditable leaves the cell focused after the blur-commit
  cy.realType(suffix);
  cy.realPress("Enter");
  cy.get(S.editingCell(name)).should("not.exist");
  cy.get(S.changesetContent(name)).should("exist");
};

/**
 * @tjBlock  canvas
 * @tjUsage  kvMetrics('kv1', (m) => expect(m.bar.left).to.be.gte(m.root.left + 8))
 * @tjDom    retries the callback with plain rects/values: grid box, `.key-value-pair-container` root, the value list
 *           (scroll + padding), rows, the changeset bar (popover/content, classes, radii), Cancel/Save buttons and the
 *           line-box count of the Save label (Range.getClientRects)
 */
export const kvMetrics = (name, assertFn) =>
  cy.get(S.container(name), { timeout: 30000 }).should(($root) => {
    const root = $root[0];
    const doc = root.ownerDocument;
    const win = doc.defaultView;
    const rect = (el) => {
      if (!el) return null;
      const r = el.getBoundingClientRect();
      return { left: r.left, right: r.right, top: r.top, bottom: r.bottom, width: r.width, height: r.height };
    };
    const content = root.querySelector(".key-value-pair-content");
    const popover = root.querySelector(".kv-changeset-popover");
    const bar = root.querySelector(".kv-changeset-content");
    const save = root.querySelector('[data-cy="kv-button-save-changes"]');
    const cancel = root.querySelector('[data-cy="kv-button-cancel"]');
    const saveText = save && Array.from(save.childNodes).find((n) => n.nodeType === 3);
    let saveLines = 0;
    if (saveText) {
      const range = doc.createRange();
      range.selectNodeContents(saveText);
      // one rect per line box; a wrapped label yields 2+ distinct tops
      saveLines = new Set(Array.from(range.getClientRects()).map((r) => Math.round(r.top))).size;
    }
    const barCs = bar ? win.getComputedStyle(bar) : null;
    const rows = Array.from(root.querySelectorAll(".kv-row-container"));
    assertFn({
      widget: rect(root.closest(".canvas-component")),
      root: rect(root),
      content: rect(content),
      scrollTop: content.scrollTop,
      scrollHeight: content.scrollHeight,
      clientHeight: content.clientHeight,
      contentPaddingBottom: win.getComputedStyle(content).paddingBottom,
      contentClass: content.className,
      rows: rows.map(rect),
      lastRow: rect(rows[rows.length - 1]),
      popoverClass: popover ? popover.className : null,
      bar: rect(bar),
      barRadius: barCs && {
        topLeft: barCs.borderTopLeftRadius,
        topRight: barCs.borderTopRightRadius,
        bottomLeft: barCs.borderBottomLeftRadius,
        bottomRight: barCs.borderBottomRightRadius,
      },
      save: rect(save),
      cancel: rect(cancel),
      saveLabel: save ? save.textContent : null,
      saveLines,
      saveOverflow: save ? save.scrollWidth - save.clientWidth : null,
    });
  });

/**
 * @tjBlock  canvas
 * @tjUsage  scrollKvContentToEnd('kv1')
 * @tjDom    scrolls the widget's own value list (`.key-value-pair-content`) to its end
 */
export const scrollKvContentToEnd = (name) =>
  cy.get(S.content(name)).then(($c) => {
    $c[0].scrollTop = $c[0].scrollHeight;
  });

/**
 * @tjBlock  canvas
 * @tjUsage  expectHitInside('[data-cy="kv1"] [data-cy="kv-button-save-changes"]')
 * @tjDom    document.elementFromPoint at the element's centre must land on the element (or inside it): nothing is
 *           painted over it and it is inside the viewport
 */
export const expectHitInside = (selector) =>
  cy.get(selector).first().should(($el) => {
    const el = $el[0];
    const r = el.getBoundingClientRect();
    const win = el.ownerDocument.defaultView;
    expect(r.bottom, `${selector} inside viewport (bottom)`).to.be.lte(win.innerHeight + 0.5);
    expect(r.right, `${selector} inside viewport (right)`).to.be.lte(win.innerWidth + 0.5);
    const hit = el.ownerDocument.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
    expect(hit && (hit === el || el.contains(hit)), `${selector} is the topmost element at its centre`).to.eq(true);
  });

/**
 * @tjBlock  userflow
 * @tjUsage  kvTooltips('kv1', (tips) => expect(tips.map((t) => t.text)).to.deep.eq(['Cancel']))
 * @tjDom    retries the callback with the widget's shown react-tooltip nodes (KeyValuePair.jsx:282 —
 *           `react-tooltip__show`, opacity > 0) as [{ text, left, right, top, bottom }]
 */
export const kvTooltips = (name, assertFn) =>
  cy.get(S.container(name)).should(($root) => {
    const win = $root[0].ownerDocument.defaultView;
    assertFn(
      Array.from($root[0].querySelectorAll(".react-tooltip"))
        .filter((t) => t.classList.contains("react-tooltip__show") && Number(win.getComputedStyle(t).opacity) > 0)
        .map((t) => {
          const r = t.getBoundingClientRect();
          return { text: t.textContent, left: r.left, right: r.right, top: r.top, bottom: r.bottom };
        })
    );
  });

/**
 * @tjBlock  userflow
 * @tjUsage  moveKvMouseAway()
 * @tjDom    real pointer to the page's top-left corner, in two moves (mouseout/mouseleave reach the old target)
 */
export const moveKvMouseAway = () => {
  cy.get("body").realHover({ position: { x: 4, y: 4 }, scrollBehavior: false });
  cy.get("body").realHover({ position: { x: 8, y: 8 }, scrollBehavior: false });
};
