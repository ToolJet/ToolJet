/**
 * SPEC — Modal (ModalV2) — contexts facet.
 * FOR AI: always-on device and exposed-value contexts (no TESTING.md browser scenario is context-owned for ModalV2):
 *   - inspector Show on desktop / Show on mobile toggles gate the Modal per editor layout, independently of the
 *     trigger visibility;
 *   - saved device × trigger-visibility flags give the same result in the editor and the preview on desktop and mobile;
 *   - the exposed `show` reaches a bound Text, and the modal's children render only while it is open, in editor
 *     and viewer; before the first open a binding that reads only the Modal is blank (product bug — that test stays red).
 * Device gate: WidgetWrapper — a widget whose others.showOn<Layout> is false is not rendered at all. Trigger
 * visibility off: ModalV2.jsx:306 renders no trigger button (`useDefaultButton && isVisible`) while the widget box
 * stays. The viewer picks mobile with ?layout=mobile.
 * Helpers: switchLayout, openEditorSidebar, openAccordion, verifyAndModifyToggleFx, addModalsViaApi,
 * openModalAppInViewer, openModal, collapseQueryPanel, useMainCanvasForCanvasCommands.
 */
import { fake } from "Fixtures/fake";
import { commonWidgetSelector } from "Selectors/common";
import { commonWidgetText } from "Texts/common";
import { modalV2Selector as S } from "Selectors/appBuilder/components/modalV2";
import { modalV2Text as T } from "Texts/appBuilder/components/modalV2";
import { openEditorSidebar, openAccordion, verifyAndModifyToggleFx } from "Support/utils/commonWidget";
import { switchLayout } from "Support/utils/appBuilder/layout";
import { useMainCanvasForCanvasCommands } from "Support/utils/appBuilder/components/tabs";
import { addModalsViaApi, openModalAppInViewer, openModal, collapseQueryPanel } from "Support/utils/appBuilder/components/modalV2";

const W = T.defaultWidgetName;
const OFF = { value: '{{false}}' }; // modalV2.js:398-399 toggle values
const ON = { value: '{{true}}' };

// shown = trigger button rendered with its label; hidden = widget box rendered, no trigger; absent = not rendered
const expectState = (name, state, label, context) => {
    const tag = `${name} (${context})`;
    if (state === 'absent') {
        cy.get(commonWidgetSelector.draggableWidget(name)).should('not.exist');
        return;
    }
    cy.get(commonWidgetSelector.draggableWidget(name)).should('exist');
    if (state === 'shown') {
        cy.get(S.launchButton(name)).should(($b) => {
            expect($b.text(), `${tag}: trigger label`).to.eq(label);
            const r = $b[0].getBoundingClientRect();
            expect(r.width > 0 && r.height > 0, `${tag}: trigger laid out`).to.eq(true);
        });
    } else {
        cy.get(S.launchButton(name)).should('not.exist');
    }
};

const DEVICE_MODALS = [
    { name: 'desktoponly', others: {} }, // defaults: desktop on, mobile off (modalV2.js:398-399)
    { name: 'mobileonly', others: { showOnDesktop: OFF, showOnMobile: ON } },
    { name: 'bothdevices', others: { showOnMobile: ON } },
    { name: 'nodevice', others: { showOnDesktop: OFF } },
    { name: 'hiddenboth', others: { showOnMobile: ON }, properties: { visibility: OFF } }, // modalV2.js:404
];
const EXPECTED = {
    desktop: { desktoponly: 'shown', mobileonly: 'absent', bothdevices: 'shown', nodevice: 'absent', hiddenboth: 'hidden' },
    mobile: { desktoponly: 'absent', mobileonly: 'shown', bothdevices: 'shown', nodevice: 'absent', hiddenboth: 'hidden' },
};

// sub-canvases of an open modal also carry data-cy="real-canvas": point the shared canvas commands at the main one
useMainCanvasForCanvasCommands();

describe('Modal (ModalV2) — contexts facet', { testIsolation: false }, () => {
    describe('dropped widget', () => {
        beforeEach(() => {
            cy.apiLogin();
            cy.apiCreateApp(`${fake.companyName}-ModalV2-contexts-${Cypress._.uniqueId()}`);
            cy.openApp();
            cy.dragAndDropWidget(T.displayName, 400, 100);
            collapseQueryPanel();
        });

        afterEach(() => {
            cy.apiDeleteApp();
        });

        it('Show on desktop / Show on mobile toggles gate the Modal on the matching editor layout, independently of the trigger visibility', () => {
            const widget = commonWidgetSelector.draggableWidget(W);
            expectState(W, 'shown', T.defaultTriggerLabel, 'default');
            switchLayout('mobile');
            cy.get(widget).should('not.exist');
            switchLayout('desktop');
            expectState(W, 'shown', T.defaultTriggerLabel, 'back on desktop');

            openEditorSidebar(W);
            verifyAndModifyToggleFx(T.labelTriggerVisibility, commonWidgetText.codeMirrorLabelTrue);
            expectState(W, 'hidden', T.defaultTriggerLabel, 'trigger visibility off');
            verifyAndModifyToggleFx(T.labelTriggerVisibility, commonWidgetText.codeMirrorLabelFalse);
            expectState(W, 'shown', T.defaultTriggerLabel, 'trigger visibility back on');

            openAccordion(commonWidgetText.accordionLayout);
            verifyAndModifyToggleFx(commonWidgetText.parameterShowOnDesktop, commonWidgetText.codeMirrorLabelTrue);
            cy.get(widget).should('not.exist');
            verifyAndModifyToggleFx(commonWidgetText.parameterShowOnMobile, commonWidgetText.codeMirrorLabelFalse);
            cy.waitForAutoSave();
            switchLayout('mobile');
            expectState(W, 'shown', T.defaultTriggerLabel, 'mobile canvas');
            switchLayout('desktop');
            cy.get(widget).should('not.exist');
        });
    });

    describe('seeded apps', () => {
        beforeEach(() => {
            cy.apiLogin();
            cy.apiCreateApp(`${fake.companyName}-ModalV2-contexts-${Cypress._.uniqueId()}`);
        });

        afterEach(() => {
            cy.apiLogin();
            cy.apiDeleteApp();
        });

        it('Saved device and trigger-visibility flags give the same result in the editor and the preview on desktop and mobile', () => {
            const label = fake.firstName.slice(0, 8) || 'Open';
            addModalsViaApi(
                DEVICE_MODALS.map(({ name, others, properties }, i) => ({
                    name,
                    others,
                    properties: { triggerButtonLabel: { value: label }, ...properties },
                    layout: { top: 30 + i * 60, left: 2, width: 10 }, // dynamic: stacked slots
                }))
            );
            const expectDeviceSet = (layout, context) => {
                cy.get(S.launchButton('bothdevices'), { timeout: 30000 }).should('be.visible');
                Object.entries(EXPECTED[layout]).forEach(([name, state]) => expectState(name, state, label, `${context} ${layout}`));
            };

            cy.openApp('', undefined, undefined, S.launchButton('bothdevices'));
            expectDeviceSet('desktop', 'editor canvas');
            switchLayout('mobile');
            expectDeviceSet('mobile', 'editor canvas');
            switchLayout('desktop');

            openModalAppInViewer(null);
            expectDeviceSet('desktop', 'preview');
            openModalAppInViewer(null, { query: '&layout=mobile' });
            expectDeviceSet('mobile', 'preview');
        });

        const M = crypto.randomUUID();
        const inside = fake.lastName.slice(0, 8) || 'inside';
        const seedShowApp = () =>
            addModalsViaApi([
                { id: M, name: 'dlg', layout: { top: 30, left: 2, width: 8 } },
                { type: 'Text', name: 'inside', parent: M, layout: { top: 10, left: 1, width: 20, height: 40 }, properties: { text: { value: inside } } },
                {
                    type: 'Text',
                    name: 'probe',
                    layout: { top: 100, left: 2, width: 14, height: 40 },
                    properties: { text: { value: '{{"show:" + components.dlg.show}}' } }, // modalV2.js:360 exposed show
                },
            ]);
        const expectProbe = (open, where) =>
            cy.get(commonWidgetSelector.draggableWidget('probe')).should(($el) =>
                expect($el.text().trim(), `exposed show (${where})`).to.eq(`show:${open}`)
            );
        const expectOpen = (open, where) => {
            expectProbe(open, where);
            if (open) cy.get(commonWidgetSelector.draggableWidget('inside')).should('be.visible').and('contain.text', inside);
            else cy.get(commonWidgetSelector.draggableWidget('inside')).should('not.exist');
        };

        it('The exposed show follows opening and closing in a bound Text and the modal children render only while it is open, in the editor and the viewer', () => {
            seedShowApp();
            const run = (where) => {
                cy.get(commonWidgetSelector.draggableWidget('inside')).should('not.exist'); // closed on mount
                openModal('dlg', M);
                expectOpen(true, `${where}, opened`);
                cy.get(S.closeButton(M)).realClick();
                cy.get(S.content(M)).should('not.exist');
                expectOpen(false, `${where}, closed`);
                openModal('dlg', M);
                expectOpen(true, `${where}, reopened`);
                cy.realPress('Escape');
                cy.get(S.content(M)).should('not.exist');
                expectOpen(false, `${where}, closed with Escape`);
            };

            cy.openApp('', undefined, undefined, S.launchButton('dlg'));
            collapseQueryPanel();
            run('editor');
            openModalAppInViewer(S.launchButton('dlg'));
            run('viewer');
        });

        it('A binding to the exposed show reads false before the modal is first opened, in the editor and the viewer', () => {
            // PRODUCT BUG (stays red): a binding that reads only the Modal is blank on load (`alone`) — even for values
            // ModalV2 sets on mount, e.g. isVisible — same symptom as the Timeline exposed-value finding. Control
            // (`mixed`): the same expression that also reads another widget resolves to show:false (modalV2.js:360), so
            // the value exists and only the Modal-only binding stays blank (root cause not traced here).
            seedShowApp();
            addModalsViaApi([
                { type: 'TextInput', name: 'anchor', layout: { top: 160, left: 2, width: 10, height: 40 } },
                {
                    type: 'Text',
                    name: 'mixed',
                    layout: { top: 220, left: 2, width: 14, height: 40 },
                    properties: { text: { value: '{{"show:" + components.dlg.show + "|" + components.anchor.isVisible}}' } },
                },
            ]);
            const expectOnLoad = (where) =>
                cy.get(commonWidgetSelector.draggableWidget('mixed')).should(($mixed) => {
                    const alone = $mixed[0].ownerDocument.querySelector(commonWidgetSelector.draggableWidget('probe'));
                    expect(
                        { alone: alone.textContent.trim(), mixed: $mixed.text().trim() },
                        `exposed show before the first open (${where})`
                    ).to.deep.eq({ alone: 'show:false', mixed: 'show:false|true' });
                });
            cy.openApp('', undefined, undefined, commonWidgetSelector.draggableWidget('anchor'));
            expectOnLoad('editor');
            openModalAppInViewer(commonWidgetSelector.draggableWidget('anchor'));
            expectOnLoad('viewer');
        });
    });
});
