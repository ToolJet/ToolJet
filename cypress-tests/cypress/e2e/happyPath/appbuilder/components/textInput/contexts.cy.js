/**
 * SPEC — Text Input — contexts facet.
 * FOR AI: 2 cases — device context — show on desktop / mobile toggles visibility; exposed-value context — value observable in the inspector….
 * Plus TESTING.md browser scenarios:
 *   TextInput-BRW-003 — editor canvas, preview, released app and public app agree on value, validation, styling
 *   TextInput-BRW-004 — an app saved before the input revamp (imported fixture, tooljet_version 3.15.1) keeps its
 *                       value, label placement (side width + top), validation rules and deprecated action wiring
 * Helpers: verifyLayout, openNode, openAndVerifyNode, verifyNodeData, addTextInputsViaApi, expectComputedColor,
 * resolveCssVarColor, getLabelShare, expectLabelFieldSplit, importAppFixture, releaseAndMakePublic.
 */
import { fake } from "Fixtures/fake";
import { commonWidgetSelector } from "Selectors/common";
import { verifyLayout } from "Support/utils/commonWidget";
import { openNode, openAndVerifyNode, verifyNodeData } from "Support/utils/appBuilder/inspector";
import { openEditorSidebar } from "Support/utils/commonWidget";
import { textInputSelector } from "Selectors/appBuilder/components/textInput";
import { textInputText } from "Texts/appBuilder/components/textInput";
import {
    expectComputedColor,
    resolveCssVarColor,
    getLabelShare,
    expectLabelFieldSplit,
    importAppFixture,
    releaseAndMakePublic,
} from "Support/utils/appBuilder/components/baseInput";
import { addTextInputsViaApi } from "Support/utils/appBuilder/components/textInput";
import { openAppInViewer } from "Support/utils/appBuilder/components/textArea";
import { closeQueryPanel } from "Support/utils/appBuilder/querymanager/queryPanel";

// Contexts facet — the checkbox across device + data-binding contexts.
// testIsolation:false for cypress-real-dnd; each test re-creates its app.
describe('Text Input — contexts facet', { testIsolation: false }, () => {
    const W = 'textinput1';

    beforeEach(() => {
        cy.apiLogin();
        cy.apiCreateApp(`${fake.companyName}-TextInput-Contexts`);
        cy.openApp();
        cy.dragAndDropWidget('Text Input', 400, 200);
        closeQueryPanel();
    });

    // Device-visibility context matrix: Show on Desktop / Show on Mobile.
    it('device context — show on desktop / mobile toggles visibility', () => {
        verifyLayout(W);
    });

    // Exposed-value context: components.textinput1.value is observable in the
    // app's component tree (default state Off → false). Uses the same
    // inspector-tree navigation proven green in inspector.cy.js.
    it('exposed-value context — value observable in the inspector tree', () => {
        cy.get(commonWidgetSelector.sidebarinspector).click(); // open the left inspector
        cy.hideTooltip();
        openNode('components');
        openAndVerifyNode('textinput1', [
            { key: 'value', type: 'String', value: '""' }, // default '' (empty string)
        ], verifyNodeData);
    });

    afterEach(() => {
        cy.apiDeleteApp();
    });
});

const T = textInputText;
const SEL = textInputSelector;
const moveMouseAway = () => cy.get('body').realHover({ position: 'topLeft' });

// Validation walk: empty → mandatory message, too long → maxLength message, valid → clean.
// componentsSlice.js validateWidget order is regex → minLength → maxLength → … → mandatory.
const expectValidationBehaviour = (W, { valid, tooLong, emptyMessage, tooLongMessage }) => {
    cy.get(SEL.input(W)).clear().blur();
    cy.get(SEL.invalidFeedback(W)).should('have.text', emptyMessage);
    cy.get(SEL.input(W)).should('have.attr', 'aria-invalid', 'true');
    cy.get(SEL.input(W)).type(tooLong).blur();
    cy.get(SEL.invalidFeedback(W)).should('have.text', tooLongMessage);
    cy.get(SEL.input(W)).clear().type(valid).blur();
    // once revealed the feedback node stays mounted, empty, while the value is valid (BaseInput.jsx:303)
    cy.get(SEL.invalidFeedback(W)).should(($el) => expect($el.text()).to.eq(''));
    cy.get(SEL.input(W)).should('have.attr', 'aria-invalid', 'false');
};

// ── TextInput-BRW-003 ────────────────────────────────────────────────────────
// RenderWidget passes currentMode through; the only widget-level branch is Label's viewer-only htmlFor.
// Value, validation and styling must not depend on the mode. The app is seeded through the components API
// so every context reads the same saved definition.
describe('Text Input — contexts facet (editor / viewer parity)', { testIsolation: false }, () => {
    const W = 'textinput1';
    const MAX = 12; // dynamic: maxLength rule
    const value = fake.firstName.slice(0, 10); // dynamic: fake, within maxLength
    const label = fake.lastName.slice(0, 12); // dynamic: fake
    // dynamic: test colours (hex as saved by the colour picker) → computed rgb
    const colours = {
        background: ['#008000', 'rgb(0, 128, 0)'],
        border: ['#ff8000', 'rgb(255, 128, 0)'],
        text: ['#800080', 'rgb(128, 0, 128)'],
        label: ['#0000ff', 'rgb(0, 0, 255)'],
    };
    const radius = 14; // dynamic (default {{6}} — textinput.js:372)

    beforeEach(() => {
        cy.apiLogin();
        cy.apiCreateApp(`${fake.companyName}-TextInput-contexts-${Cypress._.uniqueId()}`);
        addTextInputsViaApi([
            {
                name: W,
                layout: { top: 60, left: 2, width: 16, height: 40 },
                properties: { label: { value: label }, value: { value } }, // source: textinput.js:22 / :35
                validation: { mandatory: { value: '{{true}}' }, maxLength: { value: `{{${MAX}}}` } }, // source: textinput.js:100 / :103
                styles: {
                    backgroundColor: { value: colours.background[0] }, // source: textinput.js:205
                    borderColor: { value: colours.border[0] }, // source: textinput.js:211
                    textColor: { value: colours.text[0] }, // source: textinput.js:223
                    color: { value: colours.label[0] }, // source: textinput.js:117
                    borderRadius: { value: `{{${radius}}}` }, // source: textinput.js:256
                },
            },
        ]);
        cy.then(() => cy.openApp('', Cypress.env('workspaceId'), Cypress.env('appId'), SEL.input(W)));
    });

    afterEach(() => {
        cy.apiLogin(); // the public-app step logs out
        cy.apiDeleteApp();
    });

    it('[TextInput-BRW-003] Editor, preview, released app and public app agree on value, validation and styling', () => {
        const slug = `ti-parity-${Cypress._.uniqueId()}-${Date.now()}`; // dynamic: unique slug

        const expectParity = (context) => {
            cy.log(`parity — ${context}`);
            moveMouseAway();
            cy.get(SEL.input(W)).should('have.value', value).and('have.attr', 'type', 'text');
            cy.get(SEL.label(W)).should('contain.text', label).and('contain.text', '*');
            expectComputedColor(`${SEL.label(W)} p`, 'color', colours.label[1]);
            expectComputedColor(SEL.field(W), 'background-color', colours.background[1]);
            expectComputedColor(SEL.field(W), 'border-top-color', colours.border[1]);
            expectComputedColor(SEL.input(W), 'color', colours.text[1]);
            cy.get(SEL.field(W)).should('have.css', 'border-top-left-radius', `${radius}px`);
            expectValidationBehaviour(W, {
                valid: value,
                tooLong: 'x'.repeat(MAX + 1), // dynamic: one past maxLength
                emptyMessage: T.errorMandatory,
                tooLongMessage: T.errorMaxLength(MAX),
            });
        };

        expectParity('editor canvas');

        cy.openPreview(SEL.input(W));
        expectParity('preview');

        releaseAndMakePublic(slug);
        cy.visit(`/applications/${slug}`);
        cy.get(SEL.input(W), { timeout: 30000 }).should('be.visible');
        expectParity('released app');

        cy.apiLogout();
        cy.clearCookies();
        cy.visit(`/applications/${slug}`);
        cy.get(SEL.input(W), { timeout: 30000 }).should('be.visible');
        expectParity('public app (signed out)');
    });
});

// ── TextInput-BRW-004 ────────────────────────────────────────────────────────
// Fixture = an export of two Text Inputs in their pre-revamp shape (tooljet_version 3.15.1): no widthType
// (814feab911), no legacyInputSize, colour sentinels #1B1F24/#CCD1D5/#fff (9b78959b68), and two Buttons wired
// to the deprecated `disable` / `visibility` actions (f8dcbee6fb). Import backfills widthType 'ofField' and
// legacyInputSize {{true}} (app-import-export.service.ts) — the path a saved app takes.
describe('Text Input — contexts facet (saved pre-revamp app)', { testIsolation: false }, () => {
    const L = T.legacy;

    beforeEach(() => {
        cy.apiLogin();
        importAppFixture(T.legacyFixture, `${fake.companyName}-TextInput-contexts-legacy-${Cypress._.uniqueId()}`);
        cy.then(() => cy.openApp('', Cypress.env('workspaceId'), Cypress.env('appId'), SEL.input('textinput1')));
    });

    afterEach(() => {
        cy.apiDeleteApp();
    });

    const expectLegacyPreserved = (context) => {
        cy.log(`legacy — ${context}`);
        moveMouseAway();
        // value + label. source: textInputPreRevamp.json textinput1 properties
        cy.get(SEL.input('textinput1')).should('have.value', L.value);
        cy.get(SEL.label('textinput1')).should('contain.text', L.label).and('contain.text', '*');
        // side placement, saved width {{40}} → 40 × 0.7 = 28 % of the widget (Of the Field), capped at 70 %
        cy.get(SEL.label('textinput1'))
            .should('have.attr', 'style')
            .and('include', `width: ${L.width * 0.7}%`)
            .and('include', 'max-width: 70%');
        getLabelShare('textinput1').then((share) => {
            expect(share, 'legacy label share').to.be.gt(0).and.lt(L.width / 100);
            expectLabelFieldSplit('textinput1', share, null);
        });
        // top placement: label above the field, box grown by the top-label increment
        cy.get(SEL.input('textinput2')).should('have.value', L.topValue);
        cy.get(SEL.label('textinput2')).should('contain.text', L.topLabel);
        cy.document().should((doc) => {
            const r = (sel) => doc.querySelector(sel).getBoundingClientRect();
            const label = r(SEL.label('textinput2'));
            const field = r(SEL.field('textinput2'));
            const box = r(SEL.draggableWidget('textinput2'));
            expect(label.bottom, 'top label sits above the field').to.be.lte(field.top + 1);
            expect(Math.abs(label.left - field.left), 'label and field share the left edge').to.be.lte(2);
            expect(box.height, 'saved height 40 + top-label increment').to.be.closeTo(40 + T.topAlignmentHeightIncrement, 1.5);
            expect(field.bottom, 'field inside its box').to.be.lte(box.bottom + 1);
        });
        // colour sentinels still fall back to theme tokens (BaseInput.jsx:102-111, 223-243)
        resolveCssVarColor('--surfaces-surface-01', SEL.field('textinput1')).then((rgb) =>
            expectComputedColor(SEL.field('textinput1'), 'background-color', rgb));
        resolveCssVarColor('--borders-default', SEL.field('textinput1')).then((rgb) =>
            expectComputedColor(SEL.field('textinput1'), 'border-top-color', rgb));
        resolveCssVarColor('--text-primary', SEL.field('textinput1')).then((rgb) =>
            expectComputedColor(SEL.input('textinput1'), 'color', rgb));
        // saved validation rules: mandatory + minLength {{5}} + maxLength {{20}}
        cy.get(SEL.input('textinput1')).clear().type('abc').blur(); // dynamic: 3 chars < minLength
        cy.get(SEL.invalidFeedback('textinput1')).should('have.text', T.errorMinLength(L.minLength));
        // empty with a minLength reports the length message first (rule order), then too long, then valid
        expectValidationBehaviour('textinput1', {
            valid: L.value,
            tooLong: 'y'.repeat(L.maxLength + 1), // dynamic: one past maxLength
            emptyMessage: T.errorMinLength(L.minLength),
            tooLongMessage: T.errorMaxLength(L.maxLength),
        });
    };

    it('[TextInput-BRW-004] A saved pre-revamp app keeps its Text Input value, label placement and validation', () => {
        expectLegacyPreserved('editor');
        // Styles panel reports what the import backfilled: deprecated widthType + legacy input size on
        openEditorSidebar('textinput1');
        cy.get(commonWidgetSelector.buttonStylesEditorSideBar).click();
        cy.get('[data-cy="dropdown-common"]').should('contain.text', T.widthTypeOfField);
        cy.get(SEL.legacyInputSizeToggle).should('be.checked');
        cy.forceClickOnCanvas();

        // previewed by app id: the fixture's saved slug is reused across imports, so slug-based preview can
        // resolve to an earlier (deleted) import
        cy.waitForAutoSave();
        openAppInViewer(SEL.input('textinput1'));
        expectLegacyPreserved('preview');
    });

    it('[TextInput-BRW-004] Deprecated disable / visibility action wiring still drives the saved Text Input', () => {
        openAppInViewer(SEL.input('textinput1'));
        cy.get(SEL.input('textinput1')).should('not.be.disabled');
        // button1 → deprecated `disable` {{true}}. source: textInputPreRevamp.json events[0]
        cy.contains(`${SEL.draggableWidget('button1')} button`, L.disableButton).click();
        cy.get(SEL.input('textinput1')).should('be.disabled').and('have.attr', 'aria-disabled', 'true');
        // button2 → deprecated `visibility` {{false}}. source: textInputPreRevamp.json events[1]
        cy.contains(`${SEL.draggableWidget('button2')} button`, L.hideButton).click();
        cy.get(SEL.draggableWidget('textinput1')).should('not.be.visible');
        cy.get(SEL.input('textinput2')).should('be.visible'); // only the targeted input is affected
    });
});
