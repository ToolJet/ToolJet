/**
 * SPEC — Tree Select — userflow facet (keyboard).
 * FOR AI: the focus-order / keyboard half of TESTING.md browser scenario:
 *   TreeSelect-QA-001 — keyboard navigation reaches every enabled node in tree order: each parent's expand toggle
 *                       (react-checkbox-tree `button.rct-collapse-btn`) then its checkbox (TreeSelectCheckbox.jsx:45-80,
 *                       native disabled drops it from the tab order), skipping hidden and disabled nodes and a hidden
 *                       widget; Space toggles a node, Enter on a toggle expands it and its children join the order; a
 *                       focused node below the fold of a fixed-height tree is scrolled into view; every stop shows a
 *                       focus ring (checkbox: tw-ring-2 + offset, toggle: treeSelect.scss:31-35 outline).
 * Observed through: a Text bound to components.<name>.checked / expanded.
 * Decision: in a disabled Tree Select (properties.disabledState) every checkbox leaves the tab order; the expand
 * toggles stay focusable and operable (react-checkbox-tree gates them on `expandDisabled`, not `disabled`) — the
 * spec only asserts that no checkbox is reachable and records the toggles as a behaviour to confirm.
 * KNOWN PRODUCT BUG (kept red): Space on a focused node checkbox paints the node checked and updates the exposed
 * value, but the native checkbox stays unchecked (assistive tech announces "not checked") and On check / On change
 * fire twice — the row's onClick also handles the keyboard-generated click and preventDefault()s it.
 * Helpers: addTreeSelectsViaApi, openTreeAppInViewer, treeBoxes, tabTrail, focusedNode, counterEvent, counterText,
 * expectCounter.
 */
import { fake } from "Fixtures/fake";
import { commonWidgetSelector } from "Selectors/common";
import { treeSelectSelector } from "Selectors/appBuilder/components/treeSelect";
import { treeSelectText } from "Texts/appBuilder/components/treeSelect";
import { counterEvent, counterText, expectCounter } from "Support/utils/appBuilder/components/icon";
import {
    addTreeSelectsViaApi,
    openTreeAppInViewer,
    treeBoxes,
    tabTrail,
    focusedNode,
} from "Support/utils/appBuilder/components/treeSelect";

const T = treeSelectText;
const opt = T.option;
const input = (name) => `${commonWidgetSelector.draggableWidget(name)} input`;
const moveMouseAway = () => cy.get('body').realHover({ position: 'topLeft', scrollBehavior: false });
const word = () => fake.firstName.replace(/\W/g, '').slice(0, 8) || 'Item';

// Asia (expanded) → China (collapsed, one child), Japan (disabled), Nepal (hidden), India; Africa
const keyboardTree = () => [
    opt('Asia', 'asia', { expanded: true }, [
        opt('China', 'china', {}, [opt('Beijing', 'beijing')]),
        opt('Japan', 'japan', { disable: true }), // treeSelect.js:353 per-node disable
        opt('Nepal', 'nepal', { visible: false }), // treeSelect.js:352 per-node visible
        opt('India', 'india'),
    ]),
    opt('Africa', 'africa'),
];
const probeText = (treeName) => ({
    type: 'Text',
    name: 'probe',
    layout: { top: 330, left: 2, width: 30, height: 40 },
    properties: {
        text: { value: `{{JSON.stringify(components.${treeName}.checked) + "|" + JSON.stringify(components.${treeName}.expanded)}}` },
    },
});
const expectProbe = (checked, expanded) =>
    cy
        .get(commonWidgetSelector.draggableWidget('probe'))
        .should(($el) => expect($el.text().trim(), 'checked|expanded').to.eq(`${JSON.stringify(checked)}|${JSON.stringify(expanded)}`));

describe('Tree Select — userflow facet', { testIsolation: false }, () => {
    beforeEach(() => {
        cy.apiLogin();
        cy.apiCreateApp(`${fake.companyName}-TreeSelect-userflow-${Cypress._.uniqueId()}`);
    });

    afterEach(() => {
        moveMouseAway();
        cy.apiDeleteApp();
    });

    // ── TreeSelect-QA-001: tab order + Space / Enter, editor and viewer ──────
    it('[TreeSelect-QA-001] Tab and Shift+Tab walk every enabled node in tree order (toggle, then checkbox) with a visible focus ring, skip hidden and disabled nodes, Space selects and Enter expands — in the editor and the viewer', () => {
        addTreeSelectsViaApi([
            { type: 'TextInput', name: 'before', layout: { top: 10, left: 2, width: 10, height: 40 } },
            {
                name: 'tskey',
                layout: { top: 60, left: 2, width: 12, height: 200 },
                properties: { label: { value: word() }, options: { value: keyboardTree() } },
            },
            { type: 'TextInput', name: 'after', layout: { top: 270, left: 2, width: 10, height: 40 } },
            probeText('tskey'),
        ]);
        const ORDER = [
            'tskey:toggle:Asia',
            'tskey:check:Asia',
            'tskey:toggle:China',
            'tskey:check:China',
            'tskey:check:India', // Japan is disabled, Nepal hidden
            'tskey:check:Africa',
            'after:input',
        ];

        const run = (where) => {
            cy.log(`keyboard — ${where}`);
            expectProbe([], T.defaultExpanded);
            treeBoxes('tskey', (b) => {
                expect(b.titles, `${where}: Nepal hidden`).to.deep.eq(['Asia', 'China', 'Japan', 'India', 'Africa']);
                expect(b.nodes.map((n) => n.disabled), `${where}: only Japan disabled`).to.deep.eq([false, false, true, false, false]);
            });

            // forward: every enabled control once, in tree order, then out of the widget
            cy.get(input('before')).realClick({ scrollBehavior: false });
            tabTrail(ORDER.length).should('deep.eq', ORDER);
            // backward: the same stops in reverse, back to the field before the tree
            tabTrail(ORDER.length, { reverse: true }).should('deep.eq', [...ORDER.slice(0, -1).reverse(), 'before:input']);

            // every stop shows its ring: the checkbox a box-shadow ring, the toggle an outline
            focusedNode().then((f) => expect(f.id, `${where}: back on the field before the tree`).to.eq('before:input'));
            cy.realPress('Tab');
            focusedNode().then((f) => {
                expect(f.id, `${where}: first stop`).to.eq('tskey:toggle:Asia');
                expect(f.focusVisible, `${where}: toggle focus-visible`).to.eq(true);
                expect(f.outline, `${where}: toggle outline`).to.eq(T.toggleOutline);
            });
            cy.realPress('Tab');
            cy.realPress('Tab');
            cy.realPress('Tab');
            focusedNode().then((f) => {
                expect(f.id, `${where}: China checkbox`).to.eq('tskey:check:China');
                expect(f.focusVisible, `${where}: checkbox focus-visible`).to.eq(true);
                expect(f.spread, `${where}: checkbox ring`).to.be.gte(T.checkboxRingSpread);
            });

            // Space on China's checkbox selects China and its child; Space again clears it
            cy.realPress('Space');
            expectProbe(['china', 'beijing'], T.defaultExpanded);
            treeBoxes('tskey', (b) =>
                expect(b.nodes.filter((n) => n.painted).map((n) => n.title), `${where}: China painted checked`).to.deep.eq(['China'])
            );
            focusedNode().then((f) => expect(f.id, `${where}: focus stays on the checkbox`).to.eq('tskey:check:China'));
            cy.realPress('Space');
            expectProbe([], T.defaultExpanded);

            // Enter on China's toggle expands it; Beijing joins the order right after China
            cy.realPress(['Shift', 'Tab']);
            focusedNode().then((f) => expect(f.id, `${where}: back on China toggle`).to.eq('tskey:toggle:China'));
            cy.realPress('Enter');
            expectProbe([], ['asia', 'china']);
            tabTrail(3).should('deep.eq', ['tskey:check:China', 'tskey:check:Beijing', 'tskey:check:India']);
            // Enter again collapses it (restores the start state)
            cy.realPress(['Shift', 'Tab']);
            cy.realPress(['Shift', 'Tab']);
            cy.realPress(['Shift', 'Tab']);
            focusedNode().then((f) => expect(f.id, `${where}: China toggle again`).to.eq('tskey:toggle:China'));
            cy.realPress('Enter');
            expectProbe([], T.defaultExpanded);
        };

        moveMouseAway();
        cy.openApp('', undefined, undefined, treeSelectSelector.root('tskey'));
        cy.get('[data-cy="query-manager-toggle-button"]').click();
        run('editor');

        moveMouseAway();
        openTreeAppInViewer(treeSelectSelector.root('tskey'));
        run('viewer');
    });

    // ── TreeSelect-QA-001: Space behaves like one click (KNOWN PRODUCT BUG — red) ──
    // Pointer control first: a click on India's row (the input itself is pointer-events:none, TreeSelectCheckbox.jsx:76)
    // selects it once. Then Space on Africa's focused checkbox: the native click it dispatches bubbles to the row's
    // onClick (TreeSelect.jsx:266-272), which preventDefault()s it — the browser reverts the native `checked` — and calls
    // handleCustomCheck a second time next to the input's onChange (TreeSelect.jsx:286-289).
    it('[TreeSelect-QA-001] Space on a focused node checkbox selects it exactly like a click: native checked state, painted tick, exposed value, and one On check + one On change', () => {
        addTreeSelectsViaApi([
            { type: 'TextInput', name: 'before', layout: { top: 10, left: 2, width: 10, height: 40 } },
            {
                name: 'tskey',
                layout: { top: 60, left: 2, width: 12, height: 200 },
                properties: { options: { value: keyboardTree() } },
                // treeSelect.js:131-135
                events: [counterEvent('onCheck', 'checks'), counterEvent('onUnCheck', 'unchecks'), counterEvent('onChange', 'changes')],
            },
            probeText('tskey'),
            counterText('checkcount', 'checks', { top: 390, left: 2 }),
            counterText('uncheckcount', 'unchecks', { top: 390, left: 12 }),
            counterText('changecount', 'changes', { top: 390, left: 22 }),
        ]);
        moveMouseAway();
        openTreeAppInViewer(treeSelectSelector.root('tskey'));
        const node = (b, title) => b.nodes.find((n) => n.title === title);

        // control: pointer on India's row
        cy.get(treeSelectSelector.nodes('tskey'))
            .filter((_, li) => li.querySelector(':scope > .rct-text .rct-title').textContent.trim() === 'India')
            .find('.rct-title > div')
            .realClick({ scrollBehavior: false });
        expectProbe(['india'], T.defaultExpanded);
        treeBoxes('tskey', (b) => {
            expect(node(b, 'India').painted, 'click: India painted').to.eq(true);
            expect(node(b, 'India').checked, 'click: India native checked').to.eq(true);
        });
        expectCounter('checkcount', 'checks', 1);
        expectCounter('changecount', 'changes', 1);
        moveMouseAway();

        // keyboard: focus Africa's checkbox with Tab (before → Asia toggle, Asia, China toggle, China, India, Africa)
        cy.get(input('before')).realClick({ scrollBehavior: false });
        tabTrail(6).then((stops) => expect(stops[5], 'on Africa').to.eq('tskey:check:Africa'));
        cy.realPress('Space');
        expectProbe(['india', 'africa'], T.defaultExpanded);
        // one combined read so a failure shows every symptom at once
        cy.get(treeSelectSelector.root('tskey')).should(() => {
            const text = (n) => Cypress.$(commonWidgetSelector.draggableWidget(n)).text().trim();
            const li = [...Cypress.$(treeSelectSelector.nodes('tskey'))].find(
                (el) => el.querySelector(':scope > .rct-text .rct-title').textContent.trim() === 'Africa'
            );
            const box = li.querySelector('input[data-cy="checkbox-input"]');
            expect(
                {
                    painted: getComputedStyle(box.nextElementSibling).opacity === '1',
                    nativeChecked: box.checked,
                    checks: text('checkcount'),
                    changes: text('changecount'),
                    unchecks: text('uncheckcount'),
                },
                'Space on Africa: painted tick, native checked (what assistive tech reads), event counts'
            ).to.deep.eq({ painted: true, nativeChecked: true, checks: 'checks:2', changes: 'changes:2', unchecks: 'unchecks:0' });
        });
    });

    // ── TreeSelect-QA-001: disabled / hidden widget out of the tab order ─────
    it('[TreeSelect-QA-001] A disabled Tree Select offers no checkbox to the keyboard and a hidden one no stop at all; the enabled tree after them is still reached', () => {
        addTreeSelectsViaApi([
            { type: 'TextInput', name: 'before', layout: { top: 10, left: 2, width: 10, height: 40 } },
            {
                name: 'tsdisabled',
                layout: { top: 60, left: 2, width: 12, height: 200 },
                properties: { disabledState: { value: '{{true}}' } }, // treeSelect.js:96-101
            },
            {
                name: 'tshidden',
                layout: { top: 270, left: 2, width: 12, height: 200 },
                properties: { visibility: { value: '{{false}}' } }, // treeSelect.js:83-88
            },
            {
                name: 'tsafter',
                layout: { top: 480, left: 2, width: 12, height: 100 },
                properties: { options: { value: [opt('Africa', 'africa')] } },
            },
        ]);
        moveMouseAway();
        openTreeAppInViewer(treeSelectSelector.root('tsafter'));

        treeBoxes('tsdisabled', (b) => {
            expect(b.titles, 'disabled tree rendered').to.deep.eq(T.defaultTopTitles);
            b.nodes.forEach((n) => expect(n.disabled, `${n.title}: checkbox natively disabled`).to.eq(true));
        });
        treeBoxes('tshidden', (b) => expect(b.rootDisplay, 'hidden tree').to.eq('none'));

        // walk until the enabled tree takes focus: no checkbox of the disabled tree and nothing of the hidden one
        cy.get(input('before')).realClick({ scrollBehavior: false });
        tabTrail(8).then((stops) => {
            const reached = stops.indexOf('tsafter:check:Africa');
            expect(reached, `the enabled tree is reached (${stops.join(', ')})`).to.be.gte(0);
            const between = stops.slice(0, reached);
            expect(between.filter((s) => s.startsWith('tshidden')), 'hidden tree: no stops').to.deep.eq([]);
            expect(between.filter((s) => s.startsWith('tsdisabled:check')), 'disabled tree: no checkbox stops').to.deep.eq([]);
            expect(
                between.filter((s) => !s.startsWith('tsdisabled:toggle')),
                'nothing else between the field and the enabled tree'
            ).to.deep.eq([]);
        });
    });

    // ── TreeSelect-QA-001: focus scrolls a fixed-height tree ─────────────────
    it('[TreeSelect-QA-001] Tabbing through a tall fixed-height tree scrolls every focused node into view, down to the last node and back up', () => {
        const all = [
            opt('Asia', 'asia', { expanded: true }, [
                opt('China', 'china', { expanded: true }, [opt('Beijing', 'beijing'), opt('Shanghai', 'shanghai')]),
                opt('Japan', 'japan'),
                opt('India', 'india', { expanded: true }, [opt('Delhi', 'delhi'), opt('Mumbai', 'mumbai'), opt('Bengaluru', 'bengaluru')]),
            ]),
            opt('Europe', 'europe', { expanded: true }, [opt('France', 'france'), opt('Spain', 'spain'), opt('England', 'england')]),
            opt('Africa', 'africa'),
        ];
        const ORDER = [
            'toggle:Asia', 'check:Asia', 'toggle:China', 'check:China', 'check:Beijing', 'check:Shanghai', 'check:Japan',
            'toggle:India', 'check:India', 'check:Delhi', 'check:Mumbai', 'check:Bengaluru',
            'toggle:Europe', 'check:Europe', 'check:France', 'check:Spain', 'check:England', 'check:Africa',
        ].map((s) => `tsscroll:${s}`);
        addTreeSelectsViaApi([
            { type: 'TextInput', name: 'before', layout: { top: 10, left: 2, width: 10, height: 40 } },
            { name: 'tsscroll', layout: { top: 60, left: 2, width: 12, height: 150 }, properties: { options: { value: all } } },
        ]);
        moveMouseAway();
        openTreeAppInViewer(treeSelectSelector.root('tsscroll'));
        treeBoxes('tsscroll', (b) => {
            expect(b.scrollTop, 'starts at the top').to.eq(0);
            expect(b.scrollHeight, 'rows overflow').to.be.gt(b.clientHeight + 100);
        });

        const expectInView = (f, label) => {
            expect(f.scroller, `${label}: inside the tree`).to.not.eq(null);
            expect(f.rect.top, `${label}: top in view`).to.be.gte(f.scroller.top - 0.5);
            expect(f.rect.bottom, `${label}: bottom in view`).to.be.lte(f.scroller.bottom + 0.5);
        };
        cy.get(input('before')).realClick({ scrollBehavior: false });
        ORDER.forEach((id) => {
            cy.realPress('Tab');
            focusedNode().then((f) => {
                expect(f.id, 'tab stop').to.eq(id);
                expectInView(f, id);
            });
        });
        treeBoxes('tsscroll', (b) => expect(b.scrollTop, 'scrolled down to Africa').to.be.closeTo(b.scrollHeight - b.clientHeight, 2));

        [...ORDER].reverse().slice(1).forEach((id) => {
            cy.realPress(['Shift', 'Tab']);
            focusedNode().then((f) => {
                expect(f.id, 'shift+tab stop').to.eq(id);
                expectInView(f, id);
            });
        });
        treeBoxes('tsscroll', (b) => expect(b.scrollTop, 'back near the top').to.be.lte(T.rootPaddingY * 2 + 2));
    });
});
