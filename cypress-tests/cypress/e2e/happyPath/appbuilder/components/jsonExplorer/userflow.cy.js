/**
 * SPEC — JSON Explorer — userflow facet (real pointer / keyboard interaction).
 * FOR AI: TESTING.md browser scenario (frontend/ee/test/app-builder/widgets/JSONExplorer):
 *   JSONExplorer-BRW-001 — nodes expand and collapse by pointer (arrow, key label and item string all toggle —
 *                          react-json-tree JSONNestedNode handleClick); a disabled explorer is dimmed and does not
 *                          respond (Disable property bound both ways + the setDisable CSA); and the D-04
 *                          accessibility gap is recorded: no node is keyboard-reachable and none is announced as a tree.
 * Disabled: RenderWidget adds `disabled` to `.canvas-component` from the exposed isDisabled or the property
 * (RenderWidget.jsx:160-165,328-334) and theme.scss:3851-3854 gives it pointer-events:none + opacity 0.5 — the
 * runtime itself never reads disabledState (TESTING.md research finding), so that class is the whole block.
 * Helpers: addJsonExplorersViaApi, explorerMetrics, readExplorerMetrics, toggleNode, openLinkAppInViewer, tabFrom,
 * csaEvent.
 */
import { fake } from "Fixtures/fake";
import { jsonExplorerSelector as SEL } from "Selectors/appBuilder/components/jsonExplorer";
import { jsonExplorerText } from "Texts/appBuilder/components/jsonExplorer";
import { openLinkAppInViewer } from "Support/utils/appBuilder/components/link";
import { tabFrom } from "Support/utils/appBuilder/components/html";
import { csaEvent } from "Support/utils/appBuilder/components/dateTimeCommon";
import {
    addJsonExplorersViaApi,
    explorerMetrics,
    readExplorerMetrics,
    toggleNode,
} from "Support/utils/appBuilder/components/jsonExplorer";

const T = jsonExplorerText;
const D = T.disabled;
const COLLAPSED = { shouldExpandEntireJSON: { value: '{{false}}' } }; // jsonExplorer.js:37-42 — start with the root closed
// root → list (3 strings) + obj (x + deep → y). Fully open: root, list, a, b, c, obj, x, deep, y = 9 rows.
const DOC = `{{{ list: ['a1', 'b1', 'c1'], obj: { x: 1, deep: { y: 2 } } }}}`; // dynamic

const expectNodes = (name, count, label) => explorerMetrics(name, (m) => expect(m.nodes, `${name}: ${label}`).to.eq(count));
// React handles the click synchronously; give a blocked click the same chance to land before asserting "no change"
const SETTLE_MS = 300;

// all symptoms of the disabled state in one object, so a regression reports every broken facet at once
const stateOf = (m, doc) => {
    const hit = doc.elementFromPoint(m.widget.left + m.widget.width / 2, m.widget.top + 12);
    const widget = doc.querySelector(SEL.draggableWidget(m.name));
    return {
        disabledClass: m.widgetClass.split(/\s+/).includes(D.className),
        opacity: m.widgetOpacity,
        pointerEvents: m.widgetPointerEvents,
        pointerReaches: !!hit && widget.contains(hit),
    };
};
const ENABLED = { disabledClass: false, opacity: '1', pointerEvents: 'auto', pointerReaches: true };
const DISABLED = { disabledClass: true, opacity: D.opacity, pointerEvents: D.pointerEvents, pointerReaches: false }; // source: theme.scss:3852-3853
const expectState = (name, expected, label) =>
    cy.document().then((doc) => explorerMetrics(name, (m) => expect(stateOf(m, doc), `${name} ${label}`).to.deep.eq(expected)));

describe('JSON Explorer — userflow facet', { testIsolation: false }, () => {
    beforeEach(() => {
        cy.apiLogin();
        cy.apiCreateApp(`${fake.companyName}-JSONExplorer-userflow-${Cypress._.uniqueId()}`);
    });

    afterEach(() => {
        cy.apiDeleteApp();
    });

    // ── JSONExplorer-BRW-001 ─────────────────────────────────────────────────
    it('[JSONExplorer-BRW-001] Clicking a collapsed node reveals its children and clicking again hides them (arrow, label and item string)', () => {
        addJsonExplorersViaApi([
            { name: 'tree', layout: { top: 40, left: 2, width: 14, height: 400 }, properties: { ...COLLAPSED, value: { value: DOC } } },
        ]);
        openLinkAppInViewer(SEL.tree('tree'));

        // closed root: one row, no child keys rendered
        explorerMetrics('tree', (m) => {
            expect(m.nodes, 'root only').to.eq(1);
            expect(m.labels, 'only the root label').to.deep.eq([T.defaultRootLabel]);
        });

        // root label opens the top level: list + obj, still closed
        toggleNode('tree', 'root', 'label');
        explorerMetrics('tree', (m) => {
            expect(m.labels, 'top-level keys revealed').to.deep.eq([T.defaultRootLabel, 'list:', 'obj:']);
            expect(m.text, 'list items still hidden').to.not.contain('a1');
        });

        // list arrow opens the array: its three items appear
        toggleNode('tree', 'list', 'arrow');
        explorerMetrics('tree', (m) => {
            expect(m.nodes, 'list open').to.eq(6);
            expect(m.text).to.contain('"a1"').and.contain('"c1"');
        });

        // obj item string ("{} 2 keys") opens the object, then deep's label opens the nested object
        toggleNode('tree', 'obj', 'itemString');
        expectNodes('tree', 8, 'obj open');
        toggleNode('tree', 'deep', 'label');
        explorerMetrics('tree', (m) => {
            expect(m.nodes, 'fully open').to.eq(9);
            expect(m.labels).to.include('y:');
        });

        // clicking again hides: list arrow closes the array, obj label closes the object (and its nested child)
        toggleNode('tree', 'list', 'arrow');
        explorerMetrics('tree', (m) => {
            expect(m.nodes, 'list closed').to.eq(6);
            expect(m.text, 'list items hidden').to.not.contain('a1');
        });
        toggleNode('tree', 'obj', 'label');
        explorerMetrics('tree', (m) => {
            expect(m.labels, 'obj children hidden').to.deep.eq([T.defaultRootLabel, 'list:', 'obj:']);
        });
        toggleNode('tree', 'root', 'itemString');
        expectNodes('tree', 1, 'root closed again');
    });

    it('[JSONExplorer-BRW-001] A disabled explorer is dimmed and does not respond to the pointer (Disable property and setDisable)', () => {
        const lockWord = fake.firstName.toLowerCase().replace(/\W/g, '').slice(0, 8) || 'lock'; // dynamic
        addJsonExplorersViaApi([
            { type: 'TextInput', name: 'lock', layout: { top: 20, left: 2, width: 10, height: 40 } },
            {
                name: 'byprop',
                layout: { top: 80, left: 2, width: 14, height: 300 },
                properties: { ...COLLAPSED, value: { value: DOC }, disabledState: { value: `{{components.lock.value === "${lockWord}"}}` } },
            },
            { name: 'bycsa', layout: { top: 80, left: 20, width: 14, height: 300 }, properties: { ...COLLAPSED, value: { value: DOC } } },
            {
                type: 'Button',
                name: 'disablebtn',
                layout: { top: 20, left: 20, width: 6, height: 40 },
                properties: { text: { value: 'Disable' } },
                events: [csaEvent('onClick', 'bycsa', 'setDisable', [{ handle: 'disable', value: '{{true}}' }])], // jsonExplorer.js:173-177
            },
        ]);
        openLinkAppInViewer(SEL.tree('bycsa'));

        // enabled baseline — the blocked-click checks below only mean something because a click works here
        expectState('byprop', ENABLED, 'enabled');
        expectState('bycsa', ENABLED, 'enabled');
        toggleNode('byprop', 'root');
        expectNodes('byprop', 3, 'enabled: click opens the root');
        toggleNode('byprop', 'root');
        expectNodes('byprop', 1, 'enabled: click closes it again');

        // Disable property (bound): dimmed, the pointer passes through, clicks change nothing
        cy.get(SEL.textInput('lock')).type(lockWord);
        expectState('byprop', DISABLED, 'disabled by property');
        toggleNode('byprop', 'root', 'label');
        toggleNode('byprop', 'root', 'arrow');
        cy.wait(SETTLE_MS);
        expectNodes('byprop', 1, 'disabled: clicks did not open the root');

        // …and both ways: clearing the bound value re-enables it in the same running app
        cy.get(SEL.textInput('lock')).clear();
        expectState('byprop', ENABLED, 're-enabled');
        toggleNode('byprop', 'root');
        expectNodes('byprop', 3, 're-enabled: click opens the root');

        // setDisable CSA: the same inert state through the exposed isDisabled route — an open tree stays as it is
        toggleNode('bycsa', 'root');
        expectNodes('bycsa', 3, 'csa target open before disabling');
        cy.get(SEL.button('disablebtn')).click();
        expectState('bycsa', DISABLED, 'disabled by setDisable');
        toggleNode('bycsa', 'list', 'label');
        toggleNode('bycsa', 'root', 'label');
        cy.wait(SETTLE_MS);
        expectNodes('bycsa', 3, 'setDisable: neither opening nor closing responds');
    });

    // D-04 (approved exclusion, raised as separate accessibility work): this test RECORDS the measured gap so it stays
    // visible. When roles + keyboard handling land, this test is expected to fail — update it to assert the fix.
    it('[JSONExplorer-BRW-001] Records the D-04 gap: no node is reachable by keyboard and none is announced as a tree', () => {
        addJsonExplorersViaApi([
            { type: 'TextInput', name: 'before', layout: { top: 20, left: 2, width: 10, height: 40 } },
            { name: 'tree', layout: { top: 80, left: 2, width: 14, height: 340 }, properties: { value: { value: DOC } } },
            { type: 'TextInput', name: 'after', layout: { top: 440, left: 2, width: 10, height: 40 } },
        ]);
        openLinkAppInViewer(SEL.tree('tree'));

        // fully expanded (definition default shouldExpandEntireJSON true — jsonExplorer.js:194): every node is rendered,
        // yet nothing in it is focusable and nothing carries a role (no tree / treeitem / group)
        explorerMetrics('tree', (m) => {
            expect(m.nodes, 'tree rendered open').to.eq(9);
            expect({ focusables: m.focusables, roles: m.roles }, 'D-04: no keyboard target, no ARIA').to.deep.eq({ focusables: 0, roles: [] });
        });
        // Tab goes straight from the input above to the input below — the tree is skipped
        tabFrom(SEL.textInput('before'), 1).should('deep.equal', ['after']);
        // clicking a node does not give it focus either, so no key can operate it afterwards
        toggleNode('tree', 'list', 'label');
        expectNodes('tree', 6, 'mouse still works');
        cy.document().should((doc) => {
            const w = doc.querySelector(SEL.draggableWidget('tree'));
            expect(w.contains(doc.activeElement), 'focus not inside the tree after a click').to.eq(false);
        });
        readExplorerMetrics('tree').then((before) => {
            ['Enter', 'Space', 'ArrowRight'].forEach((key) => cy.realPress(key));
            cy.wait(SETTLE_MS);
            expectNodes('tree', before.nodes, 'keys change nothing');
        });
    });
});
