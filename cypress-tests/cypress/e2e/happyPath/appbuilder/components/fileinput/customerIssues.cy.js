import { fake } from "Fixtures/fake";
import { closeQueryPanel } from "Support/utils/appBuilder/querymanager/queryPanel";
import { fileInputSelector } from "Selectors/appBuilder/components/fileInput";
import { fileInputText, fileInputFixtures } from "Texts/appBuilder/components/fileInput";
import {
  commitChange,
  openEditorSidebar,
  openAccordion,
  verifyAndModifyParameter,
  dropWidget,
  clearParameter,
} from "Support/utils/commonWidget";
import {
  attachFile,
} from "Support/utils/appBuilder/components/fileInput";

// Customer-issues facet — regression guards for defects found while automating this
// widget. Two are shared useFilePicker bugs that also affect File Button and File Picker;
// one is a palette/discoverability gap specific to File Input.
//
// ⚠ EVERY TEST ASSERTS THE **CORRECT** BEHAVIOUR, NOT TODAY'S, so all of them fail
// against the current build and are skipped until their fixes land. Asserting the buggy
// behaviour instead would pass now and break when the bug is fixed — defending the
// defect. Un-skip each one as its fix ships; it should go green immediately.
//
// This facet is the ONLY place a skip is allowed. One further open bug — accentColor
// being dead wiring — is asserted in styles.cy.js, where the rest of the style surface
// lives, and is left RED there rather than skipped: a bug found by a normal facet should
// show up as a failure.
//
// TODO(issue links): tracker IDs not recorded yet — add the issue URL above each test.

describe(
  "File Input customer issues",
  { testIsolation: false },
  () => {
    const widget = fileInputText.defaultWidgetName;
    const { validFile, validFileName, csvFile, secondCsvFile } = fileInputFixtures;

    beforeEach(() => {
      cy.apiLogin();
      cy.apiCreateApp(`${fake.companyName}-${Date.now()}-Fileinput-App`);
      cy.openApp();
      dropWidget(fileInputText.defaultWidgetText, widget, 500, 100);
      cy.waitForElement(fileInputSelector.field(widget));
      closeQueryPanel();
    });

    afterEach(() => {
      cy.apiDeleteApp();
    });

    // File Input is registered in `widgets` (widgetConfig.js:130, under the
    // "//Select inputs" comment) but appears in NO category valueSet in sectionConfig.js,
    // while its siblings FileButton and FilePicker each appear in exactly one.
    // ComponentsManagerTab.jsx:196 filters the grouped palette by valueSet membership, so
    // the widget renders only in the flat SEARCH results (:190-191) — a shipped component
    // a user can reach only by already knowing its name.
    it.skip("File Input should appear in a widget palette category, not only in search results", () => {
      cy.get('[data-cy="right-sidebar-components-button"]').click();
      cy.get('[data-cy="widget-list-box-file-input"]').should("exist");
    });

    // Shared useFilePicker bug. Going over Max files is silently absorbed:
    // useFilePicker.js:347 slices the batch down to maxFileCount and returns — no
    // rejection, no feedback, no toast. The user picks 3 files, sees "2 files selected",
    // and is never told anything was dropped. Every other bound (minSize, maxSize,
    // minFileCount, accepted-types) surfaces a rejection; silent truncation is the odd
    // one out. Also reproduces on File Button and File Picker.
    it.skip("Exceeding Max files should reject the selection, not silently truncate it", () => {
      openEditorSidebar(widget);
      openAccordion("Validation");
      verifyAndModifyParameter("Max files", "{{2}}");
      commitChange();

      // Three files against a cap of two.
      attachFile([csvFile, secondCsvFile, validFile]);

      cy.get(fileInputSelector.errorMessage(widget)).should("be.visible");
      // And nothing is quietly kept: the over-cap batch is refused whole.
      cy.get(fileInputSelector.summary(widget)).should("have.text", fileInputText.defaultPlaceholder);
    });

    // Shared useFilePicker bug. An empty/non-numeric Max size falls back to 51200000
    // (useFilePicker.js:45) rather than to the field's declared default. On File Input
    // those two numbers happen to be equal (fileinput.js:528), so clearing the field is
    // harmless HERE — but the value is restored by coincidence, not by design, and the
    // same code path weakens the cap ~50x on File Button. Asserted as: clearing the field
    // restores the DECLARED default, so a file under it is accepted again.
    it.skip("Clearing Max size should restore the declared default", () => {
      openEditorSidebar(widget);
      openAccordion("Validation");
      verifyAndModifyParameter("Max size (Bytes)", "{{500}}");
      commitChange();

      // 1934 bytes is over the 500 cap — proves the cap is live before it is cleared.
      attachFile(validFile);
      cy.get(fileInputSelector.summary(widget)).should("have.text", fileInputText.defaultPlaceholder);

      openEditorSidebar(widget);
      openAccordion("Validation");
      clearParameter("Max size (Bytes)");
      commitChange();

      // With the declared default restored, the same file now fits.
      attachFile(validFile);
      cy.get(fileInputSelector.summary(widget)).should("have.text", validFileName);
    });
  }
);
