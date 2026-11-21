/**
 * MODULE — appBuilder/components/divider: browser-only helpers for the Horizontal Divider (and, by passing
 * its own type/definition, the Vertical Divider).
 * FOR AI: addDividersViaApi seeds fully-configured dividers (plus any helper widgets) in one components POST
 * — divider definition defaults merged with per-item overrides; openDividerAppInViewer opens the running app;
 * dividerBoxes reads the real layout boxes and computed styles of the RenderWidget box, the divider root, every
 * painted line and the label; hitTarget-style probing lives in dividerHitAt.
 */
import { dividerText } from "Texts/appBuilder/components/divider";
import { addIconsViaApi, openIconAppInViewer } from "Support/utils/appBuilder/components/icon";

/**
 * @tjBlock  contexts
 * @tjUsage  addDividersViaApi([{ name: 'd1', layout: { top: 40, left: 2, width: 10, height: 40 }, properties: { label: { value: 'x' } }, styles: { dividerStyle: { value: 'dashed' } } }])
 *           VerticalDivider: addDividersViaApi(items, { type: 'VerticalDivider', definition: verticalDividerText.definition })
 * @tjDom    delegates to addIconsViaApi (GET app → POST components diff → POST events). Items without a `type`
 *           become `type` with `definition` properties/styles/others merged under the item's own; items with
 *           another `type` (a neighbouring Text, …) pass through unchanged.
 */
export const addDividersViaApi = (
  items,
  { type = dividerText.componentType, definition = dividerText.definition, appId } = {}
) =>
  addIconsViaApi(
    items.map((item) =>
      item.type && item.type !== type
        ? item
        : {
            ...item,
            type,
            properties: { ...definition.properties, ...item.properties },
            styles: { ...definition.styles, ...item.styles },
            others: { ...definition.others, ...item.others },
          }
    ),
    appId
  );

/**
 * @tjBlock  contexts
 * @tjUsage  openDividerAppInViewer('[data-cy="draggable-widget-d1"]', { query: '&layout=mobile' })
 * @tjDom    visits /applications/<appId>/home?version=v1 (the editor's Preview URL) and waits for a selector
 */
export const openDividerAppInViewer = (waitForSelector, opts) => openIconAppInViewer(waitForSelector, opts);

/**
 * @tjBlock  styles
 * @tjUsage  dividerBoxes('d1', (b) => expect(b.lines[0].bgColor).to.eq('rgb(255, 0, 0)'))
 * @tjDom    retries the callback with plain objects for: the RenderWidget box (`draggable-widget-<name>`), the
 *           divider root (`[data-cy=<name>]` inside it: display/overflow/justify-content), every painted line
 *           (leaf <div>s under the root, DOM order: rect + background color/image/size/repeat, box-shadow,
 *           min-width) and the label <span> (rect, colour, white-space, text-overflow, max-width, box-shadow,
 *           scroll/client width + height, line count from its client rects)
 */
export const dividerBoxes = (name, assertFn) =>
  cy.get(`[data-cy="draggable-widget-${name}"]`).first().should(($box) => {
    const box = $box[0];
    const root = box.querySelector(`[data-cy="${name}"]`);
    const win = box.ownerDocument.defaultView;
    const rect = (el) => {
      if (!el) return null;
      const r = el.getBoundingClientRect();
      return { left: r.left, right: r.right, top: r.top, bottom: r.bottom, width: r.width, height: r.height };
    };
    const cs = (el) => win.getComputedStyle(el);
    const lineEls = root ? [...root.querySelectorAll("div")].filter((d) => d.children.length === 0) : [];
    const span = root ? root.querySelector("span") : null;
    const spanCs = span ? cs(span) : null;
    assertFn({
      box: rect(box),
      root: rect(root),
      rootDisplay: root ? cs(root).display : null,
      rootOverflow: root ? cs(root).overflow : null,
      rootJustify: root ? cs(root).justifyContent : null,
      lines: lineEls.map((el) => {
        const c = cs(el);
        return {
          ...rect(el),
          parentWidth: el.parentElement.getBoundingClientRect().width,
          bgColor: c.backgroundColor,
          bgImage: c.backgroundImage,
          bgSize: c.backgroundSize,
          bgRepeat: c.backgroundRepeat,
          boxShadow: c.boxShadow,
        };
      }),
      label: span
        ? {
            ...rect(span),
            text: span.textContent,
            color: spanCs.color,
            whiteSpace: spanCs.whiteSpace,
            textOverflow: spanCs.textOverflow,
            overflow: spanCs.overflow,
            maxWidth: spanCs.maxWidth,
            boxShadow: spanCs.boxShadow,
            scrollWidth: span.scrollWidth,
            clientWidth: span.clientWidth,
            parentWidth: span.parentElement.getBoundingClientRect().width,
            lineCount: (() => {
              const range = box.ownerDocument.createRange();
              range.selectNodeContents(span);
              const tops = new Set([...range.getClientRects()].map((r) => Math.round(r.top)));
              return tops.size;
            })(),
          }
        : null,
    });
  });

/**
 * @tjBlock  styles
 * @tjUsage  dividerHitAt('[data-cy="draggable-widget-neighbour"]', 0.5, 0.1).then((hit) => expect(hit.insideSelector).to.be.true)
 * @tjDom    document.elementFromPoint at a fraction (fx, fy) of the element's box; returns a plain object
 *           { insideSelector, tag, text } so Cypress does not re-wrap the DOM element
 */
export const dividerHitAt = (selector, fx = 0.5, fy = 0.5) =>
  cy.get(selector).first().then(($el) => {
    const doc = $el[0].ownerDocument;
    const r = $el[0].getBoundingClientRect();
    const hit = doc.elementFromPoint(r.left + r.width * fx, r.top + r.height * fy);
    return {
      insideSelector: !!hit && $el[0].contains(hit),
      tag: hit ? hit.tagName : null,
      text: hit ? (hit.textContent || "").slice(0, 80) : null,
    };
  });
