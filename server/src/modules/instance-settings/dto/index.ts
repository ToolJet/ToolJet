import {
  ArrayNotEmpty,
  IsArray,
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { sanitizeInput } from '../../../helpers/utils.helper';
import { INSTANCE_USER_SETTINGS } from '../constants';

export class CreateInstanceSettingsDto {
  @IsString()
  @Transform(({ value }) => sanitizeInput(value))
  @IsNotEmpty()
  @IsOptional()
  key: string;

  @IsString()
  @IsNotEmpty()
  @IsOptional()
  label: string;

  @IsString()
  @IsNotEmpty()
  @IsOptional()
  value: string;

  @IsString()
  @IsNotEmpty()
  @IsOptional()
  labelKey: string;

  @IsString()
  @IsNotEmpty()
  @IsOptional()
  helperText: string;

  @IsString()
  @IsNotEmpty()
  @IsOptional()
  helperTextKey: string;

  @IsString()
  @IsNotEmpty()
  @IsOptional()
  dataType: string;
}

// DTO for User Settings
export class UpdateUserSettingsDto {
  @IsArray() // Validate that the input is an array
  @ArrayNotEmpty()
  @ValidateNested({ each: true }) // Validate each item in the array
  @Type(() => UserSettings)
  settings: UserSettings[];
}

class UserSettings {
  @IsString()
  id: string;

  @IsEnum(INSTANCE_USER_SETTINGS)
  key: INSTANCE_USER_SETTINGS;

  @IsString()
  @IsOptional()
  label?: string;

  @IsString()
  @IsOptional()
  label_key?: string;

  @IsString()
  value: string;

  @IsString()
  @IsOptional()
  helper_text?: string;

  @IsString()
  @IsOptional()
  helper_text_key?: string;

  @IsBoolean()
  @IsOptional()
  is_disabled?: boolean;
}
