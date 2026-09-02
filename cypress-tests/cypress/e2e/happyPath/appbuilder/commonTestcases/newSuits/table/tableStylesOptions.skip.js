import { fake } from "Fixtures/fake";
import { commonWidgetSelector } from "Selectors/common";
import { tableText } from "Texts/table";
import { tableSelector } from "Selectors/table";
import {
  resizeTableWidget,
  toggleTableProperty,
  verifyAndModifyToggleFx,
  dataCsvAssertionHelper,
  dataPdfAssertionHelper,
} from "Support/utils/appBuilder/components/table";
import { openEditorSidebar, openAccordion } from "Support/utils/commonWidget";
import { deleteDownloadsFolder } from "Support/utils/common";
import { resizeQueryPanel } from "Support/utils/appBuilder/querymanager/queryPanel";

// ---------------------------------------------------------------------------
// Chunk 5 (DEFERRED STUB) — Table styles, table-option toggles and download menu.
//
// Scope when picked up:
//   1. ~15 styles from WidgetManager/widgets/table.js:364-525, grouped by the
//      `accordian` key — "Column Header" (columnTitleColor, columnHeaderWrap,
//      headerCasing, header background/text), "Row" (selectedRowColor, rowStyle,
//      cellHeight, maxRowHeight) and the container styles (actionButtonRadius,
//      background, borderRadius, border, boxShadow, padding). NOTE several of these
//      share the displayName "Background"/"Type" across accordions, so scope each
//      swatch to its accordion body — the un-scoped selector collision is exactly
//      what quarantined the modalHappyPath styles test (STATUS.md row #7).
//   2. Table-option toggles: showSearch ("Show search"), showDownloadButton
//      ("Show download button"), enableFiltering ("Enable filtering"),
//      showUpdateButtons ("Show update buttons"), hideColumnSelectorButton,
//      showRefreshButton, disabledState ("Disable"), visibility ("Visibility").
//      Drive them with `toggleTableProperty(<displayName>)` (Support/utils/table.js)
//      and assert the corresponding toolbar control appears/disappears.
//   3. Download menu: `tableSelector.buttonDownloadDropdown(name)` opens the menu;
//      `optionDownloadCSV` / `optionDownloadExcel` / `optionDownloadPdf` are the
//      entries. `deleteDownloadsFolder()` (Support/utils/common) clears the folder
//      first and `dataCsvAssertionHelper` / `dataPdfAssertionHelper`
//      (Support/utils/table.js) build the expected file contents from
//      tableText.defaultInput.
//
// Deferred because styles need a per-accordion scoping pass plus computed-CSS
// assertions, which is independent research from the behavioural chunks.
// ---------------------------------------------------------------------------
const tableWidget = (name) =>
  `${commonWidgetSelector.draggableWidget(name)}:eq(0)`;

describe.skip(
  "Table — styles, options & download",
  { testIsolation: false },
  () => {
    const name = tableText.defaultWidgetName;

    beforeEach(() => {
      cy.apiLogin();
      cy.apiCreateApp(`${fake.companyName}-table-styles-App`);
      cy.openApp();
      deleteDownloadsFolder();
      cy.viewport(1400, 2200);
      cy.dragAndDropWidget("Table", 250, 100);
      cy.hideTooltip();
      cy.modifyCanvasSize(900, 800);
      cy.get("[data-cy='left-sidebar-settings-button']").click();
      resizeTableWidget(name, 750, 600);
      resizeQueryPanel("1");
      openEditorSidebar(name);
    });
    afterEach(() => {
      cy.apiDeleteApp();
    });

    it("applies the column-header and row styles", () => {
      // TODO: scope each swatch to its accordion body before clicking — several
      // styles share the displayName "Background"/"Type" across accordions.
    });

    it("shows and hides the toolbar controls via the table option toggles", () => {
      // TODO: toggleTableProperty("Show search") -> assert
      // tableSelector.searchInputField(name) no longer exists; repeat for the
      // download / filter / update-button toggles.
    });

    it("downloads the table data as CSV and PDF", () => {
      // TODO: buttonDownloadDropdown(name) -> optionDownloadCSV -> read the file
      // and compare against dataCsvAssertionHelper(tableText.defaultInput).
    });
  }
);
