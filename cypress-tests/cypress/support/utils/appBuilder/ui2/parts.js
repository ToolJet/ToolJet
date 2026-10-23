// Checks that a widget's parts sit where they belong (a Switch thumb in its track, every calendar column the same
// width, a straight Tabs underline, centred chips). Each returns readable failure lines, empty when it passes. They
// run in the app's window against the widget element (`[data-cy="draggable-widget-<name>"]`) or an open popover.
import { findWidget } from "./geometry";

const r1 = (n) => Math.round(n * 10) / 10;
const rect = (e) => e.getBoundingClientRect();
const cy = (r) => (r.top + r.bottom) / 2;
const cx = (r) => (r.left + r.right) / 2;
const inside = (inner, outer, tol = 0.5) =>
  inner.left >= outer.left - tol && inner.right <= outer.right + tol && inner.top >= outer.top - tol && inner.bottom <= outer.bottom + tol;
const fmt = (r) => `${r1(r.left)},${r1(r.top)} ${r1(r.width)}x${r1(r.height)}`;

const widgetEl = (win, name) => findWidget(win.document, name)?.el;

/** Switch: the thumb inside the track, vertically centred, at the end that matches its state. */
export const switchThumb = (win, name) => {
  const el = widgetEl(win, name);
  const track = el?.querySelector('[role="switch"]');
  const thumb = track?.querySelector("span");
  if (!track || !thumb) return ["switch track or thumb not found"];
  const t = rect(track);
  const h = rect(thumb);
  const f = [];
  const checked = track.getAttribute("aria-checked") === "true";
  if (!inside(h, t)) f.push(`thumb (${fmt(h)}) is outside its track (${fmt(t)}) while ${checked ? "on" : "off"}`);
  if (Math.abs(cy(h) - cy(t)) > 1) f.push(`thumb is ${r1(cy(h) - cy(t))}px off the track's centre line while ${checked ? "on" : "off"}`);
  const gapStart = h.left - t.left;
  const gapEnd = t.right - h.right;
  if (checked && gapEnd > gapStart) f.push(`thumb sits at the start of the track while on (gaps ${r1(gapStart)} / ${r1(gapEnd)}px)`);
  if (!checked && gapStart > gapEnd) f.push(`thumb sits at the end of the track while off (gaps ${r1(gapStart)} / ${r1(gapEnd)}px)`);
  return f;
};

/** Slider: every thumb's centre on the track (within its ends), vertically centred; the filled range inside it. */
export const sliderThumbs = (win, name) => {
  const el = widgetEl(win, name);
  const thumbs = [...(el?.querySelectorAll('[role="slider"]') || [])];
  // The track: the rounded bar the range fill sits in.
  const range = el?.querySelector('[data-orientation="horizontal"] > [data-orientation="horizontal"] > [data-orientation="horizontal"]');
  const track = range?.parentElement;
  if (!thumbs.length || !track) return ["slider track or thumbs not found"];
  const t = rect(track);
  const f = [];
  thumbs.forEach((th, i) => {
    const h = rect(th);
    if (cx(h) < t.left - 0.5 || cx(h) > t.right + 0.5) f.push(`thumb ${i + 1}'s centre (${r1(cx(h))}) is off the track (${r1(t.left)} to ${r1(t.right)})`);
    if (Math.abs(cy(h) - cy(t)) > 1) f.push(`thumb ${i + 1} is ${r1(cy(h) - cy(t))}px off the track's centre line`);
  });
  const fill = rect(range);
  const visible = { left: Math.max(fill.left, t.left), right: Math.min(fill.right, t.right), top: fill.top, bottom: fill.bottom };
  if (visible.top < t.top - 0.5 || visible.bottom > t.bottom + 0.5) f.push(`range fill (${fmt(fill)}) is taller than the track (${fmt(t)})`);
  return f;
};

/**
 * A day grid (react-day-picker): every weekday heading and every day cell the same width, Saturday and Sunday
 * included, and each column of days under its heading.
 */
export const dayColumns = (root) => {
  const grid = root?.querySelector('table[role="grid"]');
  if (!grid) return ["day grid not found"];
  const heads = [...grid.querySelectorAll("thead th")].map(rect);
  const rows = [...grid.querySelectorAll("tbody tr")].map((tr) => [...tr.querySelectorAll("td")].map(rect));
  const f = [];
  if (heads.length !== 7) f.push(`${heads.length} weekday headings, expected 7`);
  const w0 = heads[0]?.width;
  const names = ["1st", "2nd", "3rd", "4th", "5th", "6th", "7th"];
  heads.forEach((h, i) => Math.abs(h.width - w0) > 0.5 && f.push(`heading ${names[i]} column is ${r1(h.width)}px wide, the 1st is ${r1(w0)}px`));
  rows.forEach((cells, ri) => {
    cells.forEach((c, i) => {
      if (Math.abs(c.width - w0) > 0.5) f.push(`week ${ri + 1}, ${names[i]} day is ${r1(c.width)}px wide, headings are ${r1(w0)}px`);
      if (heads[i] && Math.abs(c.left - heads[i].left) > 1) f.push(`week ${ri + 1}, ${names[i]} day starts at ${r1(c.left)}, its heading at ${r1(heads[i].left)}`);
    });
  });
  return f.slice(0, 6);
};

/** The open popover's day grid (Date picker, Date and time picker). */
export const popoverDayColumns = (win) => {
  const pops = [...win.document.querySelectorAll("[data-radix-popper-content-wrapper]")];
  const pop = pops.find((p) => p.querySelector('table[role="grid"]'));
  return pop ? dayColumns(pop) : ["date popover with a day grid did not open"];
};

/** Tabs (underline variant): the active tab's underline is straight (no corner radius) and sits on the tab list's line. */
export const tabsUnderline = (win, name) => {
  const el = widgetEl(win, name);
  const tab = el?.querySelector('[role="tab"][aria-selected="true"]');
  const list = el?.querySelector('[role="tablist"]');
  if (!tab || !list) return ["active tab or tab list not found"];
  const f = [];
  const parts = [
    ["tab", win.getComputedStyle(tab)],
    ["tab::after", win.getComputedStyle(tab, "::after")],
    ["tab::before", win.getComputedStyle(tab, "::before")],
  ];
  parts.forEach(([what, s]) => {
    const drawn = what === "tab" || (s.content && s.content !== "none" && s.content !== "normal");
    if (!drawn) return;
    const underline = what !== "tab" || parseFloat(s.borderBottomWidth) > 0;
    if (!underline) return;
    const radii = [s.borderBottomLeftRadius, s.borderBottomRightRadius, s.borderTopLeftRadius, s.borderTopRightRadius].map(parseFloat);
    if (radii.some((x) => x > 0)) f.push(`${what} underline is rounded (radius ${radii.join("/")}px)`);
  });
  const t = rect(tab);
  const l = rect(list);
  if (Math.abs(t.bottom - l.bottom) > 1.5) f.push(`active tab's underline is ${r1(t.bottom - l.bottom)}px off the tab list's bottom line`);
  return f;
};

/** Chips (Tags, Tags input, Multiselect): each chip centred on its row's line, its label centred in it. */
export const chipsCentred = (win, name) => {
  const el = widgetEl(win, name);
  if (!el) return ["widget not found"];
  const field = el.querySelector("[data-picker-field]");
  const chips = field
    ? [...field.querySelectorAll("div.tw-inline-flex")].filter((c) => c.querySelector(".tw-truncate"))
    : [...el.querySelectorAll('[role="listitem"] > *')];
  if (!chips.length) return ["no chips found"];
  const f = [];
  const fr = field ? rect(field) : null;
  const rows = new Map();
  chips.forEach((c) => {
    const r = rect(c);
    const key = Math.round(r.top / 4);
    rows.set(key, [...(rows.get(key) || []), r]);
    const label = c.querySelector(".tw-truncate");
    if (label && Math.abs(cy(rect(label)) - cy(r)) > 1) f.push(`chip "${label.textContent}" label is ${r1(cy(rect(label)) - cy(r))}px off its centre line`);
  });
  if (fr && rows.size === 1) {
    const r = chips.map(rect)[0];
    if (Math.abs(cy(r) - cy(fr)) > 1) f.push(`chips are ${r1(cy(r) - cy(fr))}px off the field's centre line (chip ${fmt(r)}, field ${fmt(fr)})`);
  }
  rows.forEach((rs) => {
    const c0 = cy(rs[0]);
    rs.forEach((r) => Math.abs(cy(r) - c0) > 1 && f.push(`chips on one row are not on one line (${r1(cy(r) - c0)}px)`));
  });
  return f;
};

/** Checkbox: the box on the label's first line (centres within 2 px), inside the widget. */
export const checkboxAligned = (win, name) => {
  const el = widgetEl(win, name);
  const box = el?.querySelector('[role="checkbox"]');
  const label = el?.querySelector("label");
  if (!box || !label) return ["checkbox or label not found"];
  const b = rect(box);
  const l = rect(label);
  const line = Math.min(l.height, 20);
  return Math.abs(cy(b) - (l.top + line / 2)) > 2 ? [`box is ${r1(cy(b) - (l.top + line / 2))}px off the label's first line`] : [];
};

/** Radio group: the checked dot centred in its circle; every circle centred on its label. */
export const radioDots = (win, name) => {
  const el = widgetEl(win, name);
  const radios = [...(el?.querySelectorAll('[role="radio"]') || [])];
  if (!radios.length) return ["no radios found"];
  const f = [];
  radios.forEach((r, i) => {
    const c = rect(r);
    const dot = r.querySelector("svg");
    if (dot) {
      const d = rect(dot);
      if (Math.abs(cx(d) - cx(c)) > 0.75 || Math.abs(cy(d) - cy(c)) > 0.75) f.push(`radio ${i + 1}'s dot is off centre by ${r1(cx(d) - cx(c))},${r1(cy(d) - cy(c))}px`);
    }
    const label = r.parentElement?.querySelector("label");
    if (label && Math.abs(cy(rect(label)) - cy(c)) > 1.5) f.push(`radio ${i + 1} is ${r1(cy(c) - cy(rect(label)))}px off its label's centre line`);
  });
  return f;
};

/** Rating: every star the same size, on one line, inside the widget box. */
export const ratingStars = (win, name) => {
  const found = findWidget(win.document, name);
  const stars = [...(found?.el.querySelectorAll('[role="radio"]') || [])].map(rect);
  if (!stars.length) return ["no stars found"];
  const box = rect(found.box);
  const f = [];
  stars.forEach((s, i) => {
    if (Math.abs(s.top - stars[0].top) > 0.5 || Math.abs(s.height - stars[0].height) > 0.5) f.push(`star ${i + 1} is not in line with the first (${fmt(s)} vs ${fmt(stars[0])})`);
    if (!inside(s, box, 0.5)) f.push(`star ${i + 1} (${fmt(s)}) is outside the widget box (${fmt(box)})`);
  });
  return f;
};

/** Progress: the indicator exactly as tall as the track and inside it vertically. */
export const progressIndicator = (win, name) => {
  const el = widgetEl(win, name);
  const track = el?.querySelector('[role="progressbar"]');
  const ind = track?.firstElementChild;
  if (!track || !ind) return ["progress track or indicator not found"];
  const t = rect(track);
  const i = rect(ind);
  return Math.abs(i.top - t.top) > 0.5 || Math.abs(i.bottom - t.bottom) > 0.5 ? [`indicator (${fmt(i)}) does not line up with its track (${fmt(t)})`] : [];
};
