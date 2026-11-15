/**
 * SPEC — Multi Select (MultiselectV2) — contexts facet.
 * FOR AI: always-on device + exposed-value contexts, plus the TESTING.md browser scenario:
 *   MultiselectV2-BRW-003 — a Multi Select inside an open modal opens its menu above the modal, and the menu is
 *                           fully clickable there
 * The modal app is seeded through the components API (addMultiselectsViaApi + modalItem, child `parent` = modal id)
 * and opened in the viewer (the editor's Preview URL).
 * Helpers: verifyLayout, openNode, openAndVerifyNode, verifyNodeData, addMultiselectsViaApi, multiselectOptions,
 * multiselectValues, modalItem, visitMultiselectApp, openMultiselectMenu, multiselectState, getMultiselectState.
 */
import { fake } from "Fixtures/fake";
import { commonWidgetSelector } from "Selectors/common";
import { multiselectV2Selector as S } from "Selectors/appBuilder/components/multiselectV2";
import { multiselectV2Text as T } from "Texts/appBuilder/components/multiselectV2";
import { verifyLayout } from "Support/utils/commonWidget";
import { openNode, openAndVerifyNode, verifyNodeData } from "Support/utils/appBuilder/inspector";
import {
    addMultiselectsViaApi,
    multiselectOptions,
    multiselectValues,
    modalItem,
    visitMultiselectApp,
    openMultiselectMenu,
    multiselectState,
    getMultiselectState,
} from "Support/utils/appBuilder/components/multiselectV2";

const W = T.defaultWidgetName;

// testIsolation:false for cypress-real-dnd; each test re-creates its app.
describe('Multi Select (MultiselectV2) — contexts facet', { testIsolation: false }, () => {
    describe('dropped widget', () => {
        beforeEach(() => {
            cy.apiLogin();
            cy.apiCreateApp(`${fake.companyName}-MultiselectV2-contexts-${Cypress._.uniqueId()}`);
            cy.openApp();
            cy.dragAndDropWidget(T.displayName, 400, 200);
            cy.get('[data-cy="query-manager-toggle-button"]').click();
        });

        afterEach(() => {
            cy.apiDeleteApp();
        });

        it('device context — show on desktop / mobile toggles visibility', () => {
            verifyLayout(W);
        });

        it('exposed-value context — values and label observable in the inspector tree', () => {
            cy.get(commonWidgetSelector.sidebarinspector).click();
            cy.hideTooltip();
            openNode('components');
            openAndVerifyNode(W, [
                { key: 'values', type: 'Array', value: '[2]' }, // ['1','2']. source: multiselectV2.js:424
                { key: 'label', type: 'String', value: `"${T.defaultLabel}"` }, // source: multiselectV2.js:423
                { key: 'options', type: 'Array', value: '[3]' }, // source: multiselectV2.js:444-471
            ], verifyNodeData);
        });
    });

    // ── MultiselectV2-BRW-003 ────────────────────────────────────────────────
    // MultiselectV2.jsx:522,644 — the menu is portalled to <body> with a fixed stacking index; the modal (ModalV2) is
    // portalled into the canvas area with its own overlay. Regression 7cf4ed6d7f7: the menu was hidden behind modals.
    describe('inside a modal', () => {
        let labels;
        const MODAL = crypto.randomUUID();

        beforeEach(() => {
            // dynamic: eight distinct option labels
            labels = Cypress._.uniq(Array.from({ length: 40 }, () => fake.firstName.toLowerCase()).filter((w) => w.length >= 4)).slice(0, 8);
            cy.apiLogin();
            cy.apiCreateApp(`${fake.companyName}-MultiselectV2-contexts-${Cypress._.uniqueId()}`);
            cy.then(() =>
                addMultiselectsViaApi([
                    modalItem({ id: MODAL, name: 'mdl' }),
                    {
                        name: 'msmodal',
                        parent: MODAL,
                        layout: { top: 10, left: 2, width: 15, height: 40 },
                        properties: { options: multiselectOptions(labels), values: multiselectValues([labels[0]]) },
                    },
                ])
            );
        });

        afterEach(() => {
            cy.apiDeleteApp();
        });

        const modalContent = () =>
            cy.get('.modal.show .modal-content').then(($c) => {
                const r = $c[0].getBoundingClientRect();
                return { top: r.top, bottom: r.bottom, left: r.left, right: r.right };
            });

        it('[MultiselectV2-BRW-003] The menu opens above an open modal and every row is clickable', () => {
            visitMultiselectApp('[data-cy="mdl-launch-button"]');
            cy.get('[data-cy="mdl-launch-button"]').click();
            cy.get(S.field('msmodal')).should('be.visible');
            cy.get('.modal.show').should('exist');
            openMultiselectMenu('msmodal');

            modalContent().then((content) =>
                multiselectState('msmodal', (s) => {
                    // the menu really lies over the modal (otherwise "on top" would prove nothing)
                    expect(s.menu.top, 'menu starts inside the modal').to.be.gt(content.top);
                    expect(s.menu.left, 'menu left inside the modal').to.be.gte(content.left);
                    expect(s.menu.right, 'menu right inside the modal').to.be.lte(content.right);
                    expect(s.menu.options, 'all eight rows rendered').to.have.length(labels.length);
                    s.menu.options.forEach((o) => expect(o.onTop, `row ${o.text} is on top`).to.eq(true));
                })
            );

            // control: below the modal's layer the same rows are covered, so the check above can fail
            getMultiselectState('msmodal').then((s) => {
                cy.get(S.menu(s.id)).then(($m) => {
                    const portal = $m[0].parentElement.parentElement; // react-select MenuPortal (MultiselectV2.jsx:522)
                    expect(portal.ownerDocument.defaultView.getComputedStyle(portal).zIndex, 'portal stacking index').to.eq(T.menuPortalZIndex);
                    portal.style.zIndex = '-1'; // inline override of the emotion class
                });
                multiselectState('msmodal', (lowered) =>
                    expect(lowered.menu.options.filter((o) => o.onTop), 'rows covered when the menu is below the modal').to.have.length(0)
                );
                cy.get(S.menu(s.id)).then(($m) => {
                    $m[0].parentElement.parentElement.style.zIndex = ''; // back to the class value
                });
            });

            // real clicks on rows inside the modal select / deselect them; the menu and the modal stay open
            getMultiselectState('msmodal').then((s) => {
                [labels[5], labels[0]].forEach((label) => {
                    const row = s.menu.options.find((o) => o.text === label);
                    cy.get(`${S.menu(s.id)} ${S.menuBody}`).realClick({
                        x: row.left + 20 - s.menu.body.left,
                        y: (row.top + row.bottom) / 2 - s.menu.body.top,
                        scrollBehavior: false,
                    });
                });
            });
            cy.get(S.summary('msmodal')).should('have.text', labels[5]);
            multiselectState('msmodal', (s) => expect(s.menu, 'menu still open').to.not.eq(null));
            cy.get('.modal.show').should('exist');
        });
    });
});
