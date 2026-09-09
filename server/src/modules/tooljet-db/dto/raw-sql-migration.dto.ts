import { IsNotEmpty, IsObject, IsOptional, IsString, IsUUID } from 'class-validator';

export class RawSqlMigrationDto {
  @IsNotEmpty()
  @IsString()
  sql: string;

  // { [placeholder]: co_relation_id } - explicit substitution map, resolved against this table's
  // own development relation. Nothing parses the SQL itself.
  @IsObject()
  refs: Record<string, string>;

  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsUUID()
  reverts_migration_id?: string;
}
