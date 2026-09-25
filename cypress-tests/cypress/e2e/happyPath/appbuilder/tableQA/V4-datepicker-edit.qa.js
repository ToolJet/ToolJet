// Editable Date Picker column: every inspector property x pick/type/clear. Observe-only; writes logs/v4-results.json.
import { tq, col } from "./_harness";

const OUT = "cypress/e2e/happyPath/appbuilder/tableQA/logs/v4-results.json";
const results = [];
const CS = "{{JSON.stringify(components.table1.changeSet)}}";
const input = () => tq.cell(0, "d").find("input.table-column-datepicker-input");
const day = (n) => cy.get(`.react-datepicker__day--0${String(n).padStart(2, "0")}:not(.react-datepicker__day--outside-month)`).first();

const snap = (id, extra = {}) =>
  cy.document().then((doc) => {
    const td = doc.querySelector('td[data-cy="table1-d-row-0"]');
    const inp = td && td.querySelector("input.table-column-datepicker-input");
    const cs = doc.querySelector('[data-cy="draggable-widget-cs"]');
    results.push({
      id,
      shown: inp ? inp.value : td && td.innerText.trim(),
      changeSet: cs ? cs.innerText.trim() : null,
      popupOpen: !!doc.querySelector(".react-datepicker__month-container"),
      invalid: !!(td && td.querySelector(".is-invalid, .invalid-feedback-date")),
      ...extra,
    });
  });

const build = (d, extra) =>
  tq.app({
    data: [{ id: 1, d }],
    columns: [col("id"), col("d", "datepicker", { isEditable: true, ...extra })],
    props: { defaultSelectedRow: "{{undefined}}" },
    probes: { cs: CS },
  });

// [id, data value, column extra, action, note]
const PICK = [
  ["base-ddmm", "15/05/2026", { dateFormat: "DD/MM/YYYY", parseDateFormat: "DD/MM/YYYY" }, "expect shown 20/05/2026; saved value format?"],
  ["display-ne-parse", "2026-05-15", { dateFormat: "DD MMM YYYY", parseDateFormat: "YYYY-MM-DD" }, "expect shown 20 May 2026 and saved in parse format 2026-05-20"],
  ["time-12h", "15/05/2026 10:30 AM", { dateFormat: "DD/MM/YYYY", parseDateFormat: "DD/MM/YYYY", isTimeChecked: true }, "time kept after picking a day"],
  ["time-24h", "15/05/2026 14:30", { dateFormat: "DD/MM/YYYY", parseDateFormat: "DD/MM/YYYY", isTimeChecked: true, isTwentyFourHrFormatEnabled: true }, "24h kept"],
  ["unix-seconds", 1778803200, { dateFormat: "DD/MM/YYYY", parseInUnixTimestamp: true, unixTimestamp: "seconds" }, "saved as 10-digit seconds"],
  ["unix-ms", 1778803200000, { dateFormat: "DD/MM/YYYY", parseInUnixTimestamp: true, unixTimestamp: "ms" }, "saved as 13-digit ms"],
  ["tz-roundtrip", "2026-05-15 10:00", { dateFormat: "DD/MM/YYYY", parseDateFormat: "YYYY-MM-DD", isTimeChecked: true, isTwentyFourHrFormatEnabled: true, timeZoneValue: "Etc/UTC", timeZoneDisplay: "Asia/Kolkata" }, "display 15:30 IST; after pick still 15:30"],
];

describe("V4 editable Date Picker properties", () => {
  afterEach(() => tq.cleanup());
  after(() => cy.writeFile(OUT, results));

  PICK.forEach(([id, d, extra, note]) =>
    it(`pick day 20: ${id}`, () => {
      build(d, extra);
      snap(`${id}:initial`, { note });
      input().click();
      cy.get(".react-datepicker__month-container", { timeout: 5000 });
      cy.document().then((doc) => results.push({ id: `${id}:timeListItems`, count: doc.querySelectorAll(".react-datepicker__time-list-item").length }));
      day(20).click();
      cy.wait(600);
      snap(`${id}:afterPick`, { note });
      cy.get("body").type("{esc}");
      tq.probe("cs").click({ force: true }); // blur
      cy.wait(400);
      snap(`${id}:afterBlur`, { note });
    })
  );

  it("time-only (Enable date selection off, Show time on)", () => {
    build("10:30 AM", { isDateSelectionEnabled: false, isTimeChecked: true, parseDateFormat: "DD/MM/YYYY" });
    snap("timeonly:initial");
    input().click();
    cy.wait(600);
    cy.document().then((doc) =>
      results.push({ id: "timeonly:popup", days: doc.querySelectorAll(".react-datepicker__day").length, times: doc.querySelectorAll(".react-datepicker__time-list-item").length })
    );
  });

  it("disabled dates in the column's own format (DD/MM) vs MM/DD", () => {
    build("15/05/2026", { dateFormat: "DD/MM/YYYY", parseDateFormat: "DD/MM/YYYY", disabledDates: "{{['20/05/2026', '05/21/2026']}}" });
    input().click();
    cy.get(".react-datepicker__month-container");
    cy.document().then((doc) => {
      const cls = (n) => doc.querySelector(`.react-datepicker__day--0${n}:not(.react-datepicker__day--outside-month)`)?.className || "";
      results.push({ id: "disabled:day20(DD/MM entry)", disabled: /disabled|excluded/.test(cls(20)) });
      results.push({ id: "disabled:day21(MM/DD entry)", disabled: /disabled|excluded/.test(cls(21)) });
    });
  });

  it("minimum / maximum date in the calendar", () => {
    build("15/05/2026", { dateFormat: "DD/MM/YYYY", parseDateFormat: "DD/MM/YYYY", minDate: "10/05/2026", maxDate: "25/05/2026" });
    input().click();
    cy.get(".react-datepicker__month-container");
    cy.document().then((doc) => {
      const cls = (n) => doc.querySelector(`.react-datepicker__day--0${n}:not(.react-datepicker__day--outside-month)`)?.className || "";
      results.push({ id: "minmax:day05 disabled in calendar", disabled: /disabled/.test(cls("05")) });
      results.push({ id: "minmax:day28 disabled in calendar", disabled: /disabled/.test(cls(28)) });
    });
    day(5).click();
    cy.wait(600);
    snap("minmax:afterPickDay05");
  });

  const TYPE = [
    ["type-display-format", "2026-05-15", { dateFormat: "DD/MM/YYYY", parseDateFormat: "YYYY-MM-DD" }, "20/05/2026"],
    ["type-garbage", "15/05/2026", { dateFormat: "DD/MM/YYYY", parseDateFormat: "DD/MM/YYYY" }, "abc"],
    ["type-clear", "15/05/2026", { dateFormat: "DD/MM/YYYY", parseDateFormat: "DD/MM/YYYY" }, ""],
  ];
  TYPE.forEach(([id, d, extra, text]) =>
    it(`type into input: ${id}`, () => {
      build(d, extra);
      input().click();
      input().type(`{selectall}{backspace}${text}{enter}`, { force: true });
      cy.wait(500);
      tq.probe("cs").click({ force: true });
      cy.wait(400);
      snap(`${id}:afterType`, { typed: text });
    })
  );
});
