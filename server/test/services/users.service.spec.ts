/**
 * TODO: This test file needs a complete rewrite.
 *
 * The old monolithic UsersService (src/services/users.service) has been replaced by:
 *   - UsersService (@modules/users/service) — stub with only password/type operations
 *   - The permission system has been completely restructured
 *
 * Methods that no longer exist on UsersService:
 *   - create() — user creation now handled by onboarding/invitation flows
 *   - update() with addGroups/removeGroups — group management moved to group-permissions module
 *   - groupPermissions() — moved to group-permissions module
 *   - appGroupPermissions() — moved to new granular permissions system
 *   - groupPermissionsForOrganization() — moved to group-permissions module
 *   - hasGroup() — moved to group-permissions module
 *   - userCan() — replaced by new granular permission system (AppsGroupPermissions, GranularPermissions)
 *
 * Old entities replaced:
 *   - GroupPermission → GroupPermissions (permission_groups table)
 *   - UserGroupPermission → GroupUsers (group_users table)
 *   - AppGroupPermission → AppsGroupPermissions + GranularPermissions
 *
 * To rewrite these tests:
 *   - Test user CRUD through onboarding/invitation services
 *   - Test group management through @modules/group-permissions/ services
 *   - Test permission checks through the new granular permissions system
 *   - Use DataSource instead of getManager()
 */

describe('UsersService', () => {
  it.todo('should be rewritten to test new UsersService (password/type operations)');
  it.todo('should move group management tests to group-permissions service tests');
  it.todo('should move permission check tests to granular permissions service tests');
});
