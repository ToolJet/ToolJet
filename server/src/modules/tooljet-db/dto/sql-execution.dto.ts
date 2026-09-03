import { IsNotEmpty, IsString, IsUUID } from 'class-validator';

export class SqlExecutionDto {
  @IsNotEmpty()
  @IsString()
  sql: string;

  @IsNotEmpty()
  @IsUUID()
  environment_id: string;
}
