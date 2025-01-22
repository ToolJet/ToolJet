import { fake } from "Fixtures/fake";
import { textInputText } from "Texts/textInput";
import { commonWidgetText, widgetValue, customValidation } from "Texts/common";
import { commonSelectors, commonWidgetSelector } from "Selectors/common";
import { multipageSelector } from "Selectors/multipage";
import { buttonText } from "Texts/button";
import {
    verifyControlComponentAction,
    randomString,
} from "Support/utils/editor/textInput";
import {
    openAccordion,
    verifyAndModifyParameter,
    openEditorSidebar,
    verifyAndModifyToggleFx,
    addDefaultEventHandler,
    verifyComponentValueFromInspector,
    selectColourFromColourPicker,
    verifyBoxShadowCss,
    verifyLayout,
    verifyTooltip,
    editAndVerifyWidgetName,
    verifyPropertiesGeneralAccordion,
    verifyStylesGeneralAccordion,
    randomNumber,
    closeAccordions,
} from "Support/utils/commonWidget";
import { dataCsvAssertionHelper } from "Support/utils/table";
import {
    selectCSA,
    selectEvent,
    addSupportCSAData,
} from "Support/utils/events";

import {
    selectQueryFromLandingPage,
    deleteQuery,
    query,
    changeQueryToggles,
    renameQueryFromEditor,
    addInputOnQueryField,
} from "Support/utils/queries";

import {
    verifyCouldnotConnectWithAlert,
    resizeQueryPanel,
    verifypreview,
    addInput,
} from "Support/utils/dataSource";
import {
    hideOrUnhidePageMenu,
    addEventHandler,
    addNewPage,
    setHomePage,
    hideOrUnhidePage,
    detetePage,
    modifyPageHandle,
    clearSearch,
    searchPage,
} from "Support/utils/multipage";
import { verifyNodeData, openNode, verifyValue } from "Support/utils/inspector";
import { deleteDownloadsFolder } from "Support/utils/common";

describe("Global Actions", () => {
    beforeEach(() => {
        cy.apiLogin();
        cy.apiCreateApp(`${fake.companyName}-gloabalActions-App`);
        cy.openApp();
        cy.viewport(1800, 1800);
        cy.dragAndDropWidget("Button");
        resizeQueryPanel("80");
        deleteDownloadsFolder();
    });

    it("should verify actions", () => {
        const data = {};
        data.customText = randomString(12);

        selectQueryFromLandingPage("runjs", "JavaScript");
        addInputOnQueryField(
            "runjs",
            `setTimeout(() => {
        actions.setVariable('var', 'test');
      actions.setPageVariable('pageVar', 'pageTest');
    }, [0]) `
        );
        query("run");
        cy.get(commonWidgetSelector.sidebarinspector).click();
        cy.get(".tooltip-inner").invoke("hide");
        verifyNodeData("variables", "Object", "1 entry ");
        openNode("variables", 0);

        verifyValue("var", "String", `"test"`);

        openNode("page");
        openNode("variables", 1);
        verifyValue("pageVar", "String", `"pageTest"`);

        addInputOnQueryField(
            "runjs",
            `setTimeout(() => {
              actions.unSetVariable('var');
            actions.unsetPageVariable('pageVar');
          }, [0]) `
        );
        query("run");
        cy.get(commonWidgetSelector.sidebarinspector).click();
        cy.get(".tooltip-inner").invoke("hide");
        verifyNodeData("variables", "Object", "0 entry ");

        openNode("page");
        openNode("variables", 1);
        verifyNodeData("variables", "Object", "0 entry ", 1);

        addInputOnQueryField(
            "runjs",
            "actions.showAlert('success', 'alert from runjs');"
        );
        query("run");

        cy.verifyToastMessage(commonSelectors.toastMessage, "alert from runjs");
        cy.get(multipageSelector.sidebarPageButton).click();
        addNewPage("test_page");
        cy.url().should("contain", "/test-page");

        addInputOnQueryField("runjs", "actions.switchPage('home');");
        query("run");
        cy.url().should("contain", "/home");

        cy.get('[data-cy="real-canvas"]').click("topRight", { force: true });
        cy.dragAndDropWidget("Modal", 200, 300);
        cy.waitForAutoSave();
        addInputOnQueryField("runjs", "actions.showModal('modal1');");
        query("run");
        cy.get('[data-cy="modal-title"]').should("be.visible");

        addInputOnQueryField("runjs", "actions.closeModal('modal1');");
        query("run");
        cy.wait(200);
        cy.notVisible('[data-cy="modal-title"]');

        addInputOnQueryField(
            "runjs",
            "actions.copyToClipboard('data from runjs');"
        );
        query("run");

        cy.window().then((win) => {
            win.navigator.clipboard.readText().then((text) => {
                expect(text).to.eq("data from runjs");
            });
        });
        addInputOnQueryField(
            "runjs",
            "actions.setLocalStorage('localStorage','data from runjs');"
        );
        query("run");

        cy.getAllLocalStorage().then((result) => {
            expect(result[Cypress.config().baseUrl].localStorage).to.deep.equal(
                "data from runjs"
            );
        });

        addInputOnQueryField(
            "runjs",
            "actions.generateFile('runjscsv', 'csv', [{ name: 'John', email: 'john@tooljet.com' }])"
        );
        query("run");

        cy.readFile("cypress/downloads/runjscsv.csv", "utf-8")
            .should("contain", "name,email")
            .and("contain", "John,john@tooljet.com");

        // addInputOnQueryField(
        //   "runjs",
        //   "actions.goToApp('111234')"
        // );
        // query("run");

        addInputOnQueryField("runjs", "actions.logout()");
        query("run");
        cy.get('[data-cy="sign-in-header"]').should("be.visible");
    });

});
