import { packIdentityRows } from '../packIdentity';

// QA item 8: a selected pack component's Properties tab didn't say which component it is or which pack it comes from
// (its name, antDrawer1, is the builder's), so two packs' Drawers or Buttons looked alike. It now opens with the pack,
// as the Components panel names it, and the component's display name, as a custom library's instance already does.
describe('packIdentityRows', () => {
  test.each([
    [
      'antd',
      'Drawer',
      { displayName: 'Drawer' },
      [
        ['Pack', 'Ant Design'],
        ['Component', 'Drawer'],
      ],
    ],
    [
      'shadcn',
      'DropdownMenu',
      { displayName: 'Dropdown menu' },
      [
        ['Pack', 'Rocket 2.0'],
        ['Component', 'Dropdown menu'],
      ],
    ],
    [
      'mui',
      'KeyValue',
      { displayName: 'Key-value list' },
      [
        ['Pack', 'Material UI'],
        ['Component', 'Key-value list'],
      ],
    ],
  ])('names the %s pack and its %s', (pack, name, manifest, rows) => {
    // Break this catches: the pack's id (antd) or the component's code name shown instead of what the builder knows.
    expect(packIdentityRows(pack, name, manifest)).toEqual(rows);
  });

  test("falls back to the component's code name before its manifest loads", () => {
    // Break this catches: an empty Component row while the manifest is still loading.
    expect(packIdentityRows('antd', 'Drawer', undefined)).toEqual([
      ['Pack', 'Ant Design'],
      ['Component', 'Drawer'],
    ]);
  });

  test("a pack the palette doesn't name shows the manifest's own pack name", () => {
    // Break this catches: a new pack shown by its id.
    expect(packIdentityRows('fluent', 'Button', { displayName: 'Button' }, 'Fluent UI')).toEqual([
      ['Pack', 'Fluent UI'],
      ['Component', 'Button'],
    ]);
  });

  test('shows nothing for an instance that names no component', () => {
    // Break this catches: a "Component: undefined" row on a pack slot with nothing picked.
    expect(packIdentityRows('antd', undefined, undefined)).toEqual([]);
  });
});
