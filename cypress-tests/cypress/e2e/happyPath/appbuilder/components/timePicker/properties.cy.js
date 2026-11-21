/**
 * SPEC — Time Picker — properties facet.
 * FOR AI: property behaviour that only a real browser shows, from the TESTING.md browser scenario:
 *   TimePicker-BRW-005 — with no value the input shows the configured `placeholder` (timepicker.js:46-53, default
 *                        'Select time' :376 / TimePicker.jsx:27 fallback) and the empty-value styling:
 *                        DatepickerInput.jsx:42-47 paints the text with var(--cc-placeholder-text) while the value is
 *                        empty, the field text colour (selectedTextColor, timepicker.js:398) otherwise.
 * Time zone: the browser is pinned to Asia/Kolkata through CDP; all times are explicit.
 * Helpers: addTimePickersViaApi, pinBrowserTimezone, openDateAppInViewer, openDatePopup, pickTimeItem,
 * openEditorSidebar, verifyAndModifyParameter, resolveCssVarColor, expectComputedColor.
 */
import { fake } from "Fixtures/fake";
import { dateTimeCommonSelector as P } from "Selectors/appBuilder/components/dateTimeCommon";
import { timePickerSelector as S } from "Selectors/appBuilder/components/timePicker";
import { timePickerText as T } from "Texts/appBuilder/components/timePicker";
import { openEditorSidebar, verifyAndModifyParameter } from "Support/utils/commonWidget";
import { resolveCssVarColor, expectComputedColor } from "Support/utils/appBuilder/components/baseInput";
import { addTimePickersViaApi } from "Support/utils/appBuilder/components/timePicker";
import {
    pinBrowserTimezone,
    openDateAppInViewer,
    openDatePopup,
    pickTimeItem,
} from "Support/utils/appBuilder/components/dateTimeCommon";

const W = 'tp';
const ON = { value: '{{true}}' };

describe('Time Picker — properties facet', { testIsolation: false }, () => {
    beforeEach(() => {
        cy.apiLogin();
        cy.apiCreateApp(`${fake.companyName}-TimePicker-properties-${Cypress._.uniqueId()}`);
        pinBrowserTimezone(T.browserTimezone);
    });

    afterEach(() => {
        cy.apiLogin();
        cy.apiDeleteApp();
    });

    // ── TimePicker-BRW-005 ───────────────────────────────────────────────────
    it('[TimePicker-BRW-005] An empty field shows the configured placeholder in the placeholder colour; a time replaces it', () => {
        const placeholder = fake.fullName.slice(0, 24); // dynamic: fake
        addTimePickersViaApi([
            {
                name: W,
                layout: { top: 40, left: 2, width: 12, height: 40 },
                properties: {
                    defaultValue: { value: '' }, // empty field
                    showClearBtn: ON, // timepicker.js:61-66 — to empty it again from the UI
                },
            },
        ]);
        cy.openApp('', undefined, undefined, S.input(W));

        const expectPlaceholderState = (text, context) => {
            cy.log(`placeholder — ${context}`);
            cy.get(S.input(W)).should('have.value', '').and('have.attr', 'placeholder', text);
            resolveCssVarColor('--cc-placeholder-text', S.root(W)).then((rgb) => {
                expectComputedColor(S.input(W), 'color', rgb);
                cy.get(S.input(W)).should(($i) =>
                    expect(getComputedStyle($i[0], '::placeholder').color, '::placeholder colour').to.eq(rgb));
            });
        };
        const expectValueState = (value, context) => {
            cy.log(`value — ${context}`);
            cy.get(S.input(W)).should('have.value', value);
            // the field text colour (selectedTextColor default var(--cc-primary-text) — timepicker.js:398)
            resolveCssVarColor('--cc-primary-text', S.root(W)).then((rgb) => expectComputedColor(S.input(W), 'color', rgb));
            resolveCssVarColor('--cc-placeholder-text', S.root(W)).then((rgb) =>
                cy.get(S.input(W)).should(($i) => expect(getComputedStyle($i[0]).color, 'not the placeholder colour').not.to.eq(rgb)));
        };

        // definition default placeholder (timepicker.js:376)
        expectPlaceholderState(T.placeholder, 'editor, default placeholder');

        // configured placeholder — array form types it verbatim
        openEditorSidebar(W);
        verifyAndModifyParameter(T.labelPlaceholder, [placeholder]);
        cy.forceClickOnCanvas();
        expectPlaceholderState(placeholder, 'editor, configured placeholder');
        cy.waitForAutoSave();

        // running app: same placeholder; a picked time replaces it with the value styling; clearing restores it
        openDateAppInViewer(S.input(W));
        expectPlaceholderState(placeholder, 'viewer');
        openDatePopup(S.input(W));
        pickTimeItem(0, '16'); // dynamic: hour
        cy.get('body').click(1100, 700, { force: true });
        cy.get(P.popup).should('not.exist');
        expectValueState('16:00', 'viewer, after a pick');
        cy.get(S.clearButton(W)).click();
        expectPlaceholderState(placeholder, 'viewer, after clearing');
    });
});
