import { fake } from "Fixtures/fake";

import { commonSelectors, commonWidgetSelector } from "Selectors/common";

import {
    addCSA,
    verifyCSA
} from "Support/utils/editor/textInput";

import { addMultiEventsWithAlert } from "Support/utils/events";
import { openAndVerifyNode, openNode, verifyfunctions, verifyNodes, verifyNodeData } from "Support/utils/inspector";

describe('Button Component Tests', () => {
    const functions = [

        {
            "key": "setText",
            "type": "Function"
        },
        {
            "key": "click",
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
            "key": "loading",
            "type": "Function"
        },
        {
            "key": "setLoading",
            "type": "Function"
        }
    ]
    const exposedValues = [{
        "key": "buttonText",
        "type": "String",
        "value": "\"Button\""
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
        // {
        //     "key": "id",
        //     "type": "String",
        //     "value": "\"d9f805c-a8d9-4c5a-ad09-badd6c2216ba\""
        // }
    ]

    beforeEach(() => {
        // cy.apiLogin();
        // cy.apiCreateApp(`${fake.companyName}-Button-App`);
        // cy.openApp();
        // cy.dragAndDropWidget("Button", 500, 500);
        // cy.get('[data-cy="query-manager-toggle-button"]').click();
    });

    it('should verify all the exposed values on inspector', () => {
        cy.loginByGoogleApi()
        cy.pause()
        cy.get(commonWidgetSelector.sidebarinspector).click();
        cy.get(".tooltip-inner").invoke("hide");
        cy.mhGetAllMails().then((emails) => {
            // Log the emails to the Cypress console
            cy.log(emails);
        });


        cy.pause();
        // openNode("components");
        // openAndVerifyNode("button1", exposedValues, verifyNodeData);
        // verifyNodes(functions, verifyNodeData);
        //id is pending

    });
    it.only('logs in via the full GitHub SSO flow (Cypress-only)', () => {
        const githubUsername = Cypress.env('GITHUB_USERNAME');
        const githubPassword = Cypress.env('GITHUB_PASSWORD');

        // Start at your app first to establish localhost as the top origin
        cy.visit('http://localhost:8082');
        cy.get('[data-cy="git-sso-button"]').click();
        cy.pause()
        // 1. Click the GitHub SSO button instead of visiting OAuth URL directly



        // 2. Enter GitHub credentials - now we need cy.origin since we're going from localhost to github
        // cy.origin('https://github.com', { args: { githubUsername, githubPassword } }, ({ githubUsername, githubPassword }) => {

        cy.pause()
        cy.get('input[name="login"]', { timeout: 15000 }).type(githubUsername);
        cy.get('input[name="password"]').type(githubPassword, { log: false });
        cy.get('input[name="commit"]').click();

        // 3. Approve the app if prompted (still within the same cy.origin block)
        cy.get('button', { timeout: 10000 }).then($btns => {
            const approveBtn = $btns.filter((i, el) => el.innerText.includes('Authorize') || el.value?.includes('Authorize'));
            if (approveBtn.length) {
                cy.wrap(approveBtn).click({ force: true });
            }
        });
        // });

        // 3. Wait for redirect back to your app and assert successful login
        cy.url({ timeout: 15000 }).should('include', '/sso/git');

        // After the OAuth callback, you should be redirected to your app's main page
        cy.url({ timeout: 10000 }).should('include', 'localhost:8082');

        // Adjust this assertion based on what actually appears after successful login
        // This might be a dashboard, user profile, or specific page element
        cy.get('body').should('be.visible'); // Basic check that page loaded
    });


    it('should verify all the events from the button', () => {
        const events = [
            { event: "On hover", message: "On hover Event" },
            { event: "On Click", message: "On Click Event" },
        ];

        addMultiEventsWithAlert(events);
        const textInputSelector = '[data-cy="draggable-widget-button1"]';

        const verifyTextInputEvents = (selector) => {
            cy.get(selector).realHover()
            cy.verifyToastMessage(commonSelectors.toastMessage, 'On hover Event', false);

            cy.get(selector).click();
            cy.verifyToastMessage(commonSelectors.toastMessage, 'On Click Event', false);
        };

        verifyTextInputEvents(textInputSelector);
    });

    it.skip('should verify all the CSA from button', () => {
        addMultiEventsWithAlert([
            { event: "On hover", message: "On hover Event" },
            { event: "On Click", message: "On Click Event" },
        ]);
        const actions = [
            { event: "On click", action: "Set visibility", valueToggle: "{{false}}" }, //b2
            { event: "On click", action: "Visibility(deprecated)", valueToggle: "{{true}}" },//b3
            { event: "On click", action: "Disable(deprecated)", valueToggle: "{{true}}" },//b4
            { event: "On click", action: "Set disable", valueToggle: "{{false}}" },//b5
            { event: "On click", action: "Set text", value: "New Button Text" },//b6
            { event: "On click", action: "Click" },//b7
            { event: "On click", action: "Set loading", valueToggle: "{{true}}" },//b8
            { event: "On click", action: "Loading(deprecated)", valueToggle: "{{false}}" },//b9

        ];
        addCSA("button1", actions);
        let component = "button1";
        cy.get(commonWidgetSelector.draggableWidget("button2")).click();
        cy.get(commonWidgetSelector.draggableWidget(component)).should("not.be.visible");

        cy.get(commonWidgetSelector.draggableWidget("button3")).click();
        cy.get(commonWidgetSelector.draggableWidget(component)).should("be.visible");

        cy.get(commonWidgetSelector.draggableWidget("button4")).click();
        cy.get(commonWidgetSelector.draggableWidget(component)).parent().should("have.attr", "disabled");

        cy.get(commonWidgetSelector.draggableWidget("button5")).click();
        cy.get(commonWidgetSelector.draggableWidget(component)).parent().should("not.have.attr", "disabled");

        cy.get(commonWidgetSelector.draggableWidget("button6")).click();
        cy.get(commonWidgetSelector.draggableWidget(component)).should("have.text", "New Button Text");

        cy.get(commonWidgetSelector.draggableWidget("button7")).click();
        cy.verifyToastMessage(commonSelectors.toastMessage, 'On Click Event', false);

        cy.get(commonWidgetSelector.draggableWidget("button8")).click();
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

it('xyz', function () {
    cy.visit('localhost:8082')

});