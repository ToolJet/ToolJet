/**
 * SPEC — Radio Button (V2) — properties facet (browser-only tooltip rendering).
 * FOR AI: TESTING.md browser scenario:
 *   RadioButtonV2-BRW-002 — the configured tooltip (radioButtonV2.js:103-127) appears on hover / keyboard focus and
 *                           renders as plain text, Markdown or HTML per tooltipFormat.
 * RenderWidget.jsx:396-403 wraps the widget box in WidgetTooltip (Radix, 500ms show delay, side top / align start);
 * WidgetTooltip.jsx:26-37 renders one body per format (plain <span>, .widget-tooltip-markdown, sanitised
 * .widget-tooltip-html); an empty / whitespace tooltip renders no content at all (WidgetTooltip.jsx:55-56).
 * Radix renders the content twice (visible + a visually hidden copy), so matches take .first().
 * Helpers: addRadioButtonsViaApi, openRadioAppInViewer, hoverForTooltip, moveMouseAway, radioBoxes, openEditorSidebar,
 * openAccordion, setTooltip, hoverInPreview.
 */
import { fake } from "Fixtures/fake";
import { commonWidgetSelector } from "Selectors/common";
import { radioButtonV2Selector } from "Selectors/appBuilder/components/radioButtonV2";
import { radioButtonV2Text } from "Texts/appBuilder/components/radioButtonV2";
import { openEditorSidebar, openAccordion } from "Support/utils/commonWidget";
import { setTooltip, hoverInPreview } from "Support/utils/appBuilder/properties";
import {
    addRadioButtonsViaApi,
    openRadioAppInViewer,
    hoverForTooltip,
    moveMouseAway,
    radioBoxes,
} from "Support/utils/appBuilder/components/radioButtonV2";

const T = radioButtonV2Text;
const S = radioButtonV2Selector;
const W = T.defaultWidgetName;
const word = () => (fake.firstName.replace(/\W/g, '') || 'Tip').slice(0, 10); // dynamic: one word, no markup

// The tooltip sits above the hovered widget, left-aligned with it (WidgetTooltip.jsx:65-67 side top, align start)
const expectTooltipAbove = (name) =>
    cy.get(S.tooltip).first().should(($tip) => {
        const tip = $tip[0].getBoundingClientRect();
        const box = Cypress.$(commonWidgetSelector.draggableWidget(name))[0].getBoundingClientRect();
        expect(tip.width, 'tooltip painted').to.be.gt(0);
        expect(tip.bottom, 'tooltip above the widget').to.be.lte(box.top + 1);
        expect(tip.left, 'tooltip aligned to the widget start').to.be.closeTo(box.left, 2);
    });

describe('Radio Button (V2) — properties facet', { testIsolation: false }, () => {
    beforeEach(() => {
        cy.apiLogin();
        cy.apiCreateApp(`${fake.companyName}-RadioButtonV2-properties-${Cypress._.uniqueId()}`);
    });

    afterEach(() => {
        moveMouseAway();
        cy.apiLogin();
        cy.apiDeleteApp();
    });

    // ── RadioButtonV2-BRW-002 — the three formats ─────────────────────────
    // Plain and Markdown share the same Markdown source, Plain and HTML share the same HTML source, so only the
    // format switch can explain the different output.
    it('[RadioButtonV2-BRW-002] Hovering shows the tooltip above the widget as literal plain text, rendered Markdown or sanitised HTML per format; an empty tooltip shows nothing', () => {
        const bold = word();
        const md = `**${bold}** tip`; // dynamic: Markdown emphasis
        const html = `<b>${bold}</b> tip<img src="x" onerror="window.__rbXss = 1">`; // dynamic: HTML + a script hook DOMPurify must drop
        const row = (i) => ({ top: 40 + i * 80, left: 2, width: 12, height: T.defaultHeight }); // dynamic: stacked slots
        addRadioButtonsViaApi([
            { name: 'plainmd', layout: row(0), properties: { tooltip: { value: md }, tooltipFormat: { value: T.formatPlain } } },
            { name: 'markdown', layout: row(1), properties: { tooltip: { value: md }, tooltipFormat: { value: T.formatMarkdown } } },
            { name: 'plainhtml', layout: row(2), properties: { tooltip: { value: html }, tooltipFormat: { value: T.formatPlain } } },
            { name: 'html', layout: row(3), properties: { tooltip: { value: html }, tooltipFormat: { value: T.formatHtml } } },
            { name: 'notip', layout: row(4) }, // radioButtonV2.js:362 default tooltip ''
        ]);
        moveMouseAway();
        openRadioAppInViewer(S.options('notip'));

        // plain text: the Markdown source stays literal
        hoverForTooltip('plainmd');
        cy.get(S.tooltipPlain).first().should('have.text', md);
        cy.get(S.tooltipMarkdown).should('not.exist');
        cy.get(S.tooltip).first().find('strong').should('not.exist');
        expectTooltipAbove('plainmd');
        moveMouseAway();
        cy.get(S.tooltip).should('not.exist');

        // markdown: the asterisks become emphasis
        hoverForTooltip('markdown');
        cy.get(S.tooltipMarkdown).first().find('strong').first().should('have.text', bold);
        cy.get(S.tooltipMarkdown).first().should(($m) => expect($m.text().trim(), 'no literal asterisks').to.eq(`${bold} tip`));
        expectTooltipAbove('markdown');
        moveMouseAway();
        cy.get(S.tooltip).should('not.exist');

        // plain text: the HTML source stays literal (escaped, nothing parsed)
        hoverForTooltip('plainhtml');
        cy.get(S.tooltipPlain).first().should('have.text', html);
        cy.get(S.tooltip).first().find('b, img').should('not.exist');
        moveMouseAway();
        cy.get(S.tooltip).should('not.exist');

        // html: tags are parsed; the event-handler attribute is sanitised away
        hoverForTooltip('html');
        cy.get(S.tooltipHtml).first().find('b').first().should('have.text', bold);
        cy.get(S.tooltipHtml).first().find('img').first().should('not.have.attr', 'onerror');
        cy.get(S.tooltipHtml).first().should(($h) => expect($h.text().trim(), 'rendered text').to.eq(`${bold} tip`));
        expectTooltipAbove('html');
        cy.window().its('__rbXss').should('be.undefined');
        moveMouseAway();
        cy.get(S.tooltip).should('not.exist');

        // empty tooltip: hovering past the delay shows nothing
        hoverForTooltip('notip');
        cy.get(S.tooltip).should('not.exist');
    });

    // ── RadioButtonV2-BRW-002 — keyboard focus ─────────────────────────────
    it('[RadioButtonV2-BRW-002] Tabbing onto an option opens the tooltip without a pointer; tabbing away closes it', () => {
        const tip = `${word()} ${word()}`; // dynamic: plain tooltip text
        addRadioButtonsViaApi([
            { type: 'TextInput', name: 'before', layout: { top: 40, left: 2, width: 10, height: 40 } },
            { name: 'focustip', layout: { top: 100, left: 2, width: 12, height: T.defaultHeight }, properties: { tooltip: { value: tip } } },
            { type: 'TextInput', name: 'after', layout: { top: 160, left: 2, width: 10, height: 40 } },
        ]);
        moveMouseAway();
        openRadioAppInViewer(S.options('focustip'));

        cy.get(`${commonWidgetSelector.draggableWidget('before')} input`).click();
        cy.get(S.tooltip).should('not.exist');
        cy.realPress('Tab');
        // Tab lands on the checked option of the radio group (option2, radioButtonV2.js:336)
        cy.focused().should('have.attr', 'data-cy', `focustip-option-input-1`);
        cy.get(S.tooltipPlain).first().should('have.text', tip);
        expectTooltipAbove('focustip');

        cy.realPress('Tab');
        cy.focused().closest(commonWidgetSelector.draggableWidget('after')).should('exist');
        cy.get(S.tooltip).should('not.exist');
    });

    // ── RadioButtonV2-BRW-002 — inspector path ─────────────────────────────
    it('[RadioButtonV2-BRW-002] Tooltip text and format set in the inspector show in Preview: Markdown rendered, then switched back to Plain text literal', () => {
        const bold = word();
        const md = `**${bold}** tip`; // dynamic
        addRadioButtonsViaApi([{ name: W, layout: { top: 40, left: 2, width: 12, height: T.defaultHeight } }]);
        cy.openApp('', undefined, undefined, S.options(W));
        openEditorSidebar(W);
        openAccordion('Additional Actions');
        setTooltip(T.formatMarkdown, md);
        hoverInPreview(S.options(W));
        cy.get(S.tooltipMarkdown).first().find('strong').first().should('have.text', bold);
        expectTooltipAbove(W);
        radioBoxes(W, (b) => expect(b.options, 'widget still renders its options').to.have.length(T.defaultOptionCount));

        moveMouseAway();
        cy.openApp('', undefined, undefined, S.options(W)); // back to the editor
        openEditorSidebar(W);
        openAccordion('Additional Actions');
        cy.get(commonWidgetSelector.togglrButton(T.formatPlain)).click();
        cy.waitForAutoSave();
        hoverInPreview(S.options(W));
        cy.get(S.tooltipPlain).first().should('have.text', md);
        cy.get(S.tooltipMarkdown).should('not.exist');
    });
});
