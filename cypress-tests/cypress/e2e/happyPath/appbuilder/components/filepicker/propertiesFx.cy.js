import { fake } from "Fixtures/fake";
import { closeQueryPanel } from "Support/utils/appBuilder/querymanager/queryPanel";
import { commonWidgetSelector } from "Selectors/common";
import { filePickerSelector } from "Selectors/appBuilder/components/filePicker";
import {
  filePickerText,
  filePickerAccordion,
  filePickerFixtures,
  filePickerValidationBar,
  filePickerErrors,
  fxExemptFields,
} from "Texts/appBuilder/components/filePicker";
import {
  openEditorSidebar,
  openAccordion,
  verifyAndModifyParameter,
  dropWidget,
  enableFxAndBind,
  clickWidgetInput,
  expectNoFxButton,
  waitForDropSettle,
} from "Support/utils/commonWidget";
import {
  commitChange,
  verifyExposedValue,
  acceptAnyFileType,
  attachFile,
  attachGeneratedFile,
  expectInlineAndToastError,
  expectPickerBlocked,
  expectDropzoneOpensPicker,
  dragFilesOver,
  endDrag,
  selectParseFileType,
  spyPickerClick,
  clickDropzone,
  expectPickerClickCount,
  expectFileInList,
  validationFileTypeWrapper,
  openParsedValue,
  closeParsedValue,
  hoverInPreview,
  widgetTooltip,
} from "Support/utils/appBuilder/components/filePicker";

// PropertiesFx facet — fx/dynamic-binding half; the direct half is in properties.cy.js.
// Covers all 20 fx-capable items across the two blocks — 14 of 15 config.properties
// (filepicker.js:43-210) and all 6 config.validation (:216-295).
//   properties  label:44 · instructionText:53 · enableDropzone:62 · enablePicker:71 ·
//               enableMultiple:80 · parseContent:89 · parseFileType:100 · delimiter:125 ·
//               dynamicHeight:144 · loadingState:150 · visibility:159 ·
//               collapseWhenHidden:168 · disabledState:174 · tooltip:200
//   validation  enableValidation:217 · fileType:227 · minSize:237 · maxSize:248 ·
//               minFileCount:259 · maxFileCount:277
// Negative: tooltipFormat:186 is the one isFxNotRequired item in this block — asserted to
//           expose NO fx button. The style block's single exempt field lives in stylesFx.
//
// Every test binds the field to a COMPANION widget then drives the companion — changing
// the source is what proves the binding stays live rather than resolving once at bind time.
// The companion's default is chosen to be the OPPOSITE of the property's shipped default
// wherever possible, so the bound state is observable before the companion is even touched.
// GEOMETRY — companions must clear the widget.
// File Picker ships 220px tall (filepicker.js:8) and every test drops it at y=100, so it
// occupies roughly y=100-320. A companion dropped at y=300 lands ON TOP of it and
// clickWidgetInput then fails with "this element is not visible" — the widget is over it.
// The File Button and File Input specs use y=300 safely because those widgets are far
// shorter, so the coordinate does NOT port across the family.
const COMPANION_Y = 400;

// CODE-type fields ship with fx ALREADY ACTIVE — their definition entries carry no
// `fxActive` key (filepicker.js:376-389), unlike the toggles which set `fxActive: false`
// explicitly. The Inspector renders them as a code editor from the start and HIDES the fx
// button (`fx-button active` inside a `d-none` container), so enableFxAndBind cannot click
// it, and clicking it would turn fx OFF rather than on. For these, typing the binding
// straight into the field IS the fx path.

// clickWidgetInput ends with cy.waitForAutoSave(), which polls the EDITOR's save
// indicator — absent in preview, so it times out for 20s. This is the preview-safe form.
const flipToggleInPreview = (name = "toggleswitch1") =>
  cy.get(`[data-cy="${name}"]`).find("input").click({ force: true });

const dropCompanionToggle = (x, y = COMPANION_Y) => dropWidget("Toggle Switch", "toggleswitch1", x, y);

describe(
  "File Picker properties fx",
  { testIsolation: false, retries: { runMode: Number(Cypress.env("TJ_RETRIES") ?? 3), openMode: 0 } },
  () => {
    const widget = filePickerText.defaultWidgetName;
    const { validFile, validFileName, csvFile, csvFileName, secondCsvFile, secondCsvFileName } =
      filePickerFixtures;

    beforeEach(() => {
      cy.apiLogin();
      cy.apiCreateApp(`${fake.companyName}-${Date.now()}-Filepicker-App`);
      cy.openApp();
      cy.dragAndDropWidget(filePickerText.defaultWidgetText, 500, 100);
      waitForDropSettle(widget);
      closeQueryPanel();
      // File Picker ships fileType: 'image/*' (filepicker.js:234, :405), so a fresh widget
      // refuses every non-image — a CSV or TXT never reaches the size, count or parsing
      // logic under test. Neutralised once per test here; the shipped default is asserted
      // in basics.cy.js, and the tests that are ABOUT file types set their own value after
      // this runs.
      acceptAnyFileType(widget);
    });

    afterEach(function () {
      if (this.currentTest.state === "passed") cy.apiDeleteApp();
    });

    /* --------------------------------------------------------------- data ---- */

    it("should verify Label resolves and re-resolves a binding", () => {
      const first = fake.companyName;
      const second = fake.companyName;

      dropWidget("Text Input", "textinput1", 500, COMPANION_Y);
      openEditorSidebar("textinput1");
      verifyAndModifyParameter("Default value", first);
      commitChange();

      openEditorSidebar(widget);
      verifyAndModifyParameter("Label", "{{components.textinput1.value}}"); // source: filepicker.js:44
      commitChange();
      cy.get(filePickerSelector.title(widget)).should("have.text", first);

      // Re-resolving is the point: a binding that only read once at bind time would keep
      // the first value here.
      openEditorSidebar("textinput1");
      verifyAndModifyParameter("Default value", second);
      commitChange();
      cy.get(filePickerSelector.title(widget)).should("have.text", second);
    });

    it("should verify Placeholder follows a binding", () => {
      const text = fake.companyName;
      dropWidget("Text Input", "textinput1", 500, COMPANION_Y);
      openEditorSidebar("textinput1");
      verifyAndModifyParameter("Default value", text);
      commitChange();

      openEditorSidebar(widget);
      verifyAndModifyParameter("Placeholder", "{{components.textinput1.value}}"); // source: filepicker.js:53
      commitChange();
      cy.get(filePickerSelector.instructionText(widget)).should("have.text", text);
    });

    it("should verify Use drop zone follows a bound boolean", () => {
      dropCompanionToggle(500, COMPANION_Y);
      openEditorSidebar(widget);
      enableFxAndBind("Use drop zone", "{{components.toggleswitch1.value}}"); // source: filepicker.js:62
      commitChange();

      // Toggle Switch defaults to false, so the bound field starts OFF — the opposite of
      // this property's shipped default of true (filepicker.js:378), which is what makes
      // the binding observable before the companion is touched.
      dragFilesOver(widget, [{ name: "dragged.png", type: "image/png" }]);
      cy.get(filePickerSelector.dropzone(widget)).should("not.have.class", "is-dragging");
      endDrag(widget);

      clickWidgetInput("toggleswitch1");
      dragFilesOver(widget, [{ name: "dragged.png", type: "image/png" }]);
      cy.get(filePickerSelector.dropzone(widget)).should("have.class", "is-dragging");
      endDrag(widget);
    });

    it("should verify Use file picker follows a bound boolean", () => {
      dropCompanionToggle(500, COMPANION_Y);
      openEditorSidebar(widget);
      enableFxAndBind("Use file picker", "{{components.toggleswitch1.value}}"); // source: filepicker.js:71
      commitChange();

      // Both polarities inside ONE preview session — the only place the forwarded click is
      // observable (the editor canvas intercepts it) and the only way to reach both states
      // without navigating back to the editor. The Toggle Switch is a runtime widget, so it
      // can be flipped right there.
      // ONE spy, then cumulative counts — sinon cannot wrap the same method twice, so the
      // single-shot helper cannot be called for both polarities in one test.
      cy.openPreview(filePickerSelector.widget(widget));
      spyPickerClick(widget);
      clickDropzone(widget);
      expectPickerClickCount(0); // picker off: the click is not forwarded

      flipToggleInPreview();
      clickDropzone(widget);
      expectPickerClickCount(1); // picker on: forwarded exactly once more
    });

    it("should verify Allow picking multiple files follows a bound boolean", () => {
      dropCompanionToggle(500, COMPANION_Y);
      openEditorSidebar(widget);
      enableFxAndBind("Allow picking multiple files", "{{components.toggleswitch1.value}}"); // source: filepicker.js:80
      commitChange();

      cy.get(filePickerSelector.inputField(widget))
        .scrollIntoView()
        .should("not.have.attr", "multiple");

      clickWidgetInput("toggleswitch1");
      cy.get(filePickerSelector.inputField(widget)).scrollIntoView().should("have.attr", "multiple");
      // The count readout is gated on the same flag (ValidationBar.jsx:16), so it appears
      // with it — a second, independent signal that the binding reached the widget.
      cy.get(filePickerSelector.countInfo(widget)).should(
        "have.text",
        filePickerValidationBar.countMax(0, 2)
      );
    });

    it("should verify Enable parsing follows a bound boolean", () => {
      dropCompanionToggle(500, COMPANION_Y);
      openEditorSidebar(widget);
      enableFxAndBind("Enable parsing", "{{components.toggleswitch1.value}}"); // source: filepicker.js:89
      commitChange();

      // parseFileType is conditionallyRender'd on this flag (filepicker.js:119-122), so
      // the Inspector control appearing is the observable.
      openEditorSidebar(widget);
      cy.get('[data-cy="dropdown-file-type"]').should("not.exist");

      clickWidgetInput("toggleswitch1");
      openEditorSidebar(widget);
      cy.get('[data-cy="dropdown-file-type"]').should("be.visible");
    });

    it("should verify File type drives parsing when bound", () => {
      // parseFileType's own fx path. Bound to a Text Input holding the option VALUE, not
      // its label — the config's options carry `csv` as the value (filepicker.js:105).
      dropWidget("Text Input", "textinput1", 500, COMPANION_Y);
      openEditorSidebar("textinput1");
      verifyAndModifyParameter("Default value", "csv");
      commitChange();

      openEditorSidebar(widget);
      cy.get(commonWidgetSelector.parameterTogglebutton("Enable parsing")).click();
      cy.waitForAutoSave();
      enableFxAndBind("File type", "{{components.textinput1.value}}"); // source: filepicker.js:100
      commitChange();

      attachFile(csvFile);
      expectFileInList(csvFileName);
      // sample-a.csv is id,name,role — a bound `csv` that failed to resolve would leave
      // auto-detect in place, which parses the same file to the same shape, so the row
      // KEY COUNT is asserted rather than mere presence of a parsed value.
      openParsedValue(widget);
      cy.get('[data-cy="inspector-parsedvalue-label"]').first().click();
      cy.get('[data-cy="inspector-1-value"]').first().should("have.text", "{3}");
      closeParsedValue();
    });

    it("should verify Delimiter resolves a binding, changing how a CSV splits", () => {
      // The delimiter character comes from a Text Input, so the source is a string.
      // Row count is identical either way, so only the KEY count per row shows the split:
      // a semicolon delimiter against a comma-separated file yields ONE key per row.
      dropWidget("Text Input", "textinput1", 500, COMPANION_Y);
      openEditorSidebar("textinput1");
      verifyAndModifyParameter("Default value", ";");
      commitChange();

      openEditorSidebar(widget);
      cy.get(commonWidgetSelector.parameterTogglebutton("Enable parsing")).click();
      cy.waitForAutoSave();
      // Delimiter is gated on BOTH parseContent and parseFileType === 'csv'
      // (filepicker.js:132-141), so the type has to be set or the field never renders.
      selectParseFileType("CSV");
      openEditorSidebar(widget);
      verifyAndModifyParameter("Delimiter", "{{components.textinput1.value}}"); // source: filepicker.js:125
      commitChange();

      attachFile(csvFile);
      expectFileInList(csvFileName);
      openParsedValue(widget);
      cy.get('[data-cy="inspector-parsedvalue-label"]').first().click();
      cy.get('[data-cy="inspector-1-value"]').first().should("have.text", "{1}");
      closeParsedValue();
    });

    it("should verify Dynamic height follows a bound boolean", () => {
      dropCompanionToggle(500, COMPANION_Y);
      openEditorSidebar(widget);
      openAccordion(filePickerAccordion.additionalActions);
      enableFxAndBind("Dynamic height", "{{components.toggleswitch1.value}}"); // source: filepicker.js:144
      commitChange();

      // Dynamic height only takes effect in PREVIEW, by design — the editor pins a widget
      // to its layout height so it stays draggable, so the min-height style never appears
      // on the canvas whatever the property says. The binding is therefore driven here and
      // read in preview, with the toggle flipped there (autosave-free).
      cy.openPreview(filePickerSelector.widget(widget));
      cy.get(filePickerSelector.dropzone(widget)).parent().should("not.have.attr", "style");

      flipToggleInPreview();
      cy.get(filePickerSelector.dropzone(widget))
        .parent()
        .invoke("attr", "style")
        .should("match", /min-height:\s*\d+px/);
    });

    it("should verify Show loading state follows a bound boolean", () => {
      dropCompanionToggle(500, COMPANION_Y);
      openEditorSidebar(widget);
      openAccordion(filePickerAccordion.additionalActions);
      enableFxAndBind("Show loading state", "{{components.toggleswitch1.value}}"); // source: filepicker.js:150
      commitChange();

      cy.get(filePickerSelector.loader(widget)).should("not.exist");

      clickWidgetInput("toggleswitch1");
      cy.get(filePickerSelector.loader(widget)).scrollIntoView().should("be.visible");
      cy.get(filePickerSelector.dropzone(widget)).should("not.exist");
      verifyExposedValue("isLoading", "Boolean", "true");
    });

    it("should verify Visibility follows a bound boolean", () => {
      dropCompanionToggle(500, COMPANION_Y);
      openEditorSidebar(widget);
      openAccordion(filePickerAccordion.additionalActions);
      enableFxAndBind("Visibility", "{{components.toggleswitch1.value}}"); // source: filepicker.js:159
      commitChange();

      // The toggle ships false, so binding it hides the widget immediately — the opposite
      // of visibility's own default of true (filepicker.js:385).
      // CSS-hidden, not unmounted — see FilePicker.jsx:143.
      cy.get(filePickerSelector.widget(widget)).should("not.be.visible");

      clickWidgetInput("toggleswitch1");
      cy.get(filePickerSelector.widget(widget)).scrollIntoView().should("exist");
      verifyExposedValue("isVisible", "Boolean", "true");
    });

    it("should verify Collapse when hidden follows a bound boolean", () => {
      // Measured on the NEIGHBOUR, not on the widget. A hidden File Picker is display:none
      // (FilePicker.jsx:143) and its positioned wrapper is hidden with it, so the widget's
      // own height reads 0 whether or not the space was reclaimed — the only observable is
      // whether what sits below it moves up. properties.cy.js owns the direct pair; this
      // proves a BOUND value drives the same behaviour.
      dropWidget("Text", "text1", 500, 380);
      dropCompanionToggle(500, 520);

      openEditorSidebar(widget);
      openAccordion(filePickerAccordion.additionalActions);
      enableFxAndBind("Collapse when hidden", "{{components.toggleswitch1.value}}"); // source: filepicker.js:168
      commitChange();

      // Hide the widget so collapsing has something to do.
      openEditorSidebar(widget);
      openAccordion(filePickerAccordion.additionalActions);
      cy.get(commonWidgetSelector.parameterTogglebutton("Visibility")).click();
      cy.waitForAutoSave();

      // Wait on the NEIGHBOUR: every widget-scoped selector is display:none once hidden,
      // including the draggable wrapper, so openPreview cannot key on any of them.
      cy.openPreview(commonWidgetSelector.draggableWidget("text1"));

      cy.get(commonWidgetSelector.draggableWidget("text1"))
        .then(($t) => $t[0].getBoundingClientRect().top)
        .then((topNotCollapsed) => {
          // Toggle ships false, so collapse starts OFF and the gap is held open.
          flipToggleInPreview();
          cy.get(commonWidgetSelector.draggableWidget("text1")).should(($t) => {
            expect(
              $t[0].getBoundingClientRect().top,
              "bound collapse reclaims the hidden widget's space"
            ).to.be.lessThan(topNotCollapsed);
          });
        });
    });

    it("should verify Disable follows a bound boolean", () => {
      dropCompanionToggle(500, COMPANION_Y);
      openEditorSidebar(widget);
      openAccordion(filePickerAccordion.additionalActions);
      enableFxAndBind("Disable", "{{components.toggleswitch1.value}}"); // source: filepicker.js:174
      commitChange();

      cy.get(filePickerSelector.dropzone(widget))
        .scrollIntoView()
        .should("have.attr", "tabindex", "0");

      clickWidgetInput("toggleswitch1");
      expectPickerBlocked(widget);
      verifyExposedValue("isDisabled", "Boolean", "true");
    });

    it("should verify Tooltip content resolves a binding", () => {
      dropWidget("Text Input", "textinput1", 500, COMPANION_Y);
      openEditorSidebar("textinput1");
      verifyAndModifyParameter("Default value", "Bound tooltip text");
      commitChange();

      openEditorSidebar(widget);
      openAccordion(filePickerAccordion.additionalActions);
      // Typed straight into the code field rather than by display name: tooltipFormat:186
      // shares the visible "Tooltip" label with this field, which sets showLabel:false
      // (filepicker.js:208), so addressing it by name is ambiguous.
      cy.get(commonWidgetSelector.tooltipInputField).clearAndTypeOnCodeMirror(
        "{{components.textinput1.value}}"
      );
      commitChange();

      // Only observable on the preview — the editor canvas swallows the pointer events
      // Radix needs to open it. Unlike the rest of this file the companion is seeded rather
      // than re-driven: resolution is what this asserts.
      hoverInPreview(filePickerSelector.title(widget));
      cy.get(widgetTooltip).should("contain.text", "Bound tooltip text");
    });

    /* --------------------------------------------------------- validation ---- */

    it("should verify Make this field mandatory follows a bound boolean", () => {
      dropCompanionToggle(500, COMPANION_Y);
      openEditorSidebar(widget);
      openAccordion("Validation");
      enableFxAndBind("Make this field mandatory", "{{components.toggleswitch1.value}}"); // source: filepicker.js:217
      commitChange();

      cy.get(filePickerSelector.mandatoryIndicator(widget)).should("not.exist");

      clickWidgetInput("toggleswitch1");
      cy.get(filePickerSelector.mandatoryIndicator(widget)).scrollIntoView().should("be.visible");
      cy.get(filePickerSelector.ariaRequired(widget)).should("exist");
      verifyExposedValue("isMandatory", "Boolean", "true");
    });

    it("should verify Accept file types via fx: a bound pattern gates the same way", () => {
      // The direct half drives the Inspector dropdown; the fx half bypasses it entirely and
      // types a raw pattern, which is the only way to prove the field accepts an arbitrary
      // value rather than just the seven canned options.
      dropWidget("Text Input", "textinput1", 500, COMPANION_Y);
      openEditorSidebar("textinput1");
      verifyAndModifyParameter("Default value", "image/*");
      commitChange();

      openEditorSidebar(widget);
      openAccordion("Validation");
      // Hand-rolled control, so the fx button is reached through the wrapper rather than by
      // parameter name. source: Inspector/Components/FilePicker.jsx:39
      cy.get(`${validationFileTypeWrapper} [data-cy="filetype-fx-button"]`).click();
      cy.get(`${validationFileTypeWrapper} .cm-content`).clearAndTypeOnCodeMirror(
        "{{components.textinput1.value}}"
      ); // source: filepicker.js:227
      commitChange();

      attachFile(csvFile);
      cy.get(filePickerSelector.filePane(widget)).should("not.exist");

      attachFile(validFile);
      expectFileInList(validFileName);
    });

    it("should verify Min size limit follows a binding", () => {
      dropWidget("Number Input", "numberinput1", 500, COMPANION_Y);
      openEditorSidebar("numberinput1");
      verifyAndModifyParameter("Default value", "{{500}}");
      commitChange();

      openEditorSidebar(widget);
      openAccordion("Validation");
      verifyAndModifyParameter("Min size limit (Bytes)", "{{components.numberinput1.value}}"); // source: filepicker.js:237
      commitChange();

      // 100 bytes clears the shipped floor of 50 but not the bound 500, so a rejection here
      // can only come from the binding.
      attachGeneratedFile({ sizeBytes: 100, name: "hundred.txt" }, widget);
      expectInlineAndToastError(filePickerErrors.tooSmall("hundred.txt", 100, 500), widget);

      attachGeneratedFile({ sizeBytes: 500, name: "fivehundred.txt" }, widget);
      expectFileInList("fivehundred.txt");
    });

    it("should verify Max size limit follows a binding", () => {
      dropWidget("Number Input", "numberinput1", 500, COMPANION_Y);
      openEditorSidebar("numberinput1");
      verifyAndModifyParameter("Default value", "{{1024}}");
      commitChange();

      openEditorSidebar(widget);
      openAccordion("Validation");
      verifyAndModifyParameter("Max size limit (Bytes)", "{{components.numberinput1.value}}"); // source: filepicker.js:248
      commitChange();

      attachGeneratedFile({ sizeBytes: 2048, name: "twokb.txt" }, widget);
      expectInlineAndToastError(filePickerErrors.tooLarge("twokb.txt", 2048, 1024), widget);

      attachGeneratedFile({ sizeBytes: 1024, name: "onekb.txt" }, widget);
      expectFileInList("onekb.txt");
    });

    it("should verify Min file count follows a binding", () => {
      dropWidget("Number Input", "numberinput1", 500, COMPANION_Y);
      openEditorSidebar("numberinput1");
      verifyAndModifyParameter("Default value", "{{2}}");
      commitChange();

      // Gated across blocks on properties.enableMultiple (filepicker.js:269-275), so the
      // gate is opened before the field can be bound at all.
      openEditorSidebar(widget);
      cy.get(commonWidgetSelector.parameterTogglebutton("Allow picking multiple files")).click();
      cy.waitForAutoSave();

      openEditorSidebar(widget);
      openAccordion("Validation");
      verifyAndModifyParameter("Min file count", "{{components.numberinput1.value}}"); // source: filepicker.js:259
      commitChange();

      attachFile(csvFile);
      cy.get(filePickerSelector.errorMessage(widget)).should(
        "have.text",
        filePickerErrors.minCountShortfall(2)
      );
      verifyExposedValue("isValid", "Boolean", "false");

      attachFile(secondCsvFile);
      cy.get(filePickerSelector.errorMessage(widget)).should("not.exist");
      verifyExposedValue("isValid", "Boolean", "true");
    });

    it("should verify Max file count follows a binding", () => {
      dropWidget("Number Input", "numberinput1", 500, COMPANION_Y);
      openEditorSidebar("numberinput1");
      verifyAndModifyParameter("Default value", "{{1}}");
      commitChange();

      openEditorSidebar(widget);
      cy.get(commonWidgetSelector.parameterTogglebutton("Allow picking multiple files")).click();
      cy.waitForAutoSave();

      openEditorSidebar(widget);
      openAccordion("Validation");
      verifyAndModifyParameter("Max file count", "{{components.numberinput1.value}}"); // source: filepicker.js:277
      commitChange();

      attachFile(csvFile);
      expectFileInList(csvFileName);

      // Refusal asserted by STATE: past the cap the picker disables itself and the refusal
      // produces no inline error and no toast (FP-13), so the observable contract is that
      // the selection does not grow and the held file survives.
      attachFile(secondCsvFile);
      expectFileInList(csvFileName);
      cy.get(filePickerSelector.fileName(widget, secondCsvFileName)).should("not.exist");
      cy.get(filePickerSelector.fileListItem(widget)).should("have.length", 1);
    });

    /* ----------------------------------------------------------- negative ---- */

    it("should verify Tooltip format exposes no fx button, while the Tooltip code field does", () => {
      const { control, accordion } = fxExemptFields.properties[0];
      openEditorSidebar(widget);
      openAccordion(accordion);

      // Located by its control, not by name: tooltipFormat shares the visible "Tooltip"
      // label with the fx-CAPABLE `tooltip` code field, so `tooltip-fx-button` does exist
      // and asserting on the name would find the wrong element and pass.
      expectNoFxButton(() => cy.get(control), "Tooltip"); // source: filepicker.js:194
    });
  }
);
