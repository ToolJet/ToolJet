import { fake } from "Fixtures/fake";
import { commonWidgetSelector } from "Selectors/common";
import { getWidgetRect } from "Support/utils/appBuilder/canvas";
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
// test drags throw "No dragIntercepted". Each test still re-logs-in + creates
// its own app in beforeEach, so shared browser state is not relied upon.
describe('Toggle Switch — properties facet', { testIsolation: false }, () => {
    const W = 'toggleswitch1'; // computeComponentName from config name 'ToggleSwitch'
    const INNER = `[data-cy="${W}"]`; // ToggleV2.jsx:264 — flex wrapper carrying display/alignment/shadow
    const INPUT = `${INNER} input.form-check-input`; // ToggleV2.jsx:67-88 (visually hidden, still assertable)
    const LABEL_WRAP = `${INNER} div:has(> label)`; // ToggleV2.jsx:270-283 — OverflowTooltip renders an UNCLASSED div (its `className` goes to the ToolTip wrapper, OverflowTooltip.jsx:64/72-74), so pin it by the <label> it contains

    // The widget tooltip is a Radix popover, and [data-cy="widget-tooltip"] lives on
    // TooltipContent (WidgetTooltip.jsx:71) — mounted ONLY while it is open.
    // Hovering it in the EDITOR is non-deterministic: the widget stays selected and
    // react-moveable's `.moveable-control-box` (gridUtils.js:696) overlays the trigger,
    // so pointerenter often never reaches it. Five editor-mode attempts produced three
    // different outcomes (never mounts / mounts with 2 body nodes / never mounts).
    // PREVIEW has no selection, no control box and no inspector, so the hover lands
    // reliably — and preview is the mode a real user sees the tooltip in anyway.
    const verifyTooltipInPreview = (bodySelector, text) => {
        // the inspector may already be closed (forceClickOnCanvas deselects), so
        // only click the close button when it is actually present.
        cy.get('body').then(($b) => {
            if ($b.find(commonWidgetSelector.buttonCloseEditorSideBar).length) {
                cy.get(commonWidgetSelector.buttonCloseEditorSideBar).click({ force: true });
            }
        });
        cy.openInCurrentTab(commonWidgetSelector.previewButton);
        cy.wait(2500);
        cy.get(commonWidgetSelector.draggableWidget(W)).scrollIntoView().realHover();
        cy.get('[data-cy="widget-tooltip"]').should(($t) => {
            // Radix renders the body twice (a visually-hidden copy for screen readers),
            // so assert PRESENCE, not an exact count.
            expect($t.find(bodySelector), bodySelector).to.have.length.of.at.least(1);
            expect($t.text()).to.contain(text);
        });
        cy.go('back');
        cy.wait(2000);
    };

    beforeEach(() => {
        cy.apiLogin();
        // fake.companyName is just the first word of a company name (fake.js:19-22)
        // — a small pool, so repeat local runs collide on POST /api/apps (409
        // "This app name is already taken") and abort the suite from beforeEach.
        cy.apiCreateApp(`${fake.companyName}-ToggleSwitch-Properties-App-${Date.now().toString().slice(-6)}`);
        cy.openApp();
        cy.dragAndDropWidget('Toggle Switch', 500, 100); // source: toggleswitchv2.js:3
        cy.get('[data-cy="query-manager-toggle-button"]').click();
    });

    // ── General ───────────────────────────────────────────────────────────────
    it('general — label (code) renders its default then the typed value', () => {
        openEditorSidebar(W);

        // definition default label 'Label' — source: toggleswitchv2.js:213
        cy.get(`${INNER} label`).scrollIntoView().should('have.text', 'Label');

        // label (code) → widget re-renders with the typed text (ToggleV2.jsx:281)
        // source: toggleswitchv2.js:25
        const labelText = fake.companyName; // dynamic: fake
        verifyAndModifyParameter('Label', labelText);
        // CodeMirror commits the property on BLUR — without this the store keeps
        // the old value and the canvas renders stale (runtime-confirmed: the
        // inspector field showed the new text while <label> still read 'Label').
        cy.forceClickOnCanvas();
        cy.get(`${INNER} label`).scrollIntoView().should('have.text', labelText); // dynamic: fake echoed
    });

    it('general — defaultValue (switch) On checks the toggle', () => {
        openEditorSidebar(W);

        // defaultValue default '{{false}}' — source: toggleswitchv2.js:214
        cy.get(INPUT).should('not.be.checked');

        // flip Default state → On ('{{true}}') — source: toggleswitchv2.js:33,38
        verifyAndModifySwitch('Default state', 'On');
        cy.get(INPUT).should('be.checked');

        // and back to Off ('{{false}}') — source: toggleswitchv2.js:39
        verifyAndModifySwitch('Default state', 'Off');
        cy.get(INPUT).should('not.be.checked');
    });

    // ── Additional Actions ────────────────────────────────────────────────────
    it('additional — loadingState (toggle) renders the widget loader', () => {
        openEditorSidebar(W);
        openAccordion('Additional Actions');

        // loadingState fx default false → verify + flip ON — source: toggleswitchv2.js:43 (default :219)
        verifyAndModifyToggleFx('Loading state', '{{false}}');
        // Loader replaces the label+switch inside the widget (ToggleV2.jsx:266-267)
        cy.get(`${INNER} .tj-widget-loader`).should('be.visible');
        cy.get(INPUT).should('not.exist');
    });

    it('additional — visibility (toggle) hides the widget', () => {
        openEditorSidebar(W);
        openAccordion('Additional Actions');

        // visibility fx default true → verify + flip OFF — source: toggleswitchv2.js:49 (default :215)
        verifyAndModifyToggleFx('Visibility', '{{true}}');
        // display:none is written on the INNER wrapper (ToggleV2.jsx:255)
        cy.get(INNER).should('not.be.visible');
    });

    it('additional — collapseWhenHidden (toggle) collapses the row in preview', () => {
        // collapseWhenHidden only reflows in VIEW mode (RenderWidget.jsx:280-289),
        // and its effect is on the widgets BELOW: a hidden widget that opted in
        // stops contributing a height floor, so the overlapping widgets downstream
        // collapse up into the gap (dynamicHeightReflow.js:45-47, 75-78).
        // Place a Text widget directly below the switch to observe that.
        // source: toggleswitchv2.js:56 (default toggleswitchv2.js:217)
        cy.get('[data-cy="right-sidebar-components-button"]').click();
        cy.dragAndDropWidget('Text', 500, 300); // source: text.js:3
        cy.get('[data-cy="query-manager-toggle-button"]').click();

        // hide the switch, leaving collapseWhenHidden at its '{{false}}' default
        openEditorSidebar(W);
        openAccordion('Additional Actions');
        verifyAndModifyToggleFx('Visibility', '{{true}}'); // source: toggleswitchv2.js:49 (flips OFF)
        cy.waitForAutoSave();

        // baseline: hidden but NOT collapsing → text1 keeps its authored row
        // the inspector may already be closed (forceClickOnCanvas deselects), so
        // only click the close button when it is actually present.
        cy.get('body').then(($b) => {
            if ($b.find(commonWidgetSelector.buttonCloseEditorSideBar).length) {
                cy.get(commonWidgetSelector.buttonCloseEditorSideBar).click({ force: true });
            }
        });
        cy.openInCurrentTab(commonWidgetSelector.previewButton);
        cy.wait(2500);
        getWidgetRect('text1').as('beforeCollapse');
        cy.go('back');
        cy.wait(2500);

        // now opt in to collapsing
        openEditorSidebar(W);
        openAccordion('Additional Actions');
        verifyAndModifyToggleFx('Collapse when hidden', '{{false}}'); // source: toggleswitchv2.js:56 (flips ON)
        cy.waitForAutoSave();

        // the inspector may already be closed (forceClickOnCanvas deselects), so
        // only click the close button when it is actually present.
        cy.get('body').then(($b) => {
            if ($b.find(commonWidgetSelector.buttonCloseEditorSideBar).length) {
                cy.get(commonWidgetSelector.buttonCloseEditorSideBar).click({ force: true });
            }
        });
        cy.openInCurrentTab(commonWidgetSelector.previewButton);
        cy.wait(2500);
        cy.get('@beforeCollapse').then((before) => {
            cy.get(commonWidgetSelector.draggableWidget('text1')).should(($t) => {
                const y = Math.round($t[0].getBoundingClientRect().y);
                expect(y, 'text1 collapses upward into the hidden switch row').to.be.lessThan(before.y - 2); // dynamic: 2px tolerance
            });
        });
        cy.go('back');
    });

    it('additional — disabledState (toggle) disables the widget', () => {
        openEditorSidebar(W);
        openAccordion('Additional Actions');

        // disabledState default '{{false}}' — source: toggleswitchv2.js:218
        cy.get(INNER).should('have.attr', 'data-disabled', 'false');

        // disabledState fx default false → verify + flip ON — source: toggleswitchv2.js:62 (default :218)
        verifyAndModifyToggleFx('Disable', '{{false}}');
        // data-disabled is written from properties.disabledState (ToggleV2.jsx:252)
        cy.get(INNER).should('have.attr', 'data-disabled', 'true');
        // and the input itself is disabled (ToggleV2.jsx:79)
        cy.get(INPUT).should('be.disabled');
        // RenderWidget adds the `disabled` class to the widget wrapper (RenderWidget.jsx:307-311)
        cy.get(commonWidgetSelector.draggableWidget(W)).should('have.class', 'disabled');
    });

    it('additional — tooltip (code) + tooltipFormat (switch) render the widget tooltip', () => {
        openEditorSidebar(W);
        openAccordion('Additional Actions');

        // tooltip (code) default '' — source: toggleswitchv2.js:220
        const tooltipText = fake.companyName; // dynamic: fake
        verifyAndModifyParameter('Tooltip', tooltipText); // source: toggleswitchv2.js:85 (label :87)
        cy.forceClickOnCanvas();

        // tooltipFormat default 'plainText' → plain body span (WidgetTooltip.jsx:37)
        // source: toggleswitchv2.js:221
        verifyTooltipInPreview('span.tw-whitespace-pre-wrap', tooltipText); // dynamic: fake echoed

        // → Markdown swaps to the markdown renderer (WidgetTooltip.jsx:30-35)
        // source: toggleswitchv2.js:76
        openEditorSidebar(W);
        openAccordion('Additional Actions');
        verifyAndModifySwitch('Tooltip', 'Markdown');
        cy.forceClickOnCanvas();
        verifyTooltipInPreview('div.widget-tooltip-markdown', tooltipText); // dynamic: fake echoed

        // → HTML swaps to the sanitized-HTML renderer (WidgetTooltip.jsx:27-29)
        // source: toggleswitchv2.js:77
        openEditorSidebar(W);
        openAccordion('Additional Actions');
        verifyAndModifySwitch('Tooltip', 'HTML');
        cy.forceClickOnCanvas();
        verifyTooltipInPreview('div.widget-tooltip-html', tooltipText); // dynamic: fake echoed
    });

    // ── Validation ────────────────────────────────────────────────────────────
    it('validation — mandatory (toggle) renders the * marker', () => {
        openEditorSidebar(W);
        openAccordion('Validation');

        // mandatory default '{{false}}' — source: toggleswitchv2.js:209
        cy.get(LABEL_WRAP).should('not.contain.text', '*');

        // mandatory fx default false → verify + flip ON — source: toggleswitchv2.js:16 (default :209)
        verifyAndModifyToggleFx('Make this field mandatory', '{{false}}');
        // the mandatory marker is a sibling span inside the label wrapper (ToggleV2.jsx:282)
        cy.get(LABEL_WRAP).scrollIntoView().should('contain.text', '*');
    });

    it('validation — customRule (code) surfaces its message as invalid feedback', () => {
        openEditorSidebar(W);
        openAccordion('Validation');

        // customRule default null — source: toggleswitchv2.js:210. A non-empty
        // resolved string makes the field invalid and becomes the error text
        // (_helpers/utils.js:458-461).
        const ruleMessage = fake.companyName; // dynamic: fake
        verifyAndModifyParameter('Custom validation', ruleMessage); // source: toggleswitchv2.js:17 (label :19)

        // the feedback node only renders after userInteracted (ToggleV2.jsx:315),
        // so toggle the switch once to arm it.
        cy.forceClickOnCanvas();
        cy.get(`${INNER} > div > div.d-flex`).scrollIntoView().click({ force: true });
        cy.get(commonWidgetSelector.validationFeedbackMessage(W))
            .should('be.visible')
            .and('have.text', ruleMessage); // dynamic: fake echoed
    });

    // ── Layout (others) ───────────────────────────────────────────────────────
    it('layout — showOnDesktop + showOnMobile via verifyLayout', () => {
        // covers others.showOnDesktop ('{{true}}') + showOnMobile ('{{false}}')
        // source: toggleswitchv2.js:11-12 (defaults toggleswitchv2.js:205-206)
        verifyLayout(W);
    });
});
