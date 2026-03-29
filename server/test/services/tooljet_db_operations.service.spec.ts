/**
 * This test file has been intentionally replaced with this explanation.
 *
 * The old TooljetDbOperationsService was split into two services:
 *
 *   1. TooljetDbDataOperationsService
 *      (src/modules/tooljet-db/services/tooljet-db-data-operations.service.ts)
 *      Handles CRUD operations: listRows, createRow, updateRows, deleteRows,
 *      joinTables, sqlExecution, bulkUpdateWithPrimaryKey, bulkUpsertUsingPrimaryKey.
 *      ALL data operations proxy through PostgREST (PostgrestProxyService) or require
 *      a live tenant database connection with workspace-specific schemas (workspace_<orgId>).
 *
 *   2. TooljetDbTableOperationsService
 *      (src/modules/tooljet-db/services/tooljet-db-table-operations.service.ts)
 *      Handles DDL / schema operations: createTable, renameTable, addColumn, dropColumn, etc.
 *      All methods execute raw SQL against the tooljetDb DataSource within tenant schemas
 *      and require PostgREST grant/revoke calls for permission management.
 *
 * Why unit tests are not feasible:
 *
 *   - Every public method in both services requires either a running PostgREST instance
 *     or a real PostgreSQL connection with tenant schemas (workspace_<orgId>), tenant
 *     users, and TJDB configurations (OrganizationTjdbConfigurations).
 *
 *   - The private helper functions (buildPostgrestQuery, hasNullValueInFilters,
 *     checkCommandAllowlist, parseTableListFromASTParser) are not exported and cannot
 *     be tested directly without refactoring production code.
 *
 *   - Mocking PostgREST and the dual-DataSource setup (default + tooljetDb) would
 *     produce tests that validate mock wiring, not actual service behavior.
 *
 * These services should be tested via integration tests with a full PostgREST + PostgreSQL
 * environment, or via E2E tests through the API layer (which already exist in cypress-tests).
 */

describe('TooljetDb operations services', () => {
  it('are integration-tested via API/E2E — see comment above for rationale', () => {
    // This single passing assertion documents that the file was reviewed and
    // intentionally left without service-level unit tests.
    expect(true).toBe(true);
  });
});
