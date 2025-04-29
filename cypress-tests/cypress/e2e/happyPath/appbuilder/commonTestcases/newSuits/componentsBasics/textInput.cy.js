import { fake } from "Fixtures/fake";
import { commonSelectors, commonWidgetSelector } from "Selectors/common";
import {
    addCSA,
    verifyCSA
} from "Support/utils/editor/textInput";
import { addMultiEventsWithAlert } from "Support/utils/events";
import { openAndVerifyNode, openNode, verifyfunctions, verifyNodes, verifyValue } from "Support/utils/inspector";


describe('Text Input Component Tests', () => {
    const functions = [

        {
            "key": "setText",
            "type": "Function"
        },
        {
            "key": "clear",
            "type": "Function"
        },
        {
            "key": "setFocus",
            "type": "Function"
        },
        {
            "key": "setBlur",
            "type": "Function"
        },
        {
            "key": "disable",
            "type": "Function"
        },
        {
            "key": "visibility",
            "type": "Function"
        },
        {
            "key": "setVisibility",
            "type": "Function"
        },
        {
            "key": "setDisable",
            "type": "Function"
        },
        {
            "key": "setLoading",
            "type": "Function"
        }
    ]
    const exposedValues = [{
        "key": "value",
        "type": "String",
        "value": "\"\""
    },
    {
        "key": "isMandatory",
        "type": "Boolean",
        "value": "false"
    },
    {
        "key": "isVisible",
        "type": "Boolean",
        "value": "true"
    },
    {
        "key": "isDisabled",
        "type": "Boolean",
        "value": "false"
    },
    {
        "key": "isLoading",
        "type": "Boolean",
        "value": "false"
    },
    {
        "key": "label",
        "type": "String",
        "value": "\"Label\""
    },
    {
        "key": "isValid",
        "type": "Boolean",
        "value": "true"
    },
        // {
        //     "key": "id",
        //     "type": "String",
        //     "value": "\"d9f805c-a8d9-4c5a-ad09-badd6c2216ba\""
        // }
    ]

    beforeEach(() => {
        cy.apiLogin();
        cy.apiCreateApp(`${fake.companyName}-Textinput-App`);
        cy.openApp();
        cy.dragAndDropWidget("Text Input", 50, 50);
        cy.get('[data-cy="query-manager-toggle-button"]').click();
    });

    it.skip('should verify all the exposed values on inspector', () => {
        cy.get(commonWidgetSelector.sidebarinspector).click();
        cy.get(".tooltip-inner").invoke("hide");

        openNode("components");
        openAndVerifyNode("textinput1", exposedValues, verifyValue);
        verifyNodes(functions, verifyfunctions);
        //id is pending

    });

    it.skip('should verify all the events from the text input', () => {
        const events = [
            { event: "On Focus", message: "On Focus Event" },
            { event: "On Blur", message: "On Blur Event" },
            { event: "On Change", message: "On Change Event" },
            { event: "On Enter", message: "On Enter Event" }
        ];

        addMultiEventsWithAlert(events);
        const textInputSelector = '[data-cy="draggable-widget-textinput1"]';

        const verifyTextInputEvents = (selector) => {
            cy.get(selector).click();
            cy.verifyToastMessage(commonSelectors.toastMessage, 'On Focus Event', false);

            cy.get(selector).type('r');
            cy.verifyToastMessage(commonSelectors.toastMessage, 'On Change Event', false);

            cy.get(selector).type('{enter}');
            cy.verifyToastMessage(commonSelectors.toastMessage, 'On Enter Event', false);

            cy.forceClickOnCanvas();
            cy.verifyToastMessage(commonSelectors.toastMessage, 'On Blur Event', false);
        };

        verifyTextInputEvents(textInputSelector);
    });

    it.skip('should verify all the CSA from text input', () => {
        const actions = [
            { event: "On click", action: "Set visibility", valueToggle: "{{false}}" }, //b1
            { event: "On click", action: "Visibility", valueToggle: "{{true}}" },//b2
            { event: "On click", action: "Disable", valueToggle: "{{true}}" },//b3
            { event: "On click", action: "Set disable", valueToggle: "{{false}}" },//b4
            { event: "On click", action: "Set text", value: "1199999" },//b5
            { event: "On click", action: "Clear" },//b6
            { event: "On click", action: "Set focus" },//b7
            { event: "On click", action: "Set blur" },//b8
            { event: "On click", action: "Set loading", valueToggle: "{{true}}" },//b9
        ];
        addCSA("textinput1", actions);
        verifyCSA('textinput1');
    });

    // afterEach(() => {
    //     cy.apiDeleteApp();
    // });

});