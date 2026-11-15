/**
 * SPEC — Key Value Pair — inspector facet (scenario-scoped).
 * FOR AI: TESTING.md browser scenario (D-03, QA-owned):
 *   KeyValuePair-BRW-001 — the Inspector's FieldManager adds, removes and reorders fields and the canvas follows
 *                          immediately; the change is saved (and a removed field is not regenerated from data).
 * Runtime: RightSideBar/Inspector/Components/KeyValuePair/** (FieldsList.jsx, FieldItem.jsx, useFieldManager.js →
 * shared useListItemManager). Every effect is asserted on the real canvas + inspector list.
 * Helpers: openEditorSidebar, addKeyValuePairsViaApi, kvField.
 */
import { fake } from "Fixtures/fake";
import { keyValuePairSelector, keyValuePairInspectorSelector } from "Selectors/appBuilder/components/keyValuePair";
import { keyValuePairText } from "Texts/appBuilder/components/keyValuePair";
import { openEditorSidebar } from "Support/utils/commonWidget";
import { addKeyValuePairsViaApi, kvField } from "Support/utils/appBuilder/components/keyValuePair";

const W = 'kv1';
const T = keyValuePairText;
const S = keyValuePairSelector;
const INS = keyValuePairInspectorSelector;

// three fields whose data keys stay in `data` — a removed field could only come back through auto-generation
const FIELDS = [
    { key: 'a', name: 'Alpha' },
    { key: 'b', name: 'Beta' },
    { key: 'c', name: 'Gamma' },
];
const NAMES = FIELDS.map((f) => f.name);

const expectCanvasLabels = (labels) =>
    cy.get(S.container(W), { timeout: 30000 }).should(($root) =>
        expect(Cypress._.map($root[0].querySelectorAll('.key-value-label'), 'textContent'), 'canvas rows').to.deep.eq(labels));
const expectFieldList = (labels) =>
    cy.get(INS.fieldItems).should(($items) =>
        expect(Cypress._.map($items, (el) => el.getAttribute('data-cy').replace(/^field-/, '')), 'inspector fields').to.deep.eq(labels));
const openFields = () => {
    openEditorSidebar(W);
    cy.get(INS.addField).scrollIntoView().should('be.visible');
};
const saveAndReload = () => {
    cy.waitForAutoSave();
    cy.reload();
    cy.get(S.rows(W), { timeout: 30000 }).should('exist');
};

describe('Key Value Pair — inspector facet', { testIsolation: false }, () => {
    beforeEach(() => {
        cy.apiLogin();
        cy.apiCreateApp(`${fake.companyName}-KeyValuePair-inspector-${Cypress._.uniqueId()}`);
        addKeyValuePairsViaApi([
            {
                name: W,
                layout: { top: 60, left: 6, width: 14, height: 300 },
                properties: {
                    data: { value: `{{ ${JSON.stringify(Object.fromEntries(FIELDS.map((f) => [f.key, fake.firstName.slice(0, 8)])))} }}` },
                    fields: { value: FIELDS.map((f) => kvField(f.key, { name: f.name })) },
                },
            },
        ]);
        cy.openApp('', undefined, undefined, S.rows(W));
        expectCanvasLabels(NAMES);
        openFields();
        expectFieldList(NAMES);
    });

    afterEach(() => {
        cy.apiDeleteApp();
    });

    // ── KeyValuePair-BRW-001 (add) ───────────────────────────────────────────
    // useListItemManager addItem: name/key `new_field<n>` (first free n), fieldType 'string', appended.
    it('[KeyValuePair-BRW-001] Add new field appends a row to the canvas immediately and it is saved', () => {
        const added1 = T.newFieldName(1);
        const added2 = T.newFieldName(2);
        cy.get(INS.addField).click();
        expectFieldList([...NAMES, added1]);
        expectCanvasLabels([...NAMES, added1]);
        cy.get(INS.addField).click();
        expectCanvasLabels([...NAMES, added1, added2]);

        saveAndReload();
        expectCanvasLabels([...NAMES, added1, added2]);
        openFields();
        expectFieldList([...NAMES, added1, added2]);
    });

    // ── KeyValuePair-BRW-001 (remove) ────────────────────────────────────────
    // FieldItem.jsx:56-58 → useFieldManager removeField: the field leaves `fields` and its key joins
    // fieldDeletionHistory in the same save, so auto-generation (useAutoGenerateFields) never brings it back.
    it('[KeyValuePair-BRW-001] Delete removes the field from the canvas immediately and it stays removed after reload', () => {
        const [first, victim, last] = NAMES;
        cy.get(INS.deleteButton(victim)).should('not.exist'); // hover-only (List.jsx:148)
        cy.get(INS.fieldItem(victim)).realHover();
        cy.get(INS.deleteButton(victim)).should('be.visible').click();

        expectFieldList([first, last]);
        expectCanvasLabels([first, last]);

        // its key is still in `data`, yet the saved app does not regenerate it
        saveAndReload();
        expectCanvasLabels([first, last]);
        openFields();
        expectFieldList([first, last]);
    });

    // ── KeyValuePair-BRW-001 (reorder) ───────────────────────────────────────
    // FieldsList.jsx DragDropContext onDragEnd → reorderFields → paramUpdated. Driven with react-beautiful-dnd's
    // keyboard sensor (focus the drag handle, Space lift, ArrowDown, Space drop) — the same onDragEnd as a mouse drag.
    it('[KeyValuePair-BRW-001] Dragging a field reorders the canvas rows immediately and the order is saved', () => {
        const [a, b, c] = NAMES;
        cy.get(INS.dragHandle(kvField(FIELDS[0].key).id)).focus();
        cy.realPress('Space'); // lift
        cy.wait(300); // rbd lift animation
        cy.realPress('ArrowDown'); // one slot down
        cy.wait(300); // rbd move animation
        cy.realPress('Space'); // drop

        expectFieldList([b, a, c]);
        expectCanvasLabels([b, a, c]);

        saveAndReload();
        expectCanvasLabels([b, a, c]);
        openFields();
        expectFieldList([b, a, c]);
    });
});
