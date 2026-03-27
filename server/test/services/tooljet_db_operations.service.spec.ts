/**
 * TODO: This test file needs a complete rewrite.
 *
 * The old TooljetDbOperationsService has been removed and split into:
 *   - TooljetDbDataOperationsService (@modules/tooljet-db/services/tooljet-db-data-operations.service)
 *   - TooljetDbTableOperationsService (@modules/tooljet-db/services/tooljet-db-table-operations.service)
 *
 * Key changes that make this test non-trivial to fix:
 * 1. TooljetDbOperationsService and TooljetDbService no longer exist
 * 2. All CRUD methods (createRow, listRows, updateRows, deleteRows) now require
 *    a `context` parameter with `context.app.organization_id`
 * 3. CRUD operations now proxy through PostgREST (PostgrestProxyService),
 *    requiring either a running PostgREST instance or comprehensive mocking
 * 4. The joinTables method delegates to TooljetDbTableOperationsService.perform()
 * 5. TypeORM getManager()/getConnection() replaced with DataSource injection
 * 6. Old permission entities (GroupPermission, UserGroupPermission) deprecated
 * 7. LicenseService replaced with LicenseTermsService for table operations
 *
 * To rewrite this test:
 * - Use TooljetDbDataOperationsService for CRUD tests
 * - Use TooljetDbTableOperationsService for table schema tests
 * - Mock PostgrestProxyService for CRUD operations
 * - Pass context: { app: { organization_id: organizationId } } to all methods
 * - Use DataSource/getDataSourceToken for TypeORM access
 */

describe('TooljetDbOperationsService', () => {
  it.todo('should be rewritten to use TooljetDbDataOperationsService');
  it.todo('should be rewritten to use TooljetDbTableOperationsService');
});
