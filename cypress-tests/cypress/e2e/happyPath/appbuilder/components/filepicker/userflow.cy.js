import { fake } from "Fixtures/fake";
import { closeQueryPanel } from "Support/utils/appBuilder/querymanager/queryPanel";
import { commonSelectors, commonWidgetSelector } from "Selectors/common";
import { filePickerSelector } from "Selectors/appBuilder/components/filePicker";
import {
  filePickerText,
  filePickerFixtures,
  filePickerValidationBar,
  filePickerErrors,
} from "Texts/appBuilder/components/filePicker";
import {
  commitChange,
  verifyExposedValue,
  openEditorSidebar,
  openAccordion,
  verifyAndModifyParameter,
  dropWidget,
} from "Support/utils/commonWidget";
import {
  acceptAnyFileType,
  attachFile,
  expectInlineAndToastError,
  expectFileInList,
  deleteFileFromList,
  expectDropzoneOpensPicker,
  dragFilesOver,
  endDrag,
  selectParseFileType,
  selectValidationFileType,
} from "Support/utils/appBuilder/components/filePicker";

// Userflow facet — realistic end-to-end journeys rather than one field at a time, so a
// plausible COMBINATION of settings gets exercised.
// Driven in the EDITOR so the Inspector is available and every step can assert the exposed
// contract (file / isValid / isParsing) as well as the DOM. Preview is covered by
// events.cy.js and csa.cy.js.
describe(
  "File Picker userflow",
  { testIsolation: false },
  () => {
    const widget = filePickerText.defaultWidgetName;
    const { validFile, validFileName, csvFile, csvFileName, secondCsvFile, secondCsvFileName } =
      filePickerFixtures;

    beforeEach(() => {
      cy.apiLogin();
      cy.apiCreateApp(`${fake.companyName}-${Date.now()}-Filepicker-App`);
      cy.openApp();
      dropWidget(filePickerText.defaultWidgetText, widget, 500, 100);
      cy.waitForElement(filePickerSelector.widget(widget));
      closeQueryPanel();
      // Neutralises the shipped 'image/*' filter — see acceptAnyFileType. The default
      // itself is asserted in basics.cy.js.
      acceptAnyFileType(widget);
    });

    afterEach(() => {
      cy.apiDeleteApp();
    });

    it("should build a mandatory two-CSV parsing dropzone and drive it through reject, shortfall, complete and removal", () => {
      // ── build ──
      openEditorSidebar(widget);
      verifyAndModifyParameter("Label", "Attach statements");
      commitChange();

      openEditorSidebar(widget);
      verifyAndModifyParameter("Placeholder", "Drop two CSVs here");
      commitChange();

      openEditorSidebar(widget);
      cy.get(commonWidgetSelector.parameterTogglebutton("Allow picking multiple files")).click();
      cy.waitForAutoSave();

      openEditorSidebar(widget);
      cy.get(commonWidgetSelector.parameterTogglebutton("Enable parsing")).click();
      cy.waitForAutoSave();
      selectParseFileType("CSV");

      openEditorSidebar(widget);
      openAccordion("Validation");
      cy.get(commonWidgetSelector.parameterTogglebutton("Make this field mandatory")).click();
      cy.waitForAutoSave();
      selectValidationFileType("Spreadsheet files");

      openEditorSidebar(widget);
      openAccordion("Validation");
      verifyAndModifyParameter("Min file count", "{{2}}");
      commitChange();

      // ── empty and mandatory ──
      cy.get(filePickerSelector.title(widget)).should("contain.text", "Attach statements");
      cy.get(filePickerSelector.mandatoryIndicator(widget)).should("be.visible");
      cy.get(filePickerSelector.ariaRequired(widget)).should("exist");
      cy.get(filePickerSelector.instructionText(widget)).should("have.text", "Drop two CSVs here");
      // min 2 and max 2 are equal, so ValidationBar takes its "Min N files" branch
      // (ValidationBar.jsx:34) rather than the N/M one.
      cy.get(filePickerSelector.countInfo(widget)).should(
        "have.text",
        filePickerValidationBar.countMin(0, 2)
      );
      verifyExposedValue("isMandatory", "Boolean", "true", widget);
      verifyExposedValue("isValid", "Boolean", "false", widget);
      verifyExposedValue("file", "Array", "[0]", widget);

      // ── wrong type: rejected, and the reason is REPLACED ──
      // The toast carries the real reason, but the inline node does not keep it: an effect
      // at useFilePicker.js:532 rewrites uiErrorMessage to the generic mandatory string
      // whenever isMandatory && no files && isTouched — all true right after a rejection
      // that kept nothing. So a user on a mandatory picker is told the field is required
      // rather than that the type was wrong (FP-14).
      attachFile(validFile);
      cy.verifyToastMessage(
        commonSelectors.toastMessage,
        filePickerErrors.invalidTypeFor(validFileName, ".xls,.xlsx,.csv,.ods"),
        false
      );
      cy.get(filePickerSelector.errorMessage(widget)).should(
        "have.text",
        filePickerErrors.mandatory
      );
      cy.get(filePickerSelector.filePane(widget)).should("not.exist");
      verifyExposedValue("file", "Array", "[0]", widget);

      // ── one file: accepted but short of the floor ──
      // The shortfall message is TRANSIENT — onDropAccepted clears it 5s later
      // (useFilePicker.js:425) — so it is asserted before the slower checks (FP-9).
      attachFile(csvFile);
      cy.get(filePickerSelector.errorMessage(widget)).should(
        "have.text",
        filePickerErrors.minCountShortfall(2)
      );
      expectFileInList(csvFileName);
      verifyExposedValue("isValid", "Boolean", "false", widget);

      // ── second file: the floor is met and the error clears ──
      attachFile(secondCsvFile);
      expectFileInList(secondCsvFileName);
      cy.get(filePickerSelector.errorMessage(widget)).should("not.exist");
      cy.get(filePickerSelector.countInfo(widget)).should(
        "have.text",
        filePickerValidationBar.countMin(2, 2)
      );
      verifyExposedValue("isValid", "Boolean", "true", widget);
      verifyExposedValue("file", "Array", "[2]", widget);

      // ── parsing settled, and it actually parsed ──
      verifyExposedValue("isParsing", "Boolean", "false", widget);
      verifyExposedValue(["files", "0", "parsedValue", "1"], "Object", "{3}", widget);

      // ── removing one drops back below the floor: the flow is reversible ──
      // isValid flips, but NO message is shown. The shortfall string is set only from
      // onDropAccepted (useFilePicker.js:421-425) — the removal path
      // (handleRemoveFile, :445-461) never sets it. So the picker ends up invalid with
      // nothing on screen saying why, the same user-visible outcome as FP-9 reached by a
      // different route.
      deleteFileFromList(secondCsvFileName);
      verifyExposedValue("isValid", "Boolean", "false", widget);
      verifyExposedValue("file", "Array", "[1]", widget);
      cy.get(filePickerSelector.errorMessage(widget)).should("not.exist");

      // ── and the first file is still selectable again afterwards: a widget that had
      //    silently stopped accepting would satisfy every assertion above ──
      attachFile(secondCsvFile);
      expectFileInList(secondCsvFileName);
      verifyExposedValue("isValid", "Boolean", "true", widget);
    });

    it("should build a drop-only zone where clicking cannot open the picker but dragging still works", () => {
      // The two entry points are independent properties (enableDropzone / enablePicker) and
      // this is the combination a real app uses to force drag-and-drop. Neither flag changes
      // the DOM, so the flow asserts the two BEHAVIOURS.
      //
      // Ordering is forced by where each behaviour is observable: drag state and the exposed
      // contract are readable on the canvas, but the forwarded CLICK is not — the editor's
      // selection overlays intercept it. So every editor action happens first and preview is
      // the final hop, with no way back.
      openEditorSidebar(widget);
      verifyAndModifyParameter("Label", "Drag only");
      commitChange();

      openEditorSidebar(widget);
      cy.get(commonWidgetSelector.parameterTogglebutton("Use file picker")).click();
      cy.waitForAutoSave();

      // Drop zone still on: a drag registers even with the picker off. This is the control
      // for the "no entry point" state further down.
      dragFilesOver(widget, [{ name: "dragged.csv", type: "text/csv" }]);
      cy.get(filePickerSelector.dropzone(widget)).should("have.class", "is-dragging");
      endDrag(widget);

      // And the widget is not disabled — a file reaching the input is still accepted and
      // still reported, so turning the click affordance off is not the same as turning the
      // widget off.
      attachFile(csvFile);
      expectFileInList(csvFileName);
      verifyExposedValue("file", "Array", "[1]", widget);
      verifyExposedValue("isValid", "Boolean", "true", widget);

      // Drop zone off as well: now there is no entry point at all, and the widget still
      // renders rather than collapsing or erroring.
      openEditorSidebar(widget);
      cy.get(commonWidgetSelector.parameterTogglebutton("Use drop zone")).click();
      cy.waitForAutoSave();

      dragFilesOver(widget, [{ name: "dragged.csv", type: "text/csv" }]);
      cy.get(filePickerSelector.dropzone(widget)).should("not.have.class", "is-dragging");
      endDrag(widget);
      cy.get(filePickerSelector.dropzone(widget)).should("be.visible");

      // Last, in preview: the click genuinely does not reach the file input.
      cy.openPreview(filePickerSelector.widget(widget));
      expectDropzoneOpensPicker(widget, false);
    });

  }
);
