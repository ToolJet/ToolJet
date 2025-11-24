import { fake } from "Fixtures/fake";
import { addAndVerifyOnSingleLine } from "Support/utils/editor/codehinter";
import { commonSelectors, commonWidgetSelector } from "Selectors/common";
import {
    openEditorSidebar,
} from "Support/utils/commonWidget";

describe.only('Tooljet Resolution Cases', () => {
    beforeEach(() => {
        cy.apiLogin();
        cy.apiCreateApp(`${fake.companyName}-inspector-App`);
        cy.openApp();
    });

    it.only('Basic Component and Query Value Access', () => {

        cy.dragAndDropWidget("Text Input", 100, 200);
        cy.dragAndDropWidget("Text", 100, 100);
        addAndVerifyOnSingleLine('{{components.textinput1.value}}');
        cy.get(commonWidgetSelector.draggableWidget("textinput1")).type("Hello World");
        cy.get(commonWidgetSelector.draggableWidget("text1")).should('have.text', 'Hello World');
        cy.pause()

        // Example 2
        // cy.dragAndDropWidget('Table', 100, 300);
        // addAndVerifyOnSingleLine('{{queries.user.data}}', 'data');

        // // Example 3
        // cy.dragAndDropWidget('Text', 200, 100);
        // addAndVerifyOnSingleLine('{{queries.name.data.hello}}');

        // // Example 4
        // cy.dragAndDropWidget('Text', 300, 100);
        // addAndVerifyOnSingleLine('{{queries.products[components.dropdown1.value]?.details.price}}');

        // Example 5
        cy.dragAndDropWidget('Text', 400, 100);
        addAndVerifyOnSingleLine('{{globals.currentUser.email}}');
        cy.get(commonWidgetSelector.draggableWidget("text2")).should('have.text', 'dev@tooljet.io');

        // Example 6
        cy.dragAndDropWidget('Text', 500, 100);
        addAndVerifyOnSingleLine('{{page.variables.pageTitle}}');

        // Example 7
        cy.dragAndDropWidget('variables.userId');
        addAndVerifyOnSingleLine('{{variables.userId}}');

        // Example 8
        cy.dragAndDropWidget('queries.localeHelper.data.PRFieldHint');
        addAndVerifyOnSingleLine('{{queries.localeHelper.data.PRFieldHint}}');

        // Example 9
        cy.dragAndDropWidget('queries.8256e53e-061f-4108-8ab5-d9a0db607e8f.data.countryFieldHint');
        addAndVerifyOnSingleLine('{{queries.8256e53e-061f-4108-8ab5-d9a0db607e8f.data.countryFieldHint}}');

        // Example 10
        cy.dragAndDropWidget('page.otherProperty.someValue');
        addAndVerifyOnSingleLine('{{page.otherProperty.someValue}}');
    });

    it('Dynamic Access Using Brackets', () => {
        // Example 1
        cy.dragAndDropWidget('components[components.text1.data].value');
        addAndVerifyOnSingleLine('{{components[components.text1.data].value}}');

        // Example 2
        cy.dragAndDropWidget('queries[ ${components.dropdown1.value}].data.users');
        addAndVerifyOnSingleLine('{{queries[ ${components.dropdown1.value}].data.users}}');

        // Example 3
        cy.dragAndDropWidget('queries["components.dropdown.value"]?.data');
        addAndVerifyOnSingleLine('{{queries["components.dropdown.value"]?.data}}');

        // Example 4
        cy.dragAndDropWidget('components[queries.products.data].value');
        addAndVerifyOnSingleLine('{{components[queries.products.data].value}}');

        // Example 5
        cy.dragAndDropWidget('queries[queries.user.data.fieldKey]?.data');
        addAndVerifyOnSingleLine('{{queries[queries.user.data.fieldKey]?.data}}');
    });

    it('Logical Operators and Conditionals', () => {
        // Example 1
        cy.dragAndDropWidget('components.text1.value || queries.user.data');
        addAndVerifyOnSingleLine('{{components.text1.value || queries.user.data}}');

        // Example 2
        cy.dragAndDropWidget('queries.currency.data?.currency || globals.defaultCurrency');
        addAndVerifyOnSingleLine('{{queries.currency.data?.currency || globals.defaultCurrency}}');

        // Example 3
        cy.dragAndDropWidget('components.text1.value ? components.text1.value + " - active" : "Inactive"');
        addAndVerifyOnSingleLine('{{components.text1.value ? components.text1.value + " - active" : "Inactive"}}');

        // Example 4
        cy.dragAndDropWidget('(components.numberinput1.value || 0).toFixed(2).toString().padStart(8, "0")');
        addAndVerifyOnSingleLine('{{(components.numberinput1.value || 0).toFixed(2).toString().padStart(8, "0")}}');
    });

    it('String Manipulation', () => {
        // Example 1
        cy.dragAndDropWidget('components.text1.value.toUpperCase()');
        addAndVerifyOnSingleLine('{{components.text1.value.toUpperCase()}}');

        // Example 2
        cy.dragAndDropWidget('variables.userId.substring(0, 5)');
        addAndVerifyOnSingleLine('{{variables.userId.substring(0, 5)}}');

        // Example 3
        cy.dragAndDropWidget('Hello {{components.text1.value}}');
        addAndVerifyOnSingleLine('Hello {{components.text1.value}}');

        // Example 4
        cy.dragAndDropWidget('Hello {{components.text1.value + "!"}}');
        addAndVerifyOnSingleLine('Hello {{components.text1.value + "!"}}');

        // Example 5
        cy.dragAndDropWidget('components.text1.data?.toString() || "default"');
        addAndVerifyOnSingleLine('{{components.text1.data?.toString() || "default"}}');

        // Example 6
        cy.dragAndDropWidget('components.text1.value + " " + components.text2.value');
        addAndVerifyOnSingleLine('{{components.text1.value + " " + components.text2.value}}');

        // Example 7
        cy.dragAndDropWidget('"Real time Range 1 : <b>" + components.rangeslider2.value[0] + "</b>"');
        addAndVerifyOnSingleLine('{{"Real time Range 1 : <b>" + components.rangeslider2.value[0] + "</b>"}}');
    });

    it('Arrays and Iterations', () => {
        // Example 1
        cy.dragAndDropWidget('queries.orders.data.map(order => order.id).join(", ")');
        addAndVerifyOnSingleLine('{{queries.orders.data.map(order => order.id).join(", ")}}');

        // Example 2
        cy.dragAndDropWidget('Array.from({length: queries?.tooljetdbGetProducts?.data?.filter(product => product.id == components.dropdown1.value)[0]?.quantity ?? 0}, (_, i) => i + 1)');
        addAndVerifyOnSingleLine('{{Array.from({length: queries?.tooljetdbGetProducts?.data?.filter(product => product.id == components.dropdown1.value)[0]?.quantity ?? 0}, (_, i) => i + 1)}}');

        // Example 3
        cy.dragAndDropWidget('queries.user?.data?.filter(item => item.id === components.selected.value)');
        addAndVerifyOnSingleLine('{{queries.user?.data?.filter(item => item.id === components.selected.value)}}');

        // Example 4
        cy.dragAndDropWidget('queries.products.data.find(p => p.id === variables.productId)?.name || "Unknown"');
        addAndVerifyOnSingleLine('{{queries.products.data.find(p => p.id === variables.productId)?.name || "Unknown"}}');

        // Example 5
        cy.dragAndDropWidget('queries.data.items.filter(item => item.active).length');
        addAndVerifyOnSingleLine('{{queries.data.items.filter(item => item.active).length}}');
    });

    it('Numeric Operations', () => {
        // Example 1
        cy.dragAndDropWidget('10 * (components.pagination1.currentPageIndex - 1)');
        addAndVerifyOnSingleLine('{{10 * (components.pagination1.currentPageIndex - 1)}}');

        // Example 2
        cy.dragAndDropWidget('components?.pagination1?.currentPageIndex + 1');
        addAndVerifyOnSingleLine('{{components?.pagination1?.currentPageIndex + 1}}');
    });

    it('Nested Property Access', () => {
        // Example 1
        cy.dragAndDropWidget('queries.user[components.text1.data].extra.field');
        addAndVerifyOnSingleLine('{{queries.user[components.text1.data].extra.field}}');

        // Example 2
        cy.dragAndDropWidget('queries.user[components.button1.data].extra.field');
        addAndVerifyOnSingleLine('{{queries.user[components.button1.data].extra.field}}');

        // Example 3
        cy.dragAndDropWidget('queries.user.data[0]');
        addAndVerifyOnSingleLine('{{queries.user.data[0]}}');

        // Example 4
        cy.dragAndDropWidget('components.text1.data');
        addAndVerifyOnSingleLine('{{components.text1.data}}');
    });

    it('Complex Template Strings', () => {
        // Example 1
        cy.dragAndDropWidget('Hello {{components.text1.value}} {{variables.userId}} {{globals.apiKey}}');
        addAndVerifyOnSingleLine('Hello {{components.text1.value}} {{variables.userId}} {{globals.apiKey}}');

        // Example 2
        cy.dragAndDropWidget('page.variables.pageTitle');
        addAndVerifyOnSingleLine('{{page.variables.pageTitle}}');

        // Example 3
        cy.dragAndDropWidget('components.text1.value + variables.userId + globals.apiKey + page.variables.pageTitle');
        addAndVerifyOnSingleLine('{{components.text1.value + variables.userId + globals.apiKey + page.variables.pageTitle}}');
    });

    it('Nullable/Optional Chaining', () => {
        // Example 1
        cy.dragAndDropWidget('components?.text1?.value');
        addAndVerifyOnSingleLine('{{components?.text1?.value}}');

        // Example 2
        cy.dragAndDropWidget('components?.text1["value"]');
        addAndVerifyOnSingleLine('{{components?.text1["value"]}}');

        // Example 3
        cy.dragAndDropWidget('queries["user"]?.data');
        addAndVerifyOnSingleLine('{{queries["user"]?.data}}');

        // Example 4
        cy.dragAndDropWidget('queries?.tooljetdbGetProducts?.data?.filter');
        addAndVerifyOnSingleLine('{{queries?.tooljetdbGetProducts?.data?.filter}}');
    });

    it('Need to be Verified', () => {
        // Example 1
        cy.dragAndDropWidget('components[queries.user.data[0]].value');
        addAndVerifyOnSingleLine('{{components[queries.user.data[0]].value}}');

        // Example 2
        cy.dragAndDropWidget('queries.products.data.find(p => p.id === variables.productId)?.name || "Unknown"');
        addAndVerifyOnSingleLine('{{queries.products.data.find(p => p.id === variables.productId)?.name || "Unknown"}}');

        // Example 3
        cy.dragAndDropWidget('queries[ ${components.dropdown1.value}_${components.dropdown2.value}]?.data');
        addAndVerifyOnSingleLine('{{queries[ ${components.dropdown1.value}_${components.dropdown2.value}]?.data}}');

        // Example 4
        cy.dragAndDropWidget('Array.from({length: queries?.tooljetdbGetProducts?.data?.filter(product => product.id == components.dropdown1.value)[0]?.quantity ?? 0}, (_, i) => i + 1)');
        addAndVerifyOnSingleLine('{{Array.from({length: queries?.tooljetdbGetProducts?.data?.filter(product => product.id == components.dropdown1.value)[0]?.quantity ?? 0}, (_, i) => i + 1)}}');

        // Example 5
        cy.dragAndDropWidget('queries["components.dropdown.value"]?.data');
        addAndVerifyOnSingleLine('{{queries["components.dropdown.value"]?.data}}');
    });
});
