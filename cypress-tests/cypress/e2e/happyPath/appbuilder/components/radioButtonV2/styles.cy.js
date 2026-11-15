/**
 * SPEC — Radio Button (V2) — styles facet.
 * FOR AI: TESTING.md browser scenario:
 *   RadioButtonV2-BRW-003 — labelColor, borderColor, switchOnBackgroundColor, switchOffBackgroundColor, handleColor and
 *                           padding produce the right computed styles on the real checkmark control in the checked,
 *                           unchecked and disabled states, and the keyboard focus ring is visible and not clipped
 *                           (commits cd33ad841f / 7438722078 / 0685995eb9).
 * Paint (RadioButtonV2.jsx:332-346 + radioButtonV2.scss): unchecked → fill switchOff + 1px solid borderColor; checked →
 * fill switchOn (--selected-background-color), no border, ::after handle in handleColor; a disabled option → fill
 * --surfaces-surface-03, handle --icons-default, never the authored colours. Label colour → _ui/Label.jsx <p>.
 * Padding → RenderWidget.jsx:343 (2px box padding, 0 for 'none'). Focus ring → peer-focus-visible:tw-ring-2
 * tw-ring-offset-1 on the checkmark (RadioButtonV2.jsx:333).
 * KNOWN PRODUCT BUG (kept red): the first option's focus ring is cut off on its left side — its checkmark sits flush
 * with the options scroller's left edge and the scroller clips overflow (RadioButtonV2.jsx:234 `auto hidden`, restored
 * by 3fef828ab4 after 0685995eb9 had made it `visible` for the ring).
 * Helpers: addRadioButtonsViaApi, openRadioAppInViewer, radioBoxes, checkmarkRing, moveMouseAway, resolveCssVarColor.
 */
import { fake } from "Fixtures/fake";
import { commonWidgetSelector } from "Selectors/common";
import { radioButtonV2Selector } from "Selectors/appBuilder/components/radioButtonV2";
import { radioButtonV2Text } from "Texts/appBuilder/components/radioButtonV2";
import { resolveCssVarColor } from "Support/utils/appBuilder/components/baseInput";
import {
    addRadioButtonsViaApi,
    openRadioAppInViewer,
    radioBoxes,
    checkmarkRing,
    moveMouseAway,
} from "Support/utils/appBuilder/components/radioButtonV2";

const T = radioButtonV2Text;
const S = radioButtonV2Selector;
const PX = 0.6;
const input = (name) => `${commonWidgetSelector.draggableWidget(name)} input`;
const caption = () => (fake.firstName.replace(/\W/g, '') || 'Opt').slice(0, 8); // dynamic: option caption

// dynamic: five distinct authored colours (radioButtonV2.js:133-249 colorSwatches)
const AUTHORED = {
    labelColor: { hex: '#d6336c', rgb: 'rgb(214, 51, 108)' },
    borderColor: { hex: '#20c997', rgb: 'rgb(32, 201, 151)' },
    switchOnBackgroundColor: { hex: '#1c7ed6', rgb: 'rgb(28, 126, 214)' },
    switchOffBackgroundColor: { hex: '#fff3bf', rgb: 'rgb(255, 243, 191)' },
    handleColor: { hex: '#f08c00', rgb: 'rgb(240, 140, 0)' },
};
const authoredStyles = Object.fromEntries(Object.entries(AUTHORED).map(([k, v]) => [k, { value: v.hex }]));

// the paint contract of one option for a given palette { on, off, border, handle } and state
const expectOptionPaint = (o, state, P, at) => {
    expect(o.markRadius, `${at}: round`).to.eq('50%');
    expect(o.mark.width, `${at}: 16px circle`).to.be.closeTo(T.checkmarkSize, PX);
    if (state === 'checked') {
        expect(o.checked, `${at}: input checked`).to.eq(true);
        expect(o.markBg, `${at}: checked fill`).to.eq(P.on);
        expect(o.markBorderStyle, `${at}: no border when checked`).to.eq('none');
        expect(o.handleDisplay, `${at}: handle shown`).to.eq('block');
        expect(o.handleBg, `${at}: handle colour`).to.eq(P.handle);
        expect(o.handleWidth, `${at}: handle size`).to.eq(`${T.handleSize}px`);
        expect(o.handleHeight, `${at}: handle size`).to.eq(`${T.handleSize}px`);
    } else if (state === 'unchecked') {
        expect(o.checked, `${at}: input unchecked`).to.eq(false);
        expect(o.markBg, `${at}: unchecked fill`).to.eq(P.off);
        expect(o.markBorderStyle, `${at}: border style`).to.eq('solid');
        expect(o.markBorderWidth, `${at}: border width`).to.eq('1px');
        expect(o.markBorderColor, `${at}: border colour`).to.eq(P.border);
        expect(o.handleDisplay, `${at}: no handle`).to.eq('none');
    } else {
        // disabled (checked or not): the disabled fill, never the authored fill / border
        expect(o.disabled, `${at}: input disabled`).to.eq(true);
        expect(o.markBg, `${at}: disabled fill`).to.eq(P.disabledFill);
        expect(o.markBg, `${at}: not the checked fill`).to.not.eq(P.on);
        expect(o.markBg, `${at}: not the unchecked fill`).to.not.eq(P.off);
        expect(`${o.markBorderStyle} ${o.markBorderColor}`, `${at}: not the authored border`).to.not.eq(`solid ${P.border}`);
        if (state === 'disabled-checked') {
            expect(o.handleDisplay, `${at}: handle shown`).to.eq('block');
            expect(o.handleBg, `${at}: disabled handle colour`).to.eq(P.disabledHandle);
        } else {
            expect(o.handleDisplay, `${at}: no handle`).to.eq('none');
        }
    }
};

const expectPalette = (name, states, P, context) =>
    radioBoxes(name, (b) => {
        expect(b.options.length, `${context} ${name}: options`).to.eq(states.length);
        states.forEach((state, i) => expectOptionPaint(b.options[i], state, P, `${context} ${name} option ${i} (${state})`));
        if (P.label) expect(b.labelColor, `${context} ${name}: label colour`).to.eq(P.label);
    });

// resolves the theme tokens a palette needs, scoped to a widget
const resolvePalette = (scope) => {
    const keys = {
        on: T.tokenOn,
        off: T.tokenOff,
        border: T.tokenBorder,
        handle: T.tokenHandle,
        label: T.tokenLabel,
        disabledFill: T.tokenDisabledFill,
        disabledHandle: T.tokenDisabledHandle,
    };
    const P = {};
    Object.entries(keys).forEach(([k, token]) => resolveCssVarColor(token, scope).then((c) => (P[k] = c)));
    return cy.wrap(P);
};

describe('Radio Button (V2) — styles facet', { testIsolation: false }, () => {
    beforeEach(() => {
        cy.apiLogin();
        cy.apiCreateApp(`${fake.companyName}-RadioButtonV2-styles-${Cypress._.uniqueId()}`);
    });

    afterEach(() => {
        moveMouseAway();
        cy.apiLogin();
        cy.apiDeleteApp();
    });

    // ── RadioButtonV2-BRW-003 — default theme colours ─────────────────────
    it('[RadioButtonV2-BRW-003] Default styles paint the checked, unchecked and disabled circles from the theme tokens, in the editor and the viewer', () => {
        const names = [caption(), caption(), caption()];
        addRadioButtonsViaApi([
            { name: 'rbdefault', layout: { top: 40, left: 2, width: 15, height: T.defaultHeight } }, // radioButtonV2.js:366-377 defaults
            {
                name: 'rbdisabled',
                layout: { top: 120, left: 2, width: 15, height: T.defaultHeight },
                properties: {
                    options: { value: [T.option(names[0], '1', true, true), T.option(names[1], '2'), T.option(names[2], '3', false, true)] },
                },
            },
        ]);
        const DEFAULT_STATES = ['unchecked', 'checked', 'unchecked']; // radioButtonV2.js:336 option2 default
        const DISABLED_STATES = ['disabled-checked', 'unchecked', 'disabled-unchecked'];

        cy.openApp('', undefined, undefined, S.options('rbdefault'));
        resolvePalette(S.root('rbdefault')).then((P) => {
            expect(P.on, 'brand colour resolved').to.match(/^rgb/);
            expectPalette('rbdefault', DEFAULT_STATES, P, 'editor');
            expectPalette('rbdisabled', DISABLED_STATES, { ...P, label: null }, 'editor');
        });

        openRadioAppInViewer(S.options('rbdefault'));
        resolvePalette(S.root('rbdefault')).then((P) => {
            expectPalette('rbdefault', DEFAULT_STATES, P, 'viewer');
            expectPalette('rbdisabled', DISABLED_STATES, { ...P, label: null }, 'viewer');
        });
    });

    // ── RadioButtonV2-BRW-003 — authored colours + state changes ──────────
    it('[RadioButtonV2-BRW-003] Authored label, border, checked, unchecked and handle colours paint the real control and follow the selection; disabled options keep the disabled paint', () => {
        const names = [caption(), caption(), caption()];
        addRadioButtonsViaApi([
            {
                name: 'rbpaint',
                layout: { top: 40, left: 2, width: 18, height: T.defaultHeight },
                styles: authoredStyles,
                properties: {
                    options: { value: [T.option(names[0], '1', true), T.option(names[1], '2'), T.option(names[2], '3', false, true)] },
                },
            },
            {
                name: 'rbpaintdis',
                layout: { top: 120, left: 2, width: 18, height: T.defaultHeight },
                styles: authoredStyles,
                properties: { options: { value: [T.option(names[0], '1', true, true), T.option(names[1], '2')] } },
            },
        ]);
        moveMouseAway();
        openRadioAppInViewer(S.options('rbpaint'));
        resolvePalette(S.root('rbpaint')).then((theme) => {
            const P = {
                on: AUTHORED.switchOnBackgroundColor.rgb,
                off: AUTHORED.switchOffBackgroundColor.rgb,
                border: AUTHORED.borderColor.rgb,
                handle: AUTHORED.handleColor.rgb,
                label: AUTHORED.labelColor.rgb,
                disabledFill: theme.disabledFill,
                disabledHandle: theme.disabledHandle,
            };
            expectPalette('rbpaint', ['checked', 'unchecked', 'disabled-unchecked'], P, 'viewer');
            expectPalette('rbpaintdis', ['disabled-checked', 'unchecked'], P, 'viewer');

            // a real click moves the checked paint to the clicked option
            cy.get(S.optionLabel('rbpaint', 1)).realClick({ scrollBehavior: false });
            expectPalette('rbpaint', ['unchecked', 'checked', 'disabled-unchecked'], P, 'after selecting option 1');
            // a click on the disabled option changes nothing
            cy.get(S.optionLabel('rbpaint', 2)).realClick({ scrollBehavior: false });
            expectPalette('rbpaint', ['unchecked', 'checked', 'disabled-unchecked'], P, 'after clicking the disabled option');
            // selecting the enabled option of the second widget leaves its disabled default with the disabled paint
            cy.get(S.optionLabel('rbpaintdis', 1)).realClick({ scrollBehavior: false });
            radioBoxes('rbpaintdis', (b) => {
                expectOptionPaint(b.options[1], 'checked', P, 'rbpaintdis option 1 selected');
                expect(b.options[0].checked, 'disabled default released').to.eq(false);
                expect(b.options[0].markBg, 'disabled fill kept').to.eq(P.disabledFill);
                expect(b.options[0].handleDisplay, 'disabled handle hidden once unchecked').to.eq('none');
            });
        });
        moveMouseAway();
    });

    // ── RadioButtonV2-BRW-003 — padding ────────────────────────────────────
    it('[RadioButtonV2-BRW-003] Padding Default insets the radio group by 2px inside the widget box; None puts it flush', () => {
        addRadioButtonsViaApi([
            { name: 'rbpad', layout: { top: 40, left: 2, width: 15, height: T.defaultHeight } }, // radioButtonV2.js:377 default
            {
                name: 'rbnopad',
                layout: { top: 120, left: 2, width: 15, height: T.defaultHeight },
                styles: { padding: { value: T.paddingNone } },
            },
        ]);
        const expectInset = (name, inset, context) =>
            radioBoxes(name, (b) => {
                expect(b.boxPadding, `${context} ${name}: box padding`).to.eq(`${inset}px`);
                expect(b.root.left - b.box.left, `${context} ${name}: left inset`).to.be.closeTo(inset, PX);
                expect(b.root.top - b.box.top, `${context} ${name}: top inset`).to.be.closeTo(inset, PX);
                expect(b.box.right - b.root.right, `${context} ${name}: right inset`).to.be.closeTo(inset, PX);
                expect(b.box.bottom - b.root.bottom, `${context} ${name}: bottom inset`).to.be.closeTo(inset, PX);
                expect(b.box.height, `${context} ${name}: box keeps the authored height`).to.be.closeTo(T.defaultHeight, 1.5);
            });
        cy.openApp('', undefined, undefined, S.options('rbpad'));
        expectInset('rbpad', T.boxPadding, 'editor');
        expectInset('rbnopad', 0, 'editor');
        openRadioAppInViewer(S.options('rbpad'));
        expectInset('rbpad', T.boxPadding, 'viewer');
        expectInset('rbnopad', 0, 'viewer');
    });

    // ── RadioButtonV2-BRW-003 — focus ring ─────────────────────────────────
    // `rbmid` checks option2 (radioButtonV2.js:336), so Tab lands on a circle with neighbours on both sides.
    it('[RadioButtonV2-BRW-003] Keyboard focus draws the focus-colour ring around the focused option circle without clipping; pointer focus draws none', () => {
        addRadioButtonsViaApi([
            { type: 'TextInput', name: 'before', layout: { top: 40, left: 2, width: 10, height: 40 } },
            { name: 'rbmid', layout: { top: 100, left: 2, width: 15, height: T.defaultHeight } },
        ]);
        moveMouseAway();
        openRadioAppInViewer(S.options('rbmid'));
        resolveCssVarColor(T.tokenFocusOutline, S.root('rbmid')).as('focusColour');

        cy.get(input('before')).click();
        cy.realPress('Tab');
        cy.get('@focusColour').then((focusColour) =>
            checkmarkRing().then((f) => {
                expect(f.widget, 'Tab reaches the radio group').to.eq('rbmid');
                expect(f.index, 'lands on the checked option').to.eq(1);
                expect(f.focusVisible, 'keyboard focus is focus-visible').to.eq(true);
                expect(f.spread, '1px offset + 2px ring').to.eq(T.focusRingSpread);
                expect(f.ringColor, 'ring in the focus colour').to.eq(focusColour);
                expect(f.clip, 'clipping ancestor').to.not.eq(null);
                expect(f.rect.left - f.spread, 'ring left visible').to.be.gte(f.clip.left - 0.5);
                expect(f.rect.right + f.spread, 'ring right visible').to.be.lte(f.clip.right + 0.5);
                expect(f.rect.top - f.spread, 'ring top visible').to.be.gte(f.clip.top - 0.5);
                expect(f.rect.bottom + f.spread, 'ring bottom visible').to.be.lte(f.clip.bottom + 0.5);
            })
        );
        // arrow keys move focus + selection; the ring follows to the next circle
        cy.realPress('ArrowRight');
        checkmarkRing().then((f) => {
            expect(f.index, 'ArrowRight moves to option 3').to.eq(2);
            expect(f.spread, 'ring follows').to.eq(T.focusRingSpread);
            expect(f.rect.right + f.spread, 'ring right visible').to.be.lte(f.clip.right + 0.5);
        });
        cy.get(S.optionInput('rbmid', 2)).should('be.checked');

        // pointer focus: the clicked option is focused but draws no ring
        cy.get(S.optionLabel('rbmid', 1)).realClick({ scrollBehavior: false });
        checkmarkRing().then((f) => {
            expect(f.index, 'clicked option focused').to.eq(1);
            expect(f.focusVisible, 'pointer focus is not focus-visible').to.eq(false);
            expect(f.spread, 'no ring for pointer focus').to.eq(0);
        });
        moveMouseAway();
    });

    // ── RadioButtonV2-BRW-003 — focus ring on the first option (KNOWN PRODUCT BUG — red) ──
    // The default layout: label on the side, option1 checked → its circle sits flush with the scroller's left edge.
    it('[RadioButtonV2-BRW-003] The focus ring of the first option is not cut off by the options scroller', () => {
        const names = [caption(), caption(), caption()];
        addRadioButtonsViaApi([
            { type: 'TextInput', name: 'before', layout: { top: 40, left: 2, width: 10, height: 40 } },
            {
                name: 'rbfirst',
                layout: { top: 100, left: 2, width: 15, height: T.defaultHeight },
                properties: { options: { value: [T.option(names[0], '1', true), T.option(names[1], '2'), T.option(names[2], '3')] } },
            },
        ]);
        moveMouseAway();
        openRadioAppInViewer(S.options('rbfirst'));
        cy.get(input('before')).click();
        cy.realPress('Tab');
        checkmarkRing().then((f) => {
            expect(f.widget, 'Tab reaches the radio group').to.eq('rbfirst');
            expect(f.index, 'lands on the first (checked) option').to.eq(0);
            expect(f.spread, 'ring drawn').to.eq(T.focusRingSpread);
            // control: the scroller does clip (so a ring sticking out of it is cut)
            expect(f.clipClass, 'nearest clipping ancestor').to.contain('radio-button-options');
            expect(f.rect.top - f.spread, 'ring top visible').to.be.gte(f.clip.top - 0.5);
            expect(f.rect.bottom + f.spread, 'ring bottom visible').to.be.lte(f.clip.bottom + 0.5);
            expect(f.rect.left - f.spread, 'ring left visible (not cut by the scroller)').to.be.gte(f.clip.left - 0.5);
        });
    });
});
