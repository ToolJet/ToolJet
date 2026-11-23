/**
 * SPEC — Cascader — userflow facet.
 * FOR AI: TESTING.md browser scenario only:
 *   Cascader-BRW-001 — Tab reaches the combobox in page order; arrow keys move the highlight among enabled rows
 *                      (skipping disabled ones, wrapping, drilling in/out) and Enter selects; a long level scrolls
 *                      inside the menu instead of clipping options
 * Real keyboard (cypress-real-events realPress → CDP) against the running app (the editor's Preview URL). Browser
 * focus stays on the combobox while the menu is open (CascaderMenu.tsx:31-35: keys are forwarded from the control's
 * onKeyDown, Cascader.tsx:236-251). Rows highlight on mouse enter too (CascaderMenu.tsx:209), so the pointer is
 * parked away from the menu before keyboard checks.
 * Trees are seeded as Dynamic options (one `data` string): a saved static `options` tree is index-merged with the
 * widget's default tree on load (see contexts BRW-003, kept red), which would add rows these keyboard checks do not
 * expect.
 * KNOWN PRODUCT BUG (kept red): ArrowDown/ArrowUp move the highlight past the 260px fold but the option list never
 * scrolls, so the highlighted row stays hidden below the list (no scrollIntoView in CascaderMenu.tsx moveHighlight).
 * Helpers: addCascadersViaApi, schemaOption, dynamicOptions, openCascaderMenu, expectCascaderDisplay, cascaderState,
 * readCascaderState, hitTest, openIconAppInViewer, moveMouseAway.
 */
import { fake } from "Fixtures/fake";
import { commonWidgetSelector } from "Selectors/common";
import { cascaderSelector as S } from "Selectors/appBuilder/components/cascader";
import { cascaderText as T } from "Texts/appBuilder/components/cascader";
import { openIconAppInViewer } from "Support/utils/appBuilder/components/icon";
import { moveMouseAway } from "Support/utils/appBuilder/components/radioButtonV2";
import {
    addCascadersViaApi,
    schemaOption,
    dynamicOptions,
    openCascaderMenu,
    expectCascaderDisplay,
    cascaderState,
    readCascaderState,
    hitTest,
} from "Support/utils/appBuilder/components/cascader";

// dynamic: distinct option labels (fake.firstName is lowercase a-z only)
const words = (n) =>
    Cypress._.uniq(Array.from({ length: n * 5 }, () => fake.firstName).filter((w) => w.length >= 4)).slice(0, n);
const probe = (name) => ({
    type: 'Text',
    name: `${name}probe`,
    layout: { top: 300, left: 20, width: 20, height: 40 },
    properties: { text: { value: `{{JSON.stringify([components.${name}.value, components.${name}.pathString])}}` } },
});
const expectProbe = (name, value, pathString) =>
    cy.get(commonWidgetSelector.draggableWidget(`${name}probe`)).should(($el) =>
        expect($el.text().trim(), 'exposed value, pathString').to.eq(JSON.stringify([value, pathString])));
const highlightedValues = (s) => s.menu.options.filter((o) => o.highlighted).map((o) => o.value);
const expectHighlight = (name, value, context) =>
    cascaderState(name, (s) => {
        expect(s.menu, `${context}: menu open`).to.not.eq(null);
        expect(highlightedValues(s), `${context}: highlighted row`).to.deep.eq([value]);
        expect(s.control.focused, `${context}: focus stays on the combobox`).to.eq(true);
    });

describe('Cascader — userflow facet', () => {
    beforeEach(() => {
        cy.apiLogin();
        cy.apiCreateApp(`${fake.companyName}-Cascader-userflow-${Cypress._.uniqueId()}`);
    });

    afterEach(() => {
        moveMouseAway();
        cy.apiDeleteApp();
    });

    // ── Cascader-BRW-001: focus order ────────────────────────────────────────
    // Cascader.tsx:322 tabIndex 0 on the role=combobox control (−1 only while disabled/loading).
    it('[Cascader-BRW-001] Tab and Shift+Tab reach the combobox between its neighbours in page order', () => {
        addCascadersViaApi([
            { type: 'TextInput', name: 'tibefore', layout: { top: 40, left: 2, width: 12, height: 40 } },
            { name: 'cs', layout: { top: 110, left: 2, width: 12, height: 40 } },
            { type: 'TextInput', name: 'tiafter', layout: { top: 180, left: 2, width: 12, height: 40 } },
        ]);
        openIconAppInViewer(S.control('cs'));
        moveMouseAway();

        cy.get(`${commonWidgetSelector.draggableWidget('tibefore')} input`).focus();
        cascaderState('cs', (s) => expect(s.activeWidget, 'start in the first input').to.eq('tibefore'));
        cy.realPress('Tab');
        cascaderState('cs', (s) => {
            expect(s.control.focused, 'Tab lands on the Cascader combobox').to.eq(true);
            expect(s.control.tabIndex, 'combobox is tabbable').to.eq(0);
            expect(s.menu, 'focus alone does not open the menu').to.eq(null);
        });
        cy.realPress('Tab');
        cascaderState('cs', (s) => expect(s.activeWidget, 'next Tab leaves to the following input').to.eq('tiafter'));
        cy.realPress(['Shift', 'Tab']);
        cascaderState('cs', (s) => expect(s.control.focused, 'Shift+Tab comes back to the combobox').to.eq(true));
        cy.realPress(['Shift', 'Tab']);
        cascaderState('cs', (s) => expect(s.activeWidget, 'Shift+Tab again reaches the previous input').to.eq('tibefore'));

        // the focused combobox opens from the keyboard and Escape closes it, focus kept
        cy.realPress('Tab');
        cy.realPress('ArrowDown'); // Cascader.tsx:240-244 opens on Enter / Space / ArrowDown
        cascaderState('cs', (s) => {
            expect(s.menu, 'ArrowDown opens the menu').to.not.eq(null);
            expect(s.control.ariaExpanded).to.eq('true');
            expect(s.menu.options.map((o) => o.text), 'root level rows').to.deep.eq([T.defaultTree.asia, T.defaultTree.europe, T.defaultTree.africa]);
        });
        cy.realPress('Escape');
        cascaderState('cs', (s) => {
            expect(s.menu, 'Escape closes the menu').to.eq(null);
            expect(s.control.focused, 'focus stays on the combobox').to.eq(true);
        });
    });

    // ── Cascader-BRW-001: arrow keys among enabled rows ──────────────────────
    // CascaderMenu.tsx:90-101 moveHighlight skips disabled rows and wraps; :108-128 ArrowRight descends into an
    // enabled parent, ArrowLeft goes back, Enter activates (leaf → select + close).
    it('[Cascader-BRW-001] Arrow keys move the highlight over enabled rows only (wrapping, drilling in and out) and Enter selects', () => {
        const L = words(8);
        const tree = [
            schemaOption(L[0], 'p0', [
                schemaOption(L[5], 'c0'),
                schemaOption(L[6], 'c1', null, { disabled: true }),
                schemaOption(L[7], 'c2'),
            ]),
            schemaOption(L[1], 'x1', null, { disabled: true }),
            schemaOption(L[2], 'l2'),
            schemaOption(L[3], 'x3', [schemaOption(fake.firstName, 'xc')], { disabled: true }),
            schemaOption(L[4], 'l4'),
        ];
        addCascadersViaApi([
            { name: 'cs', layout: { top: 40, left: 2, width: 12, height: 40 }, properties: dynamicOptions(tree) },
            probe('cs'),
        ]);
        openIconAppInViewer(S.control('cs'));
        expectProbe('cs', null, '');
        moveMouseAway();

        cy.get(S.control('cs')).focus();
        cy.realPress('ArrowDown');
        cascaderState('cs', (s) => {
            expect(s.menu.options.map((o) => o.value), 'root rows').to.deep.eq(['p0', 'x1', 'l2', 'x3', 'l4']);
            expect(s.menu.options.filter((o) => o.disabled).map((o) => o.value), 'disabled rows').to.deep.eq(['x1', 'x3']);
        });
        expectHighlight('cs', 'p0', 'opened: first enabled row');
        cy.realPress('ArrowDown');
        expectHighlight('cs', 'l2', 'ArrowDown skips disabled x1');
        cy.realPress('ArrowDown');
        expectHighlight('cs', 'l4', 'ArrowDown skips disabled parent x3');
        cy.realPress('ArrowDown');
        expectHighlight('cs', 'p0', 'ArrowDown wraps to the top');
        cy.realPress('ArrowUp');
        expectHighlight('cs', 'l4', 'ArrowUp wraps to the bottom');
        cy.realPress('ArrowUp');
        expectHighlight('cs', 'l2', 'ArrowUp skips disabled parent x3');
        cy.realPress('ArrowUp');
        expectHighlight('cs', 'p0', 'ArrowUp skips disabled x1');
        // the highlight is painted, the other rows are not
        cascaderState('cs', (s) => {
            const [hl, ...rest] = [...s.menu.options].sort((a, b) => b.highlighted - a.highlighted);
            expect(hl.backgroundColor, 'highlighted row painted').to.not.eq('rgba(0, 0, 0, 0)');
            rest.forEach((o) => expect(o.backgroundColor, `${o.value} not painted`).to.eq('rgba(0, 0, 0, 0)'));
        });

        // ArrowRight drills into the highlighted parent; the highlight starts on its first enabled child
        cy.realPress('ArrowRight');
        cascaderState('cs', (s) => {
            expect(s.menu.header, 'breadcrumb of the opened parent').to.eq(L[0]);
            expect(s.menu.options.map((o) => o.value), 'child rows').to.deep.eq(['c0', 'c1', 'c2']);
        });
        expectHighlight('cs', 'c0', 'child level: first enabled row');
        cy.realPress('ArrowDown');
        expectHighlight('cs', 'c2', 'child level: skips disabled c1');
        cy.realPress('ArrowDown');
        expectHighlight('cs', 'c0', 'child level: wraps');
        // ArrowLeft returns to the root level
        cy.realPress('ArrowLeft');
        cascaderState('cs', (s) => {
            expect(s.menu.header, 'back at the root: no breadcrumb').to.eq(null);
            expect(s.menu.options.map((o) => o.value)).to.deep.eq(['p0', 'x1', 'l2', 'x3', 'l4']);
        });

        // Enter on an enabled leaf selects it and closes; focus stays on the combobox
        cy.realPress('ArrowDown');
        cy.realPress('ArrowDown');
        expectHighlight('cs', 'l4', 'root again: on l4');
        cy.realPress('Enter');
        cascaderState('cs', (s) => {
            expect(s.menu, 'menu closed after selecting').to.eq(null);
            expect(s.control.focused, 'focus kept on the combobox').to.eq(true);
        });
        expectCascaderDisplay('cs', L[4]);
        expectProbe('cs', 'l4', L[4]);

        // keyboard drilldown to a nested leaf: reopen (menu restores the selected leaf's level), go in and select
        cy.realPress('ArrowDown');
        expectHighlight('cs', 'l4', 'reopened on the selected leaf');
        cy.realPress('ArrowUp');
        cy.realPress('ArrowUp');
        expectHighlight('cs', 'p0', 'back on the parent');
        cy.realPress('Enter'); // Enter on a parent drills in (activateRow → descend)
        cascaderState('cs', (s) => expect(s.menu.header, 'Enter on a parent drills in').to.eq(L[0]));
        cy.realPress('ArrowUp');
        expectHighlight('cs', 'c2', 'ArrowUp wraps over disabled c1');
        cy.realPress('Enter');
        cascaderState('cs', (s) => expect(s.menu, 'menu closed').to.eq(null));
        expectCascaderDisplay('cs', `${L[0]}${T.defaultSeparator}${L[7]}`);
        expectProbe('cs', 'c2', `${L[0]}${T.defaultSeparator}${L[7]}`);
    });

    // ── Cascader-BRW-001: overflow ───────────────────────────────────────────
    // CascaderMenu.tsx:170-180 — the level's row list is capped at maxHeight 260px with overflow-y auto inside the
    // popover (Cascader.tsx:395-407, overflow hidden).
    const COUNT = 30; // dynamic: rows at one level — far more than 260px of 32px rows
    const longTree = (labels) => labels.map((l, i) => schemaOption(`${i} ${l}`, `r${i}`));
    const longLabels = () => Array.from({ length: COUNT }, () => fake.firstName.slice(0, 10));

    it('[Cascader-BRW-001] A long level scrolls inside the menu: every row can be scrolled into view and picked', () => {
        const labels = longLabels();
        addCascadersViaApi([
            { name: 'cs', layout: { top: 40, left: 2, width: 12, height: 40 }, properties: dynamicOptions(longTree(labels)) },
            probe('cs'),
        ]);
        openIconAppInViewer(S.control('cs'));
        openCascaderMenu('cs');
        moveMouseAway();

        cascaderState('cs', (s) => {
            const { list } = s.menu;
            expect(s.menu.options, 'every row rendered').to.have.length(COUNT);
            expect(list.height, 'list capped').to.be.lte(T.menuMaxHeight + 0.5);
            expect(list.overflowY, 'list scrolls vertically').to.eq('auto');
            expect(list.scrollHeight, 'content taller than the list').to.be.gt(list.clientHeight + 100);
            expect(list.scrollTop, 'starts at the top').to.eq(0);
            // the list sits wholly inside the popover and the viewport (nothing cut by the popover's overflow:hidden)
            expect(list.top).to.be.gte(s.menu.top - 0.5);
            expect(list.bottom).to.be.lte(s.menu.bottom + 0.5);
            expect(s.menu.bottom, 'menu inside the viewport').to.be.lte(s.viewport.height);
            const last = s.menu.options[COUNT - 1];
            expect(last.top, 'last row starts below the visible list').to.be.gt(list.bottom);
        });

        // a real wheel over the list scrolls it to the end
        cy.get(S.menuList).realMouseWheel({ deltaY: 3000, scrollBehavior: false });
        cascaderState('cs', (s) => {
            const { list } = s.menu;
            expect(list.scrollTop, 'scrolled to the end').to.be.closeTo(list.scrollHeight - list.clientHeight, 1);
            const last = s.menu.options[COUNT - 1];
            expect(last.top, 'last row top visible').to.be.gte(list.top - 0.5);
            expect(last.bottom, 'last row bottom visible').to.be.lte(list.bottom + 0.5);
            expect(s.menu.options[0].bottom, 'first row scrolled out').to.be.lte(list.top + 0.5);
        });
        // the pointer really lands on the scrolled-in last row, and clicking it selects it
        readCascaderState('cs').then((s) => {
            const last = s.menu.options[COUNT - 1];
            const x = last.left + last.width / 2;
            const y = (last.top + last.bottom) / 2;
            hitTest(x, y).then((h) => expect(h.option, 'pointer hits the last row').to.eq(`r${COUNT - 1}`));
            cy.get(S.option(`r${COUNT - 1}`)).click({ scrollBehavior: false });
        });
        cascaderState('cs', (s) => expect(s.menu, 'menu closed').to.eq(null));
        expectCascaderDisplay('cs', `${COUNT - 1} ${labels[COUNT - 1]}`);
        expectProbe('cs', `r${COUNT - 1}`, `${COUNT - 1} ${labels[COUNT - 1]}`);

        // reopening restores the level and the selected (last) row is reachable by scrolling back down
        openCascaderMenu('cs');
        moveMouseAway();
        cy.get(S.menuList).realMouseWheel({ deltaY: 3000, scrollBehavior: false });
        cascaderState('cs', (s) => {
            const last = s.menu.options[COUNT - 1];
            expect(last.bottom, 'selected last row visible after scrolling').to.be.lte(s.menu.list.bottom + 0.5);
        });
    });

    // Keyboard users reach rows past the fold with ArrowDown; the highlighted row must be scrolled into the list's
    // visible area or it is effectively clipped for them. CascaderMenu.tsx has no scrollIntoView for the highlight.
    it('[Cascader-BRW-001] Arrowing past the fold keeps the highlighted row visible in the menu', () => {
        const labels = longLabels();
        const target = 20; // dynamic: a row well below the 260px fold (≈ 7 rows visible)
        addCascadersViaApi([
            { name: 'cs', layout: { top: 40, left: 2, width: 12, height: 40 }, properties: dynamicOptions(longTree(labels)) },
        ]);
        openIconAppInViewer(S.control('cs'));
        moveMouseAway();
        cy.get(S.control('cs')).focus();
        cy.realPress('ArrowDown'); // opens, highlight on r0
        expectHighlight('cs', 'r0', 'opened');
        Cypress._.times(target, () => cy.realPress('ArrowDown'));
        expectHighlight('cs', `r${target}`, 'after arrowing down');
        cascaderState('cs', (s) => {
            const row = s.menu.options[target];
            expect(row.top, `highlighted row r${target} top inside the visible list`).to.be.gte(s.menu.list.top - 0.5);
            expect(row.bottom, `highlighted row r${target} bottom inside the visible list`).to.be.lte(s.menu.list.bottom + 0.5);
        });
    });
});
