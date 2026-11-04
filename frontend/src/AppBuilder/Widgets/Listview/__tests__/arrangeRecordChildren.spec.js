/**
 * Where a ListView record's children go when the Layout changes: a row in List, a vertical stack in Grid.
 * Contract: frontend/ee/test/app-builder/widgets/Listview/TESTING.md (Listview-GRID-001..).
 */
import { arrangeRecordChildren } from '../arrangeRecordChildren';

const kid = (id, componentName, layout) => ({
  id,
  componentName,
  layout: { top: 0, left: 0, width: 6, height: 30, ...layout },
});

// Image, Text and Button as dropped into a list row.
const ROW = [
  kid('img', 'Image', { top: 10, left: 3, width: 6, height: 60 }),
  kid('txt', 'Text', { top: 25, left: 11, width: 12, height: 30 }),
  kid('btn', 'Button', { top: 25, left: 25, width: 17, height: 30 }),
];

describe('arrangeRecordChildren', () => {
  test('[Listview-GRID-001] Grid stacks the children top to bottom at the left edge; Text takes the card width, the rest keep their own', () => {
    // Break this catches: children left in a row, or an Image and a Button stretched to a centred avatar and a bar.
    const layouts = arrangeRecordChildren(ROW, { toMode: 'grid', fromMode: 'list', recordHeight: 150 });

    expect(layouts.img).toMatchObject({ left: 1, width: 6, height: 60 });
    expect(layouts.txt).toMatchObject({ left: 1, width: 41, height: 30 });
    expect(layouts.btn).toMatchObject({ left: 1, width: 17, height: 30 });
    expect(layouts.img.top).toBeLessThan(layouts.txt.top);
    expect(layouts.txt.top).toBeGreaterThanOrEqual(layouts.img.top + 60);
    expect(layouts.btn.top).toBeGreaterThanOrEqual(layouts.txt.top + 30);
    expect(layouts.btn.top + 30).toBeLessThanOrEqual(150);
  });

  test('[Listview-GRID-001] a child the user moved to the left of the row is stacked in the order it showed', () => {
    // Break this catches: stacking in creation order, which ignores a rearranged row.
    const moved = [ROW[0], ROW[1], { ...ROW[2], layout: { ...ROW[2].layout, left: 0, top: 25 } }];
    const row = moved.map((child) =>
      child.id === 'img' ? { ...child, layout: { ...child.layout, left: 20 } } : child
    );

    const layouts = arrangeRecordChildren(row, { toMode: 'grid', fromMode: 'list', recordHeight: 150 });

    const order = Object.keys(layouts).sort((a, b) => layouts[a].top - layouts[b].top);
    expect(order).toEqual(['btn', 'txt', 'img']);
  });

  test('[Listview-GRID-002] List puts the children back in one row, left to right, with the dropped widths', () => {
    // Break this catches: children left stacked and full width in a one-row list.
    const stacked = arrangeRecordChildren(ROW, { toMode: 'grid', fromMode: 'list', recordHeight: 150 });
    const asStacked = ROW.map((child) => ({ ...child, layout: stacked[child.id] }));

    const layouts = arrangeRecordChildren(asStacked, { toMode: 'list', fromMode: 'grid', recordHeight: 80 });

    expect(layouts.img).toEqual({ top: 10, left: 3, width: 6, height: 60 });
    expect(layouts.txt).toEqual({ top: 25, left: 11, width: 12, height: 30 });
    expect(layouts.btn).toEqual({ top: 25, left: 25, width: 17, height: 30 });
  });

  test('[Listview-GRID-002] more children than fit keep their order and stay inside the 43 columns', () => {
    // Break this catches: widths that run past the right edge of the row.
    const many = Array.from({ length: 6 }, (_, index) =>
      kid(`c${index}`, 'Container', { top: index * 40, left: 1, width: 41 })
    );

    const layouts = arrangeRecordChildren(many, { toMode: 'list', fromMode: 'grid', recordHeight: 80 });

    const ordered = many.map((child) => layouts[child.id]);
    ordered.forEach((layout, index) => {
      expect(layout.left + layout.width).toBeLessThanOrEqual(43);
      expect(layout.width).toBeGreaterThanOrEqual(1);
      if (index > 0) expect(layout.left).toBeGreaterThanOrEqual(ordered[index - 1].left + ordered[index - 1].width);
    });
  });

  test('[Listview-GRID-001] Image and Button keep their pixel width when the columns get narrower, Text takes the card', () => {
    // Break this catches: keeping the width in columns, so a 17-column Button becomes a 75px stub in a narrow card.
    const layouts = arrangeRecordChildren(ROW, {
      toMode: 'grid',
      fromMode: 'list',
      recordHeight: 150,
      fromColumnPx: 10,
      toColumnPx: 4,
    });

    expect(layouts.img.width).toBe(15);
    expect(layouts.btn.width).toBe(41);
    expect(layouts.txt.width).toBe(41);
    expect(layouts.img.left).toBe(1);
  });

  test('[Listview-GRID-001] a child keeps its pixel width list to grid to list, within one column', () => {
    // Break this catches: a width that drifts or resets to the dropped width on the way back.
    const sized = [
      kid('b', 'Button', { top: 25, left: 3, width: 8 }),
      kid('i', 'Image', { top: 5, left: 20, width: 5 }),
    ];
    const stacked = arrangeRecordChildren(sized, {
      toMode: 'grid',
      fromMode: 'list',
      recordHeight: 150,
      fromColumnPx: 10,
      toColumnPx: 3,
    });
    expect(stacked.b.width).toBe(27);
    expect(stacked.i.width).toBe(17);

    const row = arrangeRecordChildren(
      sized.map((child) => ({ ...child, layout: stacked[child.id] })),
      { toMode: 'list', fromMode: 'grid', recordHeight: 80, fromColumnPx: 3, toColumnPx: 10 }
    );

    expect(Math.abs(row.b.width - 8)).toBeLessThanOrEqual(1);
    expect(Math.abs(row.i.width - 5)).toBeLessThanOrEqual(1);
  });

  test('[Listview-GRID-001] a new ListView card stacks as avatar, name, company, chip inside its 170px grid record', () => {
    // Break this catches: the Figma card turning into a row, a wrong order, or a stack taller than the grid record.
    const card = [
      kid('avatar', 'Image', { top: 20, left: 2, width: 4, height: 40 }),
      kid('name', 'Text', { top: 15, left: 7, width: 17, height: 25 }),
      kid('company', 'Text', { top: 40, left: 7, width: 17, height: 25 }),
      kid('role', 'Tags', { top: 20, left: 26, width: 16, height: 40 }),
    ];

    const layouts = arrangeRecordChildren(card, {
      toMode: 'grid',
      fromMode: 'list',
      recordHeight: 170,
      fromColumnPx: 10,
      toColumnPx: 3.2,
    });

    const order = Object.keys(layouts).sort((a, b) => layouts[a].top - layouts[b].top);
    expect(order).toEqual(['avatar', 'name', 'company', 'role']);
    Object.values(layouts).forEach((layout) => expect(layout.left).toBe(1));
    expect(layouts.name.width).toBe(41);
    expect(layouts.role.top + layouts.role.height).toBeLessThanOrEqual(170);
  });

  test('[Listview-GRID-001] a non-Text child wider than the card is capped to the card width', () => {
    // Break this catches: a child that sticks out of the card after the switch.
    const wide = [kid('c', 'Container', { width: 43 }), kid('t', 'Text', { top: 40 })];

    const layouts = arrangeRecordChildren(wide, { toMode: 'grid', fromMode: 'list', recordHeight: 150 });

    expect(layouts.c).toMatchObject({ left: 1, width: 41 });
  });

  test('[Listview-GRID-002] more children than columns stay inside the 43 columns', () => {
    // Break this catches: the 44th child placed past the right edge of the row.
    const crowd = Array.from({ length: 50 }, (_, index) => kid(`c${index}`, 'Container', { left: index % 43 }));

    const layouts = arrangeRecordChildren(crowd, { toMode: 'list', fromMode: 'grid', recordHeight: 80 });

    Object.values(layouts).forEach((layout) => expect(layout.left + layout.width).toBeLessThanOrEqual(43));
  });

  test('[Listview-GRID-003] children taller than the record keep their order and overflow rather than overlap', () => {
    // Break this catches: stacked children piled on top of each other when the card is too short.
    const tall = [kid('a', 'Image', { height: 90 }), kid('b', 'Text', { height: 90 })];

    const layouts = arrangeRecordChildren(tall, { toMode: 'grid', fromMode: 'list', recordHeight: 100 });

    expect(layouts.a.top).toBe(0);
    expect(layouts.b.top).toBe(90);
  });

  test('[Listview-GRID-004] a record with no children gives nothing to move', () => {
    // Break this catches: a crash on an empty record canvas.
    expect(arrangeRecordChildren([], { toMode: 'grid', fromMode: 'list', recordHeight: 150 })).toEqual({});
  });
});
