import { IsUUID, IsEnum, IsArray, IsString, IsOptional, ValidateIf } from 'class-validator';
import { Type } from 'class-transformer';
import { PAGE_PERMISSION_TYPE } from '../constants';

export class CreatePagePermissionDto {
  @IsUUID(4)
  @IsOptional()
  pageId: string;

  @IsEnum(PAGE_PERMISSION_TYPE)
  type: PAGE_PERMISSION_TYPE;

  @ValidateIf((o) => o.type === PAGE_PERMISSION_TYPE.SINGLE)
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  @Type(() => String)
  users?: string[];

  @ValidateIf((o) => o.type === PAGE_PERMISSION_TYPE.GROUP)
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  @Type(() => String)
  groups?: string[];
}
