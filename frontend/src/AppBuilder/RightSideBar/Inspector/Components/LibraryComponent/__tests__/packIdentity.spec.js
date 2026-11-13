import { packIdentity } from '../packIdentity';

// QA item 8: a selected pack component's Properties tab didn't say which component it is or which library it comes
// from (its name, antDrawer1, is the builder's), so two libraries' Drawers or Buttons looked alike. It now opens with
// the library, as the Components panel names it, and the component's display name.
describe('packIdentity', () => {
  test.each([
    ['antd', 'Drawer', { displayName: 'Drawer' }, { library: 'Ant Design', component: 'Drawer' }],
    ['shadcn', 'DropdownMenu', { displayName: 'Dropdown menu' }, { library: 'Rocket 2.0', component: 'Dropdown menu' }],
    ['mui', 'KeyValue', { displayName: 'Key-value list' }, { library: 'Material UI', component: 'Key-value list' }],
  ])('names the %s library and its %s', (pack, name, manifest, identity) => {
    // Break this catches: the pack's id (antd) or the component's code name shown instead of what the builder knows.
    expect(packIdentity(pack, name, manifest)).toEqual(identity);
  });

  test("falls back to the component's code name before its manifest loads", () => {
    // Break this catches: an empty component name while the manifest is still loading.
    expect(packIdentity('antd', 'Drawer', undefined)).toEqual({ library: 'Ant Design', component: 'Drawer' });
  });

  test("a pack the palette doesn't name shows the manifest's own pack name", () => {
    // Break this catches: a new pack shown by its id.
    expect(packIdentity('fluent', 'Button', { displayName: 'Button' }, 'Fluent UI')).toEqual({
      library: 'Fluent UI',
      component: 'Button',
    });
  });

  test('shows nothing for an instance that names no component', () => {
    // Break this catches: "Ant Design · undefined" on a pack slot with nothing picked.
    expect(packIdentity('antd', undefined, undefined)).toBeNull();
  });
});
