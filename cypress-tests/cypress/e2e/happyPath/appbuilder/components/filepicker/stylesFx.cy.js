import { fake } from "Fixtures/fake";
import { closeQueryPanel } from "Support/utils/appBuilder/querymanager/queryPanel";
import { filePickerSelector } from "Selectors/appBuilder/components/filePicker";
import {
  filePickerText,
  filePickerAccordion,
  fxExemptFields,
} from "Texts/appBuilder/components/filePicker";
import {
  commitChange,
  openEditorSidebar,
  verifyAndModifyParameter,
  waitForDropSettle,
  dropWidget,
  enableFxAndBind,
  expectNoFxButton,
  openStyleAccordion,
} from "Support/utils/commonWidget";

// StylesFx facet — fx/dynamic-binding half; the direct half is in styles.cy.js.
// Covers all 3 fx-capable config.styles items — source: filepicker.js:296-358
//   dropzoneTitleColor:297 · borderRadius:327 · boxShadow:333
// Negative: the single isFxNotRequired item — padding:345 — asserted to expose NO fx
//   button.
//
// Sources match the File Button and File Input specs: a Color Picker for colours
// (`selectedColorHex` is what a real app binds) and a Number Input for numerics. Each test
// drives the SOURCE and re-asserts where the value is observable, which proves the binding
// stays live rather than resolving once at bind time.
describe(
  "File Picker styles fx",
  { testIsolation: false },
  () => {
    const widget = filePickerText.defaultWidgetName;

    // The standard colour source: a Color Picker seeded to red.
    const dropColorPicker = () => {
      openEditorSidebar(widget);
      dropWidget("Color Picker", "colorpicker1", 500, 400);
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
      cy.apiCreateApp(`${fake.companyName}-${Date.now()}-Filepicker-App`);
      cy.openApp();
      cy.dragAndDropWidget(filePickerText.defaultWidgetText, 500, 100);
      waitForDropSettle(widget);
      closeQueryPanel();
    });

    afterEach(() => {
      cy.apiDeleteApp();
    });

    it("should verify Title follows a bound colour", () => {
      dropColorPicker();
      openStyleAccordion(widget, filePickerAccordion.styleDropArea);
      enableFxAndBind("Title", "{{components.colorpicker1.selectedColorHex}}"); // source: filepicker.js:297
      commitChange();

      // The resolved value is written imperatively as a CUSTOM PROPERTY on the widget root
      // (FilePicker.jsx:104), not as a colour on the title — the <h3> only reads
      // var(--file-picker-text-primary). So the root's inline style is where a bound value
      // becomes observable; the title's own style attribute never changes at all.
      cy.get(filePickerSelector.widget(widget))
        .invoke("attr", "style")
        .should("include", "--file-picker-text-primary: #ff0000");

      // Re-driving the source is what proves the binding is live.
      recolourPicker("#00ff00");
      cy.get(filePickerSelector.widget(widget))
        .invoke("attr", "style")
        .should("include", "--file-picker-text-primary: #00ff00");
    });

    it("should verify Border radius resolves and re-resolves a numeric binding", () => {
      dropWidget("Number Input", "numberinput1", 500, 400);
      openEditorSidebar("numberinput1");
      verifyAndModifyParameter("Default value", "{{18}}");
      commitChange();

      openStyleAccordion(widget, filePickerAccordion.styleContainer);
      // "Border radius", NOT the config's "Border Radius" (filepicker.js:329).
      // verifyAndModifyParameter asserts the label's text EXACTLY, and the Inspector
      // renders the lowercase form — filepicker.js is the only widget config in the repo
      // spelling it with a capital R, and the panel ignores it (FP-8). The data-cy is
      // unaffected either way because cyParamName lowercases.
      enableFxAndBind("Border radius", "{{components.numberinput1.value}}"); // source: filepicker.js:327
      commitChange();

      // Asserted on the dropzone, which is where the radius is rendered
      // (UploadArea.jsx:59) — the root receives it too, but the dropzone is the visible
      // edge.
      cy.get(filePickerSelector.dropzone(widget)).should("have.css", "border-radius", "18px");

      openEditorSidebar("numberinput1");
      verifyAndModifyParameter("Default value", "{{4}}");
      commitChange();
      cy.get(filePickerSelector.dropzone(widget)).should("have.css", "border-radius", "4px");
    });

    it("should verify Box shadow follows a bound colour in its shorthand", () => {
      // Bound as a WHOLE shorthand from a Text Input rather than as a concatenation
      // expression: typing `{{'…' + components.x.y}}` into CodeMirror invites the
      // brace/quote autoclose quirks, and the field takes the
      // full string anyway.
      dropWidget("Text Input", "textinput1", 500, 400);
      openEditorSidebar("textinput1");
      verifyAndModifyParameter("Default value", "6px 6px 8px 0px #ff0000");
      commitChange();

      openStyleAccordion(widget, filePickerAccordion.styleContainer);
      enableFxAndBind("Box shadow", "{{components.textinput1.value}}"); // source: filepicker.js:333
      commitChange();

      cy.get(filePickerSelector.widget(widget))
        .should("have.css", "box-shadow")
        .and("include", "rgb(255, 0, 0)");

      openEditorSidebar("textinput1");
      verifyAndModifyParameter("Default value", "6px 6px 8px 0px #0000ff");
      commitChange();
      cy.get(filePickerSelector.widget(widget))
        .should("have.css", "box-shadow")
        .and("include", "rgb(0, 0, 255)");
    });

    it("should verify Padding exposes no fx button", () => {
      const { control, accordion } = fxExemptFields.styles[0];
      openStyleAccordion(widget, accordion);
      // The second argument must name a DIFFERENT, fx-CAPABLE field in the same open
      // accordion: expectNoFxButton asserts that control's fx button EXISTS first, as
      // proof the accordion is open and a missing fx button means something. Passing
      // "Padding" — the exempt field itself — makes that precondition unsatisfiable.
      // Border Radius is the fx-capable neighbour in Container (filepicker.js:328).
      expectNoFxButton(() => cy.get(control).scrollIntoView(), "Border radius"); // source: filepicker.js:352
    });
  }
);
