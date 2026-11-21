/**
 * SPEC — Pagination — userflow facet.
 * FOR AI: real-pointer / keyboard interaction from two TESTING.md browser scenarios:
 *   Pagination-BRW-002 — with Disable on, and for the boundary operators on the first or last page, a REAL click
 *                        performs no navigation because the computed pointer-events gate applies. D-02: nothing in JS
 *                        refuses the move — Pagination.jsx:321-345 keeps the click handler bound to the inner <a>;
 *                        only Bootstrap's `.page-item.disabled .page-link { pointer-events: none }` stops it. Disable
 *                        is RenderWidget's shared `.disabled` class (pointer-events: none) on the box's inner node.
 *   Pagination-BRW-003 — keyboard and pointer affordances of the anchor-based control row: pointer cursor on every
 *                        actionable control, none on the ellipsis or a boundary-disabled operator (dimmed); a mouse
 *                        click leaves no focus stuck on a control. Keyboard: the controls are <a> without href
 *                        (Pagination.jsx:335-339, 396) — not focusable, so Tab passes over the widget without a
 *                        hidden focus stop and keys do not navigate. This pins the shipped behaviour recorded in the
 *                        contract inventory ("no native keyboard/focus affordance") — see the report for the a11y gap.
 * Observed through: a Text bound to components.<name>.currentPageIndex, the highlighted page, and an onPageChange
 * counter (set-variable) — exact fire counts, so a click that slipped through the gate (which would fire the event
 * even when it re-selects the same page, D-06) is caught.
 * Helpers: addPaginationsViaApi, openPaginationAppInViewer, paginationBoxes, clickPaginationItem, paginationHitAt,
 * currentPageText, expectCurrentPage, moveMouseAway, counterEvent, counterText, expectCounter, focusedWidget.
 */
import { fake } from "Fixtures/fake";
import { commonWidgetSelector } from "Selectors/common";
import { paginationSelector } from "Selectors/appBuilder/components/pagination";
import { paginationText } from "Texts/appBuilder/components/pagination";
import { counterEvent, counterText, expectCounter } from "Support/utils/appBuilder/components/icon";
import { focusedWidget } from "Support/utils/appBuilder/components/steps";
import {
    addPaginationsViaApi,
    openPaginationAppInViewer,
    paginationBoxes,
    clickPaginationItem,
    paginationHitAt,
    currentPageText,
    expectCurrentPage,
    moveMouseAway,
} from "Support/utils/appBuilder/components/pagination";

const T = paginationText;
const OP = T.operators;
const PAGES = 20; // dynamic: enough pages for an ellipsis in a 10-column widget
const input = (name) => `${commonWidgetSelector.draggableWidget(name)} input`;

// the click either navigates (page + one more onPageChange) or does nothing (both unchanged)
const expectState = (page, changes) => {
    expectCurrentPage('cur', 'pg', page);
    expectCounter('changes', 'changes', changes);
};

describe('Pagination — userflow facet', { testIsolation: false }, () => {
    beforeEach(() => {
        cy.apiLogin();
        cy.apiCreateApp(`${fake.companyName}-Pagination-userflow-${Cypress._.uniqueId()}`);
    });

    afterEach(() => {
        moveMouseAway();
        cy.apiLogin();
        cy.apiDeleteApp();
    });

    // ── Pagination-BRW-002 — boundary operators ─────────────────────────────
    it('[Pagination-BRW-002] Boundary operators on the first and last page take no real click: no navigation, no On Page Change', () => {
        addPaginationsViaApi([
            {
                name: 'pg',
                layout: { top: 40, left: 2, width: 10 }, // pagination.js:6-9 default size
                properties: { numberOfPages: { value: `{{${PAGES}}}` } },
                events: [counterEvent('onPageChange', 'changes')], // pagination.js:59
            },
            currentPageText('cur', 'pg', { top: 100 }),
            counterText('changes', 'changes', { top: 160 }),
        ]);
        moveMouseAway();
        openPaginationAppInViewer(paginationSelector.items('pg'));
        expectState(1, 0); // pagination.js:118 defaultPageIndex {{1}}, mount publishes without firing

        // page 1: << and < carry the disabled class; the link ignores the pointer, so a real click lands on the <li>
        paginationBoxes('pg', (b) => {
            const op = (label) => b.items.find((i) => i.label === label);
            [OP.first, OP.previous].forEach((label) => {
                expect(op(label).disabled, `${label}: disabled at page 1`).to.eq(true);
                expect(op(label).pointerEvents, `${label}: item pointer-events`).to.eq('none');
                expect(op(label).linkPointerEvents, `${label}: link pointer-events`).to.eq('none');
            });
            [OP.next, OP.last].forEach((label) => {
                expect(op(label).disabled, `${label}: enabled at page 1`).to.eq(false);
                expect(op(label).linkPointerEvents, `${label}: link pointer-events`).to.eq('auto');
            });
        });
        [OP.first, OP.previous].forEach((label) =>
            paginationHitAt('pg', label).then((h) => {
                // the pointer falls through the gated item to the row underneath — never its click handler
                expect(h.inWidget, `${label}: the pointer is over the row`).to.eq(true);
                expect(h.onItem, `${label}: the gated item takes no pointer`).to.eq(false);
                expect(h.onLink, `${label}: never reaches its click handler`).to.eq(false);
            })
        );
        clickPaginationItem('pg', OP.first);
        clickPaginationItem('pg', OP.previous);
        expectState(1, 0);

        // control: an enabled operator takes the same kind of real click
        clickPaginationItem('pg', OP.next);
        expectState(2, 1);
        clickPaginationItem('pg', OP.first);
        expectState(1, 2);

        // last page: > and >> are gated; without the gate > would publish page 21 and >> re-fire the event
        clickPaginationItem('pg', OP.last);
        expectState(PAGES, 3);
        paginationBoxes('pg', (b) => {
            const op = (label) => b.items.find((i) => i.label === label);
            [OP.next, OP.last].forEach((label) => {
                expect(op(label).disabled, `${label}: disabled at the last page`).to.eq(true);
                expect(op(label).pointerEvents, `${label}: item pointer-events`).to.eq('none');
                expect(op(label).linkPointerEvents, `${label}: link pointer-events`).to.eq('none');
            });
            [OP.first, OP.previous].forEach((label) =>
                expect(op(label).disabled, `${label}: enabled at the last page`).to.eq(false)
            );
        });
        [OP.next, OP.last].forEach((label) =>
            paginationHitAt('pg', label).then((h) => {
                // the pointer falls through the gated item to the row underneath — never its click handler
                expect(h.inWidget, `${label}: the pointer is over the row`).to.eq(true);
                expect(h.onItem, `${label}: the gated item takes no pointer`).to.eq(false);
                expect(h.onLink, `${label}: never reaches its click handler`).to.eq(false);
            })
        );
        clickPaginationItem('pg', OP.next);
        clickPaginationItem('pg', OP.last);
        expectState(PAGES, 3);

        // and the backward operators work from there
        clickPaginationItem('pg', OP.previous);
        expectState(PAGES - 1, 4);
    });

    // ── Pagination-BRW-002 — Disable (property and setDisable) ───────────────
    it('[Pagination-BRW-002] With Disable on, real clicks on page numbers and operators pass through the widget: no navigation, no On Page Change', () => {
        const OPEN_WORD = 'open'; // dynamic: arbitrary value that enables the widget through the binding
        const action = (handle, param, value) => ({
            eventId: 'onClick',
            actionId: 'control-component',
            componentName: 'pg',
            componentSpecificActionHandle: handle, // pagination.js:96-100
            componentSpecificActionParams: [{ handle: param, value }],
        });
        addPaginationsViaApi([
            { type: 'TextInput', name: 'lock', layout: { top: 20, left: 2, width: 10, height: 40 } },
            {
                name: 'pg',
                layout: { top: 80, left: 2, width: 10 },
                properties: {
                    numberOfPages: { value: `{{${PAGES}}}` },
                    defaultPageIndex: { value: '{{3}}' }, // dynamic: a middle page, so every operator is enabled
                    // pagination.js:43-48 Disable, bound: disabled until the lock input holds OPEN_WORD
                    disabledState: { value: `{{components.lock.value !== "${OPEN_WORD}"}}` },
                },
                events: [counterEvent('onPageChange', 'changes')],
            },
            { type: 'Button', name: 'disablebtn', layout: { top: 140, left: 2, width: 5, height: 40 }, events: [action('setDisable', 'disable', '{{true}}')] },
            { type: 'Button', name: 'enablebtn', layout: { top: 140, left: 8, width: 5, height: 40 }, events: [action('setDisable', 'disable', '{{false}}')] },
            currentPageText('cur', 'pg', { top: 200 }),
            counterText('changes', 'changes', { top: 260 }),
        ]);
        const press = (name) => cy.get(`${commonWidgetSelector.draggableWidget(name)} button`).first().click();
        const targets = ['4', OP.first, OP.previous, OP.next, OP.last]; // dynamic: a page number + every operator

        const expectBlocked = (context) => {
            paginationBoxes('pg', (b) => {
                expect(b.boxDisabled, `${context}: shared disabled class`).to.eq(true);
                expect(b.root.ariaDisabled, `${context}: aria-disabled`).to.eq('true');
                expect(b.root.pointerEvents, `${context}: computed pointer-events`).to.eq('none');
            });
            targets.forEach((label) =>
                paginationHitAt('pg', label).then((h) =>
                    expect(h.inWidget, `${context}: a pointer over "${label}" passes through the widget`).to.eq(false)
                )
            );
            targets.forEach((label) => clickPaginationItem('pg', label));
        };

        moveMouseAway();
        openPaginationAppInViewer(paginationSelector.items('pg'));
        expectState(3, 0);

        // Disable on (property): nothing navigates, nothing fires
        expectBlocked('Disable property on');
        expectState(3, 0);

        // Disable off: the same real clicks work
        cy.get(input('lock')).type(OPEN_WORD, { scrollBehavior: 'center' });
        paginationBoxes('pg', (b) => expect(b.boxDisabled, 'Disable property off').to.eq(false));
        paginationHitAt('pg', '4').then((h) => expect(h.onLink, 'pointer reaches page 4').to.eq(true));
        clickPaginationItem('pg', '4');
        expectState(4, 1);

        // setDisable(true) at runtime gates the controls the same way
        press('disablebtn');
        expectBlocked('setDisable(true)');
        expectState(4, 1);

        // setDisable(false) restores them
        press('enablebtn');
        paginationBoxes('pg', (b) => expect(b.boxDisabled, 'setDisable(false)').to.eq(false));
        clickPaginationItem('pg', OP.next);
        expectState(5, 2);
    });

    // ── Pagination-BRW-003 — pointer and keyboard affordances ───────────────
    it('[Pagination-BRW-003] Pointer cursor marks every actionable control, boundary and ellipsis items show none, and a click leaves no focus on the row', () => {
        addPaginationsViaApi([
            {
                name: 'pg',
                layout: { top: 40, left: 2, width: 10 },
                properties: { numberOfPages: { value: `{{${PAGES}}}` } },
                events: [counterEvent('onPageChange', 'changes')],
            },
            currentPageText('cur', 'pg', { top: 100 }),
            counterText('changes', 'changes', { top: 160 }),
        ]);
        moveMouseAway();
        openPaginationAppInViewer(paginationSelector.items('pg'));
        expectState(1, 0);

        // the real hit target of every item at page 1, with its computed cursor
        getRowLabels().then((labels) => {
            expect(labels, 'an ellipsis in the window').to.include(T.ellipsis);
            labels.forEach((label, index) => {
                const isOperator = Object.values(OP).includes(label);
                const boundary = label === OP.first || label === OP.previous; // page 1
                const actionable = label !== T.ellipsis && !boundary;
                const at = label === T.ellipsis ? { index } : label;
                hitItem(at).then((h) => {
                    // a boundary-disabled operator lets the pointer fall through to the row (pointer-events: none)
                    expect(h.onItem, `"${label}": pointer over the item`).to.eq(!boundary);
                    if (actionable) {
                        expect(h.onLink, `"${label}": pointer reaches the control`).to.eq(true);
                        expect(h.cursor, `"${label}": pointer cursor`).to.eq(T.enabledCursor);
                    } else {
                        expect(h.cursor, `"${label}": no pointer cursor on a non-actionable item`).to.not.eq(T.enabledCursor);
                    }
                    if (isOperator && boundary) expect(h.onLink, `"${label}": boundary link not hit`).to.eq(false);
                });
            });
        });

        // a boundary-disabled operator is dimmed against its enabled twin (Bootstrap .page-item.disabled colour)
        paginationBoxes('pg', (b) => {
            const color = (label) => b.items.find((i) => i.label === label).linkColor;
            expect(color(OP.previous), 'disabled < dimmed vs enabled >').to.not.eq(color(OP.next));
            expect(color(OP.first), 'disabled << dimmed vs enabled >>').to.not.eq(color(OP.last));
        });

        // a mouse click navigates and leaves no focus on any control of the row
        clickPaginationItem('pg', '3');
        expectState(3, 1);
        focusedWidget().should('not.eq', 'pg');
        clickPaginationItem('pg', OP.next);
        expectState(4, 2);
        focusedWidget().should('not.eq', 'pg');
        // with page 4 current, << and < are actionable again — the pointer cursor follows the state
        [OP.first, OP.previous].forEach((label) =>
            paginationHitAt('pg', label).then((h) => {
                expect(h.onLink, `${label}: reachable after leaving page 1`).to.eq(true);
                expect(h.cursor, `${label}: pointer cursor after leaving page 1`).to.eq(T.enabledCursor);
            })
        );
    });

    it('[Pagination-BRW-003] Keyboard: Tab passes over the anchor controls without a hidden focus stop, and keys never navigate', () => {
        addPaginationsViaApi([
            { type: 'TextInput', name: 'before', layout: { top: 20, left: 2, width: 10, height: 40 } },
            {
                name: 'pg',
                layout: { top: 80, left: 2, width: 10 },
                properties: { numberOfPages: { value: `{{${PAGES}}}` }, defaultPageIndex: { value: '{{3}}' } },
                events: [counterEvent('onPageChange', 'changes')],
            },
            { type: 'TextInput', name: 'after', layout: { top: 130, left: 2, width: 10, height: 40 } },
            currentPageText('cur', 'pg', { top: 190 }),
            counterText('changes', 'changes', { top: 250 }),
        ]);
        moveMouseAway();
        openPaginationAppInViewer(paginationSelector.items('pg'));
        expectState(3, 0);

        // control: Tab moves focus between the two inputs at all
        cy.get(input('before')).click({ scrollBehavior: 'center' });
        focusedWidget().should('eq', 'before');
        // Tab from the field above lands on the field below — no control of the row takes focus
        cy.realPress('Tab');
        focusedWidget().should('eq', 'after');
        cy.realPress(['Shift', 'Tab']);
        focusedWidget().should('eq', 'before');

        // the anchors cannot take focus at all (no href, no tabindex)
        cy.get(paginationSelector.items('pg')).find('a').each(($a) => {
            $a[0].focus();
            expect($a[0].ownerDocument.activeElement, `"${$a.text() || 'operator'}" not focusable`).to.not.eq($a[0]);
        });

        // keys pressed after a pointer click on the row change nothing
        clickPaginationItem('pg', '4');
        expectState(4, 1);
        ['Enter', 'Space', 'ArrowRight', 'ArrowLeft', 'End', 'Home'].forEach((key) => cy.realPress(key));
        expectState(4, 1);
    });
});

// labels of the row items in order (operators by aria-label, pages and ellipses by text)
const getRowLabels = () =>
    cy.get(paginationSelector.items('pg')).then(($lis) =>
        [...$lis].map((li) => li.getAttribute('aria-label') || (li.textContent || '').trim())
    );

// hit-test an item by label, or an ellipsis by its row index (there can be two)
const hitItem = (at) => {
    if (typeof at === 'string') return paginationHitAt('pg', at);
    return cy.get(paginationSelector.items('pg')).eq(at.index).then(($li) => {
        const li = $li[0];
        const r = li.getBoundingClientRect();
        const doc = li.ownerDocument;
        const hit = doc.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
        return {
            onItem: !!hit && li.contains(hit),
            onLink: !!hit && li.firstElementChild.contains(hit),
            cursor: hit ? doc.defaultView.getComputedStyle(hit).cursor : null,
        };
    });
};
