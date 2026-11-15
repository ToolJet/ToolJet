/**
 * SPEC — Navigation — userflow facet.
 * FOR AI: TESTING.md browser scenario (a multi-step real-pointer interaction in the Inspector):
 *   Navigation-BRW-002 — dragging a menu item or group in the Inspector's tree reorders it, including moving it
 *                        into or out of a group; here: real @dnd-kit pointer drags on the Content tree, each
 *                        released only once the tree's projection shows the intended drop, then checked in the
 *                        Inspector, on the editor canvas, after a reload and in the running app (row + group menu).
 * Tree: Inspector Components/Navigation/components/Tree/SortableTree.jsx on frontend/src/_ui/SortableTree
 * (single-level: groups stay top level, items nest one level deep — utilities.js getProjection); the drop calls
 * useMenuItemsManager.js:311-315 handleReorder → properties.menuItems.
 * Helpers: addNavigationsViaApi, openNavigationAppInViewer, openEditorSidebar, inspectorTree, dragInspectorRow,
 * expectTopLevelRow, expectGroupMenu.
 */
import { fake } from "Fixtures/fake";
import { navigationSelector } from "Selectors/appBuilder/components/navigation";
import { navigationText } from "Texts/appBuilder/components/navigation";
import { openEditorSidebar } from "Support/utils/commonWidget";
import {
    addNavigationsViaApi,
    openNavigationAppInViewer,
    inspectorTree,
    dragInspectorRow,
    expectTopLevelRow,
    expectGroupMenu,
} from "Support/utils/appBuilder/components/navigation";

const T = navigationText;
const NAV = 'navdnd';

const openTree = () => {
    openEditorSidebar(NAV);
    cy.get(navigationSelector.inspectorList).should('be.visible');
};
const expectTree = (rows, context) => inspectorTree((r) => expect(r, `Inspector tree ${context}`).to.deep.eq(rows));
// after a reload of the editor the saved menu comes back in the same tree
const expectSavedInEditor = (rows, topLevel) => {
    cy.reload();
    cy.get(navigationSelector.root(NAV), { timeout: 30000 }).should('be.visible');
    expectTopLevelRow(NAV, topLevel, 'after reload');
    openTree();
    expectTree(rows, 'after reload');
};

describe('Navigation — userflow facet', { testIsolation: false }, () => {
    beforeEach(() => {
        cy.apiLogin();
        cy.apiCreateApp(`${fake.companyName}-Navigation-userflow-${Cypress._.uniqueId()}`);
        // the default menu (navigation.js:241-290): item1, item2, group1[item3, item4]
        addNavigationsViaApi([{ name: NAV, layout: { top: 40, left: 2, width: 20, height: 60 } }]);
        cy.openApp('', undefined, undefined, navigationSelector.root(NAV));
        cy.get('[data-cy="query-manager-toggle-button"]').click();
        openTree();
        expectTree(T.defaultTree, 'before dragging');
    });

    afterEach(() => {
        cy.apiLogin();
        cy.apiDeleteApp();
    });

    it('[Navigation-BRW-002] Dragging a top-level item and a group in the Inspector reorders them on the canvas, after a reload and in the running app', () => {
        // Option 2 up one row: it now comes first
        const afterItem = [['item2', 0], ['item1', 0], ['group1', 0], ['item3', 1], ['item4', 1]];
        dragInspectorRow('item2', { rows: -1 }, afterItem);
        expectTree(afterItem, 'after dragging Option 2 up');
        expectTopLevelRow(NAV, ['item2', 'item1', 'group1'], 'after dragging Option 2 up');

        // the group up two rows: it moves to the top with both children (they are folded away while it is dragged)
        dragInspectorRow('group1', { rows: -2 }, [['group1', 0], ['item2', 0], ['item1', 0]]);
        const afterGroup = [['group1', 0], ['item3', 1], ['item4', 1], ['item2', 0], ['item1', 0]];
        expectTree(afterGroup, 'after dragging Group 1 to the top');
        expectTopLevelRow(NAV, ['group1', 'item2', 'item1'], 'after dragging Group 1 to the top');

        expectSavedInEditor(afterGroup, ['group1', 'item2', 'item1']);

        openNavigationAppInViewer(navigationSelector.root(NAV));
        expectTopLevelRow(NAV, ['group1', 'item2', 'item1'], 'running app');
        expectGroupMenu(NAV, 'group1', ['item3', 'item4']);
    });

    it('[Navigation-BRW-002] Dragging an item into a group and a group child out of it moves them between the top-level row and the group menu', () => {
        // Option 1 down onto the group's children: it becomes the group's second child
        const intoGroup = [['item2', 0], ['group1', 0], ['item3', 1], ['item1', 1], ['item4', 1]];
        dragInspectorRow('item1', { rows: 3 }, intoGroup);
        expectTree(intoGroup, 'after dragging Option 1 into Group 1');
        expectTopLevelRow(NAV, ['item2', 'group1'], 'after dragging Option 1 into Group 1');

        // Option 4 up and left, above everything: it leaves the group and becomes the first top-level item
        const outOfGroup = [['item4', 0], ['item2', 0], ['group1', 0], ['item3', 1], ['item1', 1]];
        dragInspectorRow('item4', { rows: -4, dx: -30 }, outOfGroup);
        expectTree(outOfGroup, 'after dragging Option 4 out of Group 1');
        expectTopLevelRow(NAV, ['item4', 'item2', 'group1'], 'after dragging Option 4 out of Group 1');

        expectSavedInEditor(outOfGroup, ['item4', 'item2', 'group1']);

        openNavigationAppInViewer(navigationSelector.root(NAV));
        expectTopLevelRow(NAV, ['item4', 'item2', 'group1'], 'running app');
        expectGroupMenu(NAV, 'group1', ['item3', 'item1']);
    });
});
