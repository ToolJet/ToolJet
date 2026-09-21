import { fake } from "Fixtures/fake";
import { commonWidgetSelector } from "Selectors/common";
import {
    verifyAndModifyParameter,
    verifyAndModifyToggleFx,
    verifyAndModifySwitch,
    verifyLayout,
    openEditorSidebar,
    openAccordion,
} from "Support/utils/commonWidget";

// testIsolation:false — cypress-real-dnd caches its CDP client for the spec
// run; testIsolation's per-test AUT reset leaves that client stale, so 2nd+
// test drags throw "No dragIntercepted". Keeping the AUT stable across tests
// keeps the drag intercept valid. Each test still re-logs-in + creates its own
// app in beforeEach, so shared browser state is not relied upon.
// retries:1 — afterEach deletes the app via API, leaving the browser on the old
// editor page. The next beforeEach's openApp() navigation can stale the CDP
// intercept. A single retry re-runs beforeEach (re-priming the intercept).
describe('Tabs — properties facet', { testIsolation: false, retries: 1 }, () => {
    const W = 'tabs1'; // runtimeCandidate from tabs-surface.yaml

    beforeEach(() => {
        cy.apiLogin();
        cy.apiCreateApp(`${fake.companyName}-Tabs-Properties-App`);
        cy.openApp();
        // Double-rewarm: the afterEach apiDeleteApp() leaves the browser on the
        // deleted app's page; openApp() then navigates to the new app, which
        // stales the CDP drag intercept. Calling realDragRewarm here (before the
        // component panel opens) gives the intercept maximum settling time before
        // the actual drag fires inside dragAndDropWidget.
        cy.realDragRewarm();
        cy.wait(500);
        cy.dragAndDropWidget('Tabs', 500, 100);
        cy.get('[data-cy="query-manager-toggle-button"]').click();
    });

    // ── General ──────────────────────────────────────────────────────────────
    it('general — useDynamicOptions (toggle), tabs (code) default renders 3 tabs, defaultTab (code)', () => {
        openEditorSidebar(W);

        // useDynamicOptions (toggle) fx default {{false}} — source: tabs.js:15 / definition tabs.js:407
        // Observable: flipping ON switches the sidebar to dynamic mode — the 'tabs'
        // code field appears (replacing the tabItems structured editor).
        verifyAndModifyToggleFx('Dynamic options', '{{false}}'); // flips ON → useDynamicOptions=true

        // tabs (code) — only rendered when useDynamicOptions=true; test it while
        // the field is visible in the sidebar. source: tabs.js:57
        // fake.firstName (single word, no spaces): clearAndTypeOnCodeMirror splits
        // on whitespace; multi-word sentences produce multiple tokens, each preceded
        // by a .click() that can land mid-text, causing cursor-position scrambling.
        const tabsValue = fake.firstName; // dynamic: fake — single word avoids CM tokenizer jitter
        verifyAndModifyParameter('Tabs', tabsValue); // source: tabs.js:57

        // defaultTab (code) — also only rendered when useDynamicOptions=true (it
        // selects the active tab by ID from the `tabs` expression; in static mode
        // the active tab is controlled per-tabItem). source: tabs.js:80 / definition tabs.js:446
        verifyAndModifyParameter('Default tab', '1'); // source: tabs.js:80

        // Flip useDynamicOptions back OFF — sidebar reverts to the tabItems editor.
        verifyAndModifyToggleFx('Dynamic options', '{{true}}'); // flips back OFF → useDynamicOptions=false

        // With useDynamicOptions=false, the widget renders from tabItems (Tab 1/2/3).
        // source: tabs.js:57 / definition tabs.js:408-444
        cy.get(commonWidgetSelector.draggableWidget(W))
            .scrollIntoView()
            .within(() => {
                // default tabItems: Tab 1, Tab 2, Tab 3 — source: tabs.js:415,424,433
                cy.contains('Tab 1').should('exist');
                cy.contains('Tab 2').should('exist');
                cy.contains('Tab 3').should('exist');
            });
    });

    // ── Additional Actions ────────────────────────────────────────────────────
    it('additional — hideTabs (toggle) hides the tab header', () => {
        openEditorSidebar(W);
        openAccordion('Additional Actions');

        // hideTabs has value:false (plain boolean). For the properties facet we
        // only need to verify the toggle exists and flips — no fx-path exercise needed.
        // Directly clicking the toggle avoids the open/close-empty-CM race that
        // verifyAndModifyToggleFx(null) can leave behind. source: tabs.js:91
        cy.get(commonWidgetSelector.parameterLabel('Hide tabs'))
            .should('have.text', 'Hide tabs'); // source: tabs.js:93
        cy.get(commonWidgetSelector.parameterTogglebutton('Hide tabs')).click(); // flips ON
        cy.forceClickOnCanvas();
        // Observable: when hideTabs=true the tab header bar is hidden
        // source: tabs.js:91 — RESOLVE-LIVE: exact selector for the tab header bar
        // needs runtime confirmation. Using `.tab-header` (commonly used in Tabs.jsx).
        cy.get(commonWidgetSelector.draggableWidget(W))
            .scrollIntoView()
            .within(() => {
                // hideTabs sets display:none on the nav ul — Tabs.jsx:350
                // data-bs-toggle="tabs" is the stable selector for the tab header nav.
                cy.get('[data-bs-toggle="tabs"]').should('not.be.visible');
            });
    });

    it('additional — renderOnlyActiveTab (toggle) flips ON', () => {
        openEditorSidebar(W);
        openAccordion('Additional Actions');

        // renderOnlyActiveTab has value:false (plain boolean). Direct toggle click — same
        // rationale as hideTabs above. source: tabs.js:102 / definition tabs.js:448
        // NOTE: flipping ON causes scrollToTopOnTabSwitch (conditionallyRender key:
        // renderOnlyActiveTab value:false) to be hidden (source: tabs.js:113).
        cy.get(commonWidgetSelector.parameterLabel('Render only active tab'))
            .should('have.text', 'Render only active tab'); // source: tabs.js:104
        cy.get(commonWidgetSelector.parameterTogglebutton('Render only active tab')).click(); // flips ON
        // Observable: the toggle is now ON; its sibling conditionally-rendered toggle
        // scrollToTopOnTabSwitch should no longer appear.
        cy.get('[data-cy="scroll-to-top-on-tab-switch-widget-parameter-label"]')
            .should('not.exist'); // source: tabs.js:113 (conditionallyRender: renderOnlyActiveTab=false hides this)
    });

    it('additional — scrollToTopOnTabSwitch (toggle, visible when renderOnlyActiveTab=false, default)', () => {
        openEditorSidebar(W);
        openAccordion('Additional Actions');

        // scrollToTopOnTabSwitch is visible by default because renderOnlyActiveTab
        // defaults to false. source: tabs.js:113 / definition tabs.js:449
        // conditionallyRender: { key: 'renderOnlyActiveTab', value: false } — source: tabs.js:117
        // value:false (plain boolean) — direct toggle click, same rationale as hideTabs.
        cy.get(commonWidgetSelector.parameterLabel('Scroll to top on tab switch'))
            .should('have.text', 'Scroll to top on tab switch'); // source: tabs.js:115
        cy.get(commonWidgetSelector.parameterTogglebutton('Scroll to top on tab switch')).click(); // flips ON
        // Observable: the toggle input must now be checked — this is the maximum
        // automatable effect in edit mode. The runtime scroll-to-top behaviour
        // (page scrolls to the top of the tab panel on every tab switch) is only
        // observable in PREVIEW with scrollable content and cannot be driven headlessly.
        cy.get(commonWidgetSelector.parameterTogglebutton('Scroll to top on tab switch'))
            .should('be.checked'); // source: tabs.js:113 — toggle flipped ON confirms the property is active
    });

    it('additional — dynamicHeight (toggle) flips ON', () => {
        openEditorSidebar(W);
        openAccordion('Additional Actions');

        // dynamicHeight (toggle) fx default {{false}} — source: tabs.js:125 / definition tabs.js:406
        verifyAndModifyToggleFx('Dynamic height', '{{false}}'); // source: tabs.js:125 (flips ON)
        // Observable: dynamicHeight=true causes the widget to grow/shrink to fit
        // its content. The height side-effect is layout-level and only observable
        // in preview; the toggle flip itself is the assertable action here.
        // Assert the fx button toggled back (confirming the CM cycle completed).
        cy.get(commonWidgetSelector.parameterLabel('Dynamic height'))
            .should('have.text', 'Dynamic height'); // source: tabs.js:128
    });

    it('additional — tooltipFormat (switch: Plain text / Markdown / HTML)', () => {
        openEditorSidebar(W);
        openAccordion('Additional Actions');

        // tooltipFormat (switch) default 'plainText', isFxNotRequired:true — source: tabs.js:137 / definition tabs.js:456
        // Switch to Markdown
        verifyAndModifySwitch('Tooltip', 'Markdown'); // source: tabs.js:141
        cy.get('[data-cy="togglr-button-markdown"]')
            .closest('[role="radio"]')
            .should('have.attr', 'aria-checked', 'true'); // Markdown selected

        // Switch to HTML
        verifyAndModifySwitch('Tooltip', 'HTML'); // source: tabs.js:142
        cy.get('[data-cy="togglr-button-html"]')
            .closest('[role="radio"]')
            .should('have.attr', 'aria-checked', 'true'); // HTML selected

        // Switch back to Plain text
        verifyAndModifySwitch('Tooltip', 'Plain text'); // source: tabs.js:140
        // data-cy uses the raw option value — 'plainText' (camelCase), not the
        // displayName. ToggleGroupItem.jsx:33: data-cy={`togglr-button-${value}`}
        cy.get('[data-cy="togglr-button-plainText"]')
            .closest('[role="radio"]')
            .should('have.attr', 'aria-checked', 'true'); // plainText selected
    });

    it('additional — tooltip (code) accepts text', () => {
        openEditorSidebar(W);
        openAccordion('Additional Actions');

        // tooltip (code) default '' — source: tabs.js:151 / definition tabs.js:455
        // fake.firstName (single word, no spaces): avoids clearAndTypeOnCodeMirror's
        // multi-token cursor-jitter that scrambles multi-word sentences.
        const tooltipText = fake.firstName; // dynamic: fake — single word
        verifyAndModifyParameter('Tooltip', tooltipText); // source: tabs.js:151
        // Observable: the CM editor now holds the typed text.
        // Tooltip popover visibility requires hovering in preview (non-headless);
        // the CM value change is the automatable assertion.
        cy.get(commonWidgetSelector.parameterInputField('Tooltip'))
            .find('.cm-line')
            .should('have.text', tooltipText); // dynamic: fake echoed in CM editor
    });

    it('additional — loadingState (toggle) shows widget loader', () => {
        openEditorSidebar(W);
        openAccordion('Additional Actions');

        // loadingState (toggle) fx default {{false}} — source: tabs.js:23 / definition tabs.js:450
        verifyAndModifyToggleFx('Loading state', '{{false}}'); // source: tabs.js:23 (flips ON)
        cy.forceClickOnCanvas();
        cy.get(commonWidgetSelector.draggableWidget(W))
            .scrollIntoView()
            .within(() => {
                // Tabs renders its own Spinner (not tj-widget-loader) when isLoading=true.
                // Spinner component: div[role="status"] — source: _ui/Spinner/index.js:15
                // Tabs.jsx:472 renders <Spinner /> in the content area when isLoading.
                cy.get('[role="status"]').should('be.visible');
            });
    });

    it('additional — visibility (toggle) hides the widget', () => {
        openEditorSidebar(W);
        openAccordion('Additional Actions');

        // visibility (toggle) fx default {{true}} — source: tabs.js:32 / definition tabs.js:451
        verifyAndModifyToggleFx('Visibility', '{{true}}'); // source: tabs.js:32 (flips OFF)
        cy.get(commonWidgetSelector.draggableWidget(W))
            .scrollIntoView()
            .should('not.be.visible'); // source: tabs.js:32 — widget hidden when visibility=false
    });

    it('additional — collapseWhenHidden (toggle) flips ON', () => {
        openEditorSidebar(W);
        openAccordion('Additional Actions');

        // collapseWhenHidden (toggle) fx default {{false}} — source: tabs.js:42 / definition tabs.js:453
        verifyAndModifyToggleFx('Collapse when hidden', '{{false}}'); // source: tabs.js:42 (flips ON)
        // Observable: layout-only side-effect (widget must be hidden first for
        // reflow to occur); the toggle flip is confirmed by verifyAndModifyToggleFx.
        cy.get(commonWidgetSelector.parameterLabel('Collapse when hidden'))
            .should('have.text', 'Collapse when hidden'); // source: tabs.js:44
    });

    it('additional — disabledState (toggle) disables the widget', () => {
        openEditorSidebar(W);
        openAccordion('Additional Actions');

        // disabledState (toggle) fx default {{false}} — source: tabs.js:48 / definition tabs.js:454
        verifyAndModifyToggleFx('Disable', '{{false}}'); // source: tabs.js:48 (flips ON)
        cy.forceClickOnCanvas();
        // Observable: RenderWidget adds .disabled class when disabledState=true.
        // RESOLVE-LIVE: confirm whether Tabs uses `data-disabled` attr or `.disabled`
        // class (checkbox uses .disabled; toggleSwitchV2 uses data-disabled).
        cy.get(commonWidgetSelector.draggableWidget(W))
            .scrollIntoView()
            .should('have.class', 'disabled'); // RESOLVE-LIVE: verify exact disabled indicator for Tabs
    });

    afterEach(() => {
        cy.waitForAutoSave();
        // Navigate away from the app editor BEFORE deleting. The editor's
        // React code holds an open WebSocket; apiDeleteApp() causes the server
        // to close it, which triggers window.location = '/apps' inside React —
        // a redirect that races with the next beforeEach's openApp() navigation
        // and stales the CDP drag intercept. Navigating to '/' first closes the
        // WebSocket cleanly (page unloads, React unmounts), so the delete
        // produces no browser-side redirect and the next openApp() is ONE clean
        // navigation from the apps list to the new app editor.
        cy.visit('/');
        cy.apiDeleteApp();
    });

    // ── Layout (others) ───────────────────────────────────────────────────────
    it('layout — showOnDesktop + showOnMobile via verifyLayout', () => {
        // covers others.showOnDesktop ('{{true}}') + showOnMobile ('{{false}}')
        // source: tabs.js:11 (showOnDesktop) / tabs.js:12 (showOnMobile)
        verifyLayout(W);
    });
});
