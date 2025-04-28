import { fake } from "Fixtures/fake";
import { commonSelectors, commonWidgetSelector } from "Selectors/common";
import {
    addCSA,
    verifyCSA
} from "Support/utils/editor/textInput";
import { addMultiEventsWithAlert } from "Support/utils/events";
import { openAndVerifyNode, openNode, verifyfunctions, verifyNodes, verifyValue } from "Support/utils/inspector";


describe('Dropdown Component Tests', () => {
    const functions = [

        {
            "key": "clear",
            "type": "Function"
        },
        {
            "key": "selectOption",
            "type": "Function"
        }, ,
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
        },
        {
            "key": "selectedOption",
            "type": "Object"
        },
        {
            "key": "options",
            "type": "Array"
        },
    ]
    const exposedValues = [{
        "key": "searchText",
        "type": "String",
        "value": "\"\""
    },
    {
        "key": "label",
        "type": "String",
        "value": "\"Select\""
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
        "key": "isMandatory",
        "type": "Boolean",
        "value": "false"
    },
    {
        "key": "isLoading",
        "type": "Boolean",
        "value": "false"
    },
    {
        "key": "isValid",
        "type": "Boolean",
        "value": "true"
    },
    {
        "key": "value",
        "type": "String",
        "value": "2"
    }

        // {
        //     "key": "id",
        //     "type": "String",
        //     "value": "\"d9f805c-a8d9-4c5a-ad09-badd6c2216ba\""
        // }
    ]

    beforeEach(() => {
        cy.apiLogin();
        cy.apiCreateApp(`${fake.companyName}-Dropdown-App`);
        cy.openApp();
        cy.dragAndDropWidget("Dropdown", 50, 50);
        cy.get('[data-cy="query-manager-toggle-button"]').click();
    });

    it('should verify all the exposed values on inspector', () => {
        cy.get(commonWidgetSelector.sidebarinspector).click();
        cy.get(".tooltip-inner").invoke("hide");

        openNode("components");
        openAndVerifyNode("dropdown1", exposedValues, verifyValue);
        verifyNodes(functions, verifyfunctions);
        //id is pending

    });

    it('should verify all the events from the dropdown', () => {
        const events = [
            { event: "On Focus", message: "On Focus Event" },
            { event: "On Blur", message: "On Blur Event" },
            { event: "On select", message: "On select Event" },
            { event: "On search text changes", message: "On search Event" }
        ];


        addMultiEventsWithAlert(events, false);
        const textInputSelector = '[data-cy="draggable-widget-dropdown1"]';

        const verifyTextInputEvents = (selector) => {
            cy.get(selector).click();
            cy.verifyToastMessage(commonSelectors.toastMessage, 'On Focus Event', false);

            // cy.get(selector).type('r');
            // cy.verifyToastMessage(commonSelectors.toastMessage, 'On Change Event', false);

            // cy.get(selector).type('{enter}');
            // cy.verifyToastMessage(commonSelectors.toastMessage, 'On Enter Event', false);

            cy.forceClickOnCanvas();
            cy.verifyToastMessage(commonSelectors.toastMessage, 'On Blur Event', false);
        };

        verifyTextInputEvents(textInputSelector);
    });

    it('should verify all the CSA from dropdown', () => {
        const events = [
            { event: "On Change", message: "On Change Event" },
        ];

        addMultiEventsWithAlert(events, false);
        const actions = [
            { event: "On click", action: "Set visibility", valueToggle: "{{false}}" }, //b2
            { event: "On click", action: "Set visibility", valueToggle: "{{true}}" },//b3
            { event: "On click", action: "Set disable", valueToggle: "{{true}}" },//b4
            { event: "On click", action: "Set disable", valueToggle: "{{false}}" },//b5
            { event: "On click", action: "Set value", value: "true" },//b6
            { event: "On click", action: "Toggle" },//b7
            { event: "On click", action: "Set loading", valueToggle: "{{true}}" },//b8
            { event: "On click", action: "Set loading", valueToggle: "{{false}}" },//b9

        ];
        addCSA("dropdown1", actions);
        let component = "dropdown1";
        cy.get(commonWidgetSelector.draggableWidget("button1")).click();
        cy.get(commonWidgetSelector.draggableWidget(component)).should("not.be.visible");

        cy.get(commonWidgetSelector.draggableWidget("button2")).click();
        cy.get(commonWidgetSelector.draggableWidget(component)).should("be.visible");

        cy.get(commonWidgetSelector.draggableWidget("button3")).click();
        cy.get(commonWidgetSelector.draggableWidget(component)).should("have.attr", "data-disabled", 'true');

        cy.get(commonWidgetSelector.draggableWidget("button4")).click();
        cy.get(commonWidgetSelector.draggableWidget(component)).should("have.attr", "data-disabled", 'false');

        cy.get(commonWidgetSelector.draggableWidget("button5")).click();
        cy.get(commonWidgetSelector.draggableWidget(component)).should("have.text", "New Button Text");

        cy.get(commonWidgetSelector.draggableWidget("button6")).click();
        cy.verifyToastMessage(commonSelectors.toastMessage, 'On Click Event', false);

        cy.get(commonWidgetSelector.draggableWidget("button7")).click();
        cy.get(commonWidgetSelector.draggableWidget(component))
            .parent()
            .within(() => {
                cy.get(".tj-widget-loader").should("be.visible");
            });

        cy.get(commonWidgetSelector.draggableWidget("button9")).click();
        cy.notVisible(".tj-widget-loader");

    });

    // afterEach(() => {
    //     cy.apiDeleteApp();
    // });

});