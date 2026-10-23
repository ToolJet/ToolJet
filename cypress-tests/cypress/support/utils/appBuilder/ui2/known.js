// Failures the suite knows about. Two kinds:
//
// 1. Out of scope (by design): single failure lines matched per widget, check, size and kind. They are recorded and
//    shown (tools/ui2/report.js lists them) but do not fail the test; every other line of the same test still does.
//    Today that is E19 (notes/ui2-audit-out-of-scope-2026-10-17.md): the editor draws a widget's saved height while
//    the viewer fits it to its content, as native widgets do. So a fitted widget's editor and preview heights differ,
//    and on the editor canvas its content leaves a band in, or runs past, the saved box. Each mark below comes from a
//    run on 29551480b5, and only where the viewer passes the same case (a check the viewer also fails is a real bug,
//    never E19). The parity mark also re-checks the cause: the editor height must equal the saved height.
//
// 2. Tracked bugs (KNOWN): a whole test, still run and still failing with the reason in its title and message, so a
//    fix shows up as a pass; CYPRESS_ui2_skip_known=true skips them. Remove an entry when its fix lands. Shape:
//    { <check>: { <widget type>: reason | { reason, when: (ctx) => boolean } } }, ctx = { mode, width, theme }.
//    Empty: the 36 off-grid default heights it held at a839e007ee were fixed by b61ce368e1.

export const E19 = "E19: editor draws saved height for fitted widgets";

const D = ["default"];
const S = ["small"];
const DS = ["default", "small"];

/** parity: the sizes whose editor vs preview height gap is E19, per widget. */
const E19_PARITY = {
  ShadAccordion: D, ShadAlert: D, ShadButtonGroup: D, ShadCalendar: D, ShadCardGrid: D, ShadCarousel: D,
  ShadColorPicker: D, ShadCombobox: D, ShadCurrencyInput: DS, ShadDatePicker: DS, ShadDateTimePicker: DS,
  ShadFileUpload: D, ShadHero: D, ShadInput: DS, ShadKanban: D, ShadKeyValue: D, ShadListView: D, ShadMultiselect: D,
  ShadNumberInput: DS, ShadOtpInput: DS, ShadPasswordInput: DS, ShadPhoneInput: DS, ShadProgressList: D,
  ShadQuestionnaire: D, ShadRadioGroup: DS, ShadRating: D, ShadRecordList: D, ShadSchedule: D, ShadSelect: DS,
  ShadSlider: DS, ShadStat: D, ShadSwitch: DS, ShadTable: D, ShadTags: D, ShadTagsInput: D, ShadText: D,
  ShadTextarea: S, ShadTimePicker: DS, ShadTimeline: D, ShadToggleGroup: S,
};

// Failure kinds, as geometryFailures words them.
const INSIDE = /^root sits [\d.]+px inside the box at the bottom/; // saved box taller than the content
const BAND = /^blank band of [\d.]+px at the bottom/;
const STICKS = /^root sticks out [\d.]+px at the bottom/; // saved box shorter than the content
const PAINTS = /^paints [\d.]+px outside the box at the bottom/;
const TALL = [INSIDE, BAND];
const SHORT = [STICKS, PAINTS];

/** geometry, editor only: per widget and size, the failure kinds that are E19 (the viewer passes the same case). */
const E19_EDITOR_GEOMETRY = {
  ShadCalendar: { default: [BAND] },
  ShadColorPicker: { default: [BAND] },
  ShadCombobox: { default: [BAND] },
  ShadCurrencyInput: { default: TALL, small: SHORT },
  ShadDatePicker: { default: TALL, small: SHORT },
  ShadDateTimePicker: { default: TALL, small: SHORT },
  ShadInput: { default: TALL, small: SHORT },
  ShadMultiselect: { default: [BAND] },
  ShadNumberInput: { default: TALL, small: SHORT },
  ShadOtpInput: { default: [INSIDE], small: SHORT },
  ShadPasswordInput: { default: TALL, small: SHORT },
  ShadPhoneInput: { default: TALL, small: SHORT },
  ShadQuestionnaire: { default: [BAND] },
  ShadRadioGroup: { default: [INSIDE], small: SHORT },
  ShadSchedule: { default: [BAND] },
  ShadSelect: { default: TALL, small: SHORT },
  ShadSlider: { default: [INSIDE], small: SHORT },
  ShadSwitch: { default: [INSIDE], small: SHORT },
  ShadTagsInput: { default: [BAND] },
  ShadTextarea: { small: SHORT },
  ShadTimePicker: { default: TALL, small: SHORT },
  ShadToggleGroup: { small: SHORT },
};

/**
 * Why one failure line is out of scope, or null. `rec` is the result being asserted: { check, widget, mode, authored }
 * (authored: the saved height per size, which the parity spec passes in).
 */
export const outOfScope = (rec, line) => {
  if (rec.check === "parity" && rec.mode === "editor-vs-preview") {
    const m = line.match(/^(default|small): height ([\d.]+)px in the editor, ([\d.]+)px in the preview$/);
    const saved = m && rec.authored?.[m[1]];
    if (m && (E19_PARITY[rec.widget] || []).includes(m[1]) && saved !== undefined && Math.abs(Number(m[2]) - saved) <= 1) return E19;
    return null;
  }
  if (rec.check === "geometry" && rec.mode === "editor") {
    const m = line.match(/^(default|small) \(\d+px\): (.*)$/);
    const kinds = m && E19_EDITOR_GEOMETRY[rec.widget]?.[m[1]];
    if (kinds && kinds.some((k) => k.test(m[2]))) return E19;
  }
  return null;
};

const KNOWN = {};

/** The reason a tracked bug makes a whole test fail, or null. */
export const knownFailure = (check, type, ctx = {}) => {
  const entry = KNOWN[check]?.[type];
  if (!entry) return null;
  if (typeof entry === "string") return entry;
  return entry.when(ctx) ? entry.reason : null;
};
