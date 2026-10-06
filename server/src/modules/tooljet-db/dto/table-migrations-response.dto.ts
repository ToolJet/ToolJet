import { Expose, Type } from 'class-transformer';

// Whitelists getTableMigrations()' response so a future field added to TableMigrationChainEntry/
// EnvironmentMigrationState (tooljet-db-environment-assignment.service.ts) doesn't reach the API
// wire format without a deliberate decision to expose it. Casing (snake_case on the wire) is still
// handled by decamelizeKeys() at the controller, same as every other route in this file -
// class-transformer's own @Expose({ name }) rename is bidirectional and would break reading these
// camelCase service fields back out, so it's deliberately not used here.
export class EnvironmentMigrationStateResponseDto {
  @Expose()
  environmentId: string;

  @Expose()
  environmentName: string;

  @Expose()
  appliedMigrationIds: string[];

  @Expose()
  baselineError: string | null;
}

export class TableMigrationChainEntryResponseDto {
  @Expose()
  id: string;

  @Expose()
  kind: string;

  @Expose()
  name: string | null;

  @Expose()
  sequence: string;

  @Expose()
  migrationNumber: number;

  @Expose()
  createdAt: Date;

  @Expose()
  createdBy: string | null;

  @Expose()
  sql: string | null;
}

export class TableMigrationsResponseDto {
  @Expose()
  @Type(() => TableMigrationChainEntryResponseDto)
  migrations: TableMigrationChainEntryResponseDto[];

  @Expose()
  @Type(() => EnvironmentMigrationStateResponseDto)
  environments: EnvironmentMigrationStateResponseDto[];
}
