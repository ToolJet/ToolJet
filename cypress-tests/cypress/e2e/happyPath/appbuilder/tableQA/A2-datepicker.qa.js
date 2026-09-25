import { tq, col } from "./_harness";

// Test-infra workaround (not a product bug): _harness.js's tq.app() reads Cypress.env("appId")
// synchronously as a cy.openApp() call argument, BEFORE this test's own apiCreateApp command has
// actually run. If that env var still holds a PREVIOUS test's (now cleaned-up) app id, cy.openApp()
// opens a dead app and lands on /error/invalid-link. Clearing it first forces cy.openApp()'s own
// `appId = Cypress.env("appId")` default-parameter fallback to kick in, which re-reads the env var
// at real invocation time (after this test's apiCreateApp has completed and set the fresh id).
beforeEach(() => {
  Cypress.env("appId", undefined);
});

// A2 Column types (display): datepicker
// Source refs:
//  - frontend/src/AppBuilder/Shared/DataTypes/renderers/DatePickerRenderer.jsx (parseDate, computeDateString)
//  - frontend/src/AppBuilder/Widgets/NewTable/_components/DataTypes/adapters/Datepicker.jsx
//  - column keys: dateFormat (display), parseDateFormat (parse), isDateSelectionEnabled, isTimeChecked,
//    isTwentyFourHrFormatEnabled, timeZoneValue/timeZoneDisplay, parseInUnixTimestamp, unixTimestamp.
// Cell text lives inside a readOnly <div> (DatepickerInput) when not editable.

const cellText = () => tq.cell(0, "c").find(".table-column-datepicker-input-container div").invoke("text");

describe("A2 datepicker column - display", () => {
  afterEach(() => tq.cleanup());

  it("ISO date string parses via ISO fallback and displays per dateFormat (default DD/MM/YYYY)", () => {
    tq.app({ data: [{ c: "2024-03-15" }], columns: [col("c", "datepicker")] });
    cellText().should("eq", "15/03/2024");
  });

  it("value matching parseDateFormat exactly is parsed strictly", () => {
    tq.app({
      data: [{ c: "15/03/2024" }],
      columns: [col("c", "datepicker", { dateFormat: "DD/MM/YYYY", parseDateFormat: "DD/MM/YYYY" })],
    });
    cellText().should("eq", "15/03/2024");
  });

  it("dateFormat=MM/DD/YYYY changes only the display, not the parse", () => {
    tq.app({
      data: [{ c: "2024-03-15" }],
      columns: [col("c", "datepicker", { dateFormat: "MM/DD/YYYY", parseDateFormat: "DD/MM/YYYY" })],
    });
    cellText().should("eq", "03/15/2024");
  });

  it("null value -> blank cell (not \"Invalid date\")", () => {
    tq.app({ data: [{ c: null }], columns: [col("c", "datepicker")] });
    cellText().should("eq", "");
  });

  it("undefined value -> blank cell", () => {
    tq.app({ data: [{ c: undefined }], columns: [col("c", "datepicker")] });
    cellText().should("eq", "");
  });

  it("empty string value -> blank cell", () => {
    tq.app({ data: [{ c: "" }], columns: [col("c", "datepicker")] });
    cellText().should("eq", "");
  });

  it("wrong type: unparsable string shows literal \"Invalid date\"", () => {
    tq.app({ data: [{ c: "not-a-date" }], columns: [col("c", "datepicker")] });
    cellText().should("eq", "Invalid date");
  });

  it("wrong type: object value shows literal \"Invalid date\" (no crash)", () => {
    tq.app({ data: [{ c: "{{ ({foo: 1}) }}" }], columns: [col("c", "datepicker")] });
    cellText().should("eq", "Invalid date");
  });

  it("unix timestamp (seconds) is parsed and displayed", () => {
    // 1700000000s = 2023-11-14T22:13:20Z
    tq.app({
      data: [{ c: 1700000000 }],
      columns: [col("c", "datepicker", { parseInUnixTimestamp: "{{true}}", unixTimestamp: "seconds" })],
    });
    cellText().should("match", /^\d{2}\/\d{2}\/2023$/);
  });

  it("unix timestamp (milliseconds) is parsed and displayed", () => {
    tq.app({
      data: [{ c: 1700000000000 }],
      columns: [col("c", "datepicker", { parseInUnixTimestamp: "{{true}}", unixTimestamp: "milliseconds" })],
    });
    cellText().should("match", /^\d{2}\/\d{2}\/2023$/);
  });

  it("isTimeChecked appends time to the display using the 12hr format by default", () => {
    tq.app({
      data: [{ c: "2024-03-15T13:30:00" }],
      columns: [col("c", "datepicker", { isTimeChecked: "{{true}}" })],
    });
    cellText().should("match", /^15\/03\/2024 \d{1,2}:\d{2} (AM|PM|am|pm)$/);
  });

  it("isTwentyFourHrFormatEnabled shows 24hr time instead of AM/PM", () => {
    tq.app({
      data: [{ c: "2024-03-15T13:30:00" }],
      columns: [col("c", "datepicker", { isTimeChecked: "{{true}}", isTwentyFourHrFormatEnabled: "{{true}}" })],
    });
    cellText().should("eq", "15/03/2024 13:30");
  });

  it("isDateSelectionEnabled=false with isTimeChecked=true shows time only", () => {
    tq.app({
      data: [{ c: "2024-03-15T13:30:00" }],
      columns: [
        col("c", "datepicker", {
          isDateSelectionEnabled: "{{false}}",
          isTimeChecked: "{{true}}",
          isTwentyFourHrFormatEnabled: "{{true}}",
        }),
      ],
    });
    cellText().should("eq", "13:30");
  });
});
