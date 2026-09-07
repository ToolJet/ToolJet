import { fake } from "Fixtures/fake";
import { closeQueryPanel } from "Support/utils/appBuilder/querymanager/queryPanel";
import { commonWidgetSelector } from "Selectors/common";
import { fileInputSelector } from "Selectors/appBuilder/components/fileInput";
import { fileInputText, fileInputAccordion, fileInputFixtures } from "Texts/appBuilder/components/fileInput";
import {
  openEditorSidebar,
  openAccordion,
  verifyAndModifyParameter,
  waitForDropSettle,
  dropWidget,
  enableFxAndBind,
  expectNoFxButton,
  openStyleAccordion,
} from "Support/utils/commonWidget";
import { commitChange, attachFile, unlockLabelWidth, toggleIconVisibility } from "Support/utils/appBuilder/components/fileInput";

// StylesFx facet — fx/dynamic-binding half; the direct half is in styles.cy.js.
// Covers all 12 fx-capable config.styles items — source: fileinput.js:233-423
//   labelColor:234 · labelFontSize:240 · alignment:246 · icon:320 · iconColor:327
//   backgroundColor:337 · borderColor:346 · accentColor:355 · textColor:364
//   errTextColor:373 · borderRadius:382 · boxShadow:394
// Negative: the 5 isFxNotRequired items — direction:267 · auto:278 · labelWidth:294 ·
//   widthType:308 · padding:416 — each asserted to expose NO fx button.
//
// Colour sources are TEXT INPUTS holding a hex, not Color Pickers. That is a deliberate
// departure from the File Button spec: clearAndTypeOnCodeMirror races the CodeMirror
// autocomplete on long identifiers, and every recorded failure of that race has been a
// `colorpicker1.selectedColorHex` binding while short `.value` bindings pass. Using
// `.value` sidesteps a known-flaky path rather than inheriting it.
describe(
  "File Input styles fx",
  { testIsolation: false, retries: { runMode: 3, openMode: 0 } },
  () => {
    const widget = fileInputText.defaultWidgetName;
    const { csvFile } = fileInputFixtures;

    // A Text Input seeded with a value, used as the live fx source.
    const dropSource = (value, name = "textinput1") => {
      dropWidget("Text Input", name, 500, 300);
      openEditorSidebar(name);
      verifyAndModifyParameter("Default value", value);
      commitChange();
    };

    const reseedSource = (value, name = "textinput1") => {
      openEditorSidebar(name);
      verifyAndModifyParameter("Default value", value);
      commitChange();
    };

    beforeEach(() => {
      cy.apiLogin();
      cy.apiCreateApp(`${fake.companyName}-${Date.now()}-Fileinput-App`);
      cy.openApp();
      closeQueryPanel();
      cy.dragAndDropWidget(fileInputText.defaultWidgetText, 500, 100);
      waitForDropSettle(widget);
    });

    afterEach(function () {
      if (this.currentTest.state === "passed") cy.apiDeleteApp();
    });

    it("should verify Color follows and re-resolves a bound colour", () => {
      dropSource("#ff0000");
      openStyleAccordion(widget, fileInputAccordion.styleLabel);
      enableFxAndBind("Color", "{{components.textinput1.value}}"); // source: fileinput.js:234
      commitChange();
      cy.get(fileInputSelector.labelText(widget)).scrollIntoView().should("have.css", "color", "rgb(255, 0, 0)");

      // Prove the binding is live: change the source, not the target.
      reseedSource("#00ff00");
      cy.get(fileInputSelector.labelText(widget)).scrollIntoView().should("have.css", "color", "rgb(0, 255, 0)");
    });

    it("should verify Size resolves and re-resolves a numeric binding", () => {
      dropWidget("Number Input", "numberinput1", 500, 300);
      openEditorSidebar("numberinput1");
      verifyAndModifyParameter("Default value", "32");
      commitChange();

      openStyleAccordion(widget, fileInputAccordion.styleLabel);
      enableFxAndBind("Size", "{{components.numberinput1.value}}"); // source: fileinput.js:240
      commitChange();
      cy.get(fileInputSelector.label(widget)).scrollIntoView().should("have.css", "font-size", "32px");

      openEditorSidebar("numberinput1");
      verifyAndModifyParameter("Default value", "18");
      commitChange();
      cy.get(fileInputSelector.label(widget)).scrollIntoView().should("have.css", "font-size", "18px");
    });

    it("should verify Alignment follows a bound string", () => {
      dropSource("side");
      openStyleAccordion(widget, fileInputAccordion.styleLabel);
      enableFxAndBind("Alignment", "{{components.textinput1.value}}"); // source: fileinput.js:246
      commitChange();
      cy.get(fileInputSelector.widget(widget)).should("have.class", "tw-flex-row");

      reseedSource("top");
      cy.get(fileInputSelector.widget(widget)).should("have.class", "tw-flex-col");
    });

    it("should verify Icon follows a bound icon name", () => {
      dropSource("IconHome");
      openStyleAccordion(widget, fileInputAccordion.styleField);
      toggleIconVisibility(); // the icon is inert until visibility is on
      enableFxAndBind("Icon", "{{components.textinput1.value}}"); // source: fileinput.js:320
      commitChange();
      cy.get(fileInputSelector.icon(widget)).scrollIntoView().should("exist");

      // The rendered PATH is the observable, not the class. File Input passes its own
      // className to TablerIcon (FileInput.jsx:313), which REPLACES tabler's generated
      // `tabler-icon-<name>` class — the svg ships only `cursor-pointer clear-indicator`,
      // so the icon's identity is not in its class list. File Button passes no className,
      // which is why the class assertion works there and cannot work here.
      cy.get(fileInputSelector.icon(widget))
        .find("path")
        .first()
        .invoke("attr", "d")
        .then((boundPath) => {
          reseedSource("IconUser");
          // A different icon name must redraw the glyph — same element, different path.
          cy.get(fileInputSelector.icon(widget))
            .find("path")
            .first()
            .invoke("attr", "d")
            .should("not.equal", boundPath);
        });
    });

    it("should verify Icon color follows a bound colour", () => {
      dropSource("#ff0000");
      openStyleAccordion(widget, fileInputAccordion.styleField);
      toggleIconVisibility();

      // showLabel:false means no label div renders (fileinput.js:330), so
      // enableFxAndBind's label assertion cannot be reused. Drive the fx button and the
      // CodeMirror field directly, keyed on the raw config key: iconColor.
      cy.get(commonWidgetSelector.parameterFxButton("iconColor")).click();
      cy.get(commonWidgetSelector.parameterInputField("iconColor")).clearAndTypeOnCodeMirror(" ");
      cy.get(commonWidgetSelector.parameterInputField("iconColor")).clearAndTypeOnCodeMirror(
        "{{components.textinput1.value}}"
      ); // source: fileinput.js:327
      commitChange();

      // TablerIcon forwards `color` to the SVG's STROKE, so stroke is the real effect.
      cy.get(fileInputSelector.icon(widget)).scrollIntoView().should("have.css", "stroke", "rgb(255, 0, 0)");

      reseedSource("#00ff00");
      cy.get(fileInputSelector.icon(widget)).scrollIntoView().should("have.css", "stroke", "rgb(0, 255, 0)");
    });

    it("should verify Background follows a bound colour", () => {
      dropSource("#ff0000");
      openStyleAccordion(widget, fileInputAccordion.styleField);
      enableFxAndBind("Background", "{{components.textinput1.value}}"); // source: fileinput.js:337
      commitChange();
      // #ff0000 deliberately avoids the '#fff' sentinel that would route to the theme
      // fallback instead of the configured colour (FileInput.jsx:176).
      cy.get(fileInputSelector.field(widget)).should("have.css", "background-color", "rgb(255, 0, 0)");
    });

    it("should verify Border follows a bound colour", () => {
      dropSource("#ff0000");
      openStyleAccordion(widget, fileInputAccordion.styleField);
      enableFxAndBind("Border", "{{components.textinput1.value}}"); // source: fileinput.js:346
      commitChange();
      // Avoids the '#CCD1D5' sentinel (FileInput.jsx:168).
      cy.get(fileInputSelector.field(widget)).should("have.css", "border-color", "rgb(255, 0, 0)");
    });

    it("should verify Text follows a bound colour", () => {
      dropSource("#ff0000");
      openStyleAccordion(widget, fileInputAccordion.styleField);
      enableFxAndBind("Text", "{{components.textinput1.value}}"); // source: fileinput.js:364
      commitChange();
      // Avoids the '#1B1F24'/'#000'/'#000000ff' sentinels (FileInput.jsx:183).
      cy.get(fileInputSelector.field(widget)).should("have.css", "color", "rgb(255, 0, 0)");
    });

    it("should verify Accent exposes an fx button and accepts a bound colour", () => {
      // accentColor is fx-CAPABLE per the config (no isFxNotRequired, fileinput.js:355)
      // and the fx button is genuinely present — but the resolved value is never read by
      // the component. Covered here so the fx surface is complete; the dead-wiring bug
      // itself is recorded in styles.cy.js and the Findings report.
      dropSource("#ff0000");
      openStyleAccordion(widget, fileInputAccordion.styleField);
      enableFxAndBind("Accent", "{{components.textinput1.value}}");
      commitChange();
      cy.get(fileInputSelector.field(widget)).should("be.visible");
    });

    it("should verify Error text follows a bound colour", () => {
      dropSource("#ff0000");
      openEditorSidebar(widget);
      openAccordion("Validation");
      verifyAndModifyParameter("Min files", "{{2}}");
      commitChange();

      openStyleAccordion(widget, fileInputAccordion.styleField);
      enableFxAndBind("Error text", "{{components.textinput1.value}}"); // source: fileinput.js:373
      commitChange();

      // The error text has to be on screen before its colour can be asserted.
      attachFile(csvFile);
      cy.get(fileInputSelector.errorMessage(widget)).should("have.css", "color", "rgb(255, 0, 0)");
    });

    it("should verify Border radius resolves a numeric binding", () => {
      dropWidget("Number Input", "numberinput1", 500, 300);
      openEditorSidebar("numberinput1");
      verifyAndModifyParameter("Default value", "20");
      commitChange();

      openStyleAccordion(widget, fileInputAccordion.styleField);
      enableFxAndBind("Border radius", "{{components.numberinput1.value}}"); // source: fileinput.js:382
      commitChange();
      cy.get(fileInputSelector.field(widget)).should("have.css", "border-radius", "20px");
    });

    it("should verify Box shadow follows a bound shadow string", () => {
      dropSource("0px 0px 10px 2px #ff0000");
      openStyleAccordion(widget, fileInputAccordion.styleField);
      enableFxAndBind("Box shadow", "{{components.textinput1.value}}"); // source: fileinput.js:394
      commitChange();
      cy.get(fileInputSelector.field(widget)).should("have.css", "box-shadow", "rgb(255, 0, 0) 0px 0px 10px 2px");
    });

    it("should verify Direction exposes no fx button", () => {
      openStyleAccordion(widget, fileInputAccordion.styleLabel);
      // Located by its control rather than a name: direction declares showLabel:false and
      // has no usable displayName (fileinput.js:256-265). "Alignment" is the fx-CAPABLE
      // control in the same open accordion, so a wrong selector cannot pass silently.
      expectNoFxButton(() => cy.get('[data-cy="togglr-button-right"]'), "Alignment");
    });

    it("should verify Width, label width and Width type expose no fx button", () => {
      openStyleAccordion(widget, fileInputAccordion.styleLabel);
      // auto/labelWidth/widthType are gated on alignment=side AND auto=false, so the gate
      // has to be opened before their absence means anything — asserting on controls that
      // were never rendered would pass for the wrong reason.
      unlockLabelWidth();

      expectNoFxButton(() => cy.get('[data-cy="auto-width-checkbox"]'), "Alignment"); // source: fileinput.js:278
      expectNoFxButton(() => cy.get('[data-cy="width-input-field"]'), "Alignment"); // source: fileinput.js:294
      expectNoFxButton(() => cy.get('[data-cy="dropdown-common"]'), "Alignment"); // source: fileinput.js:308
    });

    it("should verify Padding exposes no fx button", () => {
      // The container accordion holds padding ALONE, and padding is exempt — so there is
      // no fx-capable control inside it to use as the required control. The field
      // accordion is opened alongside it to supply "Border radius" as that control.
      openStyleAccordion(widget, fileInputAccordion.styleField);
      openAccordion(fileInputAccordion.styleContainer);
      expectNoFxButton(() => cy.get('[data-cy="togglr-button-none"]'), "Border radius"); // source: fileinput.js:416
    });
  }
);
