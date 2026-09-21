import { fake } from "Fixtures/fake";
import { commonWidgetSelector } from "Selectors/common";
import {
    openEditorSidebar,
    openAccordion,
    selectColourFromColourPicker,
    verifyWidgetColorCss,
    verifyAndModifySwitch,
    selectFromSidebarDropdown,
    fillBoxShadowParams,
    verifyBoxShadowCss,
} from "Support/utils/commonWidget";

// ── DOM map (Tabs.jsx) ────────────────────────────────────────────────────────
// The root widget element carries `data-cy={dataCy}` which resolves to "tabs1"
// (Tabs.jsx:316 `data-cy={dataCy}`).  All style targets are inside it.
//
// WIDGET ROOT  : [data-cy="tabs1"]   — carries boxShadow + borderRadius (Tabs.jsx:311-313)
// NAV WRAPPER  : [data-cy="tabs1"] > div:first-child
//                  — carries headerBackground (Tabs.jsx:327) + divider as border-bottom (Tabs.jsx:324)
// NAV UL       : [data-cy="tabs1"] .nav    — ul.nav (Tabs.jsx:344)
// ACTIVE LI    : [data-cy="tabs1"] .nav-item.active
// ACTIVE DIV   : [data-cy="tabs1"] .nav-item.active > div
//                  — carries selectedText (color, Tabs.jsx:420) and accent as border-bottom
//                    of the parent li (Tabs.jsx:372)
// INACTIVE LI  : [data-cy="tabs1"] .nav-item:not(.active)
// INACTIVE DIV : [data-cy="tabs1"] .nav-item:not(.active) > div
//                  — carries unselectedText (color, Tabs.jsx:420)
//
// hoverBackground: set via tinycolor on hover — not observable in headless Cypress
//   (requires onMouseEnter; not automatable via cy.hover in CI).
// unselectedIcon / selectedIcon: applied to TablerIcon svg `color` style prop —
//   only visible when tab has iconVisibility=true (Tabs.jsx:284).
//   The default tabItems have no icon; this requires DOM setup → RESOLVE-LIVE.
// commonBackgroundColor: applied to TabContent sub-container background —
//   resolves only in edit-mode canvas sub-container; RESOLVE-LIVE for exact selector.
// border: applied as --cc-tabs-border-color CSS var (Tabs.jsx:314) — observable
//   as a custom property; RESOLVE-LIVE for which child element reads it.

const W = 'tabs1'; // runtimeCandidate
const ROOT = `[data-cy="${W}"]`; // Tabs.jsx:316 — boxShadow, borderRadius
const NAV_WRAPPER = `${ROOT} > div:first-child`; // Tabs.jsx:322-329 — headerBackground, divider
const ACTIVE_LI = `${ROOT} .nav-item.active`; // Tabs.jsx:368 — accent as border-bottom
const ACTIVE_DIV = `${ROOT} .nav-item.active > div`; // Tabs.jsx:408-429 — selectedText color
const INACTIVE_DIV = `${ROOT} .nav-item:not(.active) > div`; // Tabs.jsx:420 — unselectedText color

// testIsolation:false — cypress-real-dnd caches its CDP client for the spec run;
// testIsolation's per-test AUT reset leaves that client stale.
describe('Tabs — styles facet', { testIsolation: false, retries: 1 }, () => {

    beforeEach(() => {
        cy.apiLogin();
        cy.apiCreateApp(`${fake.companyName}-Tabs-Styles-App`);
        cy.openApp();
        cy.realDragRewarm();
        cy.wait(500);
        cy.dragAndDropWidget('Tabs', 500, 100);
        cy.get('[data-cy="query-manager-toggle-button"]').click();
    });

    // ── Tabs accordion ───────────────────────────────────────────────────────────
    // Styles under accordian='Tabs': headerBackground, divider, unselectedText,
    // selectedText, hoverBackground, unselectedIcon, selectedIcon, accent,
    // tabWidth, transition.

    it('Tabs accordian — headerBackground (colorSwatches) colours the nav wrapper background', () => {
        openEditorSidebar(W);
        cy.get(commonWidgetSelector.buttonStylesEditorSideBar).click();
        openAccordion('Tabs');

        // headerBackground (colorSwatches, fxCapable:true) default var(--cc-surface1-surface)
        // source: tabs.js:162 — applied as backgroundColor on the nav wrapper div (Tabs.jsx:327)
        selectColourFromColourPicker('Header background', ['255', '0', '0', '100']); // dynamic: test color
        cy.get(ROOT).scrollIntoView();
        // RESOLVE-LIVE: headerBackground → NAV_WRAPPER `background-color` (Tabs.jsx:327).
        // Confirm the nav-wrapper selector resolves to exactly the header bar after live inspection.
        verifyWidgetColorCss(NAV_WRAPPER, 'background-color', ['255', '0', '0', '100'], true); // dynamic: test color
    });

    it('Tabs accordian — divider (colorSwatches) colours the nav wrapper bottom border', () => {
        openEditorSidebar(W);
        cy.get(commonWidgetSelector.buttonStylesEditorSideBar).click();
        openAccordion('Tabs');

        // divider (colorSwatches, fxCapable:true) default var(--cc-default-border)
        // source: tabs.js:171 — applied as borderBottom color on the nav wrapper (Tabs.jsx:324)
        selectColourFromColourPicker('Divider', ['255', '0', '0', '100']); // dynamic: test color
        cy.get(ROOT).scrollIntoView();
        // RESOLVE-LIVE: divider → NAV_WRAPPER `border-bottom-color` (Tabs.jsx:324 `0.5px solid ${divider}`).
        // border-bottom is a shorthand; read the longhand border-bottom-color.
        verifyWidgetColorCss(NAV_WRAPPER, 'border-bottom-color', ['255', '0', '0', '100'], true); // dynamic: test color
    });

    it('Tabs accordian — unselectedText (colorSwatches) colours inactive tab text', () => {
        openEditorSidebar(W);
        cy.get(commonWidgetSelector.buttonStylesEditorSideBar).click();
        openAccordion('Tabs');

        // unselectedText (colorSwatches, fxCapable:true) default var(--cc-placeholder-text)
        // source: tabs.js:180 — applied as color on inactive tab inner div (Tabs.jsx:420)
        selectColourFromColourPicker('Unselected text', ['255', '0', '0', '100']); // dynamic: test color
        cy.get(ROOT).scrollIntoView();
        // RESOLVE-LIVE: unselectedText → INACTIVE_DIV `color` (Tabs.jsx:420 `color: unselectedText`).
        verifyWidgetColorCss(INACTIVE_DIV, 'color', ['255', '0', '0', '100'], true); // dynamic: test color
    });

    it('Tabs accordian — selectedText (colorSwatches) colours the active tab text', () => {
        openEditorSidebar(W);
        cy.get(commonWidgetSelector.buttonStylesEditorSideBar).click();
        openAccordion('Tabs');

        // selectedText (colorSwatches, fxCapable:true) default var(--cc-primary-text)
        // source: tabs.js:189 — applied as color on active tab inner div (Tabs.jsx:420)
        selectColourFromColourPicker('Selected text', ['255', '0', '0', '100']); // dynamic: test color
        cy.get(ROOT).scrollIntoView();
        // RESOLVE-LIVE: selectedText → ACTIVE_DIV `color` (Tabs.jsx:420 `color: selectedText` when active).
        verifyWidgetColorCss(ACTIVE_DIV, 'color', ['255', '0', '0', '100'], true); // dynamic: test color
    });

    it('Tabs accordian — hoverBackground (colorSwatches) is exercised via colour picker', () => {
        openEditorSidebar(W);
        cy.get(commonWidgetSelector.buttonStylesEditorSideBar).click();
        openAccordion('Tabs');

        // hoverBackground (colorSwatches, fxCapable:true) default "#1B1F24"
        // source: tabs.js:198 — applied via tinycolor setAlpha on onMouseEnter (Tabs.jsx:413-416)
        selectColourFromColourPicker('Hover background', ['255', '0', '0', '100']); // dynamic: test color
        cy.forceClickOnCanvas();
        cy.get(ROOT).scrollIntoView();
        // realHover on the <li> triggers onMouseEnter → React sets isHovered=true.
        // The background is applied to the INNER <div> (Tabs.jsx:413-415), not
        // the <li> itself — the <li> always has backgroundColor:'transparent'.
        // tinycolor(resolvedHoverBackground).setAlpha(0.08) → rgba(255,0,0,0.08)
        cy.get(`${ROOT} .nav-item`).eq(1).realHover();
        cy.get(`${ROOT} .nav-item > div`).eq(1)
            .should('have.css', 'background-color')
            .and('not.eq', 'rgba(0, 0, 0, 0)'); // source: Tabs.jsx:413 — hover applies to inner div
    });

    it('Tabs accordian — unselectedIcon (colorSwatches) is exercised via colour picker', () => {
        openEditorSidebar(W);
        cy.get(commonWidgetSelector.buttonStylesEditorSideBar).click();
        openAccordion('Tabs');

        // unselectedIcon (colorSwatches, fxCapable:true) default var(--cc-default-icon)
        // source: tabs.js:207 — applied as `color` on TablerIcon inside inactive tab (Tabs.jsx:287-292)
        selectColourFromColourPicker('Unselected icon', ['255', '0', '0', '100']); // source: tabs.js:207
        // RESOLVE-LIVE: unselectedIcon CSS applied to svg color only when iconVisibility=true on a tab item (tabs.js:416).
        // The picker interaction is the maximum automatable assertion without enabling per-tab icon visibility.
        // Assert the .color-icon swatch inside the picker reflects the new color — the OUTER
        // picker div (data-cy="unselected-icon-picker") only gets a background when the popover
        // is open (outerStyles.background = showPicker && 'var(--indigo2)'). After closing,
        // only the inner div.color-icon carries backgroundColor: value. source: BaseColorSwatches.jsx:142
        cy.get(commonWidgetSelector.stylePicker('Unselected icon'))
            .find('.color-icon')
            .should('have.css', 'background-color', 'rgb(255, 0, 0)'); // source: tabs.js:207
    });

    it('Tabs accordian — selectedIcon (colorSwatches) is exercised via colour picker', () => {
        openEditorSidebar(W);
        cy.get(commonWidgetSelector.buttonStylesEditorSideBar).click();
        openAccordion('Tabs');

        // selectedIcon (colorSwatches, fxCapable:true) default var(--cc-default-icon)
        // source: tabs.js:216 — applied as `color` on TablerIcon inside active tab (Tabs.jsx:287)
        selectColourFromColourPicker('Selected icon', ['255', '0', '0', '100']); // source: tabs.js:216
        // RESOLVE-LIVE: same as unselectedIcon — requires iconVisibility=true on a tab item.
        // .color-icon child holds backgroundColor: value; outer picker div is transparent
        // after the popover closes. source: BaseColorSwatches.jsx:142
        cy.get(commonWidgetSelector.stylePicker('Selected icon'))
            .find('.color-icon')
            .should('have.css', 'background-color', 'rgb(255, 0, 0)'); // source: tabs.js:216
    });

    it('Tabs accordian — accent (colorSwatches) colours the active tab bottom border', () => {
        openEditorSidebar(W);
        cy.get(commonWidgetSelector.buttonStylesEditorSideBar).click();
        openAccordion('Tabs');

        // accent (colorSwatches, fxCapable:true) default var(--cc-primary-brand)
        // source: tabs.js:225 — applied as border-bottom on the active li (Tabs.jsx:372 `2px solid ${accent}`)
        selectColourFromColourPicker('Accent', ['255', '0', '0', '100']); // dynamic: test color
        cy.forceClickOnCanvas();
        cy.get(ROOT).scrollIntoView();
        // RESOLVE-LIVE: accent → ACTIVE_LI `border-bottom-color` (Tabs.jsx:372).
        // border-bottom is a shorthand; read the longhand border-bottom-color.
        verifyWidgetColorCss(ACTIVE_LI, 'border-bottom-color', ['255', '0', '0', '100'], true); // dynamic: test color
    });

    it('Tabs accordian — tabWidth (select) switches to Equally split', () => {
        openEditorSidebar(W);
        cy.get(commonWidgetSelector.buttonStylesEditorSideBar).click();
        openAccordion('Tabs');

        // tabWidth (select, fxCapable:false) options: [{auto}, {split}], default "auto"
        // source: tabs.js:243 — when 'split', each visible li gets equalSplitWidth% width (Tabs.jsx:371)
        selectFromSidebarDropdown('Tab width', 'Equally split'); // source: tabs.js:247 label "Equally split"
        cy.forceClickOnCanvas();
        cy.get(ROOT).scrollIntoView();
        // RESOLVE-LIVE: tabWidth='split' sets `width: equalSplitWidth + '%'` inline on each nav-item li
        // (Tabs.jsx:371). Default is 3 visible tabs → 33.333...%. Exact computed value depends on
        // float precision; confirm the li no longer uses the auto (unset) width.
        cy.get(`${ROOT} .nav-item`).first()
            .should('have.attr', 'style')
            .and('match', /width:\s*[\d.]+%/); // RESOLVE-LIVE: width% present when split is active
    });

    it('Tabs accordian — transition (select) switches to Slide', () => {
        openEditorSidebar(W);
        cy.get(commonWidgetSelector.buttonStylesEditorSideBar).click();
        openAccordion('Tabs');

        // transition (select, fxCapable:false) options: [{slide}, {none}], default "none"
        // source: tabs.js:252 — when 'slide', tab content panels use CSS transform/opacity
        // transition instead of display:none/block (Tabs.jsx:499-513)
        selectFromSidebarDropdown('Transition', 'Slide'); // source: tabs.js:256 label "Slide"
        cy.forceClickOnCanvas();
        cy.get(ROOT).scrollIntoView();
        // RESOLVE-LIVE: In Slide mode, Tabs.jsx:499-513 applies position:absolute with transition.
        // Assert the transition property is applied to the active tab pane.
        cy.get(`${ROOT} .tab-pane.active, ${ROOT} .tab-content > .active`).first()
            .should('have.css', 'transition')
            .and('not.eq', 'none'); // source: tabs.js:252 — slide mode adds CSS transition; RESOLVE-LIVE: exact selector for tab pane
    });

    // ── Container accordion ───────────────────────────────────────────────────────
    // Styles under accordian='Container': commonBackgroundColor, border,
    // borderRadius, boxShadow, padding.

    it('Container accordian — commonBackgroundColor (colorSwatches) is exercised via colour picker', () => {
        openEditorSidebar(W);
        cy.get(commonWidgetSelector.buttonStylesEditorSideBar).click();
        openAccordion('Container');

        // commonBackgroundColor (colorSwatches, fxCapable:true) default var(--cc-surface1-surface)
        // source: tabs.js:261 / displayName: 'Common background color' → picker data-cy: common-background-color-picker
        // applied as background on the TabContent sub-container (Tabs.jsx:528)
        selectColourFromColourPicker('Common background color', ['255', '0', '0', '100']); // source: tabs.js:263
        cy.get(ROOT).scrollIntoView();
        // .color-icon child holds backgroundColor:value; outer picker div is only
        // styled when the popover is open. source: BaseColorSwatches.jsx:142
        cy.get(commonWidgetSelector.stylePicker('Common background color'))
            .find('.color-icon')
            .should('have.css', 'background-color', 'rgb(255, 0, 0)'); // source: tabs.js:263
        // RESOLVE-LIVE: the actual SubContainer background-color assertion requires knowing the SubContainer data-cy selector at runtime
    });

    it('Container accordian — border (colorSwatches) sets the --cc-tabs-border-color CSS var', () => {
        openEditorSidebar(W);
        cy.get(commonWidgetSelector.buttonStylesEditorSideBar).click();
        openAccordion('Container');

        // border (colorSwatches, fxCapable:true) default var(--cc-weak-border)
        // source: tabs.js:270 — applied as CSS custom property --cc-tabs-border-color on ROOT (Tabs.jsx:314)
        selectColourFromColourPicker('Border', ['255', '0', '0', '100']); // dynamic: test color
        cy.forceClickOnCanvas();
        cy.get(ROOT).scrollIntoView();
        // RESOLVE-LIVE: border → ROOT `--cc-tabs-border-color` custom property (Tabs.jsx:314).
        // CSS custom properties are not directly readable via have.css in Cypress; require
        // getComputedStyle(el).getPropertyValue('--cc-tabs-border-color') in a .then() block.
        cy.get(ROOT).then(($el) => {
            const val = window.getComputedStyle($el[0]).getPropertyValue('--cc-tabs-border-color').trim();
            // RESOLVE-LIVE: CSS var may resolve to 'rgb(255, 0, 0)' or '#ff0000' depending on how the browser stores it
            expect(val).to.satisfy(
                (v) => v.includes('255') || v.includes('ff0000'),
                `Expected border CSS var to contain the selected red color (255, 0, 0), got: ${val}`
            ); // source: tabs.js:270 — border applied as --cc-tabs-border-color
        });
    });

    it('Container accordian — borderRadius (numberInput) rounds the widget corners', () => {
        openEditorSidebar(W);
        cy.get(commonWidgetSelector.buttonStylesEditorSideBar).click();
        openAccordion('Container');

        // borderRadius (numberInput, fxCapable:true) default "{{6}}"
        // source: tabs.js:279 — applied as borderRadius on ROOT (Tabs.jsx:313 `${borderRadius}px`)
        cy.get('[data-cy="border-radius-input"]').clear().type('12'); // dynamic: test radius
        cy.forceClickOnCanvas();
        cy.get(ROOT).scrollIntoView();
        cy.get(ROOT).should('have.css', 'border-radius', '12px'); // source: tabs.js:279 → Tabs.jsx:313
    });

    it('Container accordian — boxShadow renders on the widget root', () => {
        openEditorSidebar(W);
        cy.get(commonWidgetSelector.buttonStylesEditorSideBar).click();
        openAccordion('Container');

        // boxShadow (boxShadow, fxCapable:true) default "0px 0px 0px 0px #00000040"
        // source: tabs.js:288 — applied inline as boxShadow on ROOT (Tabs.jsx:311)
        cy.get(commonWidgetSelector.stylePicker('Box shadow')).click();
        fillBoxShadowParams(commonWidgetSelector.boxShadowDefaultParam, [2, 4, 6, 0]); // dynamic: test shadow params
        // Alpha < 100 on purpose: alpha 100 collapses to `rgb(...)` in the computed style
        // whereas verifyBoxShadowCss builds an `rgba(...)` comparison string.
        selectColourFromColourPicker('Box shadow Color', ['255', '0', '0', '90'], 0); // dynamic: test color
        // RESOLVE-LIVE: boxShadow → ROOT `box-shadow` (Tabs.jsx:311). ROOT is the data-cy element
        // (not the draggable-widget-tabs1 wrapper), so pass as 'element' type.
        verifyBoxShadowCss(ROOT, [255, 0, 0, 90], [2, 4, 6, 0], 'element'); // dynamic: test shadow params
    });

    it('Container accordian — padding (switch) toggles widget box padding', () => {
        openEditorSidebar(W);
        cy.get(commonWidgetSelector.buttonStylesEditorSideBar).click();
        openAccordion('Container');

        // padding (switch, fxCapable:false) options: [{default}, {none}], default "default"
        // source: tabs.js:298 — controls height calculation (Tabs.jsx:307 `padding === 'default' ? height : height + 4`)
        // The side-effect (widget height +4px when none) is a layout delta; the switch
        // interaction itself is the primary automatable assertion here.
        verifyAndModifySwitch('Padding', 'None'); // source: tabs.js:303 option label 'None'
        cy.get('[data-cy="togglr-button-none"]')
            .closest('[role="radio"]')
            .should('have.attr', 'aria-checked', 'true'); // 'None' is now selected

        // Switch back to 'Default'
        verifyAndModifySwitch('Padding', 'Default'); // source: tabs.js:302 option label 'Default'
        cy.get('[data-cy="togglr-button-default"]')
            .closest('[role="radio"]')
            .should('have.attr', 'aria-checked', 'true'); // 'Default' is restored
    });

    afterEach(() => {
        cy.waitForAutoSave();
        // Navigate away from the app editor BEFORE deleting. The editor's
        // React code holds an open WebSocket to the backend; apiDeleteApp()
        // causes the server to close it, which triggers window.location =
        // '/apps' inside the React editor — a redirect that races with the
        // next beforeEach's openApp() navigation and stales the CDP intercept.
        // Navigating to '/' first closes the WebSocket cleanly (page unloads,
        // React unmounts) so the delete produces no browser-side redirect.
        cy.visit('/');
        cy.apiDeleteApp();
    });
});
