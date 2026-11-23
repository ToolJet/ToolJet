/**
 * MODULE — appBuilder/components/progressBar: browser-only helpers for the ProgressBar widget.
 * FOR AI: addProgressBarsViaApi seeds fully-configured ProgressBars (plus any helper widgets) in one components
 * POST — progressbar.js definition defaults merged with per-item overrides; openProgressBarAppInViewer opens the
 * running app; progressBarBoxes reads the real layout boxes + computed styles of the RenderWidget box, the flex
 * root, the label, the bar container, the track and the fill / loading strip; expectProgressBarLayout asserts the
 * side/top × left/right geometry, padding-aware label size + bar thickness and "nothing overflows" in one call;
 * loadingStripFrames seeks the loading keyframe animation (Web Animations API) and reads the strip at given times.
 */
import { progressBarText } from "Texts/appBuilder/components/progressBar";
import { addIconsViaApi, openIconAppInViewer } from "Support/utils/appBuilder/components/icon";

const PX = 1; // sub-pixel layout tolerance

/**
 * @tjBlock  contexts
 * @tjUsage  addProgressBarsViaApi([{ name: 'pb1', layout: { top: 40, left: 2, width: 10, height: 50 }, styles: { alignment: { value: 'top' } } }])
 * @tjDom    delegates to addIconsViaApi (GET app → POST components diff → POST events). Items without a `type`
 *           become ProgressBars with the progressbar.js definition properties/styles/others merged under the
 *           item's own; items with another `type` (a neighbouring Text, …) pass through unchanged.
 */
export const addProgressBarsViaApi = (items, { appId } = {}) => {
  const type = progressBarText.componentType;
  const D = progressBarText.definition;
  return addIconsViaApi(
    items.map((item) =>
      item.type && item.type !== type
        ? item
        : {
            ...item,
            type,
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
 * @tjUsage  openProgressBarAppInViewer('[data-cy="draggable-widget-pb1"] [data-cy="pb1"]', { query: '&layout=mobile' })
 * @tjDom    visits /applications/<appId>/home?version=v1 (the editor's Preview URL) and waits for a selector
 */
export const openProgressBarAppInViewer = (waitForSelector, opts) => openIconAppInViewer(waitForSelector, opts);

/**
 * @tjBlock  styles
 * @tjUsage  progressBarMetrics({ boxHeight: 50, padding: 'default', textSize: 30, thickness: 20 }) → { computedHeight: 42, fontSize: 12.6, barHeight: 8.4 }
 * @tjDom    pure: RenderWidget passes height = box − 4 (RenderWidget.jsx:356); padding default subtracts
 *           2 × BOX_PADDING again (Progressbar.jsx:33); font size / bar height are textSize% / thickness% of it
 *           (Progressbar.jsx:35-41); out-of-range (outside 1–50) sizes fall back to 26 / 20.
 */
export const progressBarMetrics = ({
  boxHeight,
  padding = progressBarText.paddingDefault,
  textSize = progressBarText.defaultTextSize,
  thickness = progressBarText.defaultThickness,
}) => {
  const T = progressBarText;
  const height = boxHeight - T.renderWidgetHeightInset;
  const computedHeight = padding !== T.paddingNone ? height - 2 * T.boxPadding : height;
  const ts = textSize >= 1 && textSize <= 50 ? textSize : 26;
  const th = thickness >= 1 && thickness <= 50 ? thickness : 20;
  return { computedHeight, fontSize: (computedHeight * ts) / 100, barHeight: (computedHeight * th) / 100 };
};

/**
 * @tjBlock  styles
 * @tjUsage  progressBarBoxes('pb1', (b) => expect(b.track.height).to.be.closeTo(8.4, 0.5))
 * @tjDom    retries the callback with plain objects for: the RenderWidget box (`draggable-widget-<name>`: rect,
 *           padding, class, overflow), its positioned wrapper (overflow), the flex root (`[data-cy=<name>]`: rect,
 *           display, flex-direction, box-shadow, scroll/client sizes), the <label> (rect, font size, text), the bar
 *           container (root's last child), the track (rect, overflow, bg, radius), and either the fill (rect, bg) or
 *           the loading strip (rect, bg, animation name/duration/timing/iteration). Absent pieces are null.
 *           Wrapper display is exposed too (view mode hides an invisible widget's wrapper with display:none).
 */
const snapshot = (box, name) => {
  const win = box.ownerDocument.defaultView;
  const cs = (el) => win.getComputedStyle(el);
  const rect = (el) => {
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return { left: r.left, right: r.right, top: r.top, bottom: r.bottom, width: r.width, height: r.height };
  };
  const root = box.querySelector(`[data-cy="${name}"]`);
  const label = root ? root.querySelector("label") : null;
  const barCont = root ? root.lastElementChild : null;
  const track = barCont ? barCont.firstElementChild : null;
  const first = track ? track.firstElementChild : null;
  const strip = first && first.firstElementChild ? first.firstElementChild : null;
  const fill = first && !strip ? first : null;
  return {
    box: rect(box),
    boxPadding: parseFloat(cs(box).paddingTop),
    boxClass: box.className,
    boxOverflow: cs(box).overflow,
    wrapperOverflow: cs(box.parentElement).overflow,
    wrapperDisplay: cs(box.parentElement).display,
    root: root
      ? {
          ...rect(root),
          display: cs(root).display,
          flexDirection: cs(root).flexDirection,
          boxShadow: cs(root).boxShadow,
          scrollWidth: root.scrollWidth,
          clientWidth: root.clientWidth,
          scrollHeight: root.scrollHeight,
          clientHeight: root.clientHeight,
        }
      : null,
    label: label ? { ...rect(label), fontSize: parseFloat(cs(label).fontSize), text: label.textContent.trim() } : null,
    barCont: rect(barCont),
    track: track
      ? {
          ...rect(track),
          overflow: cs(track).overflow,
          bgColor: cs(track).backgroundColor,
          radius: parseFloat(cs(track).borderTopLeftRadius),
        }
      : null,
    fill: fill ? { ...rect(fill), bgColor: cs(fill).backgroundColor } : null,
    strip: strip
      ? {
          ...rect(strip),
          bgColor: cs(strip).backgroundColor,
          clipOverflow: cs(first).overflow,
          animationName: cs(strip).animationName,
          animationDuration: cs(strip).animationDuration,
          animationTiming: cs(strip).animationTimingFunction,
          animationIterations: cs(strip).animationIterationCount,
        }
      : null,
  };
};

export const progressBarBoxes = (name, assertFn) =>
  cy.get(`[data-cy="draggable-widget-${name}"]`).first().should(($box) => assertFn(snapshot($box[0], name)));

/**
 * @tjBlock  styles
 * @tjUsage  readProgressBarBoxes('pb1').then((before) => { ...; progressBarBoxes('pb1', (b) => expect(b.track.width).to.be.gt(before.track.width)) })
 * @tjDom    same plain object as progressBarBoxes, yielded once (no retry) for before/after comparisons
 */
export const readProgressBarBoxes = (name) =>
  cy.get(`[data-cy="draggable-widget-${name}"]`).first().then(($box) => snapshot($box[0], name));

const near = (a, b, msg) => expect(a, msg).to.be.closeTo(b, PX);
const within = (inner, outer, msg) => {
  expect(inner.left, `${msg}: left inside`).to.be.gte(outer.left - PX);
  expect(inner.right, `${msg}: right inside`).to.be.lte(outer.right + PX);
  expect(inner.top, `${msg}: top inside`).to.be.gte(outer.top - PX);
  expect(inner.bottom, `${msg}: bottom inside`).to.be.lte(outer.bottom + PX);
};

/**
 * @tjBlock  styles
 * @tjUsage  expectProgressBarLayout('pb1', { alignment: 'top', direction: 'right', padding: 'none', progress: 50 })
 * @tjDom    progressBarBoxes + the runtime layout contract (Progressbar.jsx:124-176): the root fills the box
 *           minus BOX_PADDING (or 0 with padding none); side = label then bar in one row (row-reverse when
 *           direction right), both vertically centred; top = label in the upper half (left/right aligned) above a
 *           full-width bar; font size and track height follow progressBarMetrics; the fill is progress% of the
 *           track (skipped while loading); no piece leaves the root and the root does not scroll.
 */
export const expectProgressBarLayout = (name, opts = {}) => {
  const T = progressBarText;
  const {
    alignment = T.alignSide,
    direction = T.directionLeft,
    padding = T.paddingDefault,
    textSize = T.defaultTextSize,
    thickness = T.defaultThickness,
    progress = T.defaultProgress,
    label: labelText = `${progress}%`,
    context = name,
  } = opts;
  return progressBarBoxes(name, (b) => {
    const tag = `${context} [${alignment}/${direction}/${padding}]`;
    expect(b.root, `${tag}: rendered`).to.not.eq(null);
    expect(b.label, `${tag}: label rendered`).to.not.eq(null);
    const { root, label, barCont, track } = b;
    const m = progressBarMetrics({ boxHeight: b.box.height, padding, textSize, thickness });
    const pad = padding === T.paddingNone ? 0 : T.boxPadding;

    // padding: the root fills the box inset by BOX_PADDING (default) or edge to edge (none)
    expect(b.boxPadding, `${tag}: box padding`).to.eq(pad);
    near(root.left, b.box.left + pad, `${tag}: root left inset`);
    near(root.right, b.box.right - pad, `${tag}: root right inset`);
    near(root.top, b.box.top + pad, `${tag}: root top inset`);
    near(root.bottom, b.box.bottom - pad, `${tag}: root bottom inset`);

    // size: label font and bar thickness are a share of the padding-aware height
    expect(label.fontSize, `${tag}: label font size`).to.be.closeTo(m.fontSize, 0.1);
    expect(track.height, `${tag}: bar thickness`).to.be.closeTo(m.barHeight, 0.5);
    expect(track.radius, `${tag}: rounded ends`).to.be.closeTo(m.barHeight / 2, 0.5);
    expect(label.text, `${tag}: label text`).to.eq(labelText);

    // no layout overflow
    expect(root.scrollWidth, `${tag}: root does not scroll horizontally`).to.be.lte(root.clientWidth);
    expect(root.scrollHeight, `${tag}: root does not scroll vertically`).to.be.lte(root.clientHeight);
    within(label, root, `${tag}: label`);
    within(barCont, root, `${tag}: bar container`);
    within(track, root, `${tag}: track`);
    if (b.fill) {
      within(b.fill, track, `${tag}: fill`);
      expect(b.fill.width, `${tag}: fill = progress% of the track`).to.be.closeTo((track.width * progress) / 100, PX);
    }

    if (alignment === T.alignTop) {
      expect(root.flexDirection, `${tag}: column`).to.eq("column");
      // label sits in the upper half, the bar starts right below it and spans the root
      near(label.bottom, root.top + root.height / 2, `${tag}: label ends at mid-height`);
      expect(track.top, `${tag}: bar below the label`).to.be.gte(label.bottom - PX);
      near(track.left, root.left, `${tag}: bar starts at the left edge`);
      near(track.right, root.right, `${tag}: bar ends at the right edge`);
      if (direction === T.directionRight) near(label.right, root.right, `${tag}: label right-aligned`);
      else near(label.left, root.left, `${tag}: label left-aligned`);
    } else {
      const rowDir = direction === T.directionRight ? "row-reverse" : "row";
      expect(root.flexDirection, `${tag}: ${rowDir}`).to.eq(rowDir);
      // label and bar side by side, never overlapping, together spanning the root
      if (direction === T.directionRight) {
        near(label.right, root.right, `${tag}: label at the right edge`);
        near(barCont.left, root.left, `${tag}: bar at the left edge`);
        expect(barCont.right, `${tag}: bar ends before the label`).to.be.lte(label.left + PX);
      } else {
        near(label.left, root.left, `${tag}: label at the left edge`);
        near(barCont.right, root.right, `${tag}: bar at the right edge`);
        expect(barCont.left, `${tag}: bar starts after the label`).to.be.gte(label.right - PX);
      }
      near(track.width, barCont.width, `${tag}: track fills the bar container`);
      near(label.width + barCont.width, root.width, `${tag}: label + bar span the root`);
      near(track.top + track.height / 2, root.top + root.height / 2, `${tag}: bar vertically centred`);
      near(label.top + label.height / 2, root.top + root.height / 2, `${tag}: label vertically centred`);
    }
  });
};

/**
 * @tjBlock  styles
 * @tjUsage  loadingStripFrames('pb1', [0, 750, 1499]).then((f) => expect(f.frames[0].strip.right).to.be.lte(f.frames[0].track.left))
 * @tjDom    the strip's running CSS animation (element.getAnimations()[0]): returns { name, keyframes:[{offset,left}],
 *           duration, iterations (Infinity), easing per keyframe, frames:[{ t, strip, track }] } where each frame is
 *           read after pausing and seeking currentTime to t; the animation is resumed afterwards. Plain objects only.
 */
export const loadingStripFrames = (name, times) =>
  cy.get(`[data-cy="draggable-widget-${name}"] [data-cy="${name}"]`).first().then(($root) => {
    const root = $root[0];
    const track = root.lastElementChild.firstElementChild;
    const strip = track.firstElementChild.firstElementChild;
    expect(strip, `${name}: loading strip`).to.exist;
    const anim = strip.getAnimations()[0];
    expect(anim, `${name}: strip animation running`).to.exist;
    const rect = (el) => {
      const r = el.getBoundingClientRect();
      return { left: r.left, right: r.right, top: r.top, bottom: r.bottom, width: r.width, height: r.height };
    };
    const timing = anim.effect.getTiming();
    const playState = anim.playState;
    anim.pause();
    const frames = times.map((t) => {
      anim.currentTime = t;
      return { t, strip: rect(strip), track: rect(track) };
    });
    anim.play();
    return {
      name: anim.animationName,
      playState,
      keyframes: anim.effect.getKeyframes().map((k) => ({ offset: k.offset, left: k.left, easing: k.easing })),
      duration: timing.duration,
      iterations: timing.iterations,
      frames,
    };
  });

/**
 * @tjBlock  styles
 * @tjUsage  stripLeftOverTime('pb1', 300).then(([a, b]) => expect(a).to.not.eq(b))
 * @tjDom    reads the live (unpaused) strip's left edge twice, `gapMs` apart — proves the keyframes actually run
 */
export const stripLeftOverTime = (name, gapMs = 300) => {
  const sel = `[data-cy="draggable-widget-${name}"] [data-cy="${name}"]`;
  const read = ($root) => $root[0].lastElementChild.firstElementChild.firstElementChild.firstElementChild.getBoundingClientRect().left;
  return cy.get(sel).first().then(($r1) => {
    const a = read($r1);
    // eslint-disable-next-line cypress/no-unnecessary-waiting
    cy.wait(gapMs);
    return cy.get(sel).first().then(($r2) => [a, read($r2)]);
  });
};
