/**
 * SPEC — Modal (ModalV2) — userflow facet.
 * FOR AI: real keyboard focus and Escape stacking for overlays opened from inside an open modal, in the running app:
 *   ModalV2-BRW-002 — a nested overlay (Popover Menu, Dropdown menu, a second Modal) keeps keyboard focus inside
 *                     itself, and Escape closes only the innermost overlay — a second Escape then closes the modal.
 *                     Components/Modal.jsx:150-162 bails when an inner layer already handled (preventDefault) the
 *                     Escape; react-bootstrap closes only the top modal of a stack. The modal's own focus trap is
 *                     OFF (ModalV2.jsx:361-365 enforceFocus={false}, deliberately deferred in #5307 — triage B-53),
 *                     so the nested-modal test pins Tab order inside the inner modal and Escape order, not a trap.
 * Probe: a Text bound to components.<modal>.show for each modal shows which modals are logically open.
 * Helpers: addModalsViaApi, openModalAppInViewer, openModal, modalBoxes, focusedElement, focusTrail, openPopoverMenu,
 * openDropdownMenu.
 */
import { fake } from "Fixtures/fake";
import { commonWidgetSelector } from "Selectors/common";
import { modalV2Selector as S } from "Selectors/appBuilder/components/modalV2";
import { popoverMenuSelector } from "Selectors/appBuilder/components/popoverMenu";
import { dropdownV2Selector } from "Selectors/appBuilder/components/dropdownV2";
import { modalV2Text as T } from "Texts/appBuilder/components/modalV2";
import { popoverMenuText } from "Texts/appBuilder/components/popoverMenu";
import {
    addModalsViaApi,
    openModalAppInViewer,
    openModal,
    modalBoxes,
    focusedElement,
    focusTrail,
} from "Support/utils/appBuilder/components/modalV2";
import { openPopoverMenu } from "Support/utils/appBuilder/components/popoverMenu";
import { openDropdownMenu } from "Support/utils/appBuilder/components/dropdownV2";

const M1 = crypto.randomUUID();
const M2 = crypto.randomUUID();
const PM = popoverMenuText.definition;

const seed = () =>
    addModalsViaApi([
        { id: M1, name: 'outer', layout: { top: 30, left: 2, width: 8 } },
        // inside the outer modal's body: a text input, a Popover Menu, a Dropdown and a second modal's trigger
        { type: 'TextInput', name: 'outerinput', parent: M1, layout: { top: 10, left: 1, width: 15, height: 40 } },
        {
            type: popoverMenuText.componentType,
            name: 'menu',
            parent: M1,
            layout: { top: 70, left: 1, width: 10, height: 40 },
            properties: { ...PM.properties },
            styles: { ...PM.styles },
            others: { ...PM.others },
        },
        { type: 'DropdownV2', name: 'picker', parent: M1, layout: { top: 130, left: 1, width: 15, height: 40 } },
        // modalV2.js:95 size 'sm' (small) so it sits inside the outer one
        { id: M2, name: 'inner', parent: M1, layout: { top: 190, left: 1, width: 10 }, properties: { size: { value: T.sizeSmall } } },
        { type: 'TextInput', name: 'innerinput', parent: M2, layout: { top: 10, left: 1, width: 20, height: 40 } },
        { type: 'Button', name: 'innerok', parent: `${M2}-footer`, layout: { top: 10, left: 25, width: 12, height: 40 } },
        // behind the modals, on the page
        { type: 'TextInput', name: 'pageinput', layout: { top: 100, left: 2, width: 10, height: 40 } },
        {
            type: 'Text',
            name: 'probe',
            layout: { top: 160, left: 2, width: 14, height: 40 },
            // modalV2.js:360 exposed `show`
            properties: { text: { value: '{{"outer:" + components.outer.show + "|inner:" + components.inner?.show}}' } },
        },
    ]);

const expectShown = (outer, inner) =>
    cy
        .get(commonWidgetSelector.draggableWidget('probe'))
        .should(($el) => expect($el.text().trim(), 'exposed show').to.eq(`outer:${outer}|inner:${inner}`));

describe('Modal (ModalV2) — userflow facet', { testIsolation: false }, () => {
    beforeEach(() => {
        cy.apiLogin();
        cy.apiCreateApp(`${fake.companyName}-ModalV2-userflow-${Cypress._.uniqueId()}`);
        seed();
        openModalAppInViewer(S.launchButton('outer'));
        openModal('outer', M1, { real: true });
    });

    afterEach(() => {
        cy.apiLogin();
        cy.apiDeleteApp();
    });

    it('[ModalV2-BRW-002] A Popover Menu opened inside the modal keeps Tab / Shift+Tab focus on its options, and Escape closes the menu before the modal', () => {
        openPopoverMenu('menu', { real: true });
        focusedElement().then((f) => expect(f.popover, 'focus moved into the open menu').to.eq(true));

        focusTrail(5).then((trail) => {
            expect(trail.map((f) => f.popover), 'Tab stays in the menu').to.deep.eq([true, true, true, true, true]);
            // it walks the three options and wraps around
            expect(new Set(trail.map((f) => f.dataCy)).size, 'Tab cycles through every option').to.eq(popoverMenuText.defaultOptionLabels.length);
        });
        focusTrail(4, { shift: true }).then((trail) =>
            expect(trail.map((f) => f.popover), 'Shift+Tab stays in the menu').to.deep.eq([true, true, true, true])
        );

        // first Escape: only the menu closes
        cy.realPress('Escape');
        cy.get(popoverMenuSelector.content).should('not.exist');
        cy.get(popoverMenuSelector.trigger('menu')).should('have.attr', 'aria-expanded', 'false');
        cy.get(S.content(M1)).should('be.visible');
        expectShown(true, false);

        // second Escape: the modal closes
        cy.realPress('Escape');
        cy.get(S.content(M1)).should('not.exist');
        expectShown(false, false);
    });

    it('[ModalV2-BRW-002] Escape closes a Dropdown menu opened inside the modal first, then the modal', () => {
        openDropdownMenu('picker');
        focusedElement().then((f) => expect(f.dropdownMenu, 'focus in the open dropdown menu').to.eq(true));

        cy.realPress('Escape');
        cy.get(dropdownV2Selector.menuList).should('not.exist');
        cy.get(S.content(M1)).should('be.visible');
        expectShown(true, false);

        cy.realPress('Escape');
        cy.get(S.content(M1)).should('not.exist');
        expectShown(false, false);
    });

    it('[ModalV2-BRW-002] With a second modal opened from inside the first, Escape closes the inner modal first, then the outer one', () => {
        openModal('inner', M2, { real: true });
        modalBoxes(M2, (b) => {
            expect(b.openModals, 'two modals open').to.eq(2);
            // the inner modal is on top: its centre hits its own content
            const doc = Cypress.$(S.content(M2))[0].ownerDocument;
            const hit = doc.elementFromPoint((b.content.left + b.content.right) / 2, (b.content.top + b.content.bottom) / 2);
            expect(!!(hit && hit.closest(S.content(M2))), 'inner modal stacked above the outer one').to.eq(true);
        });
        expectShown(true, true);

        cy.realPress('Escape');
        cy.get(S.content(M2)).should('not.exist');
        cy.get(S.content(M1)).should('be.visible');
        modalBoxes(M1, (b) => expect(b.openModals, 'only the outer modal is left').to.eq(1));
        expectShown(true, false);

        cy.realPress('Escape');
        cy.get(S.content(M1)).should('not.exist');
        cy.get(S.anyOpenModal).should('not.exist');
        expectShown(false, false);
    });

    // KNOWN AND DELIBERATELY DEFERRED (triage B-53, #5307): ModalV2 renders with enforceFocus={false}
    // (ModalV2.jsx:361-365) — the focus trap was enabled then reverted the same day (544b118711 -> 193d998423) because
    // it breaks PopoverMenu/Select portalled outside the modal. So no focus-trap assertion here: what is documented is
    // that keyboard focus moves through the inner modal's own controls in order and Escape still closes the innermost
    // modal first, then the outer one.
    it('[ModalV2-BRW-002] In a second modal opened from inside the first, Tab / Shift+Tab move through its own controls and Escape closes it before the outer one', () => {
        openModal('inner', M2, { real: true });
        cy.get(`${commonWidgetSelector.draggableWidget('innerinput')} input`).realClick();
        focusedElement().then((f) => expect(f.modal, 'start inside the inner modal').to.eq(M2));

        focusTrail(1).then(([next]) =>
            expect({ widget: next.widget, modal: next.modal }, 'Tab reaches the inner modal footer button').to.deep.eq({ widget: 'innerok', modal: M2 }));
        focusTrail(1, { shift: true }).then(([back]) =>
            expect({ widget: back.widget, modal: back.modal }, 'Shift+Tab returns to the inner input').to.deep.eq({ widget: 'innerinput', modal: M2 }));

        cy.realPress('Escape');
        cy.get(S.content(M2)).should('not.exist');
        cy.get(S.content(M1)).should('be.visible');
        expectShown(true, false);
        cy.realPress('Escape');
        cy.get(S.content(M1)).should('not.exist');
        expectShown(false, false);
    });
});
