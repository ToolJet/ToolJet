import { canDrop, ancestorsOfSlot, enclosingModal, ownerOfSlot, parentOfSlot, slotTypeOf } from '../rules';

const id = (n) => `${n}`.padEnd(36, '0');
const LV1 = id('lv1');
const LV2 = id('lv2');
const FORM = id('form');
const MODAL = id('modal');
const BOX = id('box');

const components = {
  [LV1]: { type: 'Listview', parent: null },
  [LV2]: { type: 'Listview', parent: LV1 },
  [FORM]: { type: 'Form', parent: null },
  [MODAL]: { type: 'ModalV2', parent: null },
  [BOX]: { type: 'Container', parent: MODAL },
};

describe('slot ids', () => {
  it('maps slots to owners, types and saved parents', () => {
    expect(ownerOfSlot(`${FORM}-header`)).toBe(FORM);
    expect(ownerOfSlot('canvas')).toBeNull();
    expect(slotTypeOf(`${FORM}-footer`)).toBe('footer');
    expect(slotTypeOf('canvas')).toBe('canvas');
    expect(parentOfSlot('canvas')).toBeNull();
    expect(parentOfSlot(`${FORM}-header`)).toBe(`${FORM}-header`);
  });

  it('lists ancestors innermost first and survives a cycle', () => {
    expect(ancestorsOfSlot(LV2, components)).toEqual([LV2, LV1]);
    const cyclic = { a: { parent: 'b' }, b: { parent: 'a' } };
    expect(ancestorsOfSlot('a', cyclic)).toEqual(['a', 'b']);
  });
});

describe('canDrop', () => {
  const drop = (dragged, slotId, extra = {}) => canDrop({ dragged, slotId, components, ...extra });

  it('allows ordinary drops', () => {
    expect(drop([{ id: 'x', type: 'Button' }], 'canvas')).toEqual({ ok: true });
    expect(drop([{ type: 'Button' }], FORM)).toEqual({ ok: true });
  });

  it('refuses restricted children with the type and target in the message', () => {
    const result = drop([{ type: 'Kanban' }], FORM);
    expect(result.ok).toBe(false);
    expect(result.message).toBe('Kanban is not compatible as a child component of Form');
  });

  it('refuses container types in header and footer slots, naming the slot', () => {
    expect(drop([{ type: 'Container' }], `${FORM}-header`).message).toMatch(/of header$/);
  });

  it('refuses a third nested Listview', () => {
    expect(drop([{ type: 'Listview' }], LV1).ok).toBe(true);
    expect(drop([{ type: 'Listview' }], LV2).ok).toBe(false);
  });

  it('refuses dropping a component into itself or its descendants, silently', () => {
    expect(drop([{ id: LV1, type: 'Listview' }], LV2)).toEqual({ ok: false });
    expect(drop([{ id: LV1, type: 'Listview' }], LV1)).toEqual({ ok: false });
  });

  it('keeps module editing in the module and out of apps', () => {
    expect(drop([{ type: 'Button' }], 'canvas', { isModuleEditor: true })).toEqual({ ok: false });
    expect(drop([{ type: 'Button' }], BOX, { insideModule: true }).message).toBe(
      'Modules cannot be edited inside an app'
    );
    expect(drop([{ type: 'Button' }], BOX, { insideModule: true, isModuleEditor: true }).ok).toBe(true);
  });

  it('names each refused type once for a group', () => {
    const result = drop(
      [
        { id: 'k1', type: 'Kanban' },
        { id: 'k2', type: 'Kanban' },
        { id: 'b', type: 'Button' },
      ],
      FORM
    );
    expect(result.message).toBe('Kanban is not compatible as a child component of Form');
  });
});

describe('enclosingModal', () => {
  it('finds the modal around a slot', () => {
    expect(enclosingModal(BOX, components)).toBe(MODAL);
    expect(enclosingModal(`${MODAL}-footer`, components)).toBe(MODAL);
    expect(enclosingModal(FORM, components)).toBeNull();
  });
});
