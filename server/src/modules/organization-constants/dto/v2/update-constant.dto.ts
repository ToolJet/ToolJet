import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
  ValidateIf,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateConstantValueDto {
  @IsUUID()
  environment_id: string;

  // null clears the environment.
  @ValidateIf((entry: UpdateConstantValueDto) => entry.value !== null)
  @IsString()
  @MinLength(1, { message: 'Constant value must be at least 1 character' })
  @MaxLength(10000, { message: 'Constant value must be less than 10000 characters' })
  value: string | null;
}

export class UpdateConstantValuesDto {
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(50)
  @ValidateNested({ each: true })
  @Type(() => UpdateConstantValueDto)
  values: UpdateConstantValueDto[];
}
