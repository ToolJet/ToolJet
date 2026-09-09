import { fake } from "Fixtures/fake";
import { closeQueryPanel } from "Support/utils/appBuilder/querymanager/queryPanel";
import { commonWidgetSelector } from "Selectors/common";
import { fileInputSelector } from "Selectors/appBuilder/components/fileInput";
import { fileInputText, fileInputAccordion, fileInputFixtures } from "Texts/appBuilder/components/fileInput";
import {
  commitChange,
  openEditorSidebar,
  openAccordion,
  verifyAndModifyParameter,
  waitForDropSettle,
  dropWidget,
  enableFxAndBind,
  expectNoFxButton,
  openStyleAccordion,
} from "Support/utils/commonWidget";
import {
  attachFile,
  unlockLabelWidth,
  toggleIconVisibility,
} from "Support/utils/appBuilder/components/fileInput";

// StylesFx facet — fx/dynamic-binding half; the direct half is in styles.cy.js.
// Covers all 12 fx-capable config.styles items — source: fileinput.js:233-423
//   labelColor:234 · labelFontSize:240 · alignment:246 · icon:320 · iconColor:327
//   backgroundColor:337 · borderColor:346 · accentColor:355 · textColor:364
//   errTextColor:373 · borderRadius:382 · boxShadow:394
// Negative: the 5 isFxNotRequired items — direction:267 · auto:278 · labelWidth:294 ·
//   widthType:308 · padding:416 — each asserted to expose NO fx button.
//
// Sources match the File Button spec: a Color Picker for colours (`selectedColorHex` is
// what a real app binds), a Number Input for numerics, a Text Input for strings. Each test
// then drives the SOURCE and re-asserts, which proves the binding stays live.
describe(
  "File Input styles fx",
  { testIsolation: false },
  () => {
    const widget = fileInputText.defaultWidgetName;
    const { csvFile } = fileInputFixtures;

    // The standard colour source: a Color Picker seeded to red.
    const dropColorPicker = () => {
      openEditorSidebar(widget);
      dropWidget("Color Picker", "colorpicker1", 500, 300);
      openEditorSidebar("colorpicker1");
      verifyAndModifyParameter("Default value", "#ff0000");
      commitChange();
    };

    const recolourPicker = (hex) => {
      openEditorSidebar("colorpicker1");
      verifyAndModifyParameter("Default value", hex);
      commitChange();
    };

    // String source, for the styles whose value is not a colour (alignment, icon name).
    const dropTextSource = (value, name = "textinput1") => {
      dropWidget("Text Input", name, 500, 380);
      openEditorSidebar(name);
      verifyAndModifyParameter("Default value", value);
      commitChange();
    };

    const reseedTextSource = (value, name = "textinput1") => {
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

    afterEach(() => {
      cy.apiDeleteApp();
    });

    it("should verify Color follows a bound colour", () => {
      dropColorPicker();
      openStyleAccordion(widget, fileInputAccordion.styleLabel);
      enableFxAndBind("Color", "{{components.colorpicker1.selectedColorHex}}"); // source: fileinput.js:234
      commitChange();
      // the colour lands on the inner <p>, not the <label> wrapper (Label.jsx:52)
      cy.get(fileInputSelector.labelText(widget)).scrollIntoView().should("have.css", "color", "rgb(255, 0, 0)");

      // change the SOURCE, not the target
      recolourPicker("#00ff00");
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
      dropTextSource("side");
      openStyleAccordion(widget, fileInputAccordion.styleLabel);
      enableFxAndBind("Alignment", "{{components.textinput1.value}}"); // source: fileinput.js:246
      commitChange();
      cy.get(fileInputSelector.widget(widget)).should("have.class", "tw-flex-row");

      reseedTextSource("top");
      cy.get(fileInputSelector.widget(widget)).should("have.class", "tw-flex-col");
    });

    it("should verify Icon follows a bound icon name", () => {
      dropTextSource("IconHome");
      openStyleAccordion(widget, fileInputAccordion.styleField);
      toggleIconVisibility(); // the configured icon is inert until visibility is on
      enableFxAndBind("Icon", "{{components.textinput1.value}}"); // source: fileinput.js:320
      commitChange();
      cy.get(fileInputSelector.icon(widget)).scrollIntoView().should("exist");

      // The rendered PATH is the observable, not the class: File Input passes its own
      // className to TablerIcon (FileInput.jsx:313), which REPLACES tabler's generated
      // `tabler-icon-<name>` class, so the icon's identity is not in its class list.
      // File Button passes no className, which is why its class assertion works there.
      cy.get(fileInputSelector.icon(widget))
        .find("path")
        .first()
        .invoke("attr", "d")
        .then((boundPath) => {
          reseedTextSource("IconUser");
          cy.get(fileInputSelector.icon(widget))
            .find("path")
            .first()
            .invoke("attr", "d")
            .should("not.equal", boundPath);
        });
    });

    it("should verify Icon color follows a bound colour", () => {
      dropColorPicker();
      openStyleAccordion(widget, fileInputAccordion.styleField);
      toggleIconVisibility();

      // showLabel:false means no label div renders (fileinput.js:330), so enableFxAndBind's
      // label assertion cannot be reused. Drive the fx button and the CodeMirror field
      // directly, keyed on the raw config key: iconColor.
      cy.get(commonWidgetSelector.parameterFxButton("iconColor")).click();
      cy.get(commonWidgetSelector.parameterInputField("iconColor")).clearAndTypeOnCodeMirror(" ");
      cy.get(commonWidgetSelector.parameterInputField("iconColor")).clearAndTypeOnCodeMirror(
        "{{components.colorpicker1.selectedColorHex}}"
      ); // source: fileinput.js:327
      commitChange();

      // TablerIcon forwards `color` to the SVG's STROKE, not to its `color` property.
      cy.get(fileInputSelector.icon(widget)).scrollIntoView().should("have.css", "stroke", "rgb(255, 0, 0)");

      recolourPicker("#00ff00");
      cy.get(fileInputSelector.icon(widget)).scrollIntoView().should("have.css", "stroke", "rgb(0, 255, 0)");
    });

    it("should verify Background follows a bound colour", () => {
      dropColorPicker();
      openStyleAccordion(widget, fileInputAccordion.styleField);
      enableFxAndBind("Background", "{{components.colorpicker1.selectedColorHex}}"); // source: fileinput.js:337
      commitChange();
      // #ff0000 avoids the '#fff' sentinel, which routes to a theme fallback (FileInput.jsx:176)
      cy.get(fileInputSelector.field(widget)).should("have.css", "background-color", "rgb(255, 0, 0)");

      recolourPicker("#00ff00");
      cy.get(fileInputSelector.field(widget)).should("have.css", "background-color", "rgb(0, 255, 0)");
    });

    it("should verify Border follows a bound colour", () => {
      dropColorPicker();
      openStyleAccordion(widget, fileInputAccordion.styleField);
      enableFxAndBind("Border", "{{components.colorpicker1.selectedColorHex}}"); // source: fileinput.js:346
      commitChange();
      // Avoids the '#CCD1D5' sentinel (FileInput.jsx:168).
      cy.get(fileInputSelector.field(widget)).should("have.css", "border-color", "rgb(255, 0, 0)");

      recolourPicker("#00ff00");
      cy.get(fileInputSelector.field(widget)).should("have.css", "border-color", "rgb(0, 255, 0)");
    });

    it("should verify Text follows a bound colour", () => {
      dropColorPicker();
      openStyleAccordion(widget, fileInputAccordion.styleField);
      enableFxAndBind("Text", "{{components.colorpicker1.selectedColorHex}}"); // source: fileinput.js:364
      commitChange();
      // Avoids the '#1B1F24'/'#000'/'#000000ff' sentinels (FileInput.jsx:183).
      cy.get(fileInputSelector.field(widget)).should("have.css", "color", "rgb(255, 0, 0)");

      recolourPicker("#00ff00");
      cy.get(fileInputSelector.field(widget)).should("have.css", "color", "rgb(0, 255, 0)");
    });

    it("should verify Accent exposes an fx button and persists a bound colour", () => {
      // accentColor is fx-CAPABLE per the config (no isFxNotRequired, fileinput.js:355) and
      // the fx button is genuinely present — but the resolved value is never read by the
      // component. Covered here so the fx surface is complete; the dead-wiring bug itself
      // is asserted (and left red) in styles.cy.js.
      dropColorPicker();
      openStyleAccordion(widget, fileInputAccordion.styleField);
      enableFxAndBind("Accent", "{{components.colorpicker1.selectedColorHex}}");
      commitChange();

      // Re-reading after the save is the strongest claim available: the binding
      // round-tripped through the stored definition.
      openStyleAccordion(widget, fileInputAccordion.styleField);
      cy.get(commonWidgetSelector.parameterInputField("Accent"))
        .should("contain.text", "components.colorpicker1.selectedColorHex");
    });

    it("should verify Error text follows a bound colour", () => {
      dropColorPicker();

      openEditorSidebar(widget);
      openAccordion("Validation");
      verifyAndModifyParameter("Min files", "{{2}}");
      commitChange();

      openStyleAccordion(widget, fileInputAccordion.styleField);
      enableFxAndBind("Error text", "{{components.colorpicker1.selectedColorHex}}"); // source: fileinput.js:373
      commitChange();

      // errTextColor only has a target once an error is actually showing (FileInput.jsx:350).
      attachFile(csvFile);
      cy.get(fileInputSelector.errorMessage(widget)).should("have.css", "color", "rgb(255, 0, 0)");

      recolourPicker("#00ff00");
      cy.get(fileInputSelector.errorMessage(widget)).should("have.css", "color", "rgb(0, 255, 0)");
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

      openEditorSidebar("numberinput1");
      verifyAndModifyParameter("Default value", "4");
      commitChange();
      cy.get(fileInputSelector.field(widget)).should("have.css", "border-radius", "4px");
    });

    it("should verify Box shadow follows a bound colour in its shorthand", () => {
      // Bind only the colour sub-part, leaving x/y/blur/spread literal — that asymmetry
      // shows the binding resolves INSIDE the shorthand rather than replacing it.
      const directParam = fake.boxShadowParam;
      const shadow = (rgb) =>
        `${rgb} ${directParam[0]}px ${directParam[1]}px ${directParam[2]}px ${directParam[3]}px`;

      dropColorPicker();

      openStyleAccordion(widget, fileInputAccordion.styleField);
      enableFxAndBind(
        "Box shadow",
        `${directParam[0]}px ${directParam[1]}px ${directParam[2]}px ${directParam[3]}px {{components.colorpicker1.selectedColorHex}}`
      ); // source: fileinput.js:394
      commitChange();
      cy.get(fileInputSelector.field(widget)).scrollIntoView().should("have.css", "box-shadow", shadow("rgb(255, 0, 0)"));

      recolourPicker("#00ff00");
      cy.get(fileInputSelector.field(widget)).scrollIntoView().should("have.css", "box-shadow", shadow("rgb(0, 255, 0)"));
    });

    it("should verify Direction exposes no fx button", () => {
      openStyleAccordion(widget, fileInputAccordion.styleLabel);
      // Located by its control rather than a name: direction declares showLabel:false and
      // has no usable displayName (fileinput.js:256-265). "Alignment" is the fx-CAPABLE
      // control in the same open accordion, so a wrong selector cannot pass silently.
      expectNoFxButton(() => cy.get(commonWidgetSelector.togglrButton("right")), "Alignment");
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
      // The container accordion holds padding ALONE, and padding is exempt — so there is no
      // fx-capable control inside it to use as the required control. The field accordion is
      // opened alongside it to supply "Border radius" as that control.
      openStyleAccordion(widget, fileInputAccordion.styleField);
      openAccordion(fileInputAccordion.styleContainer);
      expectNoFxButton(() => cy.get(commonWidgetSelector.togglrButton("none")), "Border radius"); // source: fileinput.js:416
    });
  }
);
