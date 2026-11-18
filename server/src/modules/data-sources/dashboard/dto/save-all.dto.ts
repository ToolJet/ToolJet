import { Transform, Type } from 'class-transformer';
import {
  ArrayMinSize,
  ArrayNotEmpty,
  ArrayUnique,
  IsArray,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  ValidateNested,
} from 'class-validator';
import { sanitizeInput } from 'src/helpers/utils.helper';

export class SaveDataSourceEnvironmentDto {
  @IsUUID()
  environment_id: string;

  // Same option items as the v1 update body, passed through unchanged; empty would wipe the environment.
  @IsArray()
  @ArrayNotEmpty()
  options: Array<Record<string, unknown>>;
}

export class SaveAllDataSourceEnvironmentsDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @Transform(({ value }) => sanitizeInput(value))
  @Matches(/^[^/\\]*$/, { message: "Name should not contain '/' or '\\'" })
  name?: string;

  @IsArray()
  @ArrayMinSize(1)
  @ArrayUnique((environment: SaveDataSourceEnvironmentDto) => environment?.environment_id, {
    message: 'Each environment can only be listed once',
  })
  @ValidateNested({ each: true })
  @Type(() => SaveDataSourceEnvironmentDto)
  environments: SaveDataSourceEnvironmentDto[];
}

export class SaveAllDataSourceEnvironmentsQueryDto {
  @IsOptional()
  @IsUUID()
  branch_id?: string;
}
