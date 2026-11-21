/**
 * SPEC — JSON Editor — properties facet (browser-only scenarios).
 * FOR AI: TESTING.md browser scenario (frontend/ee/test/app-builder/widgets/JSONEditor):
 *   JSONEditor-BRW-004 — a disabled JSON Editor is dimmed, cannot be clicked into, and the keyboard cannot reach it
 *                        either — through the Disable property (bound, so it flips both ways in one running app) and
 *                        through the setDisable CSA.
 * Mouse/visual block: RenderWidget adds `disabled` to `.canvas-component` (RenderWidget.jsx:160-165,330-334) and
 * theme.scss:3851-3854 gives it pointer-events:none + opacity 0.5. Keyboard block: D-01 —
 * editable={!exposedVariablesTemporaryState.isDisabled} (JSONEditor.jsx:328) turns off contenteditable.
 * Helpers: addJsonWidgetsViaApi, jsonEditorMetrics, readJsonEditorMetrics, openLinkAppInViewer, tabFrom, csaEvent.
 */
import { fake } from "Fixtures/fake";
import { jsonEditorSelector as SEL } from "Selectors/appBuilder/components/jsonEditor";
import { jsonEditorText } from "Texts/appBuilder/components/jsonEditor";
import { openLinkAppInViewer } from "Support/utils/appBuilder/components/link";
import { tabFrom } from "Support/utils/appBuilder/components/html";
import { csaEvent } from "Support/utils/appBuilder/components/dateTimeCommon";
import { addJsonWidgetsViaApi, jsonEditorMetrics, readJsonEditorMetrics } from "Support/utils/appBuilder/components/jsonEditor";

const T = jsonEditorText;
const D = T.disabled;

// all symptoms of one state in one object, so a regression reports every broken facet at once
const stateOf = (m, doc) => {
    const hit = doc.elementFromPoint(m.widget.left + m.widget.width / 2, m.widget.top + m.widget.height / 2);
    const widget = doc.querySelector(SEL.draggableWidget(m.name));
    return {
        disabledClass: m.widgetClass.split(/\s+/).includes(D.className),
        opacity: m.widgetOpacity,
        pointerEvents: m.widgetPointerEvents,
        pointerReaches: !!hit && widget.contains(hit),
        contentEditable: m.content.editable,
    };
};
const ENABLED = { disabledClass: false, opacity: '1', pointerEvents: 'auto', pointerReaches: true, contentEditable: 'true' };
const DISABLED = { disabledClass: true, opacity: D.opacity, pointerEvents: D.pointerEvents, pointerReaches: false, contentEditable: 'false' }; // source: theme.scss:3852-3853

const expectState = (name, expected, label) =>
    cy.document().then((doc) =>
        jsonEditorMetrics(name, (m) => expect(stateOf({ ...m, name }, doc), `${name} ${label}`).to.deep.eq(expected)));

// a real click into the middle of the editor followed by real typing — must not change a disabled document
const clickAndType = (name, word) => {
    cy.get(SEL.draggableWidget(name)).realClick({ scrollBehavior: false });
    cy.realType(word);
};

describe('JSON Editor — properties facet', { testIsolation: false }, () => {
    beforeEach(() => {
        cy.apiLogin();
        cy.apiCreateApp(`${fake.companyName}-JSONEditor-properties-${Cypress._.uniqueId()}`);
    });

    afterEach(() => {
        cy.apiDeleteApp();
    });

    // ── JSONEditor-BRW-004 ───────────────────────────────────────────────────
    it('[JSONEditor-BRW-004] A disabled JSON Editor is dimmed, blocks the pointer and is skipped by the keyboard (Disable property and setDisable)', () => {
        const lockWord = fake.firstName.toLowerCase().replace(/\W/g, '').slice(0, 8) || 'lock'; // dynamic
        const typed = 'zq'; // dynamic: two keys that would visibly change the document
        // tab order follows the canvas order (top → bottom): before → byprop → middle → bycsa → after → lock → btn
        addJsonWidgetsViaApi([
            { type: 'TextInput', name: 'before', layout: { top: 20, left: 2, width: 10, height: 40 } },
            {
                name: 'byprop',
                layout: { top: 80, left: 2, width: 12, height: 120 },
                properties: { value: { value: '{{{ a: 1 }}}' }, disabledState: { value: `{{components.lock.value === "${lockWord}"}}` } },
            },
            { type: 'TextInput', name: 'middle', layout: { top: 220, left: 2, width: 10, height: 40 } },
            { name: 'bycsa', layout: { top: 280, left: 2, width: 12, height: 120 }, properties: { value: { value: '{{{ b: 2 }}}' } } },
            { type: 'TextInput', name: 'after', layout: { top: 420, left: 2, width: 10, height: 40 } },
            { type: 'TextInput', name: 'lock', layout: { top: 480, left: 2, width: 10, height: 40 } },
            {
                type: 'Button',
                name: 'disablebtn',
                layout: { top: 540, left: 2, width: 6, height: 40 },
                properties: { text: { value: 'Disable' } },
                events: [csaEvent('onClick', 'bycsa', 'setDisable', [{ handle: 'disable', value: '{{true}}' }])], // jsonEditor.js:166-169
            },
        ]);
        openLinkAppInViewer(SEL.content('bycsa'));

        // enabled baseline — the checks below are only meaningful because each one passes here first
        expectState('byprop', ENABLED, 'enabled');
        expectState('bycsa', ENABLED, 'enabled');
        tabFrom(SEL.textInput('before'), 1).should('deep.equal', ['byprop']);
        tabFrom(SEL.textInput('middle'), 1).should('deep.equal', ['bycsa']);
        readJsonEditorMetrics('byprop').then((m0) => {
            clickAndType('byprop', typed);
            jsonEditorMetrics('byprop', (m) => expect(m.content.text, 'enabled: typing edits').to.not.eq(m0.content.text));
        });

        // Disable property (bound): dimmed, pointer passes through, contenteditable off, Tab skips it
        cy.get(SEL.textInput('lock')).type(lockWord);
        expectState('byprop', DISABLED, 'disabled by property');
        tabFrom(SEL.textInput('before'), 1).should('deep.equal', ['middle']);
        readJsonEditorMetrics('byprop').then((m0) => {
            clickAndType('byprop', typed);
            cy.get(SEL.content('byprop')).should(($c) => expect($c.text(), 'disabled: click + typing changed nothing').to.eq(m0.content.text));
            cy.document().should((doc) => {
                const w = doc.querySelector(SEL.draggableWidget('byprop'));
                expect(w.contains(doc.activeElement), 'disabled: focus not inside the editor').to.eq(false);
            });
        });

        // …and both ways: clearing the bound value re-enables it in the same running app
        cy.get(SEL.textInput('lock')).clear();
        expectState('byprop', ENABLED, 're-enabled');
        tabFrom(SEL.textInput('before'), 1).should('deep.equal', ['byprop']);

        // setDisable CSA: the same inert state through the exposed isDisabled route
        cy.get(`[data-cy="draggable-widget-disablebtn"] button`).click();
        expectState('bycsa', DISABLED, 'disabled by setDisable');
        tabFrom(SEL.textInput('middle'), 1).should('deep.equal', ['after']);
        readJsonEditorMetrics('bycsa').then((m0) => {
            clickAndType('bycsa', typed);
            cy.get(SEL.content('bycsa')).should(($c) => expect($c.text(), 'setDisable: click + typing changed nothing').to.eq(m0.content.text));
        });
    });
});
