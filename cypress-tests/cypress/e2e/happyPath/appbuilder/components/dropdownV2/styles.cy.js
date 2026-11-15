/**
 * SPEC — Dropdown (DropdownV2) — styles facet.
 * FOR AI: TESTING.md browser scenario only:
 *   DropdownV2-BRW-008 — configured field background, border, accent, selected text, placeholder text, radius,
 *                        shadow and padding produce their computed appearance across the idle, focused/open,
 *                        selected, disabled, loading and invalid states
 * The styles are emitted through react-select's generated (emotion) CSS — DropdownV2.jsx:377-518 + utils.js:10-48 —
 * so they are read with getComputedStyle. One Dropdown per state is seeded with the same custom styles and a
 * default-styled control widget proves the custom values are not the defaults.
 * Helpers: addDropdownsViaApi, dropdownOptions, visitDropdownApp, openDropdownMenu, closeDropdownMenu,
 * pickDropdownOption, getDropdownComponentId, dropdownState, resolveCssVarColor.
 */
import { fake } from "Fixtures/fake";
import { dropdownV2Selector as S } from "Selectors/appBuilder/components/dropdownV2";
import { dropdownV2Text as T } from "Texts/appBuilder/components/dropdownV2";
import { resolveCssVarColor } from "Support/utils/appBuilder/components/baseInput";
import {
    addDropdownsViaApi,
    dropdownOptions,
    visitDropdownApp,
    openDropdownMenu,
    closeDropdownMenu,
    pickDropdownOption,
    dropdownState,
} from "Support/utils/appBuilder/components/dropdownV2";

// dynamic: test colours (hex saved → rgb computed); defaults are theme tokens (dropdownV2.js:458-470)
const C = {
    background: { hex: '#fde68a', rgb: 'rgb(253, 230, 138)' }, // fieldBackgroundColor (dropdownV2.js:253)
    border: { hex: '#0000ff', rgb: 'rgb(0, 0, 255)' }, // fieldBorderColor (dropdownV2.js:259)
    accent: { hex: '#ff00ff', rgb: 'rgb(255, 0, 255)' }, // accentColor (dropdownV2.js:265)
    text: { hex: '#008000', rgb: 'rgb(0, 128, 0)' }, // selectedTextColor (dropdownV2.js:271)
    placeholder: { hex: '#ff8800', rgb: 'rgb(255, 136, 0)' }, // placeholderTextColor (dropdownV2.js:277)
    error: { hex: '#aa0000', rgb: 'rgb(170, 0, 0)' }, // errTextColor (dropdownV2.js:283)
};
const RADIUS = 12; // dynamic: fieldBorderRadius (default '6' — dropdownV2.js:457)
const SHADOW = { saved: '2px 3px 4px 1px #ff0000', computed: 'rgb(255, 0, 0) 2px 3px 4px 1px' }; // dynamic: boxShadow (dropdownV2.js:312)
const STYLES = {
    fieldBackgroundColor: { value: C.background.hex },
    fieldBorderColor: { value: C.border.hex },
    accentColor: { value: C.accent.hex },
    selectedTextColor: { value: C.text.hex },
    placeholderTextColor: { value: C.placeholder.hex },
    errTextColor: { value: C.error.hex },
    fieldBorderRadius: { value: String(RADIUS) },
    boxShadow: { value: SHADOW.saved },
};

// a real press on an empty canvas spot (bottom-right of the viewport) moves focus off the field
const clickOutside = () => cy.get('body').realClick({ position: 'bottomRight' });

describe('Dropdown (DropdownV2) — styles facet', () => {
    let labels;

    beforeEach(() => {
        // dynamic: two distinct option labels
        labels = Cypress._.uniq(Array.from({ length: 8 }, () => fake.firstName).filter((w) => w.length >= 3)).slice(0, 2);
        cy.apiLogin();
        cy.apiCreateApp(`${fake.companyName}-DropdownV2-styles-${Cypress._.uniqueId()}`);
        cy.then(() => {
            const withDefault = dropdownOptions(labels, labels[0]);
            const at = (top, left) => ({ top, left, width: 12, height: 40 }); // dynamic: grid slots
            addDropdownsViaApi([
                { name: 'ddidle', layout: at(40, 2), styles: STYLES, properties: { options: dropdownOptions(labels) } },
                { name: 'ddsel', layout: at(40, 20), styles: STYLES, properties: { options: withDefault } },
                { name: 'dddis', layout: at(120, 2), styles: STYLES, properties: { options: withDefault, disabledState: { value: '{{true}}' } } },
                { name: 'ddload', layout: at(120, 20), styles: STYLES, properties: { options: withDefault, loadingState: { value: '{{true}}' } } },
                { name: 'ddinv', layout: at(200, 2), styles: STYLES, properties: { options: withDefault }, validation: { mandatory: { value: '{{true}}' } } },
                { name: 'ddpad', layout: at(200, 20), styles: { ...STYLES, padding: { value: T.paddingNone } }, properties: { options: withDefault } },
                { name: 'ddplain', layout: at(280, 2), properties: { options: withDefault } }, // definition defaults
            ]);
        });
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

    it('[DropdownV2-BRW-008] Idle and selected fields paint the configured background, border, radius, shadow, text and placeholder colours', () => {
        visitDropdownApp(S.field('ddidle'));

        // idle with no selection → placeholder colour
        dropdownState('ddidle', (s) => {
            expectFieldStyles(s, 'ddidle');
            expect(s.value.text, 'placeholder shown').to.eq(T.defaultPlaceholder); // source: dropdownV2.js:439
            expect(s.value.color, 'placeholder colour').to.eq(C.placeholder.rgb);
        });
        // idle with a selection → selected text colour
        dropdownState('ddsel', (s) => {
            expectFieldStyles(s, 'ddsel');
            expect(s.value.text).to.eq(labels[0]);
            expect(s.value.color, 'selected text colour').to.eq(C.text.rgb);
        });
        // control: the defaults paint differently (theme tokens), so the assertions above can fail
        resolveCssVarColor('--cc-surface1-surface', S.field('ddplain')).then((surface) =>
            dropdownState('ddplain', (s) => {
                expect(s.control.backgroundColor, 'default background').to.eq(surface).and.not.eq(C.background.rgb);
                expect(s.control.borderRadius, 'default radius').to.eq('6px'); // source: dropdownV2.js:457
                expect(s.value.color, 'default text colour').to.not.eq(C.text.rgb);
            })
        );
    });

    it('[DropdownV2-BRW-008] Focused/open field takes the accent border; the menu uses the field background, text colour and accent check mark', () => {
        visitDropdownApp(S.field('ddsel'));
        openDropdownMenu('ddsel');
        dropdownState('ddsel', (s) => {
            expectFieldStyles(s, 'ddsel (open)', C.accent.rgb);
            expect(s.menu.backgroundColor, 'menu background').to.eq(C.background.rgb);
            const selected = s.menu.options.find((o) => o.text === labels[0]);
            const other = s.menu.options.find((o) => o.text === labels[1]);
            expect(selected.checkFill, 'selected check mark uses the accent').to.eq(C.accent.rgb);
            expect(other.checkFill, 'unselected option has no check mark').to.eq(null);
            [selected, other].forEach((o) => expect(o.color, `option ${o.text} text colour`).to.eq(C.text.rgb));
        });
        closeDropdownMenu('ddsel');
        // closed by its own toggle the field keeps focus → still the accent border
        dropdownState('ddsel', (s) => expectFieldStyles(s, 'ddsel (closed, focused)', C.accent.rgb));
        // focus leaves (real click on empty canvas) → configured border again
        clickOutside();
        dropdownState('ddsel', (s) => expectFieldStyles(s, 'ddsel (blurred)'));

        // an unselected field opened shows the accent border and keeps the placeholder colour
        openDropdownMenu('ddidle');
        dropdownState('ddidle', (s) => {
            expectFieldStyles(s, 'ddidle (open)', C.accent.rgb);
            expect(s.value.color, 'placeholder colour while open').to.eq(C.placeholder.rgb);
        });
        pickDropdownOption(labels[1]);
        dropdownState('ddidle', (s) => {
            expect(s.value.text).to.eq(labels[1]);
            expect(s.value.color, 'selected text colour after picking').to.eq(C.text.rgb);
        });
    });

    it('[DropdownV2-BRW-008] Disabled and loading fields keep the configured paint and do not open', () => {
        visitDropdownApp(S.field('dddis'));
        dropdownState('dddis', (s) => {
            expectFieldStyles(s, 'dddis');
            expect(s.value.color, 'disabled selected text colour').to.eq(C.text.rgb);
        });
        dropdownState('ddload', (s) => {
            expectFieldStyles(s, 'ddload');
            expect(s.value.color, 'loading selected text colour').to.eq(C.text.rgb);
            // DropdownV2.jsx:623-624 — loader replaces the dropdown indicator
            expect(s.loader, 'loader shown').to.eq(true);
        });
        cy.get(S.loader('ddload')).should('be.visible');
        cy.get(S.loader('dddis')).should('not.exist');
        ['dddis', 'ddload'].forEach((name) => {
            // the box carries `.disabled` (pointer-events: none) while disabled — a real pointer press goes through
            cy.get(S.field(name)).realClick();
            cy.wait(300); // dynamic: give a (wrong) open a chance to render
            cy.get(S.menuList).should('not.exist');
            dropdownState(name, (s) => expectFieldStyles(s, `${name} after a click`));
        });
    });

    it('[DropdownV2-BRW-008] An invalid field paints the error border and the configured error text colour', () => {
        visitDropdownApp(S.field('ddinv'));
        dropdownState('ddinv', (s) => {
            expectFieldStyles(s, 'ddinv (valid)');
            expect(s.error, 'no error before interaction').to.eq(null);
        });
        cy.get(S.clearButton('ddinv')).click();
        cy.get('body').then(($body) => {
            if ($body.find(S.menuList).length) closeDropdownMenu('ddinv');
        });
        resolveCssVarColor(T.errorBorderVar, S.field('ddinv')).then((errorBorder) =>
            dropdownState('ddinv', (s) => {
                expect(errorBorder, 'error token differs from the configured border').to.not.eq(C.border.rgb);
                expectFieldStyles(s, 'ddinv (invalid)', errorBorder);
                expect(s.ariaInvalid).to.eq('true');
                expect(s.error.text).to.eq(T.errorMandatory);
                expect(s.error.color, 'error text colour').to.eq(C.error.rgb);
                expect(s.value.color, 'placeholder colour while invalid').to.eq(C.placeholder.rgb);
            })
        );
        // a valid pick restores the configured border
        openDropdownMenu('ddinv');
        pickDropdownOption(labels[1]);
        clickOutside();
        dropdownState('ddinv', (s) => {
            expectFieldStyles(s, 'ddinv (valid again)');
            expect(s.ariaInvalid).to.eq('false');
        });
    });

    it('[DropdownV2-BRW-008] Padding default keeps the 2px box inset; none removes it and the field fills the box', () => {
        visitDropdownApp(S.field('ddpad'));
        dropdownState('ddsel', (s) => {
            expect(s.box.padding, 'default padding').to.eq(`${T.boxPadding}px`);
            expect(s.control.height, 'field inside the inset').to.be.closeTo(s.box.height - 2 * T.boxPadding, 0.5);
        });
        dropdownState('ddpad', (s) => {
            expectFieldStyles(s, 'ddpad');
            expect(s.box.padding, 'no padding').to.eq('0px');
            expect(s.control.height, 'field fills the box').to.be.closeTo(s.box.height, 0.5);
        });
    });
});
