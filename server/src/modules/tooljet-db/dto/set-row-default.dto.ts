import { IsNotEmpty, IsObject, IsString, IsUUID } from 'class-validator';

export class SetRowDefaultDto {
  @IsNotEmpty()
  @IsUUID()
  environment_id: string;

  @IsNotEmpty()
  @IsString()
  column: string;

  /** The row's primary key: one entry per key column, matching the whole key. */
  @IsObject()
  where: Record<string, string | number | boolean>;
}
