/**
 * Undoing a duplicate (Cmd+D) or paste of a container that has children.
 *
 * Duplicate and paste add the container and its children in one call. One Cmd+Z should remove all of them,
 * the way one Cmd+Z restores all of a multi-delete. The checks after the first one pin what that call
 * already did before (redo, Form fields, FlexContainer child order), so they must keep passing.
 *
 * Everything runs against the REAL composed store; nothing here is mocked.
 */
import useStore from '@/AppBuilder/_stores/store';
import { seedApp, componentDefinition } from '@/test/app-builder';

const state = () => useStore.getState();

const PARENT_ID = '3f0c8a52-6b1e-4d7a-9c2f-1a2b3c4d5e6f';
const CHILD_A_ID = '7a1d2e3f-4b5c-4d6e-8f9a-0b1c2d3e4f5a';
const CHILD_B_ID = 'c4d5e6f7-a8b9-4c0d-9e1f-2a3b4c5d6e7f';

const child = (id, name, type, parent) => {
  const definition = componentDefinition(id, name, type);
  definition.component.parent = parent;
  return definition;
};

const pageIds = () => Object.keys(state().getCurrentPageComponents()).sort();

/** What copyPasteWidgetsUtils hands the store on Cmd+D or paste: parent first, then its children. */
const duplicate = (parentType, childType = 'Text') =>
  state().addComponentToCurrentPage(
    [
      componentDefinition(PARENT_ID, 'parent1', parentType),
      child(CHILD_A_ID, 'child1', childType, PARENT_ID),
      child(CHILD_B_ID, 'child2', childType, PARENT_ID),
    ],
    'canvas',
    { saveAfterAction: false, skipFormUpdate: true }
  );

beforeEach(() => {
  seedApp({});
  state().resetUndoRedoStack();
});

describe('undoing a duplicated container with children', () => {
  // Break this catches: each child is its own undo step, so Cmd+Z removes the children one by one and
  // leaves the empty container on the canvas until the last press.
  test('[UNDO-DUP-001] one undo removes the container and all its children', async () => {
    await duplicate('Container');
    expect(pageIds()).toEqual([CHILD_A_ID, PARENT_ID, CHILD_B_ID].sort());

    state().handleUndo();

    expect(pageIds()).toEqual([]);
    expect(state().canUndo).toBe(false);
  });

  // Break this catches: a grouped undo entry whose redo half restores only part of the group.
  test('[UNDO-DUP-002] one redo brings the container and all its children back', async () => {
    await duplicate('Container');
    state().handleUndo();

    state().handleRedo();

    expect(pageIds()).toEqual([CHILD_A_ID, PARENT_ID, CHILD_B_ID].sort());
    expect(state().getCurrentPageComponents()[CHILD_A_ID].component.parent).toBe(PARENT_ID);
    expect(state().canRedo).toBe(false);
  });

  // Break this catches: adding the components after the per-component setup, so a new Form child no
  // longer finds its new Form parent and is left out of the Form's fields.
  test('[UNDO-DUP-003] a Form added with its inputs still lists them as fields', () => {
    // Not awaited: without saving and with Form updates on, this call's promise never settles.
    state().addComponentToCurrentPage(
      [
        componentDefinition(PARENT_ID, 'form1', 'Form'),
        child(CHILD_A_ID, 'textinput1', 'TextInput', PARENT_ID),
        child(CHILD_B_ID, 'textinput2', 'TextInput', PARENT_ID),
      ],
      'canvas',
      { saveAfterAction: false }
    );

    const fieldIds = state()
      .getFormFields(PARENT_ID)
      .map((field) => field.componentId);
    expect(fieldIds).toEqual(expect.arrayContaining([CHILD_A_ID, CHILD_B_ID]));
  });

  // Break this catches: the FlexContainer child order losing a child when all are added in one step.
  test('[UNDO-DUP-004] a FlexContainer added with its children keeps both in its child order', async () => {
    await duplicate('FlexContainer');

    const childOrder =
      state().getCurrentPageComponents()[PARENT_ID].component.definition.properties.childOrder?.value ?? [];
    expect(childOrder).toEqual([CHILD_A_ID, CHILD_B_ID]);
  });

  // Break this catches: names or resolved values of the new children not registered.
  test('[UNDO-DUP-005] the new children are registered by name', async () => {
    await duplicate('Container');

    expect(state().getComponentNameIdMapping()).toEqual(
      expect.objectContaining({ parent1: PARENT_ID, child1: CHILD_A_ID, child2: CHILD_B_ID })
    );
  });
});
