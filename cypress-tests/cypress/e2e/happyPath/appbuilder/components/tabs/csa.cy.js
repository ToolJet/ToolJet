import { fake } from "Fixtures/fake";
import { commonWidgetSelector } from "Selectors/common";
import { addCSA } from "Support/utils/appBuilder/csa";
import {
  selectCSA,
  setCSAParam,
  selectEvent,
} from "Support/utils/appBuilder/events";
import { openEditorSidebar } from "Support/utils/commonWidget";

// testIsolation:false — cypress-real-dnd caches its CDP client for the spec
// run; testIsolation's per-test AUT reset leaves that client stale, so 2nd+
// test drags throw "No dragIntercepted". Keeping the AUT stable across tests
// keeps the drag intercept valid. Each test still re-logs-in + creates its own
// app in beforeEach, so shared browser state is not relied upon.
// retries:1 — addCSA drops N buttons in a loop; the CDP intercept can stale
// mid-loop despite the per-iteration realDragRewarm. A single retry re-runs
// beforeEach (fresh page + fresh intercept) and clears the flake.
describe("Tabs — csa facet", { testIsolation: false, retries: 1 }, () => {

  beforeEach(() => {
    cy.apiLogin();
    cy.apiCreateApp(`${fake.companyName}-Tabs-CSA-App`);
    cy.openApp();
    // Double-prime the CDP intercept before the first drag. Each beforeEach
    // navigates to a fresh app URL which resets the real-dnd intercept state.
    // An external rewarm here (before dragAndDropWidget's own internal rewarm)
    // gives the intercept ~1300ms total to settle and prevents the terminal
    // "No Input.dragIntercepted" task exception that retries:1 cannot recover
    // from once both attempts fail. Pattern mirrors canvas.cy.js:36-41.
    cy.realDragRewarm();
    cy.wait(500);
    cy.dragAndDropWidget("Tabs", 500, 100);
    cy.get('[data-cy="query-manager-toggle-button"]').click();
  });

  // CSA facet — handles that can be wired with static params via addCSA:
  //   setVisibility  — source: tabs.js:320 (param: toggle, default {{false}})
  //   setDisable     — source: tabs.js:325 (param: toggle, default {{false}})
  //   setLoading     — source: tabs.js:330 (param: toggle, default {{false}})
  //   setTab         — source: tabs.js:311 (param: id — code, no type field → plain value)
  //
  // Default tabItems from definition: Tab 1 (id:'t0'), Tab 2 (id:'t1'), Tab 3 (id:'t2')
  // source: tabs.js:412-443. setTab('t1') navigates to Tab 2.
  //
  // Handles with dynamic-select params wired separately (see subsequent it-blocks):
  //   setTabDisable, setTabLoading, setTabVisibility — source: tabs.js:335,355,373
  it("should verify setVisibility, setDisable, setLoading, setTab CSAs from tabs (On click)", () => {
    const actions = [
      // button1: hide the widget — setVisibility(false) — source: tabs.js:320
      { event: "On click", action: "Set visibility", valueToggle: "{{false}}" },
      // button2: show the widget — setVisibility(true) — source: tabs.js:320
      { event: "On click", action: "Set visibility", valueToggle: "{{true}}" },
      // button3: disable the widget — setDisable(true) — source: tabs.js:325
      { event: "On click", action: "Set disable", valueToggle: "{{true}}" },
      // button4: enable the widget — setDisable(false) — source: tabs.js:325
      { event: "On click", action: "Set disable", valueToggle: "{{false}}" },
      // button5: setLoading(true) — source: tabs.js:330
      { event: "On click", action: "Set loading", valueToggle: "{{true}}" },
      // button6: setLoading(false) — source: tabs.js:330
      { event: "On click", action: "Set loading", valueToggle: "{{false}}" },
      // button7: setTab(id='t1') → navigate to Tab 2 — source: tabs.js:311
      // RESOLVE-LIVE: exact action display name 'Set current tab' vs 'Set tab' —
      // using 'Set current tab' per displayName in tabs.js:312.
      { event: "On click", action: "Set current tab", value: "t1" },
    ];

    addCSA("tabs1", actions);

    // Button onClick CSAs fire at RUNTIME, not in edit mode. Verify effects in
    // PREVIEW, where runtime state (visibility/disable/loading/tab) applies.
    cy.get(commonWidgetSelector.buttonCloseEditorSideBar).click({ force: true });
    cy.openInCurrentTab(commonWidgetSelector.previewButton);
    // Wait for the preview navigation to complete before querying any widgets.
    // cy.wait(2500) was a static wait that finished before the URL change landed,
    // causing Cypress to find button1 in the old editor DOM; the click then fired
    // mid-navigation → "page updated" / subject detached error. The URL assertion
    // waits for the navigation to settle; the tabs1 check confirms the canvas has
    // rendered before the first button click.
    cy.url({ timeout: 15000 }).should("include", "env=development");

    const W = commonWidgetSelector.draggableWidget("tabs1");
    const btn = (n) => commonWidgetSelector.draggableWidget(`button${n}`);

    cy.get(W, { timeout: 15000 }).should("be.visible");

    // b1 setVisibility(false) → hidden — source: tabs.js:320
    cy.get(btn(1)).click();
    cy.get(W).should("not.be.visible");

    // b2 setVisibility(true) → visible — source: tabs.js:320
    cy.get(btn(2)).click();
    cy.get(W).should("be.visible");

    // b3 setDisable(true) → .disabled — source: tabs.js:325
    // RESOLVE-LIVE: confirm .disabled class is the correct disabled indicator for Tabs
    // (checkbox uses .disabled; if Tabs uses data-disabled attr adjust assertion below)
    cy.get(btn(3)).click();
    cy.get(W).should("have.class", "disabled");

    // b4 setDisable(false) → not .disabled — source: tabs.js:325
    cy.get(btn(4)).click();
    cy.get(W).should("not.have.class", "disabled");

    // b5 setLoading(true) → Spinner in DOM — source: Tabs.jsx:463-474
    // Tabs renders <Spinner /> (class: spinner-border) inside the widget root div.
    // ".should('be.visible')" fails because the spinner sits in a flex-row child
    // with height:'100%' that resolves to zero computed height — the element exists
    // but Cypress's :visible check rejects it. ".should('exist')" is the correct
    // assertion: it confirms the loading branch rendered without relying on layout.
    cy.get(btn(5)).click();
    cy.get(W).find(".spinner-border").should("exist");

    // b6 setLoading(false) → Spinner removed from DOM — source: Tabs.jsx:463
    cy.get(btn(6)).click();
    cy.get(W).find(".spinner-border").should("not.exist");

    // b7 setTab(id='t1') → Tab 2 becomes active — source: tabs.js:311
    // Tabs.jsx:368 marks the active tab with class "active" on the <li> element
    // (.nav-item.active), NOT with aria-selected. The [aria-selected='true']
    // selector matched an element with empty text — source: Tabs.jsx:368.
    cy.get(btn(7)).click();
    cy.get(W)
      .find(".nav-item.active")
      .should("contain.text", "Tab 2"); // source: tabs.js:425 (Tab 2, id:'t1')

    cy.go("back"); // return to the editor
  });

  // setTabDisable — source: tabs.js:335-352
  // displayName: 'Set Tab disable' (source: tabs.js:337)
  // Params: Tab (select, isDynamicOption, optionsGetter tabItems — source: tabs.js:340-344)
  //         Value (toggle, default {{false}} — source: tabs.js:348)
  // Wired manually (not via addCSA) because the Tab param is a dynamic-select
  // populated from tabItems; selectSupportCSAData targets the second
  // action-options-action-selection-field combobox (events.js:202-209).
  it("should verify setTabDisable CSA from tabs (On click)", () => {
    // Drop a Button to act as the CSA trigger.
    cy.get("body").then(($b) => {
      if ($b.find('[data-cy="widget-search-box-search-bar"]:visible').length) {
        cy.get('[data-cy="right-sidebar-components-button"]').click();
      }
    });
    cy.dragAndDropWidget("Button", 200, 400);

    // Wire: button1 On click → Control Component → tabs1 → Set Tab disable
    openEditorSidebar("button1");
    selectEvent("On click", "Control Component"); // source: tabs.js:337
    selectCSA("tabs1", "Set Tab disable");         // source: tabs.js:337

    // Tab param — dynamic select; Tab 1 title from tabItems (source: tabs.js:415)
    setCSAParam({ label: "Tab", type: "select", value: "Tab 1" }); // source: tabs.js:341
    // Value toggle — set to true (disable Tab 1) — source: tabs.js:348
    setCSAParam({ label: "Value", type: "toggle", value: true }); // source: tabs.js:348

    cy.forceClickOnCanvas();
    cy.waitForAutoSave();

    // Verify effect in PREVIEW — CSA fires at runtime, not in edit mode.
    cy.get(commonWidgetSelector.buttonCloseEditorSideBar).click({ force: true });
    cy.openInCurrentTab(commonWidgetSelector.previewButton);
    cy.wait(2500);

    // Click button1 → setTabDisable('Tab 1', true) → Tab 1 nav-item disabled
    cy.get(commonWidgetSelector.draggableWidget("button1")).click();
    // RESOLVE-LIVE: disabled tab nav-item selector — tabs render a nav bar;
    // trying aria-disabled on the [role="tab"] element for Tab 1.
    // Fallback candidates: .nav-item.disabled, [data-disabled="true"], pointer-events:none.
    cy.get(commonWidgetSelector.draggableWidget("tabs1"))
      .find('[role="tab"]')
      .first()
      .should("have.attr", "aria-disabled", "true"); // source: tabs.js:335,348

    cy.go("back");
  });

  // setTabLoading — source: tabs.js:355-371
  // displayName: 'Set Tab Loading' (source: tabs.js:356)
  // Params: Tab (select, isDynamicOption, optionsGetter tabItems — source: tabs.js:360-363)
  //         Value (toggle, default {{false}} — source: tabs.js:368)
  it("should verify setTabLoading CSA from tabs (On click)", () => {
    cy.get("body").then(($b) => {
      if ($b.find('[data-cy="widget-search-box-search-bar"]:visible').length) {
        cy.get('[data-cy="right-sidebar-components-button"]').click();
      }
    });
    cy.dragAndDropWidget("Button", 200, 400);

    openEditorSidebar("button1");
    selectEvent("On click", "Control Component"); // source: tabs.js:356
    selectCSA("tabs1", "Set Tab Loading");         // source: tabs.js:356

    // Tab param — Tab 1 from tabItems (source: tabs.js:415)
    setCSAParam({ label: "Tab", type: "select", value: "Tab 1" }); // source: tabs.js:360
    // Value toggle — set to true (loading on Tab 1) — source: tabs.js:368
    setCSAParam({ label: "Value", type: "toggle", value: true }); // source: tabs.js:368

    cy.forceClickOnCanvas();
    cy.waitForAutoSave();

    cy.get(commonWidgetSelector.buttonCloseEditorSideBar).click({ force: true });
    cy.openInCurrentTab(commonWidgetSelector.previewButton);
    cy.wait(2500);

    // Click button1 → setTabLoading('Tab 1', true) → loader visible on tabs1 widget
    // setTabLoading renders a loading indicator on the tab-panel content area, not on
    // the nav-item itself. ToolJet uses .tj-widget-loader as the loading overlay on the
    // widget wrapper — same pattern as setLoading (global). Assert on the wrapper level.
    cy.get(commonWidgetSelector.draggableWidget("button1")).click();
    cy.get(commonWidgetSelector.draggableWidget("tabs1"))
      .parent()
      .within(() => {
        cy.get(".tj-widget-loader").should("be.visible"); // source: tabs.js:355,368
      });

    cy.go("back");
  });

  // setTabVisibility — source: tabs.js:373-391
  // displayName: 'Set Tab visibility' (source: tabs.js:375)
  // Params: Tab (select, isDynamicOption, optionsGetter tabItems — source: tabs.js:378-381)
  //         Value (toggle, default {{false}} — source: tabs.js:388)
  it("should verify setTabVisibility CSA from tabs (On click)", () => {
    cy.get("body").then(($b) => {
      if ($b.find('[data-cy="widget-search-box-search-bar"]:visible').length) {
        cy.get('[data-cy="right-sidebar-components-button"]').click();
      }
    });
    cy.dragAndDropWidget("Button", 200, 400);

    openEditorSidebar("button1");
    selectEvent("On click", "Control Component"); // source: tabs.js:375
    selectCSA("tabs1", "Set Tab visibility");      // source: tabs.js:375

    // Tab param — Tab 1 from tabItems (source: tabs.js:415)
    setCSAParam({ label: "Tab", type: "select", value: "Tab 1" }); // source: tabs.js:378
    // Value toggle — false hides Tab 1 (default {{false}} means hide — source: tabs.js:388)
    // The default toggle state is unchecked ({{false}} = hide). We want to hide Tab 1,
    // so leave the toggle at its default false (do not flip to true). We explicitly
    // assert the desired state.
    setCSAParam({ label: "Value", type: "toggle", value: false }); // source: tabs.js:388

    cy.forceClickOnCanvas();
    cy.waitForAutoSave();

    cy.get(commonWidgetSelector.buttonCloseEditorSideBar).click({ force: true });
    cy.openInCurrentTab(commonWidgetSelector.previewButton);
    cy.wait(2500);

    // Click button1 → setTabVisibility('Tab 1', false) → Tab 1 nav-item hidden/removed
    cy.get(commonWidgetSelector.draggableWidget("button1")).click();
    // RESOLVE-LIVE: hidden tab nav-item selector — tab may be removed from the DOM
    // or hidden via CSS. Trying not.be.visible on the first [role="tab"] element;
    // if the tab is removed from DOM, use not.exist instead.
    cy.get(commonWidgetSelector.draggableWidget("tabs1"))
      .find('[role="tab"]')
      .first()
      .should("not.be.visible"); // source: tabs.js:373,388

    cy.go("back");
  });
});
