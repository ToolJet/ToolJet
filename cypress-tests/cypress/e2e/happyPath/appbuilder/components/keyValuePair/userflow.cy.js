/**
 * SPEC — Key Value Pair — userflow facet (scenario-scoped).
 * FOR AI: real pointer/keyboard scenarios from frontend/ee/test/app-builder/widgets/KeyValuePair/TESTING.md:
 *   KeyValuePair-BRW-003 — editable `datepicker`, `select` and `newMultiSelect` fields open a real popover next to the
 *                          cell (flipping above near the bottom of the window) and are keyboard-navigable
 *   KeyValuePair-BRW-009 — the docked icon footer (< 200px): hovering or keyboard-focusing ✕ / ✓ shows "Cancel" /
 *                          "Save changes" tooltips fully inside the canvas; ✓ is a tick, not a floppy disk; the text
 *                          tier shows no tooltip
 * Field popovers come from the shared DataTypes renderers (DatePickerRenderer → react-datepicker portalled to
 * #component-portal; SelectRenderer → react-select menu portalled to <body>). Edits are observed through a Text probe
 * bound to `components.kv1.changeSet`. All apps run in the viewer.
 * Helpers: openLinkAppInViewer, addKeyValuePairsViaApi, kvField, seedAtPixelWidths, editStringField,
 * kvTooltips, moveKvMouseAway.
 */
import { fake } from "Fixtures/fake";
import { commonWidgetSelector } from "Selectors/common";
import { keyValuePairSelector, keyValuePairPopoverSelector } from "Selectors/appBuilder/components/keyValuePair";
import { keyValuePairText } from "Texts/appBuilder/components/keyValuePair";
import { openLinkAppInViewer } from "Support/utils/appBuilder/components/link";
import {
    addKeyValuePairsViaApi,
    kvField,
    seedAtPixelWidths,
    editStringField,
    kvTooltips,
    moveKvMouseAway,
} from "Support/utils/appBuilder/components/keyValuePair";

const T = keyValuePairText;
const S = keyValuePairSelector;
const P = keyValuePairPopoverSelector;
const PX = 0.75;

// ── BRW-003 app ─────────────────────────────────────────────────────────────
const OPTIONS = ['Reading', 'Music', 'Cooking'].map((v) => ({ label: v, value: v })); // dynamic option set
const DATE_FIELD = { fieldType: 'datepicker', isEditable: '{{true}}', dateFormat: 'DD/MM/YYYY', parseDateFormat: 'DD/MM/YYYY', isDateSelectionEnabled: true, isTimeChecked: false }; // definition datepicker shape, keyValuePair.js:341-345
const START_DATE = { text: '15/05/2022', day: 15 }; // dynamic
const NEXT_DATE = '16/05/2022';
const seedFieldTypeApp = () => {
    addKeyValuePairsViaApi([
        {
            name: 'kv1',
            layout: { top: 40, left: 2, width: 14, height: 200 },
            properties: {
                data: { value: `{{ ${JSON.stringify({ tag: 'Reading', cats: ['Music'], date: START_DATE.text })} }}` },
                fields: {
                    value: [
                        kvField('tag', { fieldType: 'select', isEditable: '{{true}}', options: OPTIONS }),
                        kvField('cats', { fieldType: 'newMultiSelect', isEditable: '{{true}}', options: OPTIONS }),
                        kvField('date', DATE_FIELD),
                    ],
                },
            },
        },
        // near the bottom of a 960px window: popovers must flip above the cell
        {
            name: 'kvlow',
            layout: { top: 760, left: 2, width: 14, height: 100 },
            properties: {
                data: { value: `{{ ${JSON.stringify({ date: START_DATE.text, tag: 'Reading' })} }}` },
                fields: { value: [kvField('date', DATE_FIELD), kvField('tag', { fieldType: 'select', isEditable: '{{true}}', options: OPTIONS })] },
            },
        },
        { type: 'Text', name: 'probe', layout: { top: 40, left: 20, width: 15, height: 40 }, properties: { text: { value: '{{JSON.stringify(components.kv1.changeSet)}}' } } },
    ]);
    openLinkAppInViewer(S.rows('kvlow'));
};
const expectChangeSet = (obj) => cy.get(commonWidgetSelector.draggableWidget('probe')).should('contain.text', JSON.stringify(obj));
const rectOf = (el) => {
    const r = el.getBoundingClientRect();
    return { left: r.left, right: r.right, top: r.top, bottom: r.bottom, width: r.width, height: r.height };
};
// popover geometry against its cell: below (or, when `above`, flipped above), overlapping horizontally, in the window
const expectPopoverAt = (cellSelector, popoverSelector, { above = false, gap = 16 } = {}) =>
    cy.get(popoverSelector).should(($p) => {
        const pop = rectOf($p[0]);
        const cell = rectOf(Cypress.$(cellSelector)[0]);
        const win = $p[0].ownerDocument.defaultView;
        if (above) {
            expect(pop.bottom, 'flipped above the cell').to.be.lte(cell.top + 4);
            expect(cell.top - pop.bottom, 'hugs the cell').to.be.lte(gap);
        } else {
            expect(pop.top, 'below the cell').to.be.gte(cell.bottom - 4);
            expect(pop.top - cell.bottom, 'hugs the cell').to.be.lte(gap);
        }
        expect(pop.left < cell.right && pop.right > cell.left, 'overlaps the cell horizontally').to.eq(true);
        expect(pop.top, 'inside the window (top)').to.be.gte(0);
        expect(pop.bottom, 'inside the window (bottom)').to.be.lte(win.innerHeight + PX);
        expect(pop.left, 'inside the window (left)').to.be.gte(0);
        expect(pop.right, 'inside the window (right)').to.be.lte(win.innerWidth + PX);
    });
const focusedOption = () => cy.get(P.selectFocusedOption).should('have.length', 1);

describe('Key Value Pair — userflow facet', { testIsolation: false }, () => {
    beforeEach(() => {
        cy.apiLogin();
        cy.apiCreateApp(`${fake.companyName}-KeyValuePair-userflow-${Cypress._.uniqueId()}`);
    });

    afterEach(() => {
        moveKvMouseAway();
        cy.apiDeleteApp();
    });

    describe('field-type popovers', () => {
        beforeEach(() => {
            seedFieldTypeApp();
        });

        // ── KeyValuePair-BRW-003 (select) ────────────────────────────────────
        // SelectFieldAdapter → SelectRenderer (menuIsOpen = editing): click opens the menu; react-select keyboard:
        // the current value is focused, ArrowDown moves, Enter selects (→ onChange → changeSet).
        it('[KeyValuePair-BRW-003] Select field: the menu opens at the cell (flipping near the window bottom); Arrow + Enter choose an option', () => {
            const cell = S.valueCell('kv1', 'select');
            cy.get(cell).click();
            cy.get(P.selectMenu).should('be.visible');
            expectPopoverAt(cell, P.selectMenu);
            cy.get(P.selectInput('kv1', 'select')).should('be.focused');
            focusedOption().should('have.text', 'Reading');
            cy.wait(300); // let the opening render settle: a re-render resets react-select's focused option
            cy.realPress('ArrowDown');
            focusedOption().should('have.text', 'Music');
            cy.realPress('Enter');
            cy.get(P.selectMenu).should('not.exist');
            cy.get(P.singleValue('kv1')).should('have.text', 'Music');
            expectChangeSet({ tag: 'Music' });

            // near the bottom of the window the menu flips above the cell and stays inside the window
            const lowCell = S.valueCell('kvlow', 'select');
            cy.get(lowCell).click();
            cy.get(P.selectMenu).should('be.visible');
            expectPopoverAt(lowCell, P.selectMenu, { above: true });
        });

        // ── KeyValuePair-BRW-003 (multiselect) ───────────────────────────────
        it('[KeyValuePair-BRW-003] MultiSelect field: the menu opens at the cell; Arrow + Enter toggle options', () => {
            const cell = S.valueCell('kv1', 'newMultiSelect');
            cy.get(cell).click();
            cy.get(P.selectMenu).should('be.visible');
            expectPopoverAt(cell, P.selectMenu);
            cy.get(P.selectInput('kv1', 'newMultiSelect')).should('be.focused');
            focusedOption().should('have.text', 'Reading');
            cy.wait(300); // let the opening render settle: a re-render resets react-select's focused option
            cy.realPress('ArrowDown');
            focusedOption().should('have.text', 'Music');
            cy.realPress('ArrowDown');
            focusedOption().should('have.text', 'Cooking');
            cy.realPress('Enter');
            cy.get(P.multiValueLabels('kv1')).should(($l) => expect(Cypress._.map($l, 'textContent')).to.deep.eq(['Music', 'Cooking']));
            // the changeSet carries the picked options in order (as option objects — see report; data held plain strings)
            cy.get(commonWidgetSelector.draggableWidget('probe')).should(($p) => {
                const cs = JSON.parse($p.text().trim());
                expect(cs.cats.map((o) => (o && typeof o === 'object' ? o.value : o)), 'changeSet.cats').to.deep.eq(['Music', 'Cooking']);
            });
        });

        // ── KeyValuePair-BRW-003 (Escape) ────────────────────────────────────
        // react-select announces "press Escape to exit the menu"; the field keeps the menu open while editing.
        it('[KeyValuePair-BRW-003] Escape closes the Select and MultiSelect menus', () => {
            ['select', 'newMultiSelect'].forEach((type) => {
                cy.get(S.valueCell('kv1', type)).click();
                cy.get(P.selectMenu).should('be.visible');
                cy.get(P.selectInput('kv1', type)).should('be.focused');
                cy.realPress('Escape');
                cy.get(P.selectMenu, { timeout: 2000 }).should('not.exist');
                cy.get(commonWidgetSelector.draggableWidget('probe')).click({ force: true }); // close it for the next type
            });
        });

        // ── KeyValuePair-BRW-003 (date picker) ───────────────────────────────
        // DatepickerFieldAdapter → DatePickerRenderer: click opens react-datepicker (fixed popper, portalled); in the
        // calendar grid Arrow keys move the day and Enter selects it (→ onChange → changeSet).
        it('[KeyValuePair-BRW-003] Date picker: the calendar opens at the cell (flipping near the window bottom) and its grid is keyboard-navigable', () => {
            const cell = S.valueCell('kv1', 'datepicker');
            cy.get(cell).click();
            cy.get(P.datePopper).should('be.visible').and('have.attr', 'data-placement', 'bottom');
            expectPopoverAt(cell, P.datePopper);
            cy.get(P.dateSelectedDay).should('have.text', String(START_DATE.day));

            cy.get(P.dateSelectedDay).focus();
            cy.realPress('ArrowRight');
            cy.get(P.dateKeyboardSelectedDay).should('have.text', String(START_DATE.day + 1));
            cy.realPress('Enter');
            cy.get(P.datePopper).should('not.exist');
            cy.get(P.dateInput('kv1')).should('have.value', NEXT_DATE);
            expectChangeSet({ date: NEXT_DATE });

            // near the bottom of the window the calendar flips above the cell and stays inside the window
            const lowCell = S.valueCell('kvlow', 'datepicker');
            cy.get(lowCell).click();
            cy.get(P.datePopper).should('be.visible').and('have.attr', 'data-placement', 'top');
            expectPopoverAt(lowCell, P.datePopper, { above: true });
        });

        // ── KeyValuePair-BRW-003 (date picker from its input) ────────────────
        // react-datepicker's keyboard contract: with the calendar open, ArrowDown from the input moves focus into the
        // calendar's selected day, and Escape pressed there closes the calendar.
        // KNOWN PRODUCT BUG: ArrowDown in the open date field does nothing — focus stays in the input, so a keyboard
        // user cannot reach the calendar grid. DatePickerRenderer.jsx:16 DatepickerInput drops the onKeyDown
        // react-datepicker passes to its customInput.
        it('[KeyValuePair-BRW-003] Date picker: from the focused date input, ArrowDown enters the calendar and Escape there closes it', () => {
            cy.get(S.valueCell('kv1', 'datepicker')).click();
            cy.get(P.datePopper).should('be.visible');
            cy.get(P.dateInput('kv1')).should('be.focused');
            cy.realPress('ArrowDown');
            cy.get(P.dateSelectedDay).should('be.focused');
            cy.realPress('Escape');
            cy.get(P.datePopper).should('not.exist');
        });
    });

    // ── KeyValuePair-BRW-009 ─────────────────────────────────────────────────
    describe('changeset bar tooltips', () => {
        const DOCKED = { kvl137: { px: 137, left: 0, top: 60 }, kvl52: { px: 52, left: 0, top: 320 }, kvm137: { px: 137, left: 20, top: 60 } }; // dynamic placements (canvas edge + middle)
        const rowsFor = () => ({
            data: { value: `{{ ${JSON.stringify({ first: fake.firstName.slice(0, 6), second: fake.lastName.slice(0, 6) })} }}` },
            fields: { value: [kvField('first', { isEditable: '{{true}}' }), kvField('second', { isEditable: '{{true}}' })] },
        });

        beforeEach(() => {
            seedAtPixelWidths((g) => [
                ...Object.entries(DOCKED).map(([name, d]) => ({ name, layout: { top: d.top, left: d.left, width: d.px / g, height: 220 }, properties: rowsFor() })),
                { name: 'kvtext', layout: { top: 320, left: 20, width: 335 / g, height: 220 }, properties: rowsFor() }, // text tier
            ]);
            cy.get(S.rows('kvtext'), { timeout: 30000 }).should('have.length', 2);
            [...Object.keys(DOCKED), 'kvtext'].forEach((name) => editStringField(name, 1, 'Z'));
            moveKvMouseAway();
        });

        const expectTooltip = (name, text) =>
            cy.get('#real-canvas').then(($c) => {
                const canvas = $c[0].getBoundingClientRect();
                kvTooltips(name, (tips) => {
                    expect(tips.map((t) => t.text), `${name}: shown tooltip`).to.deep.eq([text]);
                    const [t] = tips;
                    expect(t.left, `${name} "${text}" inside the canvas (left)`).to.be.gte(canvas.left - PX);
                    expect(t.right, `${name} "${text}" inside the canvas (right)`).to.be.lte(canvas.right + PX);
                    expect(t.top, `${name} "${text}" inside the canvas (top)`).to.be.gte(canvas.top - PX);
                    expect(t.bottom, `${name} "${text}" inside the canvas (bottom)`).to.be.lte(canvas.bottom + PX);
                });
            });
        const expectNoTooltip = (name) => kvTooltips(name, (tips) => expect(tips, `${name}: no tooltip`).to.deep.eq([]));

        it('[KeyValuePair-BRW-009] Hovering the icon-only ✕ / ✓ shows "Cancel" / "Save changes" inside the canvas; ✓ is a tick; the text bar has no tooltip', () => {
            Object.keys(DOCKED).forEach((name) => {
                // icons: ✕ and a tick, never the old floppy disk; aria-labels kept (KeyValuePair.jsx:290-304)
                cy.get(S.saveButton(name)).should('have.attr', 'aria-label', T.saveAria).and('have.text', '');
                cy.get(S.saveButton(name)).find('svg').should('have.class', T.saveIconClass).and('not.have.class', T.oldSaveIconClass);
                cy.get(S.cancelButton(name)).should('have.attr', 'aria-label', T.cancelAria).find('svg').should('have.class', T.cancelIconClass);

                expectNoTooltip(name);
                cy.get(S.cancelButton(name)).realHover({ scrollBehavior: false });
                expectTooltip(name, T.cancelText);
                moveKvMouseAway();
                expectNoTooltip(name);
                cy.get(S.saveButton(name)).realHover({ scrollBehavior: false });
                expectTooltip(name, T.saveText);
                moveKvMouseAway();
            });

            // text tier: labelled buttons, no tooltip at all
            cy.get(S.saveButton('kvtext')).should('have.text', T.saveText);
            cy.get(S.cancelButton('kvtext')).realHover({ scrollBehavior: false });
            cy.get(S.ctaTooltip('kvtext')).should('not.exist');
            cy.get(S.saveButton('kvtext')).realHover({ scrollBehavior: false });
            cy.get(S.ctaTooltip('kvtext')).should('not.exist');
            expectNoTooltip('kvtext');
        });

        it('[KeyValuePair-BRW-009] Keyboard focus on the icon-only ✕ / ✓ shows the "Cancel" / "Save changes" tooltip', () => {
            const name = 'kvm137';
            cy.get(S.cancelButton(name)).focus();
            cy.get(S.cancelButton(name)).should('be.focused');
            expectTooltip(name, T.cancelText);
            cy.realPress('Tab'); // real keyboard focus moves to ✓
            cy.get(S.saveButton(name)).should('be.focused');
            expectTooltip(name, T.saveText);
        });
    });
});
