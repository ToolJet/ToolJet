import { Type } from 'class-transformer';
import { IsArray, IsBoolean, IsNotEmpty, IsNumber, IsObject, IsOptional, IsString, IsUUID } from 'class-validator';

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

export class CreateComponentDto {
  @IsBoolean()
  is_user_switched_version: boolean;

  @IsUUID()
  pageId: string;

  @IsObject()
  diff: Record<string, ComponentDto>;
}

export class UpdateComponentDto {
  @IsBoolean()
  is_user_switched_version: boolean;

  @IsUUID()
  pageId: string;

  @IsObject()
  diff: Record<string, ComponentDto>;
}

export class DeleteComponentDto {
  @IsBoolean()
  is_user_switched_version: boolean;

  @IsUUID()
  pageId: string;

  @IsArray()
  diff: string[];
}

export class LayoutUpdateDto {
  @IsBoolean()
  is_user_switched_version: boolean;

  @IsUUID()
  pageId: string;

  @IsObject()
  @IsNotEmpty()
  diff: Record<string, { layouts: LayoutData }>;
}
