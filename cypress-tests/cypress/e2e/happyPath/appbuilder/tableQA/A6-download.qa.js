// A6: Download content correctness — showDownloadButton x CSV/Excel/PDF, crossed with
// nested columns, JSON columns, select label-vs-value, datepicker, unicode, hidden
// columns, renamed columns, header casing, and search/filter/sort active.
//
// Source (frontend/src/AppBuilder/Widgets/NewTable/_utils/exportData.js):
//   getData() builds headers/data from `table.getAllColumns()` (NOT getVisibleColumns())
//   and reads `row.original[accessorKey]` directly (NOT cell.getValue()/accessorFn),
//   then force-uppercases every header regardless of the "Header casing" style.
import { tq, col } from "./_harness";
import { tableSelector } from "Selectors/appBuilder/components/table";

const DOWNLOAD_DIR = "cypress/downloads";

const clearDownloads = () =>
  cy.exec(`rm -rf ${DOWNLOAD_DIR} && mkdir -p ${DOWNLOAD_DIR}`, { failOnNonZeroExit: false });

// Poll (shell-side) for a file to land in the downloads dir, return its path.
const waitForDownload = (ext) =>
  cy
    .exec(
      `bash -c 'for i in $(seq 1 30); do f=$(ls -t ${DOWNLOAD_DIR} 2>/dev/null | grep "\\.${ext}$" | head -1); if [ -n "$f" ]; then echo "$f"; exit 0; fi; sleep 0.5; done; exit 1'`,
      { timeout: 20000 }
    )
    .its("stdout")
    .then((name) => `${DOWNLOAD_DIR}/${name.trim()}`);

const clickDownload = (format, name = "table1") => {
  cy.get(tableSelector.buttonDownloadDropdown(name)).scrollIntoView().click({ force: true });
  cy.get(`[data-cy="option-download-as-${format}"]`).should("be.visible").click({ force: true });
};

describe("A6 download — content correctness", () => {
  afterEach(() => tq.cleanup());

  const columns = [
    col("id", "number"),
    col("full name", "string", { name: "Full Name" }), // renamed header, multi-word
    col("address.city", "string", { name: "City" }), // nested source key (dot path)
    col("status", "select", {
      name: "Status",
      options: [
        { label: "Is Active", value: "A" },
        { label: "Is Inactive", value: "I" },
      ],
    }),
    col("meta", "json", { name: "Meta" }),
    col("joined", "datepicker", { name: "Joined", dateFormat: "DD-MMM-YYYY", parseDateFormat: "YYYY-MM-DD" }),
    col("emoji", "string", { name: "Emoji" }),
  ];

  const data = [
    {
      id: 1,
      "full name": "José Müller",
      address: { city: "Paris" },
      status: "A",
      meta: { plan: "pro", seats: 3 },
      joined: "2024-03-15",
      emoji: "café 你好 🎉",
    },
  ];

  ["csv", "excel", "pdf"].forEach((format) => {
    const ext = format === "excel" ? "xlsx" : format;

    it(`downloads correct content as ${format}`, () => {
      clearDownloads();
      tq.app({ data, columns, props: { showDownloadButton: "{{true}}" } });
      tq.rows().should("have.length", 1);
      clickDownload(format);

      waitForDownload(ext).then((path) => {
        if (ext === "csv") {
          cy.readFile(path).then((text) => {
            // Header row: user expects "Full Name" as typed (default header casing is
            // "As typed"); exportData.js unconditionally .toUpperCase()s every header.
            expect(text, "header row is force-uppercased regardless of Header casing style")
              .to.match(/FULL NAME/);
            expect(text, "renamed column header 'Full Name' appears").to.include("FULL NAME");
            expect(text, "plain string value survives").to.include("José Müller");
            expect(text, "unicode value (CJK + emoji) survives").to.include("你好");
          });
        } else if (ext === "xlsx") {
          cy.task("readXlsx", path).then((flat) => {
            expect(flat, "plain string value present in Excel export").to.include("José Müller");
            expect(flat, "unicode value present in Excel export").to.include("你好");
          });
        } else {
          cy.task("readPdf", path).then((text) => {
            expect(text, "plain ascii row value present in PDF export").to.include("2024-03-15".slice(0, 4));
          });
        }
      });
    });
  });

  it("BUG CHECK: nested column (dot-path key) exports blank instead of the resolved value", () => {
    // On-screen, TanStack table's accessorKey resolves "address.city" via a dot-path
    // walk (table-core index.esm.js:198-211), so the cell shows "Paris". exportData.js
    // instead does `row.original[accessorKey]` (exportData.js:30) — a literal-key
    // lookup that never walks the dot path — so the export should be blank for this
    // column while the on-screen cell is correct.
    clearDownloads();
    tq.app({ data, columns, props: { showDownloadButton: "{{true}}" } });
    tq.cell(0, "City").should("contain.text", "Paris");
    clickDownload("csv");
    waitForDownload("csv").then((path) => {
      cy.readFile(path).then((text) => {
        const lines = text.trim().split("\n");
        // header row upper-cased "CITY"; data row is the 2nd line (single data row).
        expect(lines[0]).to.include("CITY");
        expect(lines[1], "nested column value ('Paris') missing from the exported row").to.not.include("Paris");
      });
    });
  });

  it("BUG CHECK: JSON/object column serialises as [object Object] instead of the JSON text", () => {
    clearDownloads();
    tq.app({ data, columns, props: { showDownloadButton: "{{true}}" } });
    clickDownload("csv");
    waitForDownload("csv").then((path) => {
      cy.readFile(path).then((text) => {
        expect(text, "raw JSON content ('\"plan\":\"pro\"') should be recoverable from the export").to.include(
          "plan"
        );
      });
    });
  });

  it("BUG CHECK: select column exports the stored value, not the displayed label", () => {
    clearDownloads();
    tq.app({ data, columns, props: { showDownloadButton: "{{true}}" } });
    // On-screen the select column shows the option's label.
    tq.cell(0, "Status").should("contain.text", "Is Active");
    clickDownload("csv");
    waitForDownload("csv").then((path) => {
      cy.readFile(path).then((text) => {
        const lines = text.trim().split("\n");
        expect(lines[1], "download shows raw value 'A' not label 'Is Active'").to.include("A");
        expect(lines[1], "download unexpectedly contains the display label").to.not.include("Is Active");
      });
    });
  });

  it("BUG CHECK: datepicker column exports the raw stored value, not the display format", () => {
    clearDownloads();
    tq.app({ data, columns, props: { showDownloadButton: "{{true}}" } });
    // On-screen the datepicker column formats per dateFormat ("DD-MMM-YYYY").
    tq.cell(0, "Joined").should("contain.text", "15-Mar-2024");
    clickDownload("csv");
    waitForDownload("csv").then((path) => {
      cy.readFile(path).then((text) => {
        const lines = text.trim().split("\n");
        expect(lines[1], "download should match the on-screen display format").to.include("15-Mar-2024");
      });
    });
  });

  it("hidden columns (toggled off via Manage columns) are still included in the download", () => {
    clearDownloads();
    tq.app({ data, columns, props: { showDownloadButton: "{{true}}" } });
    // Hide the "Meta" column via the column-visibility manager. NOTE: the shared
    // tableSelector.selectColumnDropdown/selectColumnCheckbox constants are stale
    // (pre-NewTable-migration names); the real data-cy per ControlButtons.jsx are
    // `<name>-manage-columns-button` and `option-column-<header>`.
    cy.get('[data-cy="table1-manage-columns-button"]').click({ force: true });
    cy.get('[data-cy="option-column-meta"]').click({ force: true });
    cy.get("body").type("{esc}");
    cy.get(`[data-cy="meta-column-header"]`).should("not.exist");
    clickDownload("csv");
    waitForDownload("csv").then((path) => {
      cy.readFile(path).then((text) => {
        const lines = text.trim().split("\n");
        expect(
          lines[0],
          "getAllColumns() (exportData.js:12) includes hidden columns — 'Meta' header should NOT be in the export if the UI hid it"
        ).to.include("META");
      });
    });
  });

  it("action-button column (props.actions) is not included as a junk column in the download", () => {
    clearDownloads();
    tq.app({
      data,
      columns,
      props: {
        showDownloadButton: "{{true}}",
        actions: [{ name: "a1", buttonText: "Approve", position: "right", events: [] }],
      },
    });
    cy.get(`[data-cy="draggable-widget-table1"]`).eq(0).find("button.action-button").should("exist");
    clickDownload("csv");
    waitForDownload("csv").then((path) => {
      cy.readFile(path).then((text) => {
        const lines = text.trim().split("\n");
        expect(lines[0], "an 'ACTIONS' header column should not leak into the export").to.not.include("ACTIONS");
      });
    });
  });

  it("search/filter/sort active: download still contains rows that don't match the current view", () => {
    // exportData.js reads table.getCoreRowModel() (exportData.js:27) — the UNfiltered,
    // unsorted, unpaginated row model — so the export is expected to always contain
    // ALL rows regardless of the current search/filter/sort. Document actual behaviour.
    const rows = [
      { id: 1, "full name": "Alpha Row", address: { city: "Paris" }, status: "A", meta: {}, joined: "2024-01-01", emoji: "a" },
      { id: 2, "full name": "Beta Row", address: { city: "Lyon" }, status: "I", meta: {}, joined: "2024-01-02", emoji: "b" },
    ];
    clearDownloads();
    tq.app({ data: rows, columns, props: { showDownloadButton: "{{true}}" } });
    cy.get(tableSelector.searchInputField()).type("Alpha");
    tq.rows().should("have.length", 1);
    clickDownload("csv");
    waitForDownload("csv").then((path) => {
      cy.readFile(path).then((text) => {
        expect(text, "downloaded file should contain the row hidden by the active search").to.include("Beta Row");
      });
    });
  });
});
