import { IsBoolean, IsNotEmpty, IsObject, IsOptional, IsString } from 'class-validator';

export class RevertMigrationDto {
  @IsNotEmpty()
  @IsString()
  sql: string;

  // { [placeholder]: co_relation_id } - same closed-substitution map recordRawSqlMigration takes.
  @IsObject()
  refs: Record<string, string>;

  // Required only when the target migration is data-destructive (see revert()'s add_column check).
  @IsOptional()
  @IsBoolean()
  confirmed?: boolean;
}
