import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsIn,
  IsNotEmpty,
  IsString,
  IsUUID,
  Matches,
  MaxLength,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { sanitizeInput } from '@helpers/utils.helper';
import { OrganizationConstantType } from '../../constants';

export class CreateConstantValueDto {
  @IsUUID()
  environment_id: string;

  @IsString()
  @MinLength(1, { message: 'Constant value must be at least 1 character' })
  @MaxLength(10000, { message: 'Constant value must be less than 10000 characters' })
  value: string;
}

export class CreateConstantDto {
  @IsString()
  @Transform(({ value }) => sanitizeInput(value))
  @IsNotEmpty()
  @Matches(/^[a-zA-Z_][a-zA-Z0-9_]*$/, {
    message: 'Constant name must start with a letter or underscore and contain only letters, numbers, and underscores',
  })
  @MaxLength(50, { message: 'Constant name must be less than 50 characters' })
  @MinLength(1, { message: 'Constant name must be at least 1 character' })
  name: string;

  @IsIn([OrganizationConstantType.GLOBAL, OrganizationConstantType.SECRET], {
    message: 'Type must be either Global or Secret',
  })
  type: OrganizationConstantType.GLOBAL | OrganizationConstantType.SECRET;

  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(50)
  @ValidateNested({ each: true })
  @Type(() => CreateConstantValueDto)
  values: CreateConstantValueDto[];
}
