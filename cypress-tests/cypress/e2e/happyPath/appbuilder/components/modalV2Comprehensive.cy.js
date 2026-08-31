import {
  commonSelectors,
  commonWidgetSelector,
  inspectorSelectors,
} from "Selectors/common";
import { modalSelector } from "Selectors/modal";
import { fake } from "Fixtures/fake";
import { commonWidgetText } from "Texts/common";

import {
  launchModal,
  closeModal,
  launchButton,
  openModalInspector,
  toggleModalProperty,
  setModalPropertyViaFx,
} from "Support/utils/modal";
import {
  openEditorSidebar,
  openAccordion,
  verifyAndModifyParameter,
} from "Support/utils/commonWidget";
import { selectEvent } from "Support/utils/events";
import {
  selectQueryFromLandingPage,
  addInputOnQueryField,
  query,
  waitForQueryAction,
} from "Support/utils/queries";
import { resizeQueryPanel } from "Support/utils/dataSource";
import { openStateFromComponent, verifyNodeData } from "Support/utils/inspector";


const BOOLEAN_PROPERTIES = [
  // --- Data accordion (assert inside the OPEN modal) -----------------------
  {
    accordion: "Data",
    label: "Header",
    // default ON → after toggle the header slot is gone
    assertAfterToggle: () =>
      cy.get(modalSelector.modalHeader).should("not.exist"),
  },
  {
    accordion: "Data",
    label: "Footer",
    assertAfterToggle: () =>
      cy.get(modalSelector.modalFooter).should("not.exist"),
  },

  // --- Additional Actions accordion (assert inside the OPEN modal) ---------
  {
    accordion: "Additional Actions",
    label: "Loading state",
    // default OFF → after toggle the body shows a spinner
    assertAfterToggle: () => cy.get(modalSelector.loadingSpinner).should("be.visible"),
  },
  {
    accordion: "Additional Actions",
    label: "Disable modal window",
    // default OFF → after toggle a blocking overlay covers the body
    assertAfterToggle: () =>
      cy.get(modalSelector.disabledOverlay).should(
        "exist"
      ),
  },
  {
    accordion: "Additional Actions",
    label: "Hide close button",
    assertAfterToggle: () =>
      cy.get(modalSelector.modalCloseButton).should("not.exist"),
  }
];

const TRIGGER_PROPERTIES = [
  {
    label: "Modal trigger visibility",
    // default ON → after toggle the trigger button is not rendered
    assertAfterToggle: () =>
      cy.get(launchButton("modal1")).should("not.exist"),
  },
  {
    label: "Disable modal trigger",
    // default OFF → after toggle the trigger button is disabled
    assertAfterToggle: () =>
      cy.get(launchButton("modal1")).should("have.attr", "disabled"),
  },
  {
    label: "Use default trigger button",
    // default ON → after toggle the default trigger button is not rendered
    assertAfterToggle: () =>
      cy.get(launchButton("modal1")).should("not.exist"),
    // the "Trigger button label" field is conditionally removed from the panel
    alsoAssert: () =>
      cy
        .get(commonWidgetSelector.parameterLabel("Trigger button label"))
        .should("not.exist"),
  },
];

const CSA_STEPS = [
  {
    code: ["components.modal1.open()"],
    assert: () => cy.get(modalSelector.modalBody).should("be.visible"),
  },
  {
    // modal is open → setLoading(true) swaps the body for a spinner
    code: ["components.modal1.setLoading(true)"],
    assert: () => cy.get(modalSelector.loadingSpinner).should("be.visible"),
  },
  {
    code: ["components.modal1.setLoading(false)"],
    assert: () => cy.get(modalSelector.loadingSpinner).should("not.exist"),
  },
  {
    // still open → setDisableModal(true) drops a blocking overlay on the body
    code: ["components.modal1.setDisableModal(true)"],
    assert: () =>
      cy
        .get(modalSelector.disabledOverlay)
        .should("exist"),
  },
  {
    code: ["components.modal1.setDisableModal(false)"],
    assert: () =>
      cy
        .get(modalSelector.disabledOverlay)
        .should("not.exist"),
  },
  {
    code: ["components.modal1.close()"],
    assert: () => cy.get(modalSelector.modalBody).should("not.exist"),
  },
  {
    // modal closed → trigger-button CSAs act on the launch button
    code: ["components.modal1.setDisableTrigger(true)"],
    assert: () =>
      cy.get(launchButton("modal1")).should("have.attr", "disabled"),
  },
  {
    code: ["components.modal1.setDisableTrigger(false)"],
    assert: () =>
      cy.get(launchButton("modal1")).should("not.have.attr", "disabled"),
  },
  {
    code: ["components.modal1.setVisibility(false)"],
    assert: () => cy.get(launchButton("modal1")).should("not.exist"),
  },
  {
    code: ["components.modal1.setVisibility(true)"],
    assert: () => cy.get(launchButton("modal1")).should("be.visible"),
  },
];

describe("ModalV2 - comprehensive", { testIsolation: false }, () => {
  beforeEach(() => {
    // Fresh app + fresh modal per test → every `it` is independent even though
    // testIsolation is off (one shared DB, serial runs).
    cy.apiLogin();
    cy.apiCreateApp(`${fake.companyName}-Modal-App`);
    cy.openApp();
    cy.dragAndDropWidget("Modal");
  });
  afterEach(() => {
    cy.apiDeleteApp();
  });

  it("Basic Modal functionality - open/close via trigger, close button, Escape", () => {
    // Default trigger button renders with label "Launch Modal".
    cy.get(launchButton("modal1"))
      .should("be.visible")
      .verifyVisibleElement("have.text", "Launch Modal");

    // Open via the trigger → all slots + close button visible.
    launchModal("modal1");
    cy.get(modalSelector.modalHeader).should("be.visible");
    cy.get(modalSelector.modalBody).should("be.visible");
    cy.get(modalSelector.modalFooter).should("be.visible");
    cy.get(modalSelector.modalCloseButton).should("be.visible");

    // Close via the close button → modal unmounts (assert not.exist, not
    // not.be.visible — the body is removed from the DOM on close).
    cy.get(modalSelector.modalCloseButton).realClick();
    cy.get(modalSelector.modalBody).should("not.exist");

    // Re-open, then close via Escape (hideOnEsc is ON by default).
    launchModal("modal1");
    cy.get(modalSelector.modalBody).should("be.visible");
    cy.realPress("Escape");
    cy.get(modalSelector.modalBody).should("not.exist");
  });

  // data-driven style (loops BOOLEAN_PROPERTIES)
  it("Validate boolean properties via toggle (UI state)", () => {
    BOOLEAN_PROPERTIES.forEach(({ accordion, label, assertAfterToggle }) => {
      cy.log(`**Property: ${label}**`);

      // Flip the property from its default.
      openModalInspector(accordion);
      toggleModalProperty(label);

      // Assert the UI effect while the modal is open, then close via Escape
      // (hideOnEsc stays ON for every row here).
      launchModal("modal1");
      assertAfterToggle();
      cy.realPress("Escape");
      cy.get(modalSelector.modalBody).should("not.exist");

      // Restore the default so the next row starts from a known state.
      openModalInspector(accordion);
      toggleModalProperty(label); // restore
      
    });
  });

  // trigger-button properties (data-driven, no modal open)
  it("Validate trigger button properties via toggle (Trigger accordion)", () => {
    TRIGGER_PROPERTIES.forEach(({ label, assertAfterToggle, alsoAssert }) => {
      cy.log(`**Trigger property: ${label}**`);

      // Flip the property from its default.
      openModalInspector("Trigger");
      toggleModalProperty(label);

      // These props remove/disable the launch button, so assert on the trigger
      // itself — the modal is never opened.
      assertAfterToggle();
      // Optional secondary check while the property is OFF (e.g. a conditionally
      // rendered field being removed from the panel).
      if (alsoAssert) alsoAssert();

      // Restore the default so the next row starts from a known state.
      openModalInspector("Trigger");
      toggleModalProperty(label); // restore
      // If a field was conditionally hidden, confirm it returns after restore.
      if (alsoAssert) {
        cy.get(
          commonWidgetSelector.parameterLabel("Trigger button label")
        ).should("exist");
      }
    });
  });

  it("Validate Close on escape key behavior", () => {
    // Default ON → Escape closes the modal.
    launchModal("modal1");
    cy.get(modalSelector.modalBody).should("be.visible");
    cy.realPress("Escape");
    cy.get(modalSelector.modalBody).should("not.exist");

    // Toggle OFF → Escape
    // no longer closes; the close button still works.
    openModalInspector("Additional Actions");
    toggleModalProperty("Close on escape key");
    launchModal("modal1");
    cy.realPress("Escape");
    cy.get(modalSelector.modalBody).should("be.visible"); // still open
    closeModal("modal1");
    cy.get(modalSelector.modalBody).should("not.exist");
    openModalInspector("Additional Actions");
    toggleModalProperty("Close on escape key"); //restore
  });

  it("Validate Close on clicking outside behavior", () => {
    // Default OFF → clicking the backdrop keeps the modal open (backdrop static).
    launchModal("modal1");
    cy.get(modalSelector.modalBody).should("be.visible");
    cy.get(modalSelector.modalContainer).click("topLeft");
    cy.get(modalSelector.modalBody).should("be.visible"); // still open
    cy.realPress("Escape");
    cy.get(modalSelector.modalBody).should("not.exist");

    // Toggle ON → a mousedown on the outer `.modal` element closes the modal
    openModalInspector("Additional Actions");
    toggleModalProperty("Close on clicking outside");
    launchModal("modal1");
    cy.get(modalSelector.modalBody).should("be.visible");
    cy.get(modalSelector.modalContainer).click("topLeft");
    cy.get(modalSelector.modalBody).should("not.exist");

    openModalInspector("Additional Actions");
    toggleModalProperty("Close on clicking outside");//restore
  });

  it("Validate value properties (Trigger label / Height / Width)", () => {
    // --- Trigger button label (code field) → the button text follows it
    openModalInspector("Trigger");
    cy.get(
      commonWidgetSelector.parameterInputField("Trigger button label")
    ).clearAndTypeOnCodeMirror("Open Details");
    cy.waitForAutoSave();
    cy.get(commonSelectors.canvas).click("topRight", { force: true });
    cy.get(launchButton("modal1")).verifyVisibleElement(
      "have.text",
      "Open Details"
    );

    // --- Height (numberInput under Data) → value persists in the field 
    openModalInspector("Data");
    cy.get(modalSelector.heightInput)                                     
     .scrollIntoView()                                                    
     .clear()                                                             
     .type("500")                                                         
     .blur();   
    cy.waitForAutoSave();                                                          
     cy.get(modalSelector.heightInput).should("have.value", "500");

    // --- Width (Data → searchable react-select, small/medium/large/fullscreen) 
    cy.get(modalSelector.widthDropdown)
      .find("input")
      .first()
      .type("fullscreen{enter}", { force: true });
    cy.waitForAutoSave();
    launchModal("modal1");
    cy.get(modalSelector.fullscreenModal).should("exist");
    cy.get(modalSelector.modalBody).should("be.visible");
    cy.realPress("Escape");

    // Tooltip (Additional Actions) → validate all three formats
    const TOOLTIP_CASES = [
      {
        format: "plainText",
        text: "Plain tip",
        assertBody: () =>
          cy
            .get(modalSelector.tooltipPlainText)
            .should("have.text", "Plain tip")
            .and("have.css", "white-space", "pre-wrap"),
      },
      {
        format: "markdown",
        text: "**Bold tip**", // markdown bold → <strong>
        assertBody: () =>
          cy
            .get(`${modalSelector.tooltipMarkdown} strong`)
            .should("have.text", "Bold tip")
            .and("have.css", "font-weight", "600"),
      },
      {
        format: "html",
        text: "<b>Html tip</b>", // raw HTML → <b>
        assertBody: () => {
          cy.get(`${modalSelector.tooltipHtml} b`)
            .should("have.text", "Html tip")
            .and("have.css", "font-weight", "600");
          // html uses the UNSTYLED container → transparent background.
          cy.get(modalSelector.widgetTooltip).should(
            "have.css",
            "background-color",
            "rgba(0, 0, 0, 0)"
          );
        },
      },
    ];
    TOOLTIP_CASES.forEach(({ format, text, assertBody }) => {
      cy.log(`**Tooltip format: ${format}**`);
      openModalInspector("Additional Actions");
      // Pick the format, then set the text
      cy.get(modalSelector.tooltipFormatButton(format)).click({ force: true });
      cy.get(modalSelector.tooltipInputField).clearAndTypeOnCodeMirror([text]);

      // Click the canvas so the code field blurs and the value commits — the
      // hovered tooltip only reflects the text once it's applied.
      cy.forceClickOnCanvas();
      cy.waitForAutoSave();

      // Hover the trigger → tooltip appears
      cy.get(commonWidgetSelector.draggableWidget("modal1")).realHover();
      cy.get(modalSelector.widgetTooltip).should("be.visible");
      assertBody();

      // Move off the trigger so the tooltip dismisses before the next format.
      cy.forceClickOnCanvas();
      cy.get(modalSelector.widgetTooltip).should("not.exist");
    });
  });

  it("Validate Modal trigger-button style (font size)", () => {
    openEditorSidebar("modal1");
    cy.get(commonWidgetSelector.buttonStylesEditorSideBar).click();

    cy.get(modalSelector.fontSizeInput)
      .scrollIntoView()
      .clear()
      .type("20")
      .blur();
    cy.waitForAutoSave();
    cy.get(commonWidgetSelector.buttonCloseEditorSideBar).click({ force: true });

    // The trigger label span carries the inline font size.
    cy.get(launchButton("modal1"))
      .find("span")
      .first()
      .should("have.css", "font-size", "20px");
  });

  it("Validate On open and On close events of Modal", () => {
    // On open → Show Alert
    openEditorSidebar("modal1");
    openAccordion(commonWidgetText.accordionEvents);
    selectEvent("On open", "Show Alert");
    // On open → Show Alert
    // Second handler on the same component
    selectEvent(
      "On close",
      "Show Alert",
      0,
      commonSelectors.addMoreEventHandlerLink,
      1
    );

    // On open fires when the modal opens.
    launchModal("modal1");
    cy.verifyToastMessage(commonSelectors.toastMessage, "Hello world!");
    
    // On close fires when the modal closes.
    closeModal("modal1");
    cy.verifyToastMessage(commonSelectors.toastMessage, "Hello world!");
  });

  it("Validate CSA through RunJS query (open / close / setLoading / setVisibility / setDisable*)", () => {
    // Open the query panel and create the RunJS query
    resizeQueryPanel("50");
    selectQueryFromLandingPage("runjs", "JavaScript");

    CSA_STEPS.forEach(({ code, assert }) => {
      cy.log(`**RunJS CSA: ${code}**`);
      addInputOnQueryField("runjs", code); // rewrite the query body
      query("run"); // click query-run-button
      waitForQueryAction("run"); // wait until the run finishes
      assert(); // verify the UI effect
    });
  });

  it("Validate exposed variables reflect state (Inspector)", () => {
    // A) Defaults — open modal1's state and verify every exposed variable.
    const EXPOSED_DEFAULTS = [
      ["show", "false"],
      ["isVisible", "true"],
      ["isDisabledTrigger", "false"],
      ["isDisabledModal", "false"],
      ["isLoading", "false"],
    ];
    openStateFromComponent("modal1");
    EXPOSED_DEFAULTS.forEach(([key, value]) =>
      verifyNodeData(key, "Boolean", value)
    );

    // A2) Hovering the `id` value surfaces the full id in a tooltip.
    cy.get(
      `${inspectorSelectors.inspectorNodeValue("id")} ${inspectorSelectors.jsonViewerNodeValue}`
    )
      .invoke("text")
      .then((idValue) => {
        cy.get(inspectorSelectors.inspectorNodeValue("id")).realHover();
        cy.get(inspectorSelectors.nodeTooltip)
          .should("be.visible")
          .and("have.text", idValue.trim());
      });

    // B) the open/closed state in inspector. 
    launchModal("modal1");
    verifyNodeData("show", "Boolean", "true");
    closeModal("modal1");
    verifyNodeData("show", "Boolean", "false");

    // C) Every remaining exposed boolean is driven by a property toggle. Flip
    // each from its default and confirm the exposed variable reflects it.
    const STATE_TOGGLES = [
      {
        accordion: "Additional Actions",
        label: "Loading state", // OFF default → ON
        exposedVar: "isLoading",
        expected: "true",
      },
      {
        accordion: "Additional Actions",
        label: "Disable modal window", // OFF default → ON
        exposedVar: "isDisabledModal",
        expected: "true",
      },
      {
        accordion: "Trigger",
        label: "Disable modal trigger", // OFF default → ON
        exposedVar: "isDisabledTrigger",
        expected: "true",
      },
      {
        accordion: "Trigger",
        label: "Modal trigger visibility", // ON default → OFF (keep last)
        exposedVar: "isVisible",
        expected: "false",
      },
    ];
    STATE_TOGGLES.forEach(({ accordion, label, exposedVar, expected }) => {
      openModalInspector(accordion);
      toggleModalProperty(label);
      openStateFromComponent("modal1"); // re-open the state tree after the change
      verifyNodeData(exposedVar, "Boolean", expected);
    });
  });

  it("Validate Modal visibility in desktop and Mobile view", () => {
    openModalInspector("Devices");

    // Turn OFF "Show on desktop" → the modal disappears from the desktop canvas.
    toggleModalProperty("Show on desktop");
    cy.get(commonWidgetSelector.draggableWidget("modal1")).should("not.exist");
    toggleModalProperty("Show on desktop");
    cy.get(commonWidgetSelector.draggableWidget("modal1")).should("exist");

    cy.get(commonWidgetSelector.changeLayoutToMobileButton).click();
    cy.get(commonWidgetSelector.draggableWidget("modal1")).should("not.exist");
    cy.get(commonWidgetSelector.changeLayoutToDesktopButton).click();
    // Turn ON "Show on mobile", switch the editor to the mobile layout → the
    // modal renders again on mobile.
    openModalInspector("Devices");
    toggleModalProperty("Show on mobile");
    cy.get(commonWidgetSelector.changeLayoutToMobileButton).click();
    cy.get(commonWidgetSelector.draggableWidget("modal1")).should("exist");
  });
 
});
