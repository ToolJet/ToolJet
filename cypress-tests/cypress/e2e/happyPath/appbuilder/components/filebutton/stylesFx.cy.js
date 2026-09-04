import { fake } from "Fixtures/fake";
import { closeQueryPanel } from "Support/utils/appBuilder/querymanager/queryPanel";
import { commonWidgetSelector } from "Selectors/common";
import { fileButtonSelector } from "Selectors/appBuilder/components/fileButton";
import { fileButtonText } from "Texts/appBuilder/components/fileButton";
import {
  openEditorSidebar,
  openAccordion,
  verifyAndModifyParameter,
  waitForDropSettle,
  dropWidget,
  enableFxAndBind,
  expectStyleVar,
  expectNoFxButton,
  locateAlignmentToggle,
  expectFontWeight,
  openStyleAccordion,
} from "Support/utils/commonWidget";
import {
  commitChange,
} from "Support/utils/appBuilder/components/fileButton";

// StylesFx facet — fx/dynamic-binding half; the direct half is in styles.cy.js.
// Covers all 9 fx-capable config.styles items — source: fileButton.js:155-285
//   labelSize:155 · labelWeight:164 · labelColor:175 · icon:181 · iconColor:190
//   loaderColor:208 · backgroundColor:237 · borderRadius:253 · boxShadow:262
// Negative: the 4 isFxNotRequired items — iconDirection:196 · contentAlignment:214 ·
//   buttonType:226 · padding:275 — each asserted to expose NO fx button.
//
// Every test binds the style to a COMPANION widget's exposed value then drives the
// companion, which is what proves the binding stays live.

describe(
  "File Button styles fx",
  { testIsolation: false, retries: { runMode: 3, openMode: 0 } },
  () => {
  const widget = fileButtonText.defaultWidgetName;

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

  beforeEach(() => {
    cy.apiLogin();
    cy.apiCreateApp(`${fake.companyName}-${Date.now()}-Filebutton-App`);
    cy.openApp();
    closeQueryPanel();
    cy.dragAndDropWidget(fileButtonText.defaultWidgetText, 500, 100);
    waitForDropSettle(widget);
  });

  afterEach(function () {
    if (this.currentTest.state === "passed") cy.apiDeleteApp();
  });

  it("should verify Label size resolves and re-resolves a numeric binding", () => {
    // Bound to a Number Input's numeric output, the property being numeric.
    dropWidget("Number Input", "numberinput1", 500, 300);
    openEditorSidebar("numberinput1");
    verifyAndModifyParameter("Default value", "32");
    commitChange();

    openStyleAccordion(widget, "label and icon");
    enableFxAndBind("Label size", "{{components.numberinput1.value}}");
    commitChange();
    cy.get(fileButtonSelector.label(widget)).scrollIntoView().should("have.css", "font-size", "32px");

    // Prove the binding is live: change the source, not the target.
    openEditorSidebar("numberinput1");
    verifyAndModifyParameter("Default value", "50");
    commitChange();
    cy.get(fileButtonSelector.label(widget)).scrollIntoView().should("have.css", "font-size", "50px");
  });

  it("should verify Label weight follows a bound string through all three options", () => {
    // labelWeight maps to a Tailwind CLASS (fontWeightClass, FileButton.jsx:16),
    // not an inline style. Normal 400, Medium 500 (default), Bold 700.
    // Driven from the source component, which also proves the binding stays live
    // instead of resolving once.
    const bindWeight = (value, expected) => {
      openEditorSidebar("textinput1");
      verifyAndModifyParameter("Default value", value);
      commitChange();
      expectFontWeight(fileButtonSelector.label(widget), expected);
    };

    // These are the config's raw option values, not the display names.
    dropWidget("Text Input", "textinput1", 500, 300);
    openEditorSidebar("textinput1");
    verifyAndModifyParameter("Default value", "normal");
    commitChange();

    openStyleAccordion(widget, "label and icon");
    enableFxAndBind("Label weight", "{{components.textinput1.value}}");
    commitChange();
    expectFontWeight(fileButtonSelector.label(widget), "400");

    bindWeight("bold", "700");
    bindWeight("medium", "500");
  });

  it("should verify Label color follows a bound colour", () => {
    dropColorPicker();

    openStyleAccordion(widget, "label and icon");
    enableFxAndBind("Label color", "{{components.colorpicker1.selectedColorHex}}");
    commitChange();
    cy.get(fileButtonSelector.label(widget)).scrollIntoView().should("have.css", "color", "rgb(255, 0, 0)");

    recolourPicker("#00ff00");
    cy.get(fileButtonSelector.label(widget)).scrollIntoView().should("have.css", "color", "rgb(0, 255, 0)");
  });

  it("should verify Icon follows a bound icon name", () => {
    // tabler-icons-react derives the rendered class from the icon's kebab name,
    // so the class IS the observable effect. An icon name is a string, so a Text
    // Input is the source.
    dropWidget("Text Input", "textinput1", 500, 300);
    openEditorSidebar("textinput1");
    verifyAndModifyParameter("Default value", "IconCheck");
    commitChange();

    openStyleAccordion(widget, "label and icon");
    enableFxAndBind("Icon", "{{components.textinput1.value}}");
    commitChange();
    cy.get(fileButtonSelector.icon(widget)).scrollIntoView().should("have.class", "tabler-icon-check");

    openEditorSidebar("textinput1");
    verifyAndModifyParameter("Default value", "IconStar");
    commitChange();
    cy.get(fileButtonSelector.icon(widget)).scrollIntoView().should("have.class", "tabler-icon-star");
  });

  it("should verify Icon color follows a bound colour", () => {
    dropColorPicker();

    openStyleAccordion(widget, "label and icon");
    // showLabel:false — no label div renders, so enableFxAndBind's label assertion can't
    // be reused. Drive the fx button and CodeMirror directly, keyed on the raw config key.
    cy.get(commonWidgetSelector.parameterFxButton("iconColor")).click();
    cy.get(commonWidgetSelector.parameterInputField("iconColor")).clearAndTypeOnCodeMirror(" ");
    cy.get(commonWidgetSelector.parameterInputField("iconColor")).clearAndTypeOnCodeMirror(
      "{{components.colorpicker1.selectedColorHex}}"
    );
    commitChange();
    // TablerIcon forwards `color` to the SVG's `stroke`, so `stroke` is the effect.
    cy.get(fileButtonSelector.icon(widget)).scrollIntoView().should("have.css", "stroke", "rgb(255, 0, 0)");

    recolourPicker("#00ff00");
    cy.get(fileButtonSelector.icon(widget)).scrollIntoView().should("have.css", "stroke", "rgb(0, 255, 0)");
  });

  it("should verify Loader color follows a bound colour", () => {
    // The loader only renders while loading, so that IS the precondition for this
    // field being observable at all.
    openEditorSidebar(widget);
    openAccordion("Additional Actions");
    cy.get(commonWidgetSelector.parameterTogglebutton("Loading state")).click();
    cy.waitForAutoSave();
    cy.get(fileButtonSelector.loader(widget)).should("be.visible");

    dropColorPicker();

    openStyleAccordion(widget, "label and icon");
    enableFxAndBind("Loader color", "{{components.colorpicker1.selectedColorHex}}");
    commitChange();
    // computedLoaderColor goes straight into <Loader color={...}>; unlike
    // Button/PopoverMenu it writes no `--loader-color` var, so assert the svg's
    // computed `color`.
    cy.get(`${fileButtonSelector.loader(widget)} svg`).scrollIntoView().should("have.css", "color", "rgb(255, 0, 0)");

    recolourPicker("#00ff00");
    cy.get(`${fileButtonSelector.loader(widget)} svg`).scrollIntoView().should("have.css", "color", "rgb(0, 255, 0)");
  });

  it("should verify Background follows a bound colour", () => {
    // backgroundColor is conditionallyRender'd on buttonType==='solid', which is
    // the default, so buttonType is left untouched here.
    dropColorPicker();

    openStyleAccordion(widget, "button");
    enableFxAndBind("Background", "{{components.colorpicker1.selectedColorHex}}");
    commitChange();
    cy.get(fileButtonSelector.button(widget)).scrollIntoView();
    expectStyleVar(fileButtonSelector.button(widget), "--button-primary", "#ff0000");

    recolourPicker("#00ff00");
    cy.get(fileButtonSelector.button(widget)).scrollIntoView();
    expectStyleVar(fileButtonSelector.button(widget), "--button-primary", "#00ff00");
  });

  it("should verify Border radius resolves and re-resolves a numeric binding", () => {
    dropWidget("Number Input", "numberinput1", 500, 300);
    openEditorSidebar("numberinput1");
    verifyAndModifyParameter("Default value", "15");
    commitChange();

    openStyleAccordion(widget, "button");
    enableFxAndBind("Border radius", "{{components.numberinput1.value}}");
    commitChange();
    cy.get(fileButtonSelector.button(widget)).scrollIntoView().should("have.css", "border-radius", "15px");

    openEditorSidebar("numberinput1");
    verifyAndModifyParameter("Default value", "6");
    commitChange();
    cy.get(fileButtonSelector.button(widget)).scrollIntoView().should("have.css", "border-radius", "6px");
  });

  it("should verify Box shadow follows a bound colour in its shorthand", () => {
    // Bind only the colour sub-part, leaving x/y/blur/spread literal — that asymmetry
    // shows the binding resolves INSIDE the shorthand rather than replacing it.
    const directParam = fake.boxShadowParam;
    const shadow = (rgb) =>
      `${rgb} ${directParam[0]}px ${directParam[1]}px ${directParam[2]}px ${directParam[3]}px`;

    dropColorPicker();

    openStyleAccordion(widget, "button");
    enableFxAndBind(
      "Box shadow",
      `${directParam[0]}px ${directParam[1]}px ${directParam[2]}px ${directParam[3]}px {{components.colorpicker1.selectedColorHex}}`
    );
    commitChange();
    cy.get(fileButtonSelector.button(widget))
      .scrollIntoView()
      .should("have.css", "box-shadow", shadow("rgb(255, 0, 0)"));

    recolourPicker("#00ff00");
    cy.get(fileButtonSelector.button(widget))
      .scrollIntoView()
      .should("have.css", "box-shadow", shadow("rgb(0, 255, 0)"));
  });

  // ── NEGATIVE: the four style fields declaring isFxNotRequired ───────────────
  // renderFx() returns null for these (SingleLineCodeEditor.jsx:699), so the button is
  // absent from the DOM, not merely hidden. Each assertion is paired with an fx-CAPABLE
  // control field so a "not.exist" cannot pass against a shut accordion.

  it("should verify Icon direction and Content alignment expose no fx button", () => {
    openStyleAccordion(widget, "label and icon");

    // Both render the same togglr-button-left/right values, told apart by
    // contentAlignment's extra `center`. iconDirection has displayName:'' so it has no
    // name to address (fileButton.js:198).
    expectNoFxButton(locateAlignmentToggle(false), "Label size"); // iconDirection
    expectNoFxButton(locateAlignmentToggle(true), "Label size"); // contentAlignment
  });

  it("should verify Button type and Padding expose no fx button", () => {
    openStyleAccordion(widget, "button");

    // Both are `switch` fields; locate each by an option button only it renders.
    expectNoFxButton(() => cy.get('[data-cy="togglr-button-outline"]').scrollIntoView(), "Border radius"); // buttonType
    expectNoFxButton(() => cy.get('[data-cy="togglr-button-none"]').scrollIntoView(), "Border radius"); // padding
  });
});
