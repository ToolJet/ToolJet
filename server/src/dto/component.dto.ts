import { Type } from 'class-transformer';
import { IsBoolean, IsNumber, IsObject, IsOptional, IsString, IsUUID, ValidateNested } from 'class-validator';

class ComponentLayoutDto {
  @IsNumber()
  top: number;

  @IsNumber()
  left: number;

  @IsNumber()
  width: number;

  @IsNumber()
  height: number;
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

  @ValidateNested()
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

  @ValidateNested()
  @IsObject()
  diff: Record<string, ComponentDto>;
}

export class UpdateComponentDto {
  @IsBoolean()
  is_user_switched_version: boolean;

  @IsUUID()
  pageId: string;

  @ValidateNested()
  @IsObject()
  diff: Record<string, ComponentDto>;
}
