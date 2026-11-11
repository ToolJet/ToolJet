import { fake } from "Fixtures/fake";
import { commonSelectors, commonWidgetSelector } from "Selectors/common";
import { modalSelector } from "Selectors/modal";
import {
  launchModal,
  launchButton,
  openModalInspector,
  toggleModalProperty,
} from "Support/utils/appBuilder/components/modal";

// Properties facet — every configurable property in the Modal's inspector:
// boolean toggles (Data + Additional Actions + Trigger accordions) and the
// value fields (Trigger button label, Height, Width, Tooltip formats).
// Each toggle is flipped from its config default, its DOM effect asserted, then
// restored so the next row starts from a known state.
// testIsolation:false for cypress-real-dnd; each test re-creates its own app.
describe("Modal — properties facet", { testIsolation: false, retries: { runMode: 2, openMode: 0 } }, () => {
  const W = "modal1";

  // Toggles whose effect is asserted INSIDE the open modal.
  const BOOLEAN_PROPERTIES = [
    // --- Data accordion ------------------------------------------------------
    {
      accordion: "Data",
      label: "Header", // showHeader, default ON — source: modalV2.js:87,412
      assertAfterToggle: () =>
        cy.get(modalSelector.modalHeader).should("not.exist"),
    },
    {
      accordion: "Data",
      label: "Footer", // showFooter, default ON — source: modalV2.js:88,413
      assertAfterToggle: () =>
        cy.get(modalSelector.modalFooter).should("not.exist"),
    },
    // --- Additional Actions accordion ---------------------------------------
    {
      accordion: "Additional Actions",
      label: "Loading state", // loadingState, default OFF — source: modalV2.js:15,402
      assertAfterToggle: () =>
        cy.get(modalSelector.loadingSpinner).should("be.visible"),
    },
    {
      accordion: "Additional Actions",
      label: "Disable modal window", // disabledModal, default OFF — source: modalV2.js:56,408
      assertAfterToggle: () =>
        cy.get(modalSelector.disabledOverlay).should("exist"),
    },
    {
      accordion: "Additional Actions",
      label: "Hide close button", // hideCloseButton, default OFF — source: modalV2.js:113,414
      assertAfterToggle: () =>
        cy.get(modalSelector.modalCloseButton).should("not.exist"),
    },
  ];

  // Trigger-accordion toggles — these remove/disable the launch button, so the
  // effect is asserted on the trigger itself; the modal is never opened.
  const TRIGGER_PROPERTIES = [
    {
      label: "Modal trigger visibility", // visibility, default ON — source: modalV2.js:33,404
      assertAfterToggle: () => cy.get(launchButton(W)).should("not.exist"),
    },
    {
      label: "Disable modal trigger", // disabledTrigger, default OFF — source: modalV2.js:48,407
      assertAfterToggle: () =>
        cy.get(launchButton(W)).should("have.attr", "disabled"),
    },
    {
      label: "Use default trigger button", // useDefaultButton, default ON — source: modalV2.js:65,409
      assertAfterToggle: () => cy.get(launchButton(W)).should("not.exist"),
      // the "Trigger button label" field is conditionally removed from the panel
      alsoAssert: () =>
        cy
          .get(commonWidgetSelector.parameterLabel("Trigger button label"))
          .should("not.exist"),
    },
  ];

  beforeEach(() => {
    cy.apiLogin();
    cy.apiCreateApp(`${fake.companyName}-Modal-Properties`);
    cy.openApp();
    cy.dragAndDropWidget("Modal");
  });
  afterEach(() => {
    cy.apiDeleteApp();
  });

  it("boolean properties (Data + Additional Actions) — effect visible inside the modal", () => {
    BOOLEAN_PROPERTIES.forEach(({ accordion, label, assertAfterToggle }) => {
      cy.log(`**Property: ${label}**`);

      // Flip the property from its default.
      openModalInspector(accordion);
      toggleModalProperty(label);

      // Assert the UI effect while the modal is open, then close via Escape
      // (hideOnEsc stays ON for every row here).
      launchModal(W);
      assertAfterToggle();
      cy.realPress("Escape");
      cy.get(modalSelector.modalBody).should("not.exist");

      // Restore the default so the next row starts from a known state.
      openModalInspector(accordion);
      toggleModalProperty(label); // restore
    });
  });

  it("trigger-button properties (Trigger accordion) — effect on the launch button", () => {
    TRIGGER_PROPERTIES.forEach(({ label, assertAfterToggle, alsoAssert }) => {
      cy.log(`**Trigger property: ${label}**`);

      openModalInspector("Trigger");
      toggleModalProperty(label);

      assertAfterToggle();
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

  // dynamicHeight + collapseWhenHidden — Additional Actions toggles with no
  // clean standalone DOM effect at build time. Assert the toggle flips and the
  // modal still renders (smoke), then restore. RESOLVE-LIVE: the precise DOM
  // effect (auto-sizing body / collapsed layout slot) needs a running server.
  it("Additional Actions toggles — Dynamic height + Collapse when hidden persist", () => {
    // Dynamic height — source: modalV2.js:24,403 (default OFF)
    openModalInspector("Additional Actions");
    toggleModalProperty("Dynamic height");
    launchModal(W);
    cy.get(modalSelector.modalBody).should("be.visible"); // renders with dynamic height on
    cy.realPress("Escape");
    cy.get(modalSelector.modalBody).should("not.exist");
    openModalInspector("Additional Actions");
    toggleModalProperty("Dynamic height"); // restore

    // Collapse when hidden — source: modalV2.js:42,406 (default OFF, layout-only)
    toggleModalProperty("Collapse when hidden");
    cy.get(commonWidgetSelector.draggableWidget(W)).should("exist"); // still on canvas
    toggleModalProperty("Collapse when hidden"); // restore
  });

  it("value properties — Trigger label / Height / Width", () => {
    // --- Trigger button label (code field) → the button text follows it.
    // source: modalV2.js:75,410 (default 'Launch Modal')
    openModalInspector("Trigger");
    cy.get(commonWidgetSelector.parameterInputField("Trigger button label"))
      .clearAndTypeOnCodeMirror("Open Details");
    cy.waitForAutoSave();
    cy.get(commonSelectors.canvas).click("topRight", { force: true });
    cy.get(launchButton(W)).verifyVisibleElement("have.text", "Open Details");

    // --- Height (numberInput under Data) → value persists in the field.
    // source: modalV2.js:105,417 (default 400)
    openModalInspector("Data");
    cy.get(modalSelector.heightInput)
      .scrollIntoView()
      .clear()
      .type("500")
      .blur();
    cy.waitForAutoSave();
    cy.get(modalSelector.heightInput).should("have.value", "500");

    // --- Width (Data → searchable react-select: small/medium/large/fullscreen).
    // source: modalV2.js:90,411 (default 'lg')
    cy.get(modalSelector.widthDropdown)
      .find("input")
      .first()
      .type("fullscreen{enter}", { force: true });
    cy.waitForAutoSave();
    launchModal(W);
    cy.get(modalSelector.fullscreenModal).should("exist");
    cy.get(modalSelector.modalBody).should("be.visible");
    cy.realPress("Escape");
  });

  // Width options — each select option maps to a react-bootstrap modal-size
  // class on the dialog. fullscreen is covered in "value properties" above.
  // source: modalV2.js:90-104 (size options), ModalV2.jsx:319 (size prop)
  it("Width options — small / medium / large map to the modal-size class", () => {
    const SIZE_CASES = [
      { option: "small", cls: ".modal-sm" }, // sm — source: modalV2.js:95
      { option: "medium", cls: ".modal-lg" }, // lg — source: modalV2.js:96 (default)
      { option: "large", cls: ".modal-xl" }, // xl — source: modalV2.js:97
    ];
    SIZE_CASES.forEach(({ option, cls }) => {
      cy.log(`**Width: ${option} → ${cls}**`);
      openModalInspector("Data");
      cy.get(modalSelector.widthDropdown)
        .find("input")
        .first()
        .type(`${option}{enter}`, { force: true });
      cy.waitForAutoSave();
      launchModal(W);
      cy.get(cls).should("exist");
      cy.get(modalSelector.modalBody).should("be.visible");
      cy.realPress("Escape");
      cy.get(modalSelector.modalBody).should("not.exist");
    });
  });

  it("Tooltip — Plain text / Markdown / HTML formats render on hover", () => {
    // tooltipFormat (switch) + tooltip (code) — source: modalV2.js:114,128
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
      // Pick the format, then set the text.
      cy.get(modalSelector.tooltipFormatButton(format)).click({ force: true });
      cy.get(modalSelector.tooltipInputField).clearAndTypeOnCodeMirror([text]);

      // Click the canvas so the code field blurs and the value commits.
      cy.forceClickOnCanvas();
      cy.waitForAutoSave();

      // Hover the trigger → tooltip appears with the applied text.
      cy.get(commonWidgetSelector.draggableWidget(W)).realHover();
      cy.get(modalSelector.widgetTooltip).should("be.visible");
      assertBody();

      // Move off the trigger so the tooltip dismisses before the next format.
      cy.forceClickOnCanvas();
      cy.get(modalSelector.widgetTooltip).should("not.exist");
    });
  });
});
