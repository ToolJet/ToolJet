/**
 * MODULE — appBuilder/components/navigation: browser-only helpers for the Navigation widget.
 * FOR AI: addNavigationsViaApi seeds fully-configured Navigations (plus any helper widgets) in one components POST;
 * openNavigationAppInViewer opens the running app; navRowBoxes / expectOverflowBucketing read the real horizontal
 * row (container content box, the hidden measurement copy's real widths, every visible item / group / "More"
 * button) and assert the overflow contract; expectMoreMenu opens "More" and checks what overflowed; the inspector
 * helpers read the menu-items tree (order + depth) and drag a row with a real pointer, releasing only once the
 * @dnd-kit projection shows the expected drop; expectCaptionTooltip / expectInlineCaption check how a caption shows.
 */
import { navigationText } from "Texts/appBuilder/components/navigation";
import { navigationSelector } from "Selectors/appBuilder/components/navigation";
import { addIconsViaApi, openIconAppInViewer } from "Support/utils/appBuilder/components/icon";
import { moveMouseAway } from "Support/utils/appBuilder/components/radioButtonV2";

const PX = 1; // sub-pixel layout tolerance
const INDENT = 15; // Inspector SortableTree indentationWidth (Components/Navigation/components/Tree/SortableTree.jsx:20)

/**
 * @tjBlock  contexts
 * @tjUsage  addNavigationsViaApi([{ name: 'nav1', layout: { top: 40, left: 2, width: 30, height: 50 }, properties: { menuItems: { value: [...] } } }])
 * @tjDom    delegates to addIconsViaApi (GET app → POST components diff → POST events). Items without a `type`
 *           become Navigations with the navigation.js definition properties/styles/others merged under the item's
 *           own; items with another `type` (a Text probe, …) pass through unchanged.
 */
export const addNavigationsViaApi = (items, { appId } = {}) => {
  const type = navigationText.componentType;
  const D = navigationText.definition;
  return addIconsViaApi(
    items.map((item) =>
      item.type && item.type !== type
        ? item
        : {
            ...item,
            type,
            layout: { top: 40, left: 2, width: 20, height: 60, ...item.layout }, // navigation.js:6-9 default size
            properties: { ...D.properties, ...item.properties },
            styles: { ...D.styles, ...item.styles },
            others: { ...D.others, ...item.others },
          }
    ),
    appId
  );
};

/**
 * @tjBlock  contexts
 * @tjUsage  openNavigationAppInViewer(navigationSelector.root('nav1'), { query: '&layout=mobile' })
 * @tjDom    visits /applications/<appId>/home?version=v1 (the editor's Preview URL) and waits for a selector
 */
export const openNavigationAppInViewer = (waitForSelector, opts) => openIconAppInViewer(waitForSelector, opts);

/**
 * @tjBlock  canvas
 * @tjUsage  navRowBoxes('nav1', (b) => expect(b.visible).to.deep.eq(['a', 'b']))
 * @tjDom    retries the callback with a plain snapshot of the `.navigation-widget` root: display, clientWidth,
 *           computed padding, content box (rect minus border + padding), `avail` = clientWidth − 2·padding (the
 *           width useCalculateOverflow.js:28-29 buckets against), the hidden measurement copy's real offsetWidths
 *           (`measured[id]`), the visible top-level row in DOM order (`visible` ids + `rects`) and the "More"
 *           button rect (null when nothing overflows)
 */
const rowSnapshot = (box) => {
  const root = box.querySelector(".navigation-widget");
  const win = box.ownerDocument.defaultView;
  const rect = (el) => {
    const r = el.getBoundingClientRect();
    return { left: r.left, right: r.right, top: r.top, bottom: r.bottom, width: r.width, height: r.height };
  };
  if (!root) return { root: null };
  const cs = win.getComputedStyle(root);
  const pad = parseFloat(cs.paddingLeft);
  const r = rect(root);
  const content = {
    left: r.left + parseFloat(cs.borderLeftWidth) + pad,
    right: r.right - parseFloat(cs.borderRightWidth) - parseFloat(cs.paddingRight),
  };
  const measured = {};
  root.querySelectorAll("[data-id]").forEach((el) => {
    measured[el.dataset.id] = el.offsetWidth;
  });
  const buttons = [...root.querySelectorAll('nav button[data-cy^="nav-item-"], nav button[data-cy^="nav-group-"]')];
  const more = root.querySelector("button.more-pages-btn");
  return {
    root: r,
    display: cs.display,
    clientWidth: root.clientWidth,
    pad,
    content,
    avail: root.clientWidth - 2 * pad,
    measured,
    visible: buttons.map((b) => b.getAttribute("data-cy").replace(/^nav-(item|group)-/, "")),
    rects: buttons.map(rect),
    more: more ? { ...rect(more), text: more.textContent.trim() } : null,
  };
};

export const navRowBoxes = (name, assertFn) =>
  cy.get(navigationSelector.draggableWidget(name)).first().should(($box) => assertFn(rowSnapshot($box[0])));

/**
 * @tjBlock  canvas
 * @tjUsage  readNavRow('nav1').then((row) => expect(row.visible).to.have.length(3))
 * @tjDom    same plain object as navRowBoxes, yielded once (no retry)
 */
export const readNavRow = (name) =>
  cy.get(navigationSelector.draggableWidget(name)).first().then(($box) => rowSnapshot($box[0]));

/**
 * @tjBlock  canvas
 * @tjUsage  expectOverflowBucketing('nav1', ['a', 'b', 'c'], { context: 'narrow' }).then(({ visible, overflow }) => ...)
 * @tjDom    asserts (retrying) the overflow contract of useCalculateOverflow.js against the real geometry:
 *           every item was measured (width > 0); the visible row is the configured order's prefix and the rest
 *           overflowed; "More" is rendered iff something overflowed; the visible items' measured widths plus the
 *           6px gaps (and the 80px+gap "More" reserve when needed) fit `avail`; the first overflowed item would not
 *           have fitted; and every rendered row button + "More" sits inside the content box without overlapping.
 *           Yields { visible, overflow, avail } (plain object). Pass `ids` with non-decreasing widths so the
 *           overflow is a strict suffix (useCalculateOverflow.js:48-70 keeps scanning after the first miss).
 */
export const expectOverflowBucketing = (name, ids, { context = "" } = {}) => {
  const T = navigationText;
  let result;
  return navRowBoxes(name, (b) => {
    const ctx = `${name}${context ? ` (${context})` : ""}`;
    expect(b.root, `${ctx}: navigation root rendered`).to.not.eq(null);
    expect(b.display, `${ctx}: displayed`).to.eq("flex");
    ids.forEach((id) => expect(b.measured[id], `${ctx}: ${id} measured`).to.be.gt(0));
    const k = b.visible.length;
    const overflow = ids.slice(k);
    expect(b.visible, `${ctx}: visible row is the configured order's prefix`).to.deep.eq(ids.slice(0, k));
    if (overflow.length) {
      expect(b.more, `${ctx}: "More" shown while ${overflow.join(",")} overflow`).to.not.eq(null);
      expect(b.more.text, `${ctx}: More label`).to.eq(T.moreLabel);
    } else {
      expect(b.more, `${ctx}: no "More" when everything fits`).to.eq(null);
    }
    const used = ids.slice(0, k).reduce((s, id, i) => s + b.measured[id] + (i > 0 ? T.flexGap : 0), 0);
    const reserve = overflow.length ? T.moreButtonReserve + T.flexGap : 0;
    expect(used + reserve, `${ctx}: visible items (+ More reserve) fit the ${b.avail}px row`).to.be.lte(b.avail + PX);
    if (overflow.length) {
      const next = used + (k > 0 ? T.flexGap : 0) + b.measured[overflow[0]] + reserve;
      expect(next, `${ctx}: ${overflow[0]} (${b.measured[overflow[0]]}px) did not fit the ${b.avail}px row`).to.be.gt(
        b.avail - PX
      );
    }
    const painted = b.more ? [...b.rects, b.more] : b.rects;
    painted.forEach((r, i) => {
      expect(r.width, `${ctx}: row button ${i} painted`).to.be.gt(0);
      expect(r.left, `${ctx}: row button ${i} starts inside the content box`).to.be.gte(b.content.left - PX);
      expect(r.right, `${ctx}: row button ${i} ends inside the content box`).to.be.lte(b.content.right + PX);
      if (i > 0) expect(r.left, `${ctx}: row button ${i} after ${i - 1}`).to.be.gte(painted[i - 1].right - PX);
    });
    result = { visible: b.visible, overflow, avail: b.avail };
  }).then(() => result);
};

/**
 * @tjBlock  canvas
 * @tjUsage  expectMoreMenu('nav1', ['d', 'e'])
 * @tjDom    with nothing overflowing asserts there is no "More"; otherwise opens it with a real click and asserts the
 *           portalled `.page-menu-popup` lists exactly the overflowed top-level items/groups in order, then closes
 *           it with Escape
 */
export const expectMoreMenu = (name, overflowIds) => {
  if (!overflowIds.length) {
    cy.get(navigationSelector.moreButton(name)).should("not.exist");
    return;
  }
  cy.get(navigationSelector.moreButton(name)).realClick({ scrollBehavior: false });
  cy.get(navigationSelector.popup).should(($p) => {
    expect($p, "one More menu open").to.have.length(1);
    const ids = [...$p[0].querySelectorAll(':scope > [data-cy^="nav-item-"], :scope > [data-cy^="nav-group-"]')].map(
      (el) => el.getAttribute("data-cy").replace(/^nav-(item|group)-/, "")
    );
    expect(ids, `${name}: More lists what overflowed`).to.deep.eq(overflowIds);
    // Radix moves focus into the opened content; press Escape only once the menu holds focus (an Escape sent
    // while the open is still settling was once dropped on CI and left the menu open)
    expect($p[0].contains($p[0].ownerDocument.activeElement), "More menu holds focus").to.eq(true);
  });
  cy.realPress("Escape");
  cy.get(navigationSelector.popup).should("not.exist");
};

/**
 * @tjBlock  userflow
 * @tjUsage  inspectorTree((rows) => expect(rows).to.deep.eq([['item1', 0], ['item2', 0]]))
 * @tjDom    retries the callback with the Inspector menu-items rows as [id, depth], ordered by where each row is
 *           painted (dnd-kit sorts by transform while dragging); depth = the row's `--spacing` / 15px indent
 */
const treeSnapshot = ($list) =>
  [...$list[0].querySelectorAll('li[data-draggable="true"]')]
    .map((li) => {
      const body = li.querySelector("[data-list-item-id]");
      return {
        id: body ? body.getAttribute("data-list-item-id") : null,
        depth: Math.round(parseFloat(li.style.getPropertyValue("--spacing") || "0") / INDENT),
        top: body ? body.getBoundingClientRect().top : 0,
      };
    })
    .sort((a, b) => a.top - b.top)
    .map(({ id, depth }) => [id, depth]);

export const inspectorTree = (assertFn) =>
  cy.get(navigationSelector.inspectorList).should(($list) => assertFn(treeSnapshot($list)));

/**
 * @tjBlock  userflow
 * @tjUsage  dragInspectorRow('item2', { rows: -1, dx: 0 }, [['item2', 0], ['item1', 0], ['group1', 0]])
 * @tjDom    real pointer drag on the Inspector tree (@dnd-kit PointerSensor, frontend/src/_ui/SortableTree): press
 *           on the row's label, a first 12px step (past the 10px activation distance — a smaller first move hits
 *           the sensor's delay-constraint path), then 8 steps to (dx, rows × row pitch) from the press point.
 *           Releases only after the painted rows match `during` (order + projected depth of the dragged row), so
 *           the drop lands exactly where asserted; then waits for the autosave.
 */
export const dragInspectorRow = (id, { dx = 0, rows }, during) => {
  cy.get(navigationSelector.inspectorRows).then(($rows) => {
    const tops = [...$rows].map((li) => li.getBoundingClientRect().top).sort((a, b) => a - b);
    const pitch = tops[1] - tops[0];
    const row = $rows[0].ownerDocument.querySelector(navigationSelector.inspectorRow(id));
    expect(row, `inspector row ${id}`).to.not.eq(null);
    const r = row.getBoundingClientRect();
    const x0 = r.left + 60;
    const y0 = r.top + r.height / 2;
    const dy = rows * pitch;
    cy.get(navigationSelector.inspectorRow(id)).realMouseDown({ x: 60, y: r.height / 2, scrollBehavior: false });
    cy.get("body").realMouseMove(x0, y0 + (dy >= 0 ? 12 : -12), { position: "topLeft", scrollBehavior: false });
    const steps = 8;
    for (let i = 1; i <= steps; i += 1) {
      cy.get("body").realMouseMove(x0 + (dx * i) / steps, y0 + (dy * i) / steps, {
        position: "topLeft",
        scrollBehavior: false,
      });
    }
    inspectorTree((rows) => expect(rows, `while dragging ${id}`).to.deep.eq(during));
    cy.get("body").realMouseUp({ position: { x: x0 + dx, y: y0 + dy }, scrollBehavior: false });
  });
  cy.waitForAutoSave();
};

/**
 * @tjBlock  userflow
 * @tjUsage  expectTopLevelRow('nav1', ['item2', 'item1', 'group1'])
 * @tjDom    the horizontal row's top-level buttons (items + group triggers) in DOM order
 */
export const expectTopLevelRow = (name, ids, context = "") =>
  navRowBoxes(name, (b) => expect(b.visible, `${name}: top-level row ${context}`).to.deep.eq(ids));

/**
 * @tjBlock  userflow
 * @tjUsage  expectGroupMenu('nav1', 'group1', ['item3', 'item4'])
 * @tjDom    opens a horizontal group's Radix dropdown with a real click and asserts the portalled `.page-menu-popup`
 *           lists exactly these children in order, then closes it with Escape
 */
export const expectGroupMenu = (name, groupId, childIds) => {
  cy.get(navigationSelector.group(name, groupId)).realClick({ scrollBehavior: false });
  cy.get(navigationSelector.popup).should(($p) => {
    expect($p, "one group menu open").to.have.length(1);
    const ids = [...$p[0].querySelectorAll('[data-cy^="nav-item-"]')].map((el) =>
      el.getAttribute("data-cy").replace(/^nav-item-/, "")
    );
    expect(ids, `${name}: ${groupId} children`).to.deep.eq(childIds);
  });
  cy.realPress("Escape");
  cy.get(navigationSelector.popup).should("not.exist");
};

/**
 * @tjBlock  styles
 * @tjUsage  expectCaptionTooltip(navigationSelector.item('nav1', 'a'), caption)
 * @tjDom    the item button carries no inline `.nav-item-caption`; a real hover opens exactly one react-bootstrap
 *           `.tooltip.show` (role=tooltip) whose text is the caption, placed above the button (placement "top",
 *           Navigation.jsx:94) and overlapping it horizontally; moving the pointer away closes it
 */
export const expectCaptionTooltip = (itemSelector, caption) => {
  cy.get(itemSelector).should(($b) => {
    expect($b, "one item button").to.have.length(1);
    expect($b[0].querySelector(navigationSelector.inlineCaption), "no inline caption").to.eq(null);
    expect($b[0].textContent, "caption text not inside the button").to.not.contain(caption);
  });
  moveMouseAway();
  cy.get(navigationSelector.tooltip).should("not.exist");
  cy.get(itemSelector).realHover({ scrollBehavior: false });
  cy.get(navigationSelector.tooltip).should(($t) => {
    expect($t, "one tooltip").to.have.length(1);
    expect($t.attr("role")).to.eq("tooltip");
    expect($t.text().trim(), "tooltip text is the caption").to.eq(caption);
  });
  cy.get(itemSelector).then(($b) => {
    const b = $b[0].getBoundingClientRect();
    cy.get(navigationSelector.tooltip).should(($t) => {
      const t = $t[0].getBoundingClientRect();
      expect(t.bottom, "tooltip above the item").to.be.lte(b.top + PX);
      expect(t.right, "tooltip overlaps the item horizontally").to.be.gt(b.left);
      expect(t.left, "tooltip overlaps the item horizontally").to.be.lt(b.right);
    });
  });
  moveMouseAway();
  cy.get(navigationSelector.tooltip).should("not.exist");
};

/**
 * @tjBlock  styles
 * @tjUsage  expectInlineCaption(navigationSelector.item('nav1', 'a'), caption)
 * @tjDom    the caption is painted inline inside the item button (`.nav-item-caption`, Navigation.jsx:81-85) below
 *           the label, and a real hover opens no tooltip
 */
export const expectInlineCaption = (itemSelector, caption) => {
  moveMouseAway();
  cy.get(itemSelector).should(($b) => {
    expect($b, "one item button").to.have.length(1);
    const cap = $b[0].querySelector(navigationSelector.inlineCaption);
    expect(cap, "inline caption rendered").to.not.eq(null);
    expect(cap.textContent.trim(), "inline caption text").to.eq(caption);
    const c = cap.getBoundingClientRect();
    const label = $b[0].querySelector(".page-name").getBoundingClientRect();
    expect(c.height, "caption painted").to.be.gt(0);
    expect(c.top, "caption under the label").to.be.gte(label.bottom - PX);
  });
  cy.get(itemSelector).realHover({ scrollBehavior: false });
  // the tooltip opens 50ms after hover (ToolTip.jsx delay.show) — give it time to (not) appear
  cy.wait(400);
  cy.get(navigationSelector.tooltip).should("not.exist");
  moveMouseAway();
};

/**
 * @tjBlock  styles
 * @tjUsage  expectNoTooltipOnHover(navigationSelector.item('nav1', 'b'))
 * @tjDom    a real hover on an item without a caption opens no tooltip
 */
export const expectNoTooltipOnHover = (itemSelector) => {
  moveMouseAway();
  cy.get(itemSelector).realHover({ scrollBehavior: false });
  cy.wait(400);
  cy.get(navigationSelector.tooltip).should("not.exist");
  moveMouseAway();
};

/**
 * @tjBlock  styles
 * @tjUsage  setItemCaptionInInspector('item1', caption)
 * @tjDom    clicks the item's row in the Inspector tree (MenuItem.jsx:44-47 opens the edit popover), pastes the
 *           caption into the popover's Caption CodeHinter (NavItemPopover.jsx:167-180; a paste keeps every
 *           character), blurs it so CodeHinter commits, closes the popover by clicking the canvas and waits for the
 *           autosave
 */
export const setItemCaptionInInspector = (id, caption) => {
  cy.get(navigationSelector.inspectorRow(id)).click();
  cy.get(navigationSelector.inspectorCaptionField)
    .find(".cm-content")
    .click()
    .type("{selectall}")
    .then(($content) => {
      const win = $content[0].ownerDocument.defaultView;
      const data = new win.DataTransfer();
      data.setData("text/plain", caption);
      $content[0].dispatchEvent(new win.ClipboardEvent("paste", { clipboardData: data, bubbles: true, cancelable: true }));
    });
  cy.get(navigationSelector.inspectorCaptionField).find(".cm-line").should("have.text", caption);
  cy.get(`${navigationSelector.inspectorCaptionField} label`).click();
  cy.forceClickOnCanvas();
  cy.get(navigationSelector.inspectorCaptionField).should("not.exist");
  cy.waitForAutoSave();
};

/**
 * @tjBlock  canvas
 * @tjUsage  growingLabels(fake.firstName, 6)
 * @tjDom    n labels where each is a strict prefix of the next — so every next item is measured at least as wide
 *           (the overflow is then a strict suffix of the configured order)
 */
export const growingLabels = (seed, n, { start = 4, step = 3 } = {}) => {
  const letters = String(seed).replace(/[^A-Za-z]/g, "") || "Nav";
  const base = `${letters} `.repeat(30);
  return Array.from({ length: n }, (_, i) => base.slice(0, start + step * i).trim());
};
