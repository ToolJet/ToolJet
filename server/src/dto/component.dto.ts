import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  ValidationArguments,
  ValidatorConstraint,
  ValidatorConstraintInterface,
  Validate,
} from 'class-validator';

export class ComponentLayoutDto {
  @IsNumber()
  @IsOptional()
  top?: number;

  @IsNumber()
  @IsOptional()
  left?: number;

  @IsNumber()
  @IsOptional()
  width?: number;

  @IsNumber()
  @IsOptional()
  height?: number;
}

export class LayoutData {
  @IsObject()
  @IsOptional()
  desktop?: ComponentLayoutDto;

  @IsObject()
  @IsOptional()
  mobile?: ComponentLayoutDto;
}

@ValidatorConstraint({ name: 'LayoutDataValidator', async: false })
class LayoutDataValidator implements ValidatorConstraintInterface {
  validate(value: any) {
    if (value) {
      for (const key in value) {
        if (!value[key] || typeof value[key] !== 'object' || !value[key].layouts) {
          return false;
        }
      }
    }
    return true;
  }

  defaultMessage(args: ValidationArguments) {
    return `Each key in "diff" must have the structure { layouts: LayoutData }`;
  }
}

export class LayoutUpdateDto {
  @IsBoolean()
  is_user_switched_version: boolean;

  @IsUUID()
  pageId: string;

  @IsObject()
  @IsNotEmpty()
  @Validate(LayoutDataValidator, { each: true })
  diff: Record<string, { layouts: LayoutData }>;
}

class ComponentDto {
  @IsString()
  name: string;

  @IsObject()
  properties: Record<string, any>;

  @IsObject()
  styles: Record<string, any>;

  @IsObject()
  validation: Record<string, any>;

  @IsString()
  type: string;

  @IsObject()
  others: Record<string, any>;

  @IsOptional()
  @Type(() => ComponentLayoutDto)
  layouts: ComponentLayoutDto;

  @IsOptional()
  parent: string;
}

@ValidatorConstraint({ name: 'CreateComponentDtoValidator', async: false })
class CreateComponentDtoValidator implements ValidatorConstraintInterface {
  validate(value: any, args: ValidationArguments) {
    // Check if the diff structure is valid
    for (const key in value.diff) {
      if (!value.diff[key] || typeof value.diff[key] !== 'object') {
        return false;
      }
      // You can add additional checks for the component structure here
    }

    return true;
  }

  defaultMessage(args: ValidationArguments) {
    return `Invalid structure in diff for CreateComponentDto`;
  }
}

export class CreateComponentDto {
  @IsBoolean()
  is_user_switched_version: boolean;

  @IsUUID()
  pageId: string;

  @IsObject()
  @Validate(CreateComponentDtoValidator)
  diff: Record<string, ComponentDto>;
}

export class UpdateComponentDto {
  @IsBoolean()
  is_user_switched_version: boolean;

  @IsUUID()
  pageId: string;

  @IsObject()
  @Validate(CreateComponentDtoValidator)
  diff: Record<string, ComponentDto>;
}

export class DeleteComponentDto {
  @IsBoolean()
  is_user_switched_version: boolean;

  @IsUUID()
  pageId: string;

  @IsArray()
  diff: string[];

  @IsBoolean()
  @IsOptional()
  is_component_cut: boolean;
}
