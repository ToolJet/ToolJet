import { fake } from "Fixtures/fake";
import {
  launchButton,
  openModalInspector,
} from "Support/utils/appBuilder/components/modal";
import {
  verifyAndModifyParameter,
  verifyAndModifyToggleFx,
} from "Support/utils/commonWidget";

// PropertiesFx facet — every fx-capable property re-verified in fx mode.
// verifyAndModifyToggleFx reveals the fx editor, asserts the braced default in
// the .cm-line, clicks fx back, then FLIPS the toggle; we assert the flipped DOM
// effect where it is observable at build time (trigger accordion). Boolean fx
// defaults render WITH the {{}} wrapper (surface-cache fxFormatNote).
// testIsolation:false for cypress-real-dnd; each test re-creates its own app.
describe("Modal — propertiesFx facet", { testIsolation: false, retries: { runMode: 2, openMode: 0 } }, () => {
  const W = "modal1";

  beforeEach(() => {
    cy.apiLogin();
    cy.apiCreateApp(`${fake.companyName}-Modal-PropertiesFx`);
    cy.openApp();
    cy.dragAndDropWidget("Modal");
  });
  afterEach(() => {
    cy.apiDeleteApp();
  });

  // ── Trigger accordion — fx default verified + flipped DOM effect asserted ──
  it("trigger fx — Modal trigger visibility {{true}} → flip OFF → trigger removed", () => {
    openModalInspector("Trigger");
    // source: modalV2.js:33,404 (default true)
    verifyAndModifyToggleFx("Modal trigger visibility", "{{true}}"); // flips OFF
    cy.get(launchButton(W)).should("not.exist");
  });

  it("trigger fx — Disable modal trigger {{false}} → flip ON → trigger disabled", () => {
    openModalInspector("Trigger");
    // source: modalV2.js:48,407 (default false)
    verifyAndModifyToggleFx("Disable modal trigger", "{{false}}"); // flips ON
    cy.get(launchButton(W)).should("have.attr", "disabled");
  });

  it("trigger fx — Use default trigger button {{true}} → flip OFF → trigger removed", () => {
    openModalInspector("Trigger");
    // source: modalV2.js:65,409 (default true)
    verifyAndModifyToggleFx("Use default trigger button", "{{true}}"); // flips OFF
    cy.get(launchButton(W)).should("not.exist");
  });

  // ── Additional Actions accordion — fx default verified (DOM effect only
  //    visible inside an OPEN modal, so the fx-default check IS the exercise) ──
  it("additional-actions fx — braced defaults for every Additional Actions toggle", () => {
    const AA_TOGGLES = [
      { label: "Loading state", fxDefault: "{{false}}" }, // source: modalV2.js:15,402
      { label: "Dynamic height", fxDefault: "{{false}}" }, // source: modalV2.js:24,403
      { label: "Collapse when hidden", fxDefault: "{{false}}" }, // source: modalV2.js:42,406
      { label: "Disable modal window", fxDefault: "{{false}}" }, // source: modalV2.js:56,408
      { label: "Close on escape key", fxDefault: "{{true}}" }, // source: modalV2.js:111,415
      { label: "Close on clicking outside", fxDefault: "{{false}}" }, // source: modalV2.js:112,416
      { label: "Hide close button", fxDefault: "{{false}}" }, // source: modalV2.js:113,414
    ];
    AA_TOGGLES.forEach(({ label, fxDefault }) => {
      cy.log(`**fx default: ${label} = ${fxDefault}**`);
      openModalInspector("Additional Actions");
      verifyAndModifyToggleFx(label, fxDefault); // verifies braced default, flips
    });
  });

  // ── Data accordion — showHeader / showFooter fx defaults ───────────────────
  it("data fx — Header + Footer braced defaults", () => {
    openModalInspector("Data");
    verifyAndModifyToggleFx("Header", "{{true}}"); // source: modalV2.js:87,412
    openModalInspector("Data");
    verifyAndModifyToggleFx("Footer", "{{true}}"); // source: modalV2.js:88,413
  });

  // ── Code fields — fx/code path accepts a binding ───────────────────────────
  it("code fx — Trigger button label + Tooltip accept a code binding", () => {
    // triggerButtonLabel (code) — source: modalV2.js:75,410
    openModalInspector("Trigger");
    verifyAndModifyParameter("Trigger button label", fake.randomSentence);

    // tooltip (code) — source: modalV2.js:128 (Additional Actions)
    openModalInspector("Additional Actions");
    verifyAndModifyParameter("Tooltip", fake.randomSentence);
  });

  // ── NEGATIVE — tooltipFormat is isFxNotRequired:true (no fx button). Skipped
  //    for the SAME reason as checkbox: tooltipFormat and the 'tooltip' code
  //    field share displayName 'Tooltip', so a label-based fx-button assertion
  //    is ambiguous without a disambiguating selector. source: modalV2.js:114,122
  it.skip("[@resolve-live] additional — tooltipFormat (switch) exposes NO fx button", () => {
    openModalInspector("Additional Actions");
    // pending a selector that disambiguates tooltipFormat from the tooltip code field
  });
});
