import { canEditModule } from '../modulePermissions';

const MODULE_ID = 'mod-1';
const USER_ID = 'user-1';

describe('canEditModule', () => {
  test('no session → false', () => {
    expect(canEditModule(undefined, MODULE_ID)).toBe(false);
  });

  test('super_admin → true', () => {
    expect(canEditModule({ super_admin: true }, MODULE_ID)).toBe(true);
  });

  test('admin → true', () => {
    expect(canEditModule({ admin: true }, MODULE_ID)).toBe(true);
  });

  test('is_all_editable → true', () => {
    const session = { module_group_permissions: { is_all_editable: true, editable_apps_id: [] } };
    expect(canEditModule(session, MODULE_ID)).toBe(true);
  });

  test('module in editable_apps_id → true', () => {
    const session = { module_group_permissions: { is_all_editable: false, editable_apps_id: [MODULE_ID] } };
    expect(canEditModule(session, MODULE_ID)).toBe(true);
  });

  test('view-only (only viewable, not editable) → false', () => {
    const session = {
      module_group_permissions: {
        is_all_editable: false,
        editable_apps_id: [],
        is_all_viewable: true,
        viewable_apps_id: [MODULE_ID],
      },
    };
    expect(canEditModule(session, MODULE_ID)).toBe(false);
  });

  test('owner override → true even without edit permission', () => {
    const session = {
      current_user: { id: USER_ID },
      module_group_permissions: { is_all_editable: false, editable_apps_id: [] },
    };
    expect(canEditModule(session, MODULE_ID, USER_ID)).toBe(true);
  });

  test('non-owner without edit permission → false', () => {
    const session = {
      current_user: { id: USER_ID },
      module_group_permissions: { is_all_editable: false, editable_apps_id: [] },
    };
    expect(canEditModule(session, MODULE_ID, 'someone-else')).toBe(false);
  });

  test('CE fallback (no module_group_permissions): builder → true', () => {
    expect(canEditModule({ role: { name: 'builder' } }, MODULE_ID)).toBe(true);
  });

  test('CE fallback: end-user → false', () => {
    expect(canEditModule({ role: { name: 'end-user' } }, MODULE_ID)).toBe(false);
  });
});
