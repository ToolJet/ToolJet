/**
 * The editor's canvas interaction engine: selecting, moving, resizing and marquee-selecting components, and placing
 * new ones dragged in from the components panel.
 *
 * One pointer gesture at a time, as an explicit state machine:
 *
 *   idle ──press──▶ pressed ──moves past 3px──▶ translate | resize | brush ──release──▶ commit
 *                     │                                    └──Esc / pointer cancel──▶ cancel
 *                     └──release without moving──▶ click (select / toggle / open the inspector)
 *
 * During a gesture nothing is saved and nothing re-renders: the engine measures the canvases once per animation
 * frame, works out with `geometry` and `rules` exactly where the components would land, and draws that (a ghost on
 * the landing cells, the target canvas outlined, a resized component at its snapped size). On release it saves that
 * same result through `setComponentLayout`, one undo step per gesture. Layout data is never stored in px, so old and
 * imported apps behave the same.
 */
import { toast } from 'react-hot-toast';
import useStore from '@/AppBuilder/_stores/store';
import useTransientStore from '@/AppBuilder/_stores/transientStore';
import { useGridStore } from '@/_stores/gridStore';
import { RIGHT_SIDE_BAR_TAB } from '@/AppBuilder/RightSideBar/rightSidebarConstants';
import {
  computeFlexInsertIndex,
  createDefaultFlexChildLayout,
  getEffectiveFlexDirectionForFlexContainer,
  getOrderedFlexChildrenFromSnapshot,
} from '@/AppBuilder/Widgets/FlexContainer/flexContainer.utils';
import {
  ROW,
  boundingBox,
  canvasBounds,
  convertWidth,
  handleAxes,
  landAt,
  pastThreshold,
  rectFromPoints,
  intersects,
  pushedInto,
  velocityOf,
  within,
  resizeBox,
  resizeGroup,
  COLUMNS,
  columnEdge,
  columnSpan,
} from './geometry';
import { ancestorsOfSlot, canDrop, enclosingModal, parentOfSlot } from './rules';
import {
  PAGE_CANVAS,
  canvasAt,
  canvasOfComponent,
  componentOfCanvas,
  nextCanvas,
  columnWidthOf,
  componentElement,
  contentHeight,
  contentOrigin,
  layerOf,
  pressStartsMove,
  scrollersAbove,
  visibleArea,
  visibleRect,
  slotOfCanvas,
} from './dom';
import { flexResizeStyles, flexResizePatch } from './flex';
import { findHighestLevelofSelection } from '../selection';

// A moved box scrolls once its edge reaches a scroller's edge, harder the further past it goes (full at this far).
// Other drags (resize, marquee, panel drops) scroll with the pointer this far inside the edge (less in a small one).
const AUTOSCROLL_PAST_PX = 80;
const AUTOSCROLL_EDGE_PX = 40;
const AUTOSCROLL_EDGE_SHARE = 0.15;
// Px per second by elapsed time, the same on every display; it starts at about a third and is full after the ramp.
const AUTOSCROLL_MAX_PX_PER_S = 900;
const AUTOSCROLL_RAMP_START = 0.35;
// A moved box touching an edge already scrolls at this share of its pull, so it never sinks out of sight first.
const AUTOSCROLL_TOUCH_SHARE = 0.3;
const AUTOSCROLL_MAX_STEP_MS = 50;
const AUTOSCROLL_RAMP_MS = 800;
// How far past the page's edge the pointer may go and keep it scrolling.
const AUTOSCROLL_OVERSHOOT_PX = 160;
// A container's canvas scrolls only once a drag has stayed at its edge this long, so passing through doesn't; a
// pointer slower than AUTOSCROLL_SLOW_PX_PER_MS isn't passing through, and doesn't wait.
const AUTOSCROLL_DWELL_MS = 450;
const AUTOSCROLL_SLOW_PX_PER_MS = 0.4;
// The moved box's edge counts once the box has moved this far towards it.
const AUTOSCROLL_LEAD_MIN_PX = 8;
// The point of a moved box that picks its canvas: its top-left corner, this far inside it (off the grid line).
const PROBE_INSET_PX = 4;
// A move switches between a container's own canvases, or leaves one that is scrolling, only with a flick this fast
// (its velocity measured over the last FLICK_WINDOW_MS); after a flick it stays in the container until
// the box is this far out of it.
const FLICK_PX_PER_MS = 0.9;
const FLICK_WINDOW_MS = 50;
const FLICK_REACH_PX = 160;
// A flick reaches the next canvas only from this close to it, so a quick move across a big canvas isn't one.
const FLICK_NEAR_PX = 64;
// On each auto-scroll step the ghosts ride with the content and hop back into place over this long.
const GHOST_HOP_MS = 90;
const PAGE_GROWTH_PX = 200;
// The page keeps a drag's extra room this long after a drop, until it has grown around what was placed.
const PAGE_SHRINK_DELAY_MS = 600;
const SVG_NS = 'http://www.w3.org/2000/svg';

const AUTO_LAYOUT_LOCKED = "Can't move components while auto layout is on";

// The area of an element as it shows.
const areaOf = (el) => {
  const r = el.getBoundingClientRect();
  return r.width * r.height;
};

// Auto-scroll strength, eased: for a distance `inside` an edge (0 outside the zone, 1 at the edge), and for a moved
// box's distance `past` it (AUTOSCROLL_TOUCH_SHARE once it touches, 1 at AUTOSCROLL_PAST_PX).
const pull = (inside, zone) => Math.min(1, Math.max(0, 1 - inside / zone)) ** 2;
const past = (distance) =>
  distance <= 0
    ? 0
    : AUTOSCROLL_TOUCH_SHARE + (1 - AUTOSCROLL_TOUCH_SHARE) * Math.min(1, distance / AUTOSCROLL_PAST_PX) ** 2;

// WidgetWrapper marks a dynamic-height component's box; its frame, ghost and guides are purple.
const isDynamicHeight = (el) => el.classList.contains('dynamic-height-target');

export class CanvasEngine {
  constructor(root, { moduleId = PAGE_CANVAS, isModuleEditor = false } = {}) {
    this.root = root;
    this.moduleId = moduleId;
    this.isModuleEditor = isModuleEditor;
    this.press = null;
    this.gesture = null;
    this.insert = null;
    this.point = null;
    this.frame = 0;
    this.ghosts = [];
    // Per scroller: when a drag reached its edge, and the scroll still owed (see autoscroll).
    this.edgeSince = new Map();
    this.scrollCarry = new Map();
    // Keeps scrolling while the drag stays near its edge, even when the target moves to a slot beside it; and which
    // way (-1 up, 1 down).
    this.activeScroller = null;
    this.activeDirection = 0;
    // Auto-scroll feedback: the last step's scroller and px (the ghosts hop), and the edge glows.
    this.scrollStep = null;
    this.glows = null;
    // The pointer's recent positions, for flicks (see pointerVelocity); the canvas refusing the move under it.
    this.moves = [];
    this.refusingCanvas = null;
    // Where ghosts glide over a canvas that refuses the move (see showGlidingGhosts).
    this.gliding = null;
    this.guides = [];
    this.siblingEdges = new Map();
    this.targetCanvas = null;
    this.grid = null;
    this.grownCanvas = null;
    this.swallowRelease = false;
    this.scrolledAt = 0;
  }

  attach() {
    this.root.addEventListener('pointerdown', this.onPointerDown, true);
    this.root.addEventListener('pointerover', this.onPointerOver);
    this.root.addEventListener('pointerleave', this.onPointerLeave);
    this.root.addEventListener('dragstart', this.onDragStart, true);
    window.addEventListener('keydown', this.onKeyDown, true);
    window.addEventListener('mouseup', this.onReleaseEvent, true);
    window.addEventListener('click', this.onReleaseEvent, true);
  }

  detach() {
    this.cancel();
    this.endInsert();
    this.gliding?.remove();
    this.root.removeEventListener('pointerdown', this.onPointerDown, true);
    this.root.removeEventListener('pointerover', this.onPointerOver);
    this.root.removeEventListener('pointerleave', this.onPointerLeave);
    this.root.removeEventListener('dragstart', this.onDragStart, true);
    window.removeEventListener('keydown', this.onKeyDown, true);
    window.removeEventListener('mouseup', this.onReleaseEvent, true);
    window.removeEventListener('click', this.onReleaseEvent, true);
  }

  // ── Store facts ────────────────────────────────────────────────────────────────────────────────────────────────

  get store() {
    return useStore.getState();
  }

  components() {
    return this.store.getCurrentPageComponents(this.moduleId) ?? {};
  }

  /** id → { type, parent } for `rules`. */
  ruleComponents() {
    const components = this.components();
    const result = {};
    for (const id of Object.keys(components)) {
      result[id] = { type: components[id]?.component?.component, parent: components[id]?.component?.parent ?? null };
    }
    return result;
  }

  isEditing() {
    return this.store.modeStore?.modules?.[this.moduleId]?.currentMode === 'edit';
  }

  isFrozen() {
    return this.store.getShouldFreeze(false, this.isModuleEditor);
  }

  isAutoLayoutLocked() {
    return this.store.currentLayout === 'mobile' && this.store.getIsAutoMobileLayout(this.moduleId);
  }

  /** The selected components that move together: those on the topmost selected canvas (selection.js). */
  selectionGroup() {
    const components = this.components();
    return findHighestLevelofSelection(
      this.store.selectedComponents.filter((id) => components[id]).map((id) => ({ ...components[id], id }))
    ).map(({ id }) => id);
  }

  insideModule(canvasEl) {
    return !this.isModuleEditor && !!canvasEl.closest('[component-type="ModuleContainer"]');
  }

  /**
   * How far down a canvas reaches for a gesture. The page canvas: to the page footer, if any (it grows otherwise).
   * A canvas that doesn't scroll (header/footer slots …), a Listview row, or a tab being resized into: its visible
   * height, so nothing is placed where it can't be seen.
   */
  boundsOf(canvasEl, slot, forResize = false) {
    if (slot === PAGE_CANVAS) {
      const footer = this.root.querySelector('[component-id="canvas-footer"]');
      if (!footer) return canvasBounds();
      return canvasBounds(footer.getBoundingClientRect().top - contentOrigin(canvasEl).y);
    }
    const ownerType = canvasEl.getAttribute('component-type');
    const scrolls = /(auto|scroll)/.test(window.getComputedStyle(canvasEl).overflowY);
    if (!scrolls || ownerType === 'Listview' || (forResize && ownerType === 'Tabs')) {
      return canvasBounds(contentHeight(canvasEl));
    }
    return canvasBounds();
  }

  // ── Hover ──────────────────────────────────────────────────────────────────────────────────────────────────────

  /**
   * The hovered component is the innermost one under the pointer, re-read whenever the element under the pointer
   * changes. (Per-component mouseenter/mouseleave missed moving from a child onto its parent's empty area: the
   * child's leave cleared the hover and the parent, never left, got no new enter.)
   */
  setHovered(target) {
    const el = target?.closest?.('.moveable-box');
    const id =
      el && this.root.contains(el) && el.getAttribute('component-type') !== 'ModuleContainer'
        ? el.getAttribute('widgetid')
        : '';
    const transient = useTransientStore.getState();
    if (transient.hoveredComponentForGrid !== id) transient.setHoveredComponentForGrid(id);
  }

  onPointerOver = (e) => {
    if (!this.gesture) this.setHovered(e.target);
  };

  onPointerLeave = () => {
    if (!this.gesture) this.setHovered(null);
  };

  // ── Pointer input ──────────────────────────────────────────────────────────────────────────────────────────────

  onPointerDown = (e) => {
    if (e.button !== 0 || this.press || this.gesture || !this.isEditing()) return;
    const target = e.target;

    const handle = target.closest('[data-tj-handle]');
    if (handle && this.root.contains(handle)) {
      e.preventDefault();
      e.stopPropagation();
      const group = handle.hasAttribute('data-tj-group');
      this.beginPress(e, {
        kind: 'resize',
        handle: handle.dataset.tjHandle,
        group,
        componentEl: handle.closest('.moveable-box'),
      });
      return;
    }

    if (target.closest('.tj-group-frame-grip')) {
      this.beginPress(e, { kind: 'move-group' });
      return;
    }

    const componentEl = target.closest('.moveable-box');
    if (componentEl && this.root.contains(componentEl)) {
      // The config handle's buttons (inspect, delete, …) are buttons, not a place to grab the component.
      if (
        target.closest('.delete-icon') ||
        (target.closest('.config-handle-button') && !target.closest('.component-name-btn'))
      ) {
        return;
      }
      const id = componentEl.getAttribute('widgetid');
      if (e.shiftKey) {
        // Shift: toggle on click; drag a marquee, from a container's empty body inside it, otherwise beside it.
        const onEmptyBody = target.classList.contains('real-canvas') || target.classList.contains('rm-container');
        const brushCanvas = onEmptyBody ? target.closest('.real-canvas') : canvasOfComponent(componentEl);
        this.beginPress(e, { kind: 'shift-component', id, brushCanvas });
        return;
      }
      const { selectedComponents, setSelectedComponents } = this.store;
      const inMultiSelection = selectedComponents.length > 1 && selectedComponents.includes(id);
      if (!selectedComponents.includes(id)) setSelectedComponents([id]);
      const ownGesture = !pressStartsMove(target, componentEl, componentEl.getAttribute('component-type'));
      this.beginPress(e, {
        kind: 'component',
        id,
        movable: !ownGesture && !this.isFrozen(),
        inMultiSelection,
        ownGesture,
      });
      return;
    }

    const canvasEl = target.closest('.real-canvas');
    if (canvasEl && this.root.contains(canvasEl)) this.beginPress(e, { kind: 'canvas', brushCanvas: canvasEl });
  };

  beginPress(e, press) {
    this.press = { ...press, pointerId: e.pointerId, start: { x: e.clientX, y: e.clientY } };
    this.point = this.press.start;
    this.moves = [{ t: e.timeStamp, x: e.clientX, y: e.clientY }];
    window.addEventListener('pointermove', this.onPointerMove, true);
    window.addEventListener('pointerup', this.onPointerUp, true);
    window.addEventListener('pointercancel', this.onPointerCancel, true);
  }

  /** Stops following the pointer. On release the browser drops the capture itself, after the mouseup and click. */
  endPress({ releaseCapture = false } = {}) {
    window.removeEventListener('pointermove', this.onPointerMove, true);
    window.removeEventListener('pointerup', this.onPointerUp, true);
    window.removeEventListener('pointercancel', this.onPointerCancel, true);
    if (this.press && releaseCapture) {
      try {
        if (this.root.hasPointerCapture(this.press.pointerId)) this.root.releasePointerCapture(this.press.pointerId);
      } catch {
        // already released
      }
    }
    this.press = null;
  }

  onPointerMove = (e) => {
    if (!this.press || e.pointerId !== this.press.pointerId) return;
    this.moves.push({ t: e.timeStamp, x: e.clientX, y: e.clientY });
    while (e.timeStamp - this.moves[0].t > FLICK_WINDOW_MS) this.moves.shift();
    this.point = { x: e.clientX, y: e.clientY };
    if (!this.gesture) {
      if (!pastThreshold(this.press.start, this.point)) return;
      this.gesture = this.startGesture(this.press);
      if (!this.gesture) {
        // A press that doesn't become a gesture (inside a table, on a frozen version …) belongs to the component.
        this.endPress();
        return;
      }
      try {
        this.root.setPointerCapture(this.press.pointerId);
      } catch {
        // the pointer is gone; the next event ends the press
      }
      document.body.classList.add('tj-canvas-gesture');
      window.getSelection()?.removeAllRanges();
    }
    e.preventDefault();
    this.schedule();
  };

  onPointerUp = (e) => {
    if (!this.press || e.pointerId !== this.press.pointerId) return;
    const press = this.press;
    if (this.gesture) {
      this.flush();
      this.finish(true);
    } else {
      this.endPress();
      this.click(press);
    }
  };

  // Pressing on an image or link inside a component would start the browser's own drag, which cancels the pointer and
  // with it the move. Presses a component handles itself (ownGesture) keep their native drag.
  onDragStart = (e) => {
    if (this.press && !this.press.ownGesture) e.preventDefault();
  };

  onPointerCancel = (e) => {
    if (!this.press || e.pointerId !== this.press.pointerId) return;
    this.cancel();
  };

  onKeyDown = (e) => {
    if (e.key !== 'Escape' || !this.gesture) return;
    e.preventDefault();
    e.stopPropagation();
    this.cancel();
  };

  /**
   * The mouseup and click that follow a gesture's release are part of the gesture, not a click on what is under it
   * (the canvas clears the selection on a mouseup over its empty area).
   */
  onReleaseEvent = (e) => {
    if (!this.swallowRelease) return;
    if (e.type === 'click') this.swallowRelease = false;
    e.preventDefault();
    e.stopPropagation();
  };

  click(press) {
    const { selectedComponents, setSelectedComponents } = this.store;
    if (press.kind === 'shift-component') {
      setSelectedComponents(
        selectedComponents.includes(press.id)
          ? selectedComponents.filter((id) => id !== press.id)
          : [...selectedComponents, press.id]
      );
    } else if (press.kind === 'component') {
      if (press.inMultiSelection) setSelectedComponents([press.id]);
      if (!press.ownGesture) {
        this.store.setActiveRightSideBarTab(RIGHT_SIDE_BAR_TAB.CONFIGURATION);
        this.store.setRightSidebarOpen(true);
      }
    }
  }

  startGesture(press) {
    switch (press.kind) {
      case 'resize':
        return this.startResize(press);
      case 'move-group':
        return this.startTranslate(this.selectionGroup(), null);
      case 'component': {
        if (!press.movable) return null;
        const selection = this.store.selectedComponents;
        const group = selection.length > 1 && selection.includes(press.id) ? this.selectionGroup() : [press.id];
        return this.startTranslate(group.includes(press.id) ? group : [press.id], press.id);
      }
      case 'shift-component':
        return press.brushCanvas ? this.startBrush(press.brushCanvas, true) : null;
      case 'canvas':
        return this.startBrush(press.brushCanvas, false);
      default:
        return null;
    }
  }

  // ── Frames ─────────────────────────────────────────────────────────────────────────────────────────────────────

  schedule() {
    if (this.frame) return;
    this.frame = requestAnimationFrame(() => {
      this.frame = 0;
      this.render();
    });
  }

  flush() {
    if (!this.frame) return;
    cancelAnimationFrame(this.frame);
    this.frame = 0;
    this.render();
  }

  render() {
    const g = this.gesture;
    if (!g) return;
    // Scroll first, at the edge of the canvas the drag was on, so a canvas that starts scrolling keeps a move (see
    // renderTranslate); everything is measured live, so drawing then just follows.
    const carried = g.kind === 'translate' ? this.carriedRect(g) : null;
    const scrolling = this.autoscroll(g.scrollFrom ?? g.canvasEl, this.point, carried);
    if (g.kind === 'translate') this.renderTranslate(g);
    else if (g.kind === 'resize') this.renderResize(g);
    else if (g.kind === 'brush') this.renderBrush(g);
    if (this.scrollStep) this.hopGhosts();
    if (g.kind === 'translate') this.showScrollGlows(g);
    if (scrolling) this.schedule();
  }

  /** Ghosts ride a scroll step with the content, then hop back into place: the canvas visibly moves under them. */
  hopGhosts() {
    const { scroller, dy } = this.scrollStep;
    this.scrollStep = null;
    if (!dy || window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
    for (const ghost of this.ghosts) {
      if (!scroller.contains(ghost)) continue;
      // `translate`, not `transform`: that is the ghost's position.
      ghost.animate([{ translate: `0 ${-dy}px` }, { translate: '0 0' }], {
        duration: GHOST_HOP_MS,
        easing: 'ease-out',
      });
    }
  }

  /**
   * Faint glows on the top and bottom of what shows of the scroller a move is in, where it can scroll further: per
   * edge, the innermost scroller around the move that can scroll that way with that edge showing.
   */
  showScrollGlows(g) {
    this.glows ??= ['top', 'bottom'].map((side) => {
      const glow = document.createElement('div');
      glow.className = `tj-scroll-glow tj-scroll-glow-${side}`;
      document.body.appendChild(glow);
      return glow;
    });
    const scrollers = g.canvasEl?.isConnected ? scrollersAbove(g.canvasEl, this.root) : [];
    // The canvas scrolling this way keeps its glow (its content grows only as the ghost moves on, so between steps
    // it can look as if it had reached its end); else the innermost one that can scroll this way.
    const active = this.activeScroller?.isConnected ? this.activeScroller : null;
    const rects = new Map();
    const rectOf = (sc) => rects.get(sc) ?? rects.set(sc, visibleRect(sc, this.root)).get(sc);
    const place = (glow, edge, canScroll) => {
      const showing = (sc) => !rectOf(sc).hidden[edge];
      const scrolling = active && this.activeDirection === (edge === 'top' ? -1 : 1) && showing(active) ? active : null;
      const scroller = scrolling ?? scrollers.find((sc) => canScroll(sc) && showing(sc));
      glow.classList.toggle('is-on', !!scroller);
      if (!scroller) return;
      const r = rectOf(scroller);
      glow.style.left = `${r.left}px`;
      glow.style.width = `${r.width}px`;
      glow.style.top = `${r[edge]}px`;
    };
    const [top, bottom] = this.glows;
    place(top, 'top', (sc) => sc.scrollTop > 0);
    place(bottom, 'bottom', (sc) => sc.scrollTop + sc.clientHeight < sc.scrollHeight - 1);
  }

  /** Forgets where auto-scroll stood: at the end of a gesture or a panel drag. */
  resetAutoscroll() {
    this.edgeSince.clear();
    this.scrollCarry.clear();
    this.activeScroller = null;
    this.activeDirection = 0;
    this.scrollStep = null;
    this.scrolledAt = 0;
  }

  /** The moved components' box as the user carries it now (viewport px), and how far it has moved. */
  carriedRect(g) {
    const dx = this.point.x - this.press.start.x;
    const dy = this.point.y - this.press.start.y;
    const r = g.startRect;
    return { left: r.left + dx, right: r.right + dx, top: r.top + dy, bottom: r.bottom + dy, dx, dy };
  }

  /**
   * Scrolls the innermost scroller around `fromEl` whose edge the drag has reached, by whole grid rows. Speed grows
   * with how far past the edge the moved box is (the pointer, for other drags) and with time there. Returns whether
   * to draw again.
   */
  autoscroll(fromEl, point, carried) {
    if (!fromEl || !point) return false;
    const now = performance.now();
    const elapsed = this.scrolledAt ? Math.min(AUTOSCROLL_MAX_STEP_MS, now - this.scrolledAt) : 16;
    this.scrolledAt = now;
    const scrollers = scrollersAbove(fromEl, this.root);
    const active = this.activeScroller;
    if (active?.isConnected && !scrollers.includes(active)) {
      const outer = scrollers.findIndex((sc) => sc.contains(active));
      scrollers.splice(outer < 0 ? scrollers.length : outer, 0, active);
    }
    const v = this.pointerVelocity();
    const slow = Math.hypot(v.x, v.y) < AUTOSCROLL_SLOW_PX_PER_MS;
    let wants = false;
    // While a container's canvas waits at its edge, the scrollers around it follow only the pointer.
    let waiting = false;
    for (const scroller of scrollers) {
      // What shows of it: an edge hidden beyond the canvas around it is reached by scrolling that one first.
      const r = visibleRect(scroller, this.root);
      const nested = scroller.closest('.moveable-box');
      const forget = () => {
        this.edgeSince.delete(scroller);
        this.scrollCarry.delete(scroller);
        if (this.activeScroller === scroller) this.activeScroller = null;
      };
      // The pointer may go past the edge and keep scrolling: the page's far, a container's up to full speed.
      const over = nested ? AUTOSCROLL_PAST_PX : AUTOSCROLL_OVERSHOOT_PX;
      if (!within(r, point, over)) {
        forget();
        continue;
      }
      // `inside`: the pointer's distance inside the edge, `edge` the box's, `moved` how far the box moved towards it.
      // A box that started past the edge (a tall container) counts how far it has moved instead.
      const side = (zone, inside, edge, moved) => {
        if (!carried) return pull(inside, zone);
        const byPointer = past(-inside);
        if (waiting || moved <= AUTOSCROLL_LEAD_MIN_PX) return byPointer;
        return Math.max(byPointer, past(edge + moved > 0 ? -edge : moved - AUTOSCROLL_LEAD_MIN_PX));
      };
      const axis = (lo, hi, size, at, from, to, moved) => {
        const zone = Math.min(AUTOSCROLL_EDGE_PX, size * AUTOSCROLL_EDGE_SHARE);
        const back = side(zone, at - lo, from - lo, -moved);
        const ahead = side(zone, hi - at, hi - to, moved);
        return back > ahead ? -back : ahead;
      };
      const vy = axis(r.top, r.bottom, r.height, point.y, carried?.top, carried?.bottom, carried?.dy ?? 0);
      const vx = axis(r.left, r.right, r.width, point.x, carried?.left, carried?.right, carried?.dx ?? 0);
      const canY =
        vy < 0
          ? !r.hidden.top && scroller.scrollTop > 0
          : !r.hidden.bottom && scroller.scrollTop + scroller.clientHeight < scroller.scrollHeight;
      // A component's canvas scrolls only up and down (what pokes out at its side doesn't scroll it); the page both ways.
      const canX =
        !nested &&
        (vx < 0
          ? !r.hidden.left && scroller.scrollLeft > 0
          : !r.hidden.right && scroller.scrollLeft + scroller.clientWidth < scroller.scrollWidth);
      if ((!vy || !canY) && (!vx || !canX)) {
        forget();
        continue;
      }
      if (!this.edgeSince.has(scroller)) this.edgeSince.set(scroller, now);
      const dwell = nested && !slow ? AUTOSCROLL_DWELL_MS : 0;
      const at = now - this.edgeSince.get(scroller) - dwell;
      this.activeScroller = scroller;
      this.activeDirection = canY ? Math.sign(vy) : 0;
      if (at < 0) {
        wants = true;
        waiting = true;
        continue;
      }
      const ramp = AUTOSCROLL_RAMP_START + (1 - AUTOSCROLL_RAMP_START) * Math.min(1, at / AUTOSCROLL_RAMP_MS);
      const step = (AUTOSCROLL_MAX_PX_PER_S * elapsed * ramp) / 1000;
      // The first row goes at once, so a box pushed against the edge doesn't sink out of sight first.
      const carry = this.scrollCarry.get(scroller) ?? { x: 0, y: canY ? Math.sign(vy) * (ROW - 0.01) : 0 };
      carry.y += canY ? vy * step : 0;
      carry.x += canX ? vx * step : 0;
      // Whole grid rows, landing on row lines, so it moves like a grid.
      const rows = Math.trunc(carry.y / ROW);
      const sx = Math.trunc(carry.x);
      carry.y -= rows * ROW;
      carry.x -= sx;
      this.scrollCarry.set(scroller, carry);
      if (rows) {
        const before = scroller.scrollTop;
        scroller.scrollTop = (Math.round(before / ROW) + rows) * ROW;
        this.scrollStep = { scroller, dy: scroller.scrollTop - before };
      }
      if (sx) scroller.scrollLeft += sx;
      wants = true;
      break;
    }
    return wants;
  }

  // ── Feedback: ghosts and the target canvas ─────────────────────────────────────────────────────────────────────

  /**
   * Draws `boxes` (grid units, `extra` px of label below the layout height, `dynamic` for a dynamic-height component,
   * drawn purple like its frame) on `canvasEl`'s grid.
   */
  showGhosts(canvasEl, boxes, column, blocked) {
    const layer = canvasEl && layerOf(canvasEl);
    while (this.ghosts.length > boxes.length) this.ghosts.pop().remove();
    boxes.forEach((box, i) => {
      let ghost = this.ghosts[i];
      if (!ghost) {
        ghost = document.createElement('div');
        ghost.className = 'tj-drop-ghost';
        this.ghosts[i] = ghost;
      }
      if (ghost.parentElement !== layer) layer.appendChild(ghost);
      ghost.classList.toggle('is-blocked', blocked);
      ghost.classList.toggle('is-dynamic-height', !!box.dynamic);
      // One px more than the box: its frame lies on the grid lines on both sides of it, like every frame here.
      const span = columnSpan(box.left, box.width, column);
      ghost.style.width = `${span.width + 1}px`;
      ghost.style.height = `${box.height + (box.extra ?? 0) + 1}px`;
      ghost.style.transform = `translate(${span.x}px, ${box.top}px)`;
    });
  }

  /**
   * Over a canvas that refuses the move: each ghost glides with its component, off the grid, drawn above the canvases
   * so no canvas's edge cuts it off. (The move still lands on the canvas it is on, at its edge.)
   */
  showGlidingGhosts(g) {
    this.clearGuides();
    const { dx, dy } = this.carriedRect(g);
    const layer = this.glidingLayer();
    while (this.ghosts.length > g.startRects.length) this.ghosts.pop().remove();
    g.startRects.forEach((r, i) => {
      const ghost = (this.ghosts[i] ??= document.createElement('div'));
      ghost.className = 'tj-drop-ghost';
      ghost.classList.toggle('is-dynamic-height', isDynamicHeight(g.members[i].el));
      if (ghost.parentElement !== layer) layer.appendChild(ghost);
      ghost.style.width = `${r.width}px`;
      ghost.style.height = `${r.height}px`;
      ghost.style.transform = `translate(${r.left + dx}px, ${r.top + dy}px)`;
    });
  }

  /** The layer above the canvases that gliding ghosts are drawn on (see showGlidingGhosts). */
  glidingLayer() {
    if (!this.gliding?.isConnected) {
      this.gliding = document.createElement('div');
      this.gliding.className = 'tj-gliding-layer';
      document.body.appendChild(this.gliding);
    }
    return this.gliding;
  }

  clearGhosts() {
    for (const ghost of this.ghosts) ghost.remove();
    this.ghosts = [];
    this.clearGuides();
  }

  /**
   * Edges of the components on a canvas (px from its content edge), other than `exclude`: measured once per canvas
   * per gesture, since they move only with the canvas.
   */
  edgesOn(canvasEl, exclude) {
    if (!this.siblingEdges.has(canvasEl)) {
      const origin = contentOrigin(canvasEl);
      const edges = Array.from(layerOf(canvasEl).children)
        .filter((el) => el.classList.contains('moveable-box') && !exclude.includes(el))
        .map((el) => el.getBoundingClientRect())
        .filter((r) => r.width >= 1 && r.height >= 1)
        .map((r) => ({
          left: Math.round(r.left - origin.x),
          right: Math.round(r.right - origin.x),
          top: Math.round(r.top - origin.y),
          bottom: Math.round(r.bottom - origin.y),
        }));
      this.siblingEdges.set(canvasEl, edges);
    }
    return this.siblingEdges.get(canvasEl);
  }

  /**
   * Alignment guides: a line along each edge of `boxes` (grid units, together) that lines up with an edge of another
   * component on the canvas, from one to the other. Edges are on whole-pixel column edges and rows, so lining up is
   * landing on the same grid line: guides show it, the grid already snaps to it.
   */
  showGuides(canvasEl, boxes, column, exclude) {
    const dynamic = boxes.length > 0 && boxes.every((b) => b.dynamic);
    const px = boxes.map((b) => {
      const span = columnSpan(b.left, b.width, column);
      return { left: span.x, right: span.x + span.width, top: b.top, bottom: b.top + b.height + (b.extra ?? 0) };
    });
    const box = {
      left: Math.min(...px.map((b) => b.left)),
      right: Math.max(...px.map((b) => b.right)),
      top: Math.min(...px.map((b) => b.top)),
      bottom: Math.max(...px.map((b) => b.bottom)),
    };
    const others = this.edgesOn(canvasEl, exclude);
    const lines = [];
    const along = (vertical, at) => {
      const [a, b] = vertical ? ['left', 'right'] : ['top', 'bottom'];
      const [from, to] = vertical ? ['top', 'bottom'] : ['left', 'right'];
      const hits = others.filter((o) => o[a] === at || o[b] === at);
      if (!hits.length || lines.some((l) => l.vertical === vertical && l.at === at)) return;
      lines.push({
        vertical,
        at,
        from: Math.min(box[from], ...hits.map((o) => o[from])),
        to: Math.max(box[to], ...hits.map((o) => o[to])),
      });
    };
    along(true, box.left);
    along(true, box.right);
    along(false, box.top);
    along(false, box.bottom);

    // The parent's centre lines: vertical when the box is centred exactly, horizontal when as close as the rows allow
    // (not on the page, which grows as components are added).
    const width = columnEdge(COLUMNS, column);
    const height = contentHeight(canvasEl);
    const centre = (vertical, at, from, to) => {
      const same = lines.find((l) => l.vertical === vertical && l.at === at);
      if (same) Object.assign(same, { from: Math.min(same.from, from), to: Math.max(same.to, to) });
      else lines.push({ vertical, at, from, to });
    };
    if (Math.abs((box.left + box.right) / 2 - width / 2) <= 1) {
      centre(true, Math.round(width / 2), 0, Math.max(height, box.bottom));
    }
    if (
      slotOfCanvas(canvasEl, this.moduleId) !== PAGE_CANVAS &&
      Math.abs((box.top + box.bottom) / 2 - height / 2) <= ROW / 2
    ) {
      centre(false, Math.round(height / 2), 0, width);
    }

    const layer = layerOf(canvasEl);
    while (this.guides.length > lines.length) this.guides.pop().remove();
    lines.forEach((line, i) => {
      let guide = this.guides[i];
      if (!guide) {
        guide = document.createElement('div');
        guide.className = 'tj-guide';
        this.guides[i] = guide;
      }
      guide.classList.toggle('is-dynamic-height', dynamic);
      if (guide.parentElement !== layer) layer.appendChild(guide);
      const length = `${line.to - line.from + 1}px`;
      guide.style.width = line.vertical ? '1px' : length;
      guide.style.height = line.vertical ? length : '1px';
      guide.style.transform = line.vertical
        ? `translate(${line.at}px, ${line.from}px)`
        : `translate(${line.from}px, ${line.at}px)`;
    });
  }

  clearGuides() {
    for (const guide of this.guides) guide.remove();
    this.guides = [];
  }

  /** Marks the canvas a gesture targets: its grid, and its boundary in blue (red, with no grid, where it refuses). */
  setTargetCanvas(canvasEl, blocked = false) {
    if (this.targetCanvas && this.targetCanvas !== canvasEl) {
      this.targetCanvas.classList.remove('tj-drop-target', 'is-blocked');
    }
    this.targetCanvas = canvasEl;
    if (!canvasEl || blocked) this.grid?.remove();
    if (!canvasEl) return;
    canvasEl.classList.add('tj-drop-target');
    canvasEl.classList.toggle('is-blocked', blocked);
    if (!blocked) this.drawGrid(canvasEl);
  }

  /**
   * The target canvas's grid, drawn among its components on the same whole-pixel column edges they are drawn on
   * (a CSS background pattern rounds its fractional tiles its own way, and stays put while the canvas scrolls).
   * Lines 0 and 43 are the canvas's own edges, where its frame is drawn (interaction.scss).
   */
  drawGrid(canvasEl) {
    const column = columnWidthOf(canvasEl, slotOfCanvas(canvasEl, this.moduleId), this.moduleId);
    const width = columnEdge(COLUMNS, column) + 1;
    const height = Math.max(canvasEl.scrollHeight, canvasEl.clientHeight);
    const layer = layerOf(canvasEl);

    if (!this.grid) {
      this.grid = document.createElementNS(SVG_NS, 'svg');
      this.grid.setAttribute('class', 'tj-grid');
    }
    // First among the components, so it is drawn under them.
    if (this.grid.parentElement !== layer) layer.prepend(this.grid);

    const key = `${column}:${height}`;
    if (this.grid.dataset.key === key) return;
    this.grid.dataset.key = key;
    this.grid.setAttribute('width', width);
    this.grid.setAttribute('height', height);
    let path = '';
    for (let c = 1; c < COLUMNS; c++) path += `M${columnEdge(c, column) + 0.5} 0V${height}`;
    for (let y = ROW; y < height; y += ROW) path += `M0 ${y + 0.5}H${width}`;
    this.grid.innerHTML = `<path d="${path}" />`;
  }

  /** Lets the page canvas grow while something is dragged below its end, so it can be scrolled to. */
  growPageCanvas(canvasEl, bottom) {
    if (this.grownCanvas && this.grownCanvas !== canvasEl) this.shrinkPageCanvas();
    if (bottom + PAGE_GROWTH_PX / 2 <= contentHeight(canvasEl) && this.grownCanvas !== canvasEl) return;
    this.grownCanvas = canvasEl;
    canvasEl.style.minHeight = `${Math.max(parseFloat(canvasEl.style.minHeight) || 0, bottom + PAGE_GROWTH_PX)}px`;
  }

  shrinkPageCanvas() {
    if (!this.grownCanvas) return;
    this.grownCanvas.style.minHeight = '';
    this.grownCanvas = null;
  }

  publishFlexTarget(flexContainerId, point, excludeId = null) {
    const current = this.store.flexContainerDropTarget;
    if (!flexContainerId) {
      if (current) this.store.setFlexContainerDropTarget(null);
      return null;
    }
    const direction = getEffectiveFlexDirectionForFlexContainer(
      this.store.getResolvedComponent,
      flexContainerId,
      this.moduleId
    );
    const index = computeFlexInsertIndex(flexContainerId, point.x, point.y, direction, excludeId);
    if (current?.flexContainerId !== flexContainerId || current?.index !== index) {
      this.store.setFlexContainerDropTarget({ flexContainerId, index });
    }
    return index;
  }

  /**
   * The canvas a move goes to, given `found`, the one under its probe. Within a container's own canvases (body,
   * header, footer) a move goes into a bigger one by position, and into a smaller one on a push (geometry's pushedInto) or a
   * flick, to the next one in its direction that takes it, once per flick. After a flick it stays in the container
   * until the box is clearly out of it or over another component. A canvas that is scrolling keeps it until a flick.
   * A canvas that refuses the move never takes it.
   */
  chooseCanvas(g, found, probe) {
    const current = g.canvasEl;
    const chosen = this.pickCanvas(g, found, probe);
    // A canvas that refuses the move never takes it: it shows a red haze, and the move stays where it is.
    const refused = !!chosen && chosen !== current && !!current?.isConnected && !this.dropVerdict(g, chosen).ok;
    this.markRefusing(refused ? chosen : null);
    return refused ? current : chosen;
  }

  /** The canvas the rules above pick for a move, before refusals. */
  pickCanvas(g, found, probe) {
    // From the first frame, the canvas the move started on: a flick straight from a press counts too.
    const current = g.canvasEl;
    const owner = current?.isConnected && componentOfCanvas(current);
    if (!owner) return found;
    const v = this.pointerVelocity();
    const flick = Math.hypot(v.x, v.y) > FLICK_PX_PER_MS;
    if (!flick) g.flickUsed = false;
    const home = found === current;
    const sibling = !home && !!found && componentOfCanvas(found) === owner;
    // Over another component's canvas, or one inside this container: that is where the move goes.
    if (!home && !sibling && found && !found.contains(current)) return found;
    if (flick && !g.flickUsed) {
      const next = nextCanvas(current, v, (canvas) => this.dropVerdict(g, canvas).ok);
      g.flickUsed = true;
      g.heldIn = owner;
      if (next && within(next.getBoundingClientRect(), probe, FLICK_NEAR_PX)) return next;
    }
    if (home || (!flick && this.activeScroller === current)) return current;
    // Into a bigger canvas of the container (header to body) by position; into a smaller one on a flick or a push.
    if (sibling) {
      const bigger = areaOf(found) > areaOf(current);
      return bigger || flick || pushedInto(found.getBoundingClientRect(), current.getBoundingClientRect(), probe)
        ? found
        : current;
    }
    // Off the container's edge onto what encloses it (the page, a parent): after a flick, which overshoots, stays
    // unless clearly out.
    if (g.heldIn === owner && within(owner.getBoundingClientRect(), probe, FLICK_REACH_PX)) return current;
    g.heldIn = null;
    return found;
  }

  /** Puts the red haze on `canvasEl`, the canvas refusing the move under it (none: null). */
  markRefusing(canvasEl) {
    if (this.refusingCanvas === canvasEl) return;
    this.refusingCanvas?.classList.remove('tj-refusing');
    canvasEl?.classList.add('tj-refusing');
    this.refusingCanvas = canvasEl;
  }

  /** The pointer's velocity over its last FLICK_WINDOW_MS, in px per ms; zero once it has rested that long. */
  pointerVelocity() {
    const last = this.moves[this.moves.length - 1];
    return last && performance.now() - last.t <= FLICK_WINDOW_MS ? velocityOf(this.moves) : { x: 0, y: 0 };
  }

  /** Whether the moved components may go into `canvasEl` (`rules`), and why not. */
  dropVerdict(g, canvasEl) {
    return canDrop({
      dragged: g.members.map(({ id, type }) => ({ id, type })),
      slotId: slotOfCanvas(canvasEl, this.moduleId),
      components: g.rules,
      isModuleEditor: this.isModuleEditor,
      insideModule: this.insideModule(canvasEl),
    });
  }

  /** Where the drag lands: a canvas under the point that may take it, or the source canvas for a modal's content. */
  landingCanvas(point, exclude, sourceSlot, rules) {
    let canvasEl = canvasAt(this.root, point, exclude);
    const modal = sourceSlot && enclosingModal(sourceSlot, rules);
    if (modal) {
      const slot = canvasEl && slotOfCanvas(canvasEl, this.moduleId);
      if (!slot || !ancestorsOfSlot(slot, rules).includes(modal)) canvasEl = canvasOfComponent(exclude[0]);
    }
    return canvasEl;
  }

  // ── Translate ──────────────────────────────────────────────────────────────────────────────────────────────────

  /**
   * The components a gesture acts on, as they are drawn now, all on the canvas of the first one. `box` is the grid
   * box with `top` where the component is drawn (a dynamic-height reflow can draw it below its saved top), `extra`
   * the px drawn below its layout height (a top-aligned label).
   */
  measure(ids) {
    const components = this.components();
    const layoutKey = this.store.currentLayout;
    const elements = ids.map((id) => componentElement(this.root, id));
    const canvasEl = elements.find(Boolean) && canvasOfComponent(elements.find(Boolean));
    if (!canvasEl) return { members: [], canvasEl: null };
    const origin = contentOrigin(canvasEl);
    const members = ids
      .map((id, i) => {
        const el = elements[i];
        const layout = components[id]?.layouts?.[layoutKey];
        if (!el || !layout || canvasOfComponent(el) !== canvasEl) return null;
        const drawnTop = Math.max(0, Math.round(el.getBoundingClientRect().top - origin.y));
        return {
          id,
          el,
          type: components[id].component.component,
          layout,
          css: el.style.cssText,
          size: { width: el.offsetWidth, height: el.offsetHeight },
          box: { left: layout.left, top: drawnTop, width: layout.width, height: layout.height },
          extra: Math.max(0, el.offsetHeight - (layout.height ?? 0)),
        };
      })
      .filter(Boolean);
    return { members, canvasEl };
  }

  startTranslate(ids, primaryId) {
    if (this.isAutoLayoutLocked()) {
      toast(AUTO_LAYOUT_LOCKED, { id: 'mobile-auto-lock' });
      return null;
    }
    if (this.isFrozen()) return null;
    const { members, canvasEl: sourceCanvas } = this.measure(ids);
    if (!members.length) return null;
    const sourceSlot = slotOfCanvas(sourceCanvas, this.moduleId);
    const primary = members.find((m) => m.id === primaryId) ?? members[0];
    const rect = primary.el.getBoundingClientRect();

    if (members.length === 1) this.store.setDraggingComponentId(primary.id);
    else this.store.setIsGroupDragging(true);

    // The pointer is hidden while moving: the components' box, moved 1:1 with the pointer, is what the user carries.
    // Where it is — its top-left corner — decides the canvas it goes into; the ghost shows the exact cells it lands on.
    const rects = members.map((m) => m.el.getBoundingClientRect());
    const startRect = {
      left: Math.min(...rects.map((r) => r.left)),
      top: Math.min(...rects.map((r) => r.top)),
      right: Math.max(...rects.map((r) => r.right)),
      bottom: Math.max(...rects.map((r) => r.bottom)),
    };
    // The page's visible part, where the target is looked for.
    const view = visibleArea(sourceCanvas, this.root);
    document.body.classList.add('tj-canvas-moving');

    return {
      kind: 'translate',
      members,
      primary,
      startRect,
      startRects: rects,
      view,
      grab: { x: this.press.start.x - rect.left, y: this.press.start.y - rect.top },
      sourceCanvas,
      sourceSlot,
      sourceColumn: columnWidthOf(sourceCanvas, sourceSlot, this.moduleId),
      sourceIsFlex: sourceCanvas.classList.contains('flex-container-canvas'),
      rules: this.ruleComponents(),
      canvasEl: sourceCanvas,
      landing: null,
    };
  }

  renderTranslate(g) {
    const point = this.point;
    // The carried box's top-left corner (just inside it, off the grid line) picks the canvas, kept on screen.
    const carried = this.carriedRect(g);
    const { view } = g;
    const probe = {
      x: Math.min(view.right - 2, Math.max(view.left + 2, carried.left + PROBE_INSET_PX)),
      y: Math.min(view.bottom - 2, Math.max(view.top + 2, carried.top + PROBE_INSET_PX)),
    };
    const found = this.landingCanvas(
      probe,
      g.members.map((m) => m.el),
      g.sourceSlot,
      g.rules
    );
    const canvasEl = this.chooseCanvas(g, found, probe);
    if (!canvasEl) {
      g.landing = null;
      this.clearGhosts();
      this.setTargetCanvas(null);
      this.publishFlexTarget(null);
      return;
    }
    g.canvasEl = canvasEl;
    const slot = slotOfCanvas(canvasEl, this.moduleId);
    const verdict = this.dropVerdict(g, canvasEl);
    this.setTargetCanvas(canvasEl, !verdict.ok);

    if (canvasEl.classList.contains('flex-container-canvas')) {
      const index = verdict.ok ? this.publishFlexTarget(slot, probe, g.sourceIsFlex ? g.primary.id : null) : null;
      if (!verdict.ok) this.publishFlexTarget(null);
      this.clearGhosts();
      g.landing = { canvasEl, slot, verdict, flex: true, index };
      return;
    }
    this.publishFlexTarget(null);

    const column = columnWidthOf(canvasEl, slot, this.moduleId);
    const sameCanvas = canvasEl === g.sourceCanvas;
    const group = boundingBox(g.members.map((m) => m.box));
    // Each member relative to the group, in the target canvas's columns (same pixel size as now).
    const relative = g.members.map((m) => {
      if (g.sourceIsFlex) {
        return {
          left: 0,
          top: 0,
          width: Math.min(COLUMNS, Math.max(1, Math.round(m.el.offsetWidth / column))),
          height: m.layout.height ?? m.el.offsetHeight,
          extra: 0,
        };
      }
      const scale = sameCanvas ? 1 : g.sourceColumn / column;
      return {
        left: Math.round((m.box.left - group.left) * scale),
        top: m.box.top - group.top,
        width: sameCanvas ? m.box.width : convertWidth(m.box.width, g.sourceColumn, column),
        height: m.box.height,
        extra: m.extra,
      };
    });
    const groupSize = {
      width: Math.max(...relative.map((r) => r.left + r.width)),
      height: Math.max(...relative.map((r) => r.top + r.height + r.extra)),
    };
    const primaryRelative = relative[g.members.indexOf(g.primary)];
    const origin = contentOrigin(canvasEl);
    const bounds = this.boundsOf(canvasEl, slot);
    // A box carried above what shows of the canvas (scrolling up under it) lands at the top of it, in sight.
    const highest = Math.ceil((visibleRect(canvasEl, this.root).top - origin.y) / ROW) * ROW;
    const carriedTop = point.y - g.grab.y - origin.y - primaryRelative.top;
    const landed = landAt(
      {
        x: point.x - g.grab.x - origin.x - primaryRelative.left * column,
        y: Math.max(highest, carriedTop),
      },
      groupSize,
      column,
      bounds
    );
    const boxes = relative.map((r, i) => {
      const left = Math.min(landed.left + r.left, COLUMNS - 1);
      const height =
        Number.isFinite(bounds.bottom) && canvasEl.getAttribute('component-type') === 'Listview'
          ? Math.min(r.height, Math.max(ROW, bounds.bottom))
          : r.height;
      return {
        left,
        top: landed.top + r.top,
        width: Math.min(r.width, COLUMNS - left),
        height,
        extra: r.extra,
        dynamic: isDynamicHeight(g.members[i].el),
      };
    });

    if (this.refusingCanvas) {
      this.showGlidingGhosts(g);
    } else {
      this.showGhosts(canvasEl, boxes, column, !verdict.ok);
      this.showGuides(
        canvasEl,
        boxes,
        column,
        g.members.map((m) => m.el)
      );
    }
    if (slot === PAGE_CANVAS) {
      this.growPageCanvas(canvasEl, Math.max(...boxes.map((b) => b.top + b.height + b.extra)));
    }
    g.landing = { canvasEl, slot, verdict, boxes, column };
  }

  commitTranslate(g) {
    const landing = g.landing;
    if (!landing) return;
    if (!landing.verdict.ok) {
      if (landing.verdict.message) toast.error(landing.verdict.message);
      return;
    }
    const { setComponentLayout, setReorderContainerChildren, incrementCanvasUpdater, setSelectedComponents } =
      this.store;
    const parent = parentOfSlot(landing.slot);
    const sourceParent = parentOfSlot(g.sourceSlot);
    const parentChanged = parent !== sourceParent;
    const ids = g.members.map((m) => m.id);

    if (g.sourceIsFlex) {
      this.commitFromFlex(g, landing);
    } else if (landing.flex) {
      const layouts = {};
      for (const m of g.members) {
        layouts[m.id] = createDefaultFlexChildLayout({ widthPx: m.box.width * g.sourceColumn, height: m.box.height });
      }
      setComponentLayout(layouts, parent, undefined, { updateParent: parentChanged });
    } else {
      const layouts = {};
      let moved = parentChanged;
      g.members.forEach((m, i) => {
        const { left, top, width, height } = landing.boxes[i];
        layouts[m.id] = { left, top, width, height };
        moved ||= left !== m.box.left || top !== m.box.top || width !== m.box.width || height !== m.box.height;
      });
      if (!moved) return;
      setComponentLayout(layouts, parent, undefined, { updateParent: parentChanged });
    }

    setReorderContainerChildren(landing.slot);
    if (parentChanged) setReorderContainerChildren(g.sourceSlot);
    incrementCanvasUpdater();
    setSelectedComponents(ids);
  }

  /** A FlexContainer child dropped: reordered in its container, moved to another one, or placed on a grid. */
  commitFromFlex(g, landing) {
    const store = this.store;
    const child = g.primary;
    const sourceContainerId = parentOfSlot(g.sourceSlot);
    const flexTarget = store.flexContainerDropTarget;
    const lockedIndex = (containerId) => (flexTarget?.flexContainerId === containerId ? flexTarget.index : null);

    if (landing.flex) {
      const targetContainerId = landing.slot;
      const snapshot = this.components();
      const mapping = getOrderedFlexChildrenFromSnapshot(
        snapshot,
        targetContainerId,
        store.containerChildrenMapping?.[targetContainerId] ?? []
      );
      const sameContainer = targetContainerId === sourceContainerId;
      const sizing = {};
      if (!sameContainer) {
        for (const key of ['fillWidth', 'widthPx', 'height']) {
          if (child.layout[key] !== undefined) sizing[key] = child.layout[key];
        }
      }
      store.moveFlexContainerChild({
        childId: child.id,
        sourceContainerId,
        targetContainerId,
        targetIndex: lockedIndex(targetContainerId) ?? landing.index ?? mapping.length,
        moduleId: this.moduleId,
        layoutPatch: sizing,
      });
      return;
    }

    const { left, top, width, height } = landing.boxes[0];
    store.setComponentLayout({ [child.id]: { left, top, width, height } }, parentOfSlot(landing.slot), undefined, {
      updateParent: true,
    });
  }

  // ── Resize ─────────────────────────────────────────────────────────────────────────────────────────────────────

  startResize(press) {
    if (this.isAutoLayoutLocked()) {
      toast(AUTO_LAYOUT_LOCKED, { id: 'mobile-auto-lock' });
      return null;
    }
    if (this.isFrozen()) return null;
    const ids = press.group ? this.selectionGroup() : [press.componentEl?.getAttribute('widgetid')].filter(Boolean);
    if (!ids.length) return null;
    if (!press.group && !this.store.selectedComponents.includes(ids[0])) this.store.setSelectedComponents(ids);

    const { members, canvasEl } = this.measure(ids);
    if (!members.length) return null;
    const slot = slotOfCanvas(canvasEl, this.moduleId);
    const flex = canvasEl.classList.contains('flex-container-canvas');
    if (flex && members.length > 1) return null;

    if (members.length === 1) this.store.setResizingComponentId(members[0].id);
    else this.store.setIsGroupResizing(true);
    this.setTargetCanvas(canvasEl);

    const frame = press.group ? this.root.querySelector('.tj-group-frame') : null;
    return {
      kind: 'resize',
      handle: press.handle,
      members,
      canvasEl,
      slot,
      flex,
      column: columnWidthOf(canvasEl, slot, this.moduleId),
      bounds: this.boundsOf(canvasEl, slot, true),
      frame,
      frameCss: frame?.style.cssText,
      result: null,
    };
  }

  renderResize(g) {
    const delta = { dx: this.point.x - this.press.start.x, dy: this.point.y - this.press.start.y };
    const place = (el, box, extra = 0) => {
      const span = columnSpan(box.left, box.width, g.column);
      el.style.width = `${span.width + extra}px`;
      el.style.height = `${box.height + extra}px`;
      el.style.transform = `translate(${span.x}px, ${box.top}px)`;
    };

    if (g.flex) {
      const [ax, ay] = handleAxes(g.handle);
      const m = g.members[0];
      const size = {
        axes: [ax, ay],
        width: m.size.width + ax * delta.dx,
        height: m.size.height + ay * delta.dy,
      };
      const direction = getEffectiveFlexDirectionForFlexContainer(
        this.store.getResolvedComponent,
        g.slot,
        this.moduleId
      );
      Object.assign(m.el.style, flexResizeStyles(size, direction));
      g.result = size;
      return;
    }

    const rendered = g.members.map((m) => ({ ...m.box, height: m.box.height + m.extra }));
    const next = (
      g.members.length === 1
        ? [resizeBox(rendered[0], g.handle, delta, g.column, g.bounds)]
        : resizeGroup(rendered, g.handle, delta, g.column, g.bounds)
    ).map((box, i) => ({ ...box, dynamic: isDynamicHeight(g.members[i].el) }));
    // A shadow at the new size; the components keep their size (dimmed) until the release saves it — re-rendering a
    // large component at every snapped size can't keep up with the pointer.
    this.showGhosts(
      g.canvasEl,
      next.map((box, i) => ({
        ...box,
        height: Math.max(ROW, box.height - g.members[i].extra),
        extra: g.members[i].extra,
      })),
      g.column,
      false
    );
    if (g.frame) place(g.frame, boundingBox(next), 1);
    this.showGuides(
      g.canvasEl,
      next,
      g.column,
      g.members.map((m) => m.el)
    );
    g.result = next;
  }

  commitResize(g) {
    if (!g.result) return;
    const { setComponentLayout, setReorderContainerChildren, incrementCanvasUpdater } = this.store;
    if (g.flex) {
      const patch = flexResizePatch(g.result);
      if (!patch) return;
      setComponentLayout({ [g.members[0].id]: patch });
    } else {
      const layouts = {};
      let changed = false;
      g.members.forEach((m, i) => {
        const { left, top, width } = g.result[i];
        const height = Math.max(ROW, g.result[i].height - m.extra);
        layouts[m.id] = { left, top, width, height };
        changed ||= left !== m.box.left || top !== m.box.top || width !== m.box.width || height !== m.box.height;
      });
      if (!changed) return;
      setComponentLayout(layouts);
    }
    setReorderContainerChildren(g.slot);
    incrementCanvasUpdater();
  }

  // ── Marquee ────────────────────────────────────────────────────────────────────────────────────────────────────

  startBrush(canvasEl, additive) {
    const box = document.createElement('div');
    box.className = 'tj-marquee';
    document.body.appendChild(box);
    return {
      kind: 'brush',
      canvasEl,
      additive,
      box,
      candidates: Array.from(layerOf(canvasEl).children).filter((el) => el.classList.contains('moveable-box')),
      hits: new Set(),
    };
  }

  renderBrush(g) {
    const r = rectFromPoints(this.press.start, this.point);
    Object.assign(g.box.style, {
      left: `${r.left}px`,
      top: `${r.top}px`,
      width: `${r.right - r.left}px`,
      height: `${r.bottom - r.top}px`,
    });
    for (const el of g.candidates) {
      const hit = intersects(r, el.getBoundingClientRect());
      el.classList.toggle('tj-brush-hit', hit);
      if (hit) g.hits.add(el);
      else g.hits.delete(el);
    }
  }

  commitBrush(g) {
    const ids = [...g.hits].map((el) => el.getAttribute('widgetid'));
    if (!ids.length) return;
    const base = g.additive ? this.store.selectedComponents.filter((id) => !ids.includes(id)) : [];
    this.store.setSelectedComponents([...base, ...ids]);
  }

  // ── End of a gesture ───────────────────────────────────────────────────────────────────────────────────────────

  finish(commit) {
    const g = this.gesture;
    this.gesture = null;
    if (this.frame) {
      cancelAnimationFrame(this.frame);
      this.frame = 0;
    }
    this.endPress({ releaseCapture: !commit });
    document.body.classList.remove('tj-canvas-gesture', 'tj-canvas-moving');
    this.resetAutoscroll();
    this.moves = [];
    this.glows?.forEach((glow) => glow.remove());
    this.glows = null;
    if (!g) return;
    // Swallow this release's mouseup and click, but nothing after it (a release away from where it began has no
    // click).
    this.swallowRelease = true;
    setTimeout(() => (this.swallowRelease = false), 0);

    if (g.kind === 'resize') {
      // A flex child was sized here directly: hand it back to React exactly as it rendered it (the commit re-renders
      // it at its new size). Grid components only had a shadow at the new size.
      if (g.flex) for (const m of g.members) m.el.style.cssText = m.css;
      if (g.frame) g.frame.style.cssText = g.frameCss;
    }
    if (g.kind === 'brush') {
      g.box.remove();
      for (const el of g.candidates) el.classList.remove('tj-brush-hit');
    }
    this.siblingEdges.clear();
    this.setTargetCanvas(null);
    this.markRefusing(null);
    // After a move or resize, the ghosts (hidden) and the page's extra room stay until the drop has rendered: taking
    // them first shortens the canvas for a moment, and the browser pulls its scroll up, away from what was placed.
    const dropped = commit && g.kind !== 'brush';
    if (dropped) {
      const ghosts = this.ghosts;
      this.ghosts = [];
      this.clearGuides();
      for (const ghost of ghosts) ghost.style.visibility = 'hidden';
      requestAnimationFrame(() => requestAnimationFrame(() => ghosts.forEach((ghost) => ghost.remove())));
    } else this.clearGhosts();
    const grown = dropped ? this.grownCanvas : null;
    if (grown) {
      this.grownCanvas = null;
      setTimeout(() => {
        if (this.grownCanvas !== grown) grown.style.minHeight = '';
      }, PAGE_SHRINK_DELAY_MS);
    } else this.shrinkPageCanvas();
    // The pointer may have ended up over something else.
    if (this.point) this.setHovered(document.elementFromPoint(this.point.x, this.point.y));

    try {
      if (commit) {
        if (g.kind === 'translate') this.commitTranslate(g);
        else if (g.kind === 'resize') this.commitResize(g);
        else if (g.kind === 'brush') this.commitBrush(g);
      }
    } finally {
      const store = this.store;
      if (g.kind === 'translate') {
        store.setDraggingComponentId(null);
        store.setIsGroupDragging(false);
        if (store.flexContainerDropTarget) store.setFlexContainerDropTarget(null);
      } else if (g.kind === 'resize') {
        store.setResizingComponentId(null);
        store.setIsGroupResizing(false);
      }
    }
  }

  cancel() {
    if (this.gesture) this.finish(false);
    else this.endPress({ releaseCapture: true });
  }

  // ── A new component dragged in from the components panel ───────────────────────────────────────────────────────

  /** Called on every drag-over with the pointer and the dragged panel item (`{ componentType, component }`). */
  updateInsert(point, item) {
    if (!this.isEditing()) return;
    this.insert ??= { kind: 'insert', landing: null, rules: this.ruleComponents() };
    this.insert.item = item;
    this.point = point;
    this.renderInsert(this.insert, point);
    if (this.autoscroll(this.insert.landing?.canvasEl ?? this.root, point)) this.renderInsert(this.insert, point);
  }

  renderInsert(ins, point) {
    const grid = useGridStore.getState();
    const setTarget = (slot) => grid.actions.setCurrentDragCanvasId(slot);
    const canvasEl = canvasAt(this.root, point);
    if (!canvasEl) {
      ins.landing = null;
      this.clearGhosts();
      this.setTargetCanvas(null);
      this.publishFlexTarget(null);
      setTarget(null);
      return;
    }
    const slot = slotOfCanvas(canvasEl, this.moduleId);
    const verdict = canDrop({
      dragged: [{ type: ins.item.componentType }],
      slotId: slot,
      components: ins.rules,
      isModuleEditor: this.isModuleEditor,
      insideModule: this.insideModule(canvasEl),
    });
    this.setTargetCanvas(canvasEl, !verdict.ok);
    setTarget(verdict.ok ? slot : null);

    if (canvasEl.classList.contains('flex-container-canvas')) {
      this.clearGhosts();
      if (verdict.ok) this.publishFlexTarget(slot, point);
      else this.publishFlexTarget(null);
      ins.landing = { canvasEl, slot, verdict, flex: true };
      // A FlexContainer orders its children itself; the drop handler only needs a position to ignore.
      grid.actions.setGhostDragPosition({ landing: { left: 0, top: 0 } });
      return;
    }
    this.publishFlexTarget(null);

    const column = columnWidthOf(canvasEl, slot, this.moduleId);
    const pageColumn = grid.subContainerWidths[this.moduleId] || grid.subContainerWidths[PAGE_CANVAS] || column;
    const size = ins.item.component?.defaultSize ?? { width: 10, height: 40 };
    const origin = contentOrigin(canvasEl);
    const box = landAt(
      { x: point.x - origin.x, y: point.y - origin.y },
      { width: convertWidth(size.width, pageColumn, column), height: size.height },
      column,
      this.boundsOf(canvasEl, slot)
    );
    this.showGhosts(canvasEl, [box], column, !verdict.ok);
    this.showGuides(canvasEl, [box], column, []);
    if (slot === PAGE_CANVAS) this.growPageCanvas(canvasEl, box.top + box.height);
    ins.landing = { canvasEl, slot, verdict, box };
    // The drop handler places the new component exactly here.
    grid.actions.setGhostDragPosition({ landing: { left: box.left, top: box.top } });
  }

  /** The panel drag ended (dropped or not). The drop itself is handled by the panel's drop handler. */
  endInsert() {
    const ins = this.insert;
    if (!ins) return;
    this.insert = null;
    this.resetAutoscroll();
    if (ins.landing && !ins.landing.verdict.ok && ins.landing.verdict.message) toast.error(ins.landing.verdict.message);
    this.clearGhosts();
    this.siblingEdges.clear();
    this.setTargetCanvas(null);
    this.shrinkPageCanvas();
  }
}
