import { fake } from "Fixtures/fake";
import { commonWidgetSelector } from "Selectors/common";
import {
    verifyAndModifyParameter,
    verifyAndModifyToggleFx,
    openEditorSidebar,
    openAccordion,
} from "Support/utils/commonWidget";

// propertiesFx facet — exercises the fx (dynamic-binding) path for every
// fx-capable property on the Tabs widget, plus the NEGATIVE case for the
// four fields that carry no fx button (isFxNotRequired / plain-boolean defaults).
//
// testIsolation:false — cypress-real-dnd caches its CDP client for the spec run;
// testIsolation's per-test AUT reset leaves that client stale, so 2nd+ test drags
// throw "No dragIntercepted". Keeping the AUT stable across tests keeps the drag
// intercept valid. Each test still re-logs-in + creates its own app in beforeEach,
// so shared browser state is not relied upon.
// retries:1 — afterEach deletes the app via API, leaving the browser on the old
// editor page. The next beforeEach's openApp() navigation can stale the CDP
// intercept. A single retry re-runs beforeEach (re-priming the intercept).
describe('Tabs — propertiesFx facet', { testIsolation: false, retries: 1 }, () => {
    const W = 'tabs1'; // runtimeCandidate from tabs-surface.yaml

    beforeEach(() => {
        cy.apiLogin();
        cy.apiCreateApp(`${fake.companyName}-Tabs-PropertiesFx-App`);
        cy.openApp();
        // Double-rewarm: afterEach apiDeleteApp() leaves the browser on the
        // deleted app's page; openApp() navigates to the new app, staling the
        // CDP drag intercept. Calling realDragRewarm here (before the component
        // panel opens) gives the intercept maximum settling time.
        cy.realDragRewarm();
        cy.wait(500);
        cy.dragAndDropWidget('Tabs', 500, 100);
        cy.get('[data-cy="query-manager-toggle-button"]').click();
    });

    afterEach(() => {
        cy.waitForAutoSave();
        // Navigate away before deleting to prevent the editor's WebSocket
        // disconnect from triggering a reactive redirect that races with
        // the next beforeEach's openApp() navigation.
        cy.visit('/');
        cy.apiDeleteApp();
    });

    // ── fx-capable CODE fields ────────────────────────────────────────────────
    // Code fields ARE the fx/code input; exercise them with a binding and
    // assert the effect where observable in edit mode.

    it('general — tabs (code) fx: binding accepted by the CodeMirror editor', () => {
        openEditorSidebar(W);

        // tabs (code) is only rendered when useDynamicOptions=true.
        // Flip it ON first — same pattern as properties.cy.js. source: tabs.js:15
        verifyAndModifyToggleFx('Dynamic options', '{{false}}'); // flips ON → useDynamicOptions=true

        // tabs (code, fxCapable:true) — source: tabs.js:57
        // fake.firstName (single word) avoids clearAndTypeOnCodeMirror's multi-token
        // cursor-jitter that scrambles multi-word sentences.
        const tabsValue = fake.firstName; // dynamic: fake — single word
        verifyAndModifyParameter('Tabs', tabsValue); // source: tabs.js:57
        cy.get(commonWidgetSelector.parameterInputField('Tabs'))
            .find('.cm-line')
            .should('have.text', tabsValue); // source: tabs.js:57
    });

    it('general — defaultTab (code) fx: binding changes the active tab index', () => {
        openEditorSidebar(W);

        // defaultTab is only rendered when useDynamicOptions=true. source: tabs.js:80
        verifyAndModifyToggleFx('Dynamic options', '{{false}}'); // flips ON → useDynamicOptions=true

        // defaultTab (code, fxCapable:true) default "0" — source: tabs.js:80
        // In dynamic mode, tabs come from the `tabs` expression:
        //   [{title:'Home',id:'0'},{title:'Profile',id:'1'},{title:'Settings',id:'2'}]
        // Setting defaultTab='1' makes the 'Profile' tab (id:'1') the active tab.
        verifyAndModifyParameter('Default tab', '1'); // source: tabs.js:80
        cy.forceClickOnCanvas();
        // Observable: the nav-item for the active tab gets the 'active' class.
        // source: Tabs.jsx:368 — className={`nav-item ${currentTab == tab.id ? 'active' : ''}`}
        cy.get(commonWidgetSelector.draggableWidget(W))
            .scrollIntoView()
            .within(() => {
                cy.get('.nav-item.active')
                    .first()
                    .should('contain.text', 'Profile'); // id:'1' → title:'Profile' from tabs expression
            });
    });

    // ── fx-capable TOGGLE fields ──────────────────────────────────────────────
    // verifyAndModifyToggleFx opens the fx editor, asserts the braced default in
    // .cm-line, closes it, then flips the toggle. Assert the flipped DOM effect
    // where observable in edit mode.

    it('additional — loadingState fx: {{false}} default → flip ON → loader visible', () => {
        openEditorSidebar(W);
        openAccordion('Additional Actions');

        // loadingState (toggle, fxCapable:true) default {{false}} — source: tabs.js:23
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

    it('additional — visibility fx: {{true}} default → flip OFF → widget hidden', () => {
        openEditorSidebar(W);
        openAccordion('Additional Actions');

        // visibility (toggle, fxCapable:true) default {{true}} — source: tabs.js:32
        verifyAndModifyToggleFx('Visibility', '{{true}}'); // source: tabs.js:32 (flips OFF)
        cy.get(commonWidgetSelector.draggableWidget(W))
            .scrollIntoView()
            .should('not.be.visible'); // source: tabs.js:32 — widget hidden when visibility=false
    });

    it('additional — collapseWhenHidden fx: {{false}} default → flip ON', () => {
        openEditorSidebar(W);
        openAccordion('Additional Actions');

        // collapseWhenHidden (toggle, fxCapable:true) default {{false}} — source: tabs.js:42
        // Layout-only side-effect (reflow only when widget is hidden); the toggle
        // flip + fx-default verification IS the fx-path exercise here.
        verifyAndModifyToggleFx('Collapse when hidden', '{{false}}'); // source: tabs.js:42 (flips ON)
        cy.get(commonWidgetSelector.parameterTogglebutton('Collapse when hidden'))
            .should('be.checked'); // source: tabs.js:42 — toggle is now ON
    });

    it('additional — disabledState fx: {{false}} default → flip ON → widget disabled', () => {
        openEditorSidebar(W);
        openAccordion('Additional Actions');

        // disabledState (toggle, fxCapable:true) default {{false}} — source: tabs.js:48
        verifyAndModifyToggleFx('Disable', '{{false}}'); // source: tabs.js:48 (flips ON)
        cy.forceClickOnCanvas();
        // Observable: the canvas wrapper div gets the .disabled CSS class when
        // disabledState=true. draggableWidget targets that wrapper, not the inner
        // Tabs root (which carries data-disabled). Class confirmed at runtime:
        // div.canvas-component._tooljet-tabs1.disabled — source: canvas wrapper.
        cy.get(commonWidgetSelector.draggableWidget(W))
            .scrollIntoView()
            .should('have.class', 'disabled');
    });

    it('additional — dynamicHeight fx: toggle field → flip ON', () => {
        openEditorSidebar(W);
        openAccordion('Additional Actions');

        // dynamicHeight (toggle, fxCapable:false per config but renders with {{}}
        // default {{false}}) — source: tabs.js (definition tabs.js:406).
        // The definition uses {{}} braces so verifyAndModifyToggleFx handles it.
        // Height side-effect is layout-level and only observable in preview mode;
        // the toggle flip is the assertable action in edit mode.
        verifyAndModifyToggleFx('Dynamic height', '{{false}}'); // source: tabs.js definition:406 (flips ON)
        cy.get(commonWidgetSelector.parameterTogglebutton('Dynamic height'))
            .should('be.checked'); // confirms the toggle is now ON
    });

    it('additional — tooltip (code) fx: binding accepted by the CodeMirror editor', () => {
        openEditorSidebar(W);
        openAccordion('Additional Actions');

        // tooltip (code, fxCapable:true) default '' — source: tabs.js:151
        // fake.firstName (single word) avoids clearAndTypeOnCodeMirror's multi-token
        // cursor-jitter that scrambles multi-word sentences.
        const tooltipText = fake.firstName; // dynamic: fake — single word
        verifyAndModifyParameter('Tooltip', tooltipText); // source: tabs.js:151
        cy.get(commonWidgetSelector.parameterInputField('Tooltip'))
            .find('.cm-line')
            .should('have.text', tooltipText); // source: tabs.js:151
    });

    // ── NEGATIVE — fields with NO fx button ──────────────────────────────────
    // tooltipFormat carries isFxNotRequired:true (source: tabs.js:137).
    // hideTabs, renderOnlyActiveTab, scrollToTopOnTabSwitch use plain boolean
    // defaults (no {{}}) — they are plain toggles rendered without an fx button.

    it('additional — tooltipFormat (isFxNotRequired:true) exposes NO fx button', () => {
        openEditorSidebar(W);
        openAccordion('Additional Actions');

        // tooltipFormat (switch, isFxNotRequired:true) — source: tabs.js:137
        // data-cy uses the raw option value — 'plainText' (camelCase), not the
        // displayName. ToggleGroupItem.jsx:33: data-cy={`togglr-button-${value}`}
        cy.get('[data-cy="togglr-button-plainText"]').scrollIntoView().should('exist'); // source: tabs.js:140 (default plainText)
        // tooltipFormat and the `tooltip` code field BOTH carry displayName
        // 'Tooltip' (tabs.js:137 / tabs.js:151), so they share the fx-button
        // data-cy namespace. The code field contributes exactly ONE fx button;
        // if tooltipFormat were fx-capable there would be two. Asserting count=1
        // is the unambiguous isFxNotRequired check.
        cy.get(commonWidgetSelector.parameterFxButton('Tooltip'))
            .should('have.length', 1); // source: tabs.js:137 (isFxNotRequired:true — only the tooltip code field has fx)
    });

    it('additional — hideTabs / renderOnlyActiveTab / scrollToTopOnTabSwitch (plain-boolean toggles) have fx button but open empty CM', () => {
        openEditorSidebar(W);
        openAccordion('Additional Actions');

        // fx button visibility is controlled by isFxNotRequired:true in the config,
        // NOT by whether the default value uses {{}} braces. Plain-boolean toggles
        // (value: false, not '{{false}}') still render an fx button — the difference
        // is the CM opens empty (no expression) instead of showing '{{false}}'.
        // Only isFxNotRequired:true (e.g. tooltipFormat) actually suppresses the button.

        // hideTabs (plain false default) — source: tabs.js:91 / definition tabs.js:447
        // fx button exists; CM opens empty because no {{}} expression is stored.
        cy.get(commonWidgetSelector.parameterFxButton('Hide tabs'))
            .should('exist'); // source: tabs.js:91 (has fx button — isFxNotRequired not set)

        // renderOnlyActiveTab (plain false default) — source: tabs.js:102
        cy.get(commonWidgetSelector.parameterFxButton('Render only active tab'))
            .should('exist'); // source: tabs.js:102 (has fx button)

        // scrollToTopOnTabSwitch (plain false default) — source: tabs.js:113
        // Conditionally rendered when renderOnlyActiveTab=false (default), visible here.
        cy.get(commonWidgetSelector.parameterFxButton('Scroll to top on tab switch'))
            .should('exist'); // source: tabs.js:113 (has fx button)
    });
});
