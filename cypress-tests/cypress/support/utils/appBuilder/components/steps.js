/**
 * MODULE — appBuilder/components/steps: browser-only helpers for the Steps widget.
 * FOR AI: addStepsViaApi seeds fully-configured Steps (plus any helper widgets and their events) in one components
 * POST — steps.js definition defaults merged with per-item overrides; openStepsAppInViewer opens the running app;
 * stepsBoxes / readStepsBoxes read the real layout boxes + computed styles of the RenderWidget box, the Steps root,
 * every milestone button (and its dot / label) and every connector; expectStepsGeometry asserts the layout contract
 * (milestone count, equal connectors spanning the root, vertical centring, single-step centring, centred labels with
 * ellipsis, nothing overflowing) in one call; focusRing reads the keyboard focus ring of the focused milestone.
 */
import { stepsText } from "Texts/appBuilder/components/steps";
import { stepsSelector } from "Selectors/appBuilder/components/steps";
import { addIconsViaApi, openIconAppInViewer } from "Support/utils/appBuilder/components/icon";

const PX = 1; // sub-pixel layout tolerance

/**
 * @tjBlock  contexts
 * @tjUsage  addStepsViaApi([{ name: 's1', layout: { top: 40, left: 2, width: 22, height: 38 }, properties: { variant: { value: 'numbers' } } }])
 * @tjDom    delegates to addIconsViaApi (GET app → POST components diff → POST events). Items without a `type`
 *           become Steps with the steps.js definition properties/styles/others merged under the item's own; items
 *           with another `type` (a TextInput, a Button with control-component events, …) pass through unchanged.
 */
export const addStepsViaApi = (items, { appId } = {}) => {
  const type = stepsText.componentType;
  const D = stepsText.definition;
  return addIconsViaApi(
    items.map((item) =>
      item.type && item.type !== type
        ? item
        : {
            ...item,
            type,
            layout: { top: 40, left: 2, width: 22, height: 38, ...item.layout }, // steps.js:78-81 default size
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
 * @tjUsage  openStepsAppInViewer(stepsSelector.milestones('s1'), { query: '&layout=mobile' })
 * @tjDom    visits /applications/<appId>/home?version=v1 (the editor's Preview URL) and waits for a selector
 */
export const openStepsAppInViewer = (waitForSelector, opts) => openIconAppInViewer(waitForSelector, opts);

/**
 * @tjBlock  canvas
 * @tjUsage  stepsBoxes('s1', (b) => expect(b.milestones).to.have.length(5))
 * @tjDom    retries the callback with plain objects for: the RenderWidget box (rect, class, opacity, wrapper display),
 *           the Steps root (rect, padding, class, opacity, display, scroll sizes, CSS colour variables, box-shadow),
 *           the .progress-line-container, every milestone <button> (rect, class, disabled, tabIndex, aria-current,
 *           opacity, cursor, colour, background, border colour, box-shadow, effective opacity up to the box) with its
 *           .dot (rect, background, border colour) and .label (rect, colour, scroll/client width, max-width,
 *           text-overflow, white-space, text), and every .step-connector (rect, background). Absent pieces are null.
 */
const snapshot = (box, name) => {
  const win = box.ownerDocument.defaultView;
  const cs = (el) => win.getComputedStyle(el);
  const rect = (el) => {
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return { left: r.left, right: r.right, top: r.top, bottom: r.bottom, width: r.width, height: r.height };
  };
  const effectiveOpacity = (el) => {
    let o = 1;
    for (let e = el; e && e !== box.parentElement; e = e.parentElement) o *= parseFloat(cs(e).opacity);
    return o;
  };
  const root = box.querySelector(`[data-cy="${name}"]`);
  const line = root ? root.querySelector(".progress-line-container") : null;
  const milestones = root ? [...root.querySelectorAll("button.milestone")] : [];
  const connectors = root ? [...root.querySelectorAll(".step-connector")] : [];
  return {
    box: rect(box),
    boxClass: box.className,
    wrapperDisplay: cs(box.parentElement).display,
    root: root
      ? {
          ...rect(root),
          className: root.className,
          display: cs(root).display,
          opacity: parseFloat(cs(root).opacity),
          paddingLeft: parseFloat(cs(root).paddingLeft),
          paddingRight: parseFloat(cs(root).paddingRight),
          scrollWidth: root.scrollWidth,
          clientWidth: root.clientWidth,
          ariaDisabled: root.getAttribute("aria-disabled"),
          ariaHidden: root.getAttribute("aria-hidden"),
        }
      : null,
    line: rect(line),
    milestones: milestones.map((m) => {
      const dot = m.querySelector(".dot");
      const label = m.querySelector(".label");
      return {
        ...rect(m),
        className: m.className,
        text: m.textContent.trim(),
        disabled: m.disabled,
        tabIndex: m.tabIndex,
        ariaCurrent: m.getAttribute("aria-current"),
        opacity: parseFloat(cs(m).opacity),
        effectiveOpacity: effectiveOpacity(m),
        cursor: cs(m).cursor,
        color: cs(m).color,
        bgColor: cs(m).backgroundColor,
        borderColor: cs(m).borderTopColor,
        boxShadow: cs(m).boxShadow,
        dot: dot ? { ...rect(dot), bgColor: cs(dot).backgroundColor, borderColor: cs(dot).borderTopColor } : null,
        label: label
          ? {
              ...rect(label),
              color: cs(label).color,
              scrollWidth: label.scrollWidth,
              clientWidth: label.clientWidth,
              maxWidth: parseFloat(label.style.maxWidth),
              textOverflow: cs(label).textOverflow,
              whiteSpace: cs(label).whiteSpace,
              overflow: cs(label).overflowX,
              text: label.textContent,
            }
          : null,
      };
    }),
    connectors: connectors.map((c) => ({ ...rect(c), bgColor: cs(c).backgroundColor })),
  };
};

export const stepsBoxes = (name, assertFn) =>
  cy.get(stepsSelector.draggableWidget(name)).first().should(($box) => assertFn(snapshot($box[0], name)));

/**
 * @tjBlock  canvas
 * @tjUsage  readStepsBoxes('s1').then((before) => { ...; stepsBoxes('s1', (b) => expect(b.connectors[0].width).to.be.gt(before.connectors[0].width)) })
 * @tjDom    same plain object as stepsBoxes, yielded once (no retry) for before/after comparisons
 */
export const readStepsBoxes = (name) => cy.get(stepsSelector.draggableWidget(name)).first().then(($box) => snapshot($box[0], name));

const near = (a, b, msg, tol = PX) => expect(a, msg).to.be.closeTo(b, tol);
const insideX = (inner, outer, msg) => {
  expect(inner.left, `${msg}: left inside`).to.be.gte(outer.left - PX);
  expect(inner.right, `${msg}: right inside`).to.be.lte(outer.right + PX);
};

/**
 * @tjBlock  canvas
 * @tjUsage  expectStepsGeometry('s1', { variant: 'titles', count: 5, truncated: [false, false, false, false, false] })
 * @tjDom    stepsBoxes + the runtime layout contract (Steps.jsx:53-102, Steps.scss): `count` milestones and count-1
 *           connectors; the root sits inside the box and never scrolls horizontally; milestones are 12px dots
 *           (28px numbers); one step → centred in the root; several → the first starts at the root's content-left,
 *           the last ends at its content-right, the connectors are equal, non-empty and fill the gap between their
 *           neighbours (2px flex gap) on the milestones' vertical centre line; Label variant → each label is centred
 *           under its dot (2px below), inside the root, inside the box vertically, never overlapping its neighbour,
 *           and is ellipsis-truncated exactly when `truncated[i]` is true (when given).
 */
export const expectStepsGeometry = (name, opts = {}) => {
  const T = stepsText;
  const { variant = T.variantLabel, count = T.defaultStepCount, truncated, context = name } = opts;
  return stepsBoxes(name, (b) => {
    const tag = `${context} [${variant} ×${count}]`;
    expect(b.root, `${tag}: rendered`).to.not.eq(null);
    expect(b.root.display, `${tag}: root shown`).to.eq("flex");
    const { root, milestones: ms, connectors: cs } = b;
    expect(ms, `${tag}: one milestone per visible step`).to.have.length(count);
    expect(cs, `${tag}: one connector between neighbours`).to.have.length(Math.max(count - 1, 0));

    // nothing leaves the widget and the root never scrolls sideways
    insideX(root, b.box, `${tag}: root`);
    expect(root.scrollWidth, `${tag}: root does not scroll horizontally`).to.be.lte(root.clientWidth);
    if (!count) return;

    const size = variant === T.variantNumber ? T.numberSize : T.dotSize;
    const contentLeft = root.left + root.paddingLeft;
    const contentRight = root.right - root.paddingRight;
    ms.forEach((m, i) => {
      near(m.width, size, `${tag}: milestone ${i} width`);
      near(m.height, size, `${tag}: milestone ${i} height`);
      insideX(m, root, `${tag}: milestone ${i}`);
      expect(m.top, `${tag}: milestone ${i} below the box top`).to.be.gte(b.box.top - PX);
      expect(m.bottom, `${tag}: milestone ${i} above the box bottom`).to.be.lte(b.box.bottom + PX);
    });

    if (count === 1) {
      near(ms[0].left + ms[0].width / 2, root.left + root.width / 2, `${tag}: single step centred`);
    } else {
      near(ms[0].left, contentLeft, `${tag}: first milestone at the content left`);
      near(ms[count - 1].right, contentRight, `${tag}: last milestone at the content right`);
      const widths = cs.map((c) => c.width);
      expect(Math.min(...widths), `${tag}: connectors have length`).to.be.gt(0);
      expect(Math.max(...widths) - Math.min(...widths), `${tag}: connectors are equal`).to.be.lte(PX);
      cs.forEach((c, i) => {
        near(c.left, ms[i].right + T.connectorGap, `${tag}: connector ${i} starts after milestone ${i}`);
        near(c.right, ms[i + 1].left - T.connectorGap, `${tag}: connector ${i} ends before milestone ${i + 1}`);
        near(c.height, T.connectorHeight, `${tag}: connector ${i} thickness`);
        near(c.top + c.height / 2, ms[i].top + ms[i].height / 2, `${tag}: connector ${i} on the milestones' centre line`);
      });
    }

    if (variant === T.variantLabel) {
      ms.forEach((m, i) => {
        const l = m.label;
        expect(l, `${tag}: label ${i} rendered`).to.not.eq(null);
        near(l.left + l.width / 2, m.left + m.width / 2, `${tag}: label ${i} centred under its dot`);
        near(l.top, m.bottom + T.labelGap, `${tag}: label ${i} just below its dot`);
        insideX(l, root, `${tag}: label ${i}`);
        expect(l.bottom, `${tag}: label ${i} inside the box`).to.be.lte(b.box.bottom + PX);
        expect(l.width, `${tag}: label ${i} within its max width`).to.be.lte(l.maxWidth + PX);
        expect(l.whiteSpace, `${tag}: label ${i} single line`).to.eq(T.noWrap);
        expect(l.textOverflow, `${tag}: label ${i} ellipsis`).to.eq(T.ellipsis);
        if (truncated) {
          expect(l.scrollWidth > l.clientWidth, `${tag}: label ${i} truncated`).to.eq(truncated[i]);
        }
        if (i > 0) expect(ms[i - 1].label.right, `${tag}: labels ${i - 1}/${i} do not overlap`).to.be.lte(l.left + PX);
      });
    } else {
      ms.forEach((m, i) => expect(m.label, `${tag}: no label in ${variant} (${i})`).to.eq(null));
    }
    if (variant === T.variantNumber) {
      ms.forEach((m, i) => expect(m.text, `${tag}: number ${i}`).to.eq(String(i + 1)));
    }
  });
};

/**
 * @tjBlock  styles
 * @tjUsage  focusRing().then((f) => expect(f.spread).to.eq(3))
 * @tjDom    waits out the milestone's 0.3s `transition: all` (Steps.scss:31) and reads document.activeElement:
 *           { widget (runtime name of the enclosing widget box), text, focusVisible, boxShadow, spread (largest
 *           box-shadow spread, px), ringColor (colour of that layer), rect, clip (rect of the nearest ancestor that
 *           clips overflow) } — plain object
 */
export const focusRing = () => {
  // eslint-disable-next-line cypress/no-unnecessary-waiting
  cy.wait(stepsText.transitionMs + 200);
  return cy.document().then((doc) => {
    const el = doc.activeElement;
    const win = doc.defaultView;
    const widget = el && el.closest('[data-cy^="draggable-widget-"]');
    const shadow = win.getComputedStyle(el).boxShadow;
    // "rgb(255, 255, 255) 0px 0px 0px 1px, rgb(67, 104, 227) 0px 0px 0px 3px, …" → [{ color, spread }]
    const layers =
      shadow === "none"
        ? []
        : shadow.split(/,(?![^(]*\))/).map((layer) => {
            const color = (layer.match(/rgba?\([^)]*\)/) || [""])[0];
            const px = (layer.replace(color, "").match(/-?[\d.]+px/g) || []).map(parseFloat);
            return { color, spread: px[3] || 0 };
          });
    const top = layers.reduce((a, l) => (l.spread > (a ? a.spread : 0) ? l : a), null);
    let clipEl = el.parentElement;
    while (clipEl && win.getComputedStyle(clipEl).overflowX === "visible" && win.getComputedStyle(clipEl).overflowY === "visible")
      clipEl = clipEl.parentElement;
    const r = el.getBoundingClientRect();
    const c = clipEl ? clipEl.getBoundingClientRect() : null;
    return {
      widget: widget ? widget.getAttribute("data-cy").replace("draggable-widget-", "") : null,
      tag: el.tagName.toLowerCase(),
      text: el.textContent.trim(),
      focusVisible: el.matches(":focus-visible"),
      boxShadow: shadow,
      spread: top ? top.spread : 0,
      ringColor: top ? top.color : null,
      rect: { left: r.left, right: r.right, top: r.top, bottom: r.bottom },
      clip: c ? { left: c.left, right: c.right, top: c.top, bottom: c.bottom } : null,
    };
  });
};

/**
 * @tjBlock  userflow
 * @tjUsage  focusedWidget().should('eq', 's1')
 * @tjDom    runtime name of the widget box that holds document.activeElement ("body" when nothing is focused)
 */
export const focusedWidget = () =>
  cy.document().then((doc) => {
    const el = doc.activeElement;
    if (!el || el === doc.body) return "body";
    const w = el.closest('[data-cy^="draggable-widget-"]');
    return w ? w.getAttribute("data-cy").replace("draggable-widget-", "") : el.tagName.toLowerCase();
  });

const TRANSPARENT = "rgba(0, 0, 0, 0)";

/**
 * @tjBlock  styles
 * @tjUsage  expectStepColors('s1', { variant: 'titles', current: 2, colors: { completedAccent: 'rgb(255, 0, 0)', incompletedAccent, completedLabel, incompletedLabel, currentStepLabel } })
 * @tjDom    stepsBoxes; per milestone state (index < current completed, = current active, > current incomplete):
 *           Label/Plain dot — completed: fill + ring completedAccent; active: hollow (transparent) ring completedAccent;
 *           incomplete: fill + ring incompletedAccent (Steps.jsx:219-226). Label caption — completed and active:
 *           completedLabel, incomplete: incompletedLabel (Steps.scss:117-127). Number badge — completed: fill + ring
 *           completedAccent, text completedLabel; active: hollow, ring completedAccent, text currentStepLabel; incomplete:
 *           fill + ring incompletedAccent, text incompletedLabel (Steps.scss:42-57). Connector i: completedAccent when
 *           milestone i is completed, else incompletedAccent (Steps.jsx:245, Steps.scss:136-142). Colours are computed rgb().
 */
export const expectStepColors = (name, { variant = stepsText.variantLabel, current, colors, context = name }) =>
  stepsBoxes(name, (b) => {
    const C = colors;
    const tag = `${context} [${variant}]`;
    expect(b.milestones.length, `${tag}: has milestones`).to.be.gt(current);
    b.milestones.forEach((m, i) => {
      const state = i < current ? "completed" : i === current ? "active" : "incomplete";
      const accent = state === "incomplete" ? C.incompletedAccent : C.completedAccent;
      const fill = state === "active" ? TRANSPARENT : accent;
      const at = `${tag}: ${state} milestone ${i}`;
      if (variant === stepsText.variantNumber) {
        expect(m.bgColor, `${at} fill`).to.eq(fill);
        expect(m.borderColor, `${at} ring`).to.eq(accent);
        const text = state === "completed" ? C.completedLabel : state === "active" ? C.currentStepLabel : C.incompletedLabel;
        expect(m.color, `${at} number colour`).to.eq(text);
      } else {
        expect(m.dot.bgColor, `${at} dot fill`).to.eq(fill);
        expect(m.dot.borderColor, `${at} dot ring`).to.eq(accent);
      }
      if (variant === stepsText.variantLabel) {
        // the active caption follows Completed label, not Current step label (Steps.scss:121-123, commit 76c4fbbfc6f)
        expect(m.label.color, `${at} caption colour`).to.eq(state === "incomplete" ? C.incompletedLabel : C.completedLabel);
      }
    });
    b.connectors.forEach((c, i) =>
      expect(c.bgColor, `${tag}: connector ${i}`).to.eq(i < current ? C.completedAccent : C.incompletedAccent)
    );
  });
