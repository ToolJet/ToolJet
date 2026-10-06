/**
 * Pins the field whitelist controller.ts's tableMigrations() route relies on: a future field added
 * to TableMigrationChainEntry/EnvironmentMigrationState should not reach the wire without a
 * deliberate @Expose() on this DTO.
 *
 * @group database
 */
import { plainToInstance, instanceToPlain } from 'class-transformer';
import { decamelizeKeys } from 'humps';
import { TableMigrationsResponseDto } from '@modules/tooljet-db/dto/table-migrations-response.dto';

describe('TableMigrationsResponseDto whitelisting', () => {
  it('should keep every documented field and strip anything not declared on the DTO', () => {
    const source = {
      migrations: [
        {
          id: 'm1',
          kind: 'structured',
          name: null,
          sequence: '1',
          migrationNumber: 1,
          createdAt: new Date('2026-01-01T00:00:00Z'),
          createdBy: 'user-1',
          sql: 'CREATE TABLE foo (id integer);',
          internalDebugField: 'should not leak',
        },
      ],
      environments: [
        {
          environmentId: 'e1',
          environmentName: 'development',
          appliedMigrationIds: ['m1'],
          baselineError: null,
          rawRelationRowInternal: { secret: true },
        },
      ],
    };

    const whitelisted = instanceToPlain(
      plainToInstance(TableMigrationsResponseDto, source as any, { excludeExtraneousValues: true })
    );
    const wireShape = decamelizeKeys({ result: whitelisted }) as any;

    expect(wireShape.result.migrations[0]).toEqual({
      id: 'm1',
      kind: 'structured',
      name: null,
      sequence: '1',
      migration_number: 1,
      created_at: source.migrations[0].createdAt,
      created_by: 'user-1',
      sql: 'CREATE TABLE foo (id integer);',
    });
    expect(wireShape.result.environments[0]).toEqual({
      environment_id: 'e1',
      environment_name: 'development',
      applied_migration_ids: ['m1'],
      baseline_error: null,
    });
  });
});
