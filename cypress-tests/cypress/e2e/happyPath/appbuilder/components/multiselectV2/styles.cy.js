/**
 * SPEC — Multi Select (MultiselectV2) — styles facet.
 * FOR AI: TESTING.md browser scenarios only:
 *   MultiselectV2-BRW-005 — hover darkens the control border, highlights an enabled option row, and leaves a
 *                           disabled row dimmed and unhighlighted
 *   MultiselectV2-BRW-010 — configured background / border / accent / text / radius / shadow resolve on the control;
 *                           border precedence error > accent (focused or open) > configured > theme token for the
 *                           legacy default hex; the shadow is identical focused or not
 *   MultiselectV2-BRW-011 — a disabled or loading field paints the same background as an enabled one
 * The styles are emitted through react-select's generated (emotion) CSS — MultiselectV2.jsx:417-523 +
 * DropdownV2/utils.js:3-48 — so they are read with getComputedStyle in the viewer (the editor's Preview URL).
 * Helpers: addMultiselectsViaApi, multiselectOptions, multiselectValues, visitMultiselectApp, openMultiselectMenu,
 * closeMultiselectMenu, clickMultiselectOption, multiselectState, resolveCssVarColor.
 */
import { fake } from "Fixtures/fake";
import { multiselectV2Selector as S } from "Selectors/appBuilder/components/multiselectV2";
import { multiselectV2Text as T } from "Texts/appBuilder/components/multiselectV2";
import { resolveCssVarColor } from "Support/utils/appBuilder/components/baseInput";
import {
    addMultiselectsViaApi,
    multiselectOptions,
    multiselectValues,
    visitMultiselectApp,
    openMultiselectMenu,
    closeMultiselectMenu,
    clickMultiselectOption,
    multiselectState,
} from "Support/utils/appBuilder/components/multiselectV2";

// dynamic: test colours (hex saved → rgb computed); defaults are theme tokens (multiselectV2.js:482-493)
const C = {
    background: { hex: '#fde68a', rgb: 'rgb(253, 230, 138)' }, // fieldBackgroundColor (multiselectV2.js:332)
    border: { hex: '#0000ff', rgb: 'rgb(0, 0, 255)' }, // fieldBorderColor (multiselectV2.js:339)
    // tinycolor('#0000ff').darken(24) — the hover border (MultiselectV2.jsx:446, utils.js getModifiedColor)
    borderHover: 'rgb(0, 0, 133)',
    accent: { hex: '#ff00ff', rgb: 'rgb(255, 0, 255)' }, // accentColor (multiselectV2.js:345)
    text: { hex: '#008000', rgb: 'rgb(0, 128, 0)' }, // selectedTextColor (multiselectV2.js:351)
};
const RADIUS = 12; // dynamic: fieldBorderRadius (default '6' — multiselectV2.js:481)
const SHADOW = { saved: '2px 3px 4px 1px #ff0000', computed: 'rgb(255, 0, 0) 2px 3px 4px 1px' }; // dynamic: boxShadow (multiselectV2.js:386)
const STYLES = {
    fieldBackgroundColor: { value: C.background.hex },
    fieldBorderColor: { value: C.border.hex },
    accentColor: { value: C.accent.hex },
    selectedTextColor: { value: C.text.hex },
    fieldBorderRadius: { value: String(RADIUS) },
    boxShadow: { value: SHADOW.saved },
};
const ON = { value: '{{true}}' };

// a real press on an empty canvas spot (bottom-right of the viewport) moves focus off the field
const clickOutside = () => cy.get('body').realClick({ position: 'bottomRight' });
const moveMouseAway = () => cy.get('body').realHover({ position: 'bottomRight' });

describe('Multi Select (MultiselectV2) — styles facet', () => {
    let labels;

    beforeEach(() => {
        // dynamic: six distinct option labels
        labels = Cypress._.uniq(Array.from({ length: 30 }, () => fake.firstName.toLowerCase()).filter((w) => w.length >= 3)).slice(0, 6);
        cy.apiLogin();
        cy.apiCreateApp(`${fake.companyName}-MultiselectV2-styles-${Cypress._.uniqueId()}`);
        moveMouseAway();
    });

    afterEach(() => {
        cy.apiDeleteApp();
    });

    const expectFieldStyles = (s, name, borderColor = C.border.rgb) => {
        expect(s.control.backgroundColor, `${name}: field background`).to.eq(C.background.rgb);
        expect(s.control.borderColor, `${name}: field border`).to.eq(borderColor);
        expect(s.control.borderRadius, `${name}: border radius`).to.eq(`${RADIUS}px`);
        expect(s.control.boxShadow, `${name}: box shadow`).to.eq(SHADOW.computed);
    };

    // ── MultiselectV2-BRW-005 ────────────────────────────────────────────────
    it('[MultiselectV2-BRW-005] Hover darkens the control border, highlights an enabled row, and leaves a disabled row dimmed', () => {
        addMultiselectsViaApi([
            {
                name: 'mshover',
                layout: { top: 40, left: 2, width: 12, height: 40 },
                styles: { fieldBorderColor: { value: C.border.hex } },
                properties: { options: multiselectOptions(labels, { disabled: [labels[3]] }), values: multiselectValues([]) },
            },
        ]);
        visitMultiselectApp(S.field('mshover'));

        // control: idle border, hover border, idle again
        multiselectState('mshover', (s) => expect(s.control.borderColor, 'idle border').to.eq(C.border.rgb));
        cy.get(S.control('mshover')).realHover({ scrollBehavior: false });
        multiselectState('mshover', (s) => expect(s.control.borderColor, 'hovered border is darker').to.eq(C.borderHover));
        moveMouseAway();
        multiselectState('mshover', (s) => expect(s.control.borderColor, 'border after hover').to.eq(C.border.rgb));

        resolveCssVarColor(T.optionHoverVar, S.field('mshover')).then((hoverFill) => {
            resolveCssVarColor(T.surfaceTokenVar, S.field('mshover')).then((surface) => {
                expect(hoverFill, 'hover fill differs from the menu background').to.not.eq(surface);
                openMultiselectMenu('mshover');
                moveMouseAway();
                const row = (s, label) => s.menu.options.find((o) => o.text === label);

                // hover an enabled row → only that row takes the hover fill
                cy.get(S.anyMenu).contains('span.tw-truncate', labels[2]).realHover({ scrollBehavior: false });
                multiselectState('mshover', (s) => {
                    expect(row(s, labels[2]).backgroundColor, 'hovered enabled row highlighted').to.eq(hoverFill);
                    [labels[1], labels[4], labels[5]].forEach((l) =>
                        expect(row(s, l).backgroundColor, `unhovered row ${l}`).to.eq(surface)
                    );
                });

                // hover the disabled row → it stays dimmed and is not highlighted
                cy.get(S.anyMenu).contains('span.tw-truncate', labels[3]).realHover({ scrollBehavior: false });
                cy.wait(300); // dynamic: give a (wrong) hover paint a chance to apply
                multiselectState('mshover', (s) => {
                    const disabled = row(s, labels[3]);
                    expect(disabled.disabled, 'row is disabled').to.eq(true);
                    expect(disabled.opacity, 'disabled row dimmed').to.eq(T.disabledOptionOpacity);
                    expect(disabled.backgroundColor, 'disabled row not highlighted on hover').to.eq(surface);
                    expect(row(s, labels[4]).opacity, 'enabled row not dimmed').to.eq('1');
                });
            });
        });
    });

    // ── MultiselectV2-BRW-010 ────────────────────────────────────────────────
    it('[MultiselectV2-BRW-010] Configured background, border, text, radius and shadow resolve; open and focused take the accent', () => {
        addMultiselectsViaApi([
            { name: 'mscolor', layout: { top: 40, left: 2, width: 12, height: 40 }, styles: STYLES, properties: { options: multiselectOptions(labels), values: multiselectValues([labels[0]]) } },
            // search box off: opening focuses the control itself (MultiselectV2.jsx:389-391), so Escape closes the menu
            // and leaves the control focused
            {
                name: 'msfocus',
                layout: { top: 120, left: 2, width: 12, height: 40 },
                styles: STYLES,
                properties: { options: multiselectOptions(labels), values: multiselectValues([labels[0]]), showSearchInput: { value: '{{false}}' } },
            },
            { name: 'msplain', layout: { top: 200, left: 2, width: 12, height: 40 }, properties: { options: multiselectOptions(labels), values: multiselectValues([labels[0]]) } },
        ]);
        visitMultiselectApp(S.field('mscolor'));

        multiselectState('mscolor', (s) => {
            expectFieldStyles(s, 'idle');
            expect(s.summary.color, 'selected text colour').to.eq(C.text.rgb);
        });
        // control: the definition defaults paint differently, so the assertions above can fail
        resolveCssVarColor(T.surfaceTokenVar, S.field('msplain')).then((surface) =>
            multiselectState('msplain', (s) => {
                expect(s.control.backgroundColor, 'default background').to.eq(surface).and.not.eq(C.background.rgb);
                expect(s.control.borderRadius, 'default radius').to.eq('6px'); // source: multiselectV2.js:481
                expect(s.summary.color, 'default text colour').to.not.eq(C.text.rgb);
            })
        );

        // menu open → the accent replaces the configured border; the menu follows the configured background
        openMultiselectMenu('mscolor');
        multiselectState('mscolor', (s) => {
            expectFieldStyles(s, 'open', C.accent.rgb);
            expect(s.menu.backgroundColor, 'menu background follows the field background').to.eq(C.background.rgb);
            const unhovered = s.menu.options.filter((o) => o.index > 0).map((o) => o.backgroundColor);
            expect(Cypress._.uniq(unhovered), 'option rows follow the field background').to.deep.eq([C.background.rgb]);
        });
        closeMultiselectMenu('mscolor');
        clickOutside();
        multiselectState('mscolor', (s) => expectFieldStyles(s, 'closed and blurred'));

        // focused but closed → still the accent; shadow unchanged
        openMultiselectMenu('msfocus');
        multiselectState('msfocus', (s) => expect(s.focus.isCombobox && s.focus.widget, 'control focused').to.eq('msfocus'));
        cy.realPress('Escape'); // MultiselectV2.jsx:628-632
        multiselectComponentClosed('msfocus');
        multiselectState('msfocus', (s) => {
            expect(s.focus.widget, 'control still focused').to.eq('msfocus');
            expectFieldStyles(s, 'focused, menu closed', C.accent.rgb);
        });
        clickOutside();
        multiselectState('msfocus', (s) => {
            expect(s.focus.widget, 'focus left').to.not.eq('msfocus');
            expectFieldStyles(s, 'blurred');
        });
    });

    it('[MultiselectV2-BRW-010] After an invalid interaction the error border wins over the accent and the configured border', () => {
        addMultiselectsViaApi([
            {
                name: 'msinv',
                layout: { top: 40, left: 2, width: 12, height: 40 },
                styles: STYLES,
                properties: { options: multiselectOptions(labels), values: multiselectValues([labels[0]]) },
                validation: { mandatory: ON }, // multiselectV2.js:15
            },
        ]);
        visitMultiselectApp(S.field('msinv'));
        resolveCssVarColor(T.errorBorderVar, S.field('msinv')).then((errorBorder) => {
            expect(errorBorder, 'error token differs from the configured colours').to.not.be.oneOf([C.border.rgb, C.accent.rgb]);
            multiselectState('msinv', (s) => {
                expectFieldStyles(s, 'valid');
                expect(s.ariaInvalid).to.eq('false');
            });
            // the user empties the mandatory field while the menu is open
            openMultiselectMenu('msinv');
            clickMultiselectOption('msinv', labels[0]);
            multiselectState('msinv', (s) => {
                expect(s.ariaInvalid, 'invalid').to.eq('true');
                expect(s.menu, 'menu still open').to.not.eq(null);
                expectFieldStyles(s, 'invalid and open', errorBorder);
            });
            cy.get(S.draggableWidget('msinv')).should('contain.text', T.errorMandatory); // MultiselectV2.jsx:650-663
            closeMultiselectMenu('msinv');
            clickOutside();
            multiselectState('msinv', (s) => expectFieldStyles(s, 'invalid and blurred', errorBorder));
            // a valid pick restores the configured border once focus leaves
            openMultiselectMenu('msinv');
            clickMultiselectOption('msinv', labels[1]);
            multiselectState('msinv', (s) => expectFieldStyles(s, 'valid again and open', C.accent.rgb));
            closeMultiselectMenu('msinv');
            clickOutside();
            multiselectState('msinv', (s) => {
                expect(s.ariaInvalid).to.eq('false');
                expectFieldStyles(s, 'valid again and blurred');
            });
        });
    });

    it('[MultiselectV2-BRW-010] Legacy default hexes resolve to the theme tokens (dark mode makes them distinguishable)', () => {
        addMultiselectsViaApi([
            {
                name: 'mslegacy',
                layout: { top: 40, left: 2, width: 12, height: 40 },
                styles: {
                    fieldBorderColor: { value: T.legacyBorderHex },
                    accentColor: { value: T.legacyAccentHex },
                    selectedTextColor: { value: T.legacyTextHex },
                    fieldBackgroundColor: { value: T.legacyBackgroundHex },
                },
                properties: { options: multiselectOptions(labels), values: multiselectValues([labels[0]]) },
            },
        ]);
        // globalSettings.appMode drives the app's dark theme; the light tokens equal the legacy hexes
        cy.apiUpdateGlobalSettings({ appMode: 'dark' });
        visitMultiselectApp(S.field('mslegacy'));
        cy.get('.dark-theme').should('exist');
        const legacyRgb = { border: 'rgb(204, 209, 213)', accent: 'rgb(67, 104, 227)', text: 'rgb(27, 31, 36)', background: 'rgb(255, 255, 255)' }; // the four hexes above
        const tokens = {};
        [['border', T.borderTokenVar], ['accent', T.accentTokenVar], ['text', T.textTokenVar], ['background', T.surfaceTokenVar]].forEach(([k, v]) =>
            resolveCssVarColor(v, S.field('mslegacy')).then((c) => {
                tokens[k] = c;
            })
        );
        cy.then(() => {
            expect(tokens.border, 'dark border token differs from the legacy hex').to.not.eq(legacyRgb.border);
            expect(tokens.text, 'dark text token differs from the legacy hex').to.not.eq(legacyRgb.text);
            expect(tokens.background, 'dark surface token differs from the legacy hex').to.not.eq(legacyRgb.background);
            multiselectState('mslegacy', (s) => {
                expect(s.control.borderColor, 'legacy border → token').to.eq(tokens.border);
                expect(s.control.backgroundColor, 'legacy background → token').to.eq(tokens.background);
                expect(s.summary.color, 'legacy text → token').to.eq(tokens.text);
            });
            openMultiselectMenu('mslegacy');
            multiselectState('mslegacy', (s) => expect(s.control.borderColor, 'legacy accent → token').to.eq(tokens.accent));
        });
    });

    // ── MultiselectV2-BRW-011 ────────────────────────────────────────────────
    it('[MultiselectV2-BRW-011] Disabled and loading fields paint the same background as an enabled one and do not open', () => {
        const options = multiselectOptions(labels);
        const values = multiselectValues([labels[0]]);
        const at = (top, left) => ({ top, left, width: 12, height: 40 }); // dynamic: grid slots
        addMultiselectsViaApi([
            { name: 'msen', layout: at(40, 2), styles: STYLES, properties: { options, values } },
            { name: 'msdis', layout: at(40, 16), styles: STYLES, properties: { options, values, disabledState: ON } },
            { name: 'msload', layout: at(40, 30), styles: STYLES, properties: { options, values, loadingState: ON } },
            // the same three with the definition-default (theme token) background
            { name: 'msenplain', layout: at(120, 2), properties: { options, values } },
            { name: 'msdisplain', layout: at(120, 16), properties: { options, values, disabledState: ON } },
            { name: 'msloadplain', layout: at(120, 30), properties: { options, values, loadingState: ON } },
        ]);
        visitMultiselectApp(S.field('msen'));

        multiselectState('msen', (s) => expect(s.control.backgroundColor, 'enabled configured background').to.eq(C.background.rgb));
        ['msdis', 'msload'].forEach((name) =>
            multiselectState(name, (s) => expect(s.control.backgroundColor, `${name}: same background as enabled`).to.eq(C.background.rgb))
        );
        resolveCssVarColor(T.surfaceTokenVar, S.field('msenplain')).then((surface) => {
            ['msenplain', 'msdisplain', 'msloadplain'].forEach((name) =>
                multiselectState(name, (s) => expect(s.control.backgroundColor, `${name}: default token background`).to.eq(surface))
            );
        });
        // the state is conveyed by the loader and by the field not opening
        multiselectState('msload', (s) => expect(s.loader, 'loader shown').to.eq(true));
        multiselectState('msdis', (s) => expect(s.loader, 'no loader when only disabled').to.eq(false));
        ['msdis', 'msload'].forEach((name) => {
            // the disabled box has pointer-events: none — a real pointer press goes through to whatever is there
            cy.get(S.field(name)).realClick({ scrollBehavior: false });
            cy.wait(300); // dynamic: give a (wrong) open a chance to render
            multiselectState(name, (s) => {
                expect(s.menu, `${name}: menu not opened`).to.eq(null);
                expect(s.control.backgroundColor, `${name}: background after a click`).to.eq(C.background.rgb);
            });
        });
        // control: the enabled field opens
        openMultiselectMenu('msen');
    });
});

// waits until the widget's own menu has closed
function multiselectComponentClosed(name) {
    multiselectState(name, (s) => expect(s.menu, `${name} menu closed`).to.eq(null));
}
