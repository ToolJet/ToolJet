/**
 * SPEC — Camera — contexts facet.
 * FOR AI: always-on device + exposed-value contexts. Camera has no context scenario in TESTING.md
 * (frontend/ee/test/app-builder/widgets/Camera); its browser scenarios (Camera-BRW-001/003/004) are in userflow.cy.js.
 * The fake camera is installed before the drop (the widget asks for the camera on mount, Camera.jsx:379-456).
 * Helpers: switchLayout, openEditorSidebar, openAccordion, verifyAndModifyToggleFx, openNode, openAndVerifyNode,
 * verifyNodeData, installFakeCamera.
 */
import { fake } from "Fixtures/fake";
import { commonWidgetSelector } from "Selectors/common";
import { commonWidgetText } from "Texts/common";
import { cameraSelector as SEL } from "Selectors/appBuilder/components/camera";
import { cameraText } from "Texts/appBuilder/components/camera";
import { openEditorSidebar, openAccordion, verifyAndModifyToggleFx } from "Support/utils/commonWidget";
import { switchLayout } from "Support/utils/appBuilder/layout";
import { openNode, openAndVerifyNode, verifyNodeData } from "Support/utils/appBuilder/inspector";
import { installFakeCamera } from "Support/utils/appBuilder/components/camera";
import { closeQueryPanel } from "Support/utils/appBuilder/querymanager/queryPanel";

const T = cameraText;
const W = T.defaultWidgetName;

describe('Camera — contexts facet', { testIsolation: false }, () => {
    beforeEach(() => {
        cy.apiLogin();
        cy.apiCreateApp(`${fake.companyName}-Camera-contexts-${Cypress._.uniqueId()}`);
        cy.openApp();
        installFakeCamera();
        cy.dragAndDropWidget(T.displayName, 400, 200);
        closeQueryPanel();
    });

    afterEach(() => {
        cy.apiDeleteApp();
    });

    it('device context — Show on desktop / Show on mobile gate the widget on the matching editor layout', () => {
        const widget = commonWidgetSelector.draggableWidget(W);

        // defaults (camera.js:141-142): on the desktop canvas, absent from the mobile canvas
        cy.get(SEL.captureButton(W)).should('have.attr', 'aria-label', T.aria.capturePhoto);
        switchLayout('mobile');
        cy.get(widget).should('not.exist');
        switchLayout('desktop');
        cy.get(widget).should('exist');

        // desktop off → gone from desktop; mobile on → shown on the mobile canvas only
        openEditorSidebar(W);
        openAccordion(commonWidgetText.accordionLayout);
        verifyAndModifyToggleFx(commonWidgetText.parameterShowOnDesktop, commonWidgetText.codeMirrorLabelTrue);
        cy.get(widget).should('not.exist');
        verifyAndModifyToggleFx(commonWidgetText.parameterShowOnMobile, commonWidgetText.codeMirrorLabelFalse);
        cy.waitForAutoSave();
        switchLayout('mobile');
        cy.get(widget).should('be.visible');
        cy.get(SEL.captureButton(W)).should('have.attr', 'aria-label', T.aria.capturePhoto); // camera.js:145 image mode
        switchLayout('desktop');
        cy.get(widget).should('not.exist');
    });

    it('exposed-value context — initial state observable in the inspector tree', () => {
        cy.get(commonWidgetSelector.sidebarinspector).click();
        cy.hideTooltip();
        openNode('components');
        openAndVerifyNode(W, [
            { key: 'isVisible', type: 'Boolean', value: 'true' }, // camera.js:114
            { key: 'isDisabled', type: 'Boolean', value: 'false' }, // camera.js:115
            { key: 'imageDataURL', type: 'Null', value: 'null' }, // camera.js:116
            { key: 'videoDataURL', type: 'Null', value: 'null' }, // camera.js:117
        ], verifyNodeData);
    });
});
