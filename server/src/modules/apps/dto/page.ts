import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  IsUrl,
  IsUUID,
  MaxLength,
  ValidateIf,
} from 'class-validator';
import type { PageVariableDefinition } from '@entities/page.entity';
import { KeepVariableMapAsSent } from '@helpers/variable-definition-map.helper';

// 1. Define your enums here in the same file
export enum PageOpenIn {
  NEW_TAB = 'new_tab',
  SAME_TAB = 'same_tab',
}

export enum PageType {
  DEFAULT = 'default',
  GROUP = 'group',
  URL = 'url',
  APP = 'app',
  CUSTOM = 'custom',
}

export class CreatePageDto {
  @IsUUID()
  @IsNotEmpty()
  id: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(32)
  name: string;

  @IsString()
  @MaxLength(50)
  handle: string;

  @IsNumber()
  @IsNotEmpty()
  index: number;

  @IsOptional()
  disabled: boolean;

  @IsOptional()
  hidden: Record<string, any>;

  @IsOptional()
  pageHeader: Record<string, any>;

  @IsOptional()
  pageFooter: Record<string, any>;

  @IsOptional()
  @IsObject()
  @KeepVariableMapAsSent()
  variables: Record<string, PageVariableDefinition>;

  @IsOptional()
  isPageGroup: boolean;

  @IsOptional()
  autoComputeLayout: boolean;

  @IsOptional()
  icon: string;

  @IsOptional()
  @IsString()
  @ValidateIf((o) => o.url !== '')
  @IsUrl()
  url?: string;

  @IsEnum(PageOpenIn)
  @IsOptional()
  openIn?: PageOpenIn;

  @IsEnum(PageType)
  @IsOptional()
  type?: PageType;

  @IsUUID()
  @IsOptional()
  appId?: string;

  // Co relation id for the target tooljet app when page type is 'app'
  @IsUUID()
  @IsOptional()
  targetCorelationId?: string;
}

export class DeletePageDto {
  @IsUUID()
  @IsNotEmpty()
  pageId: string;

  @IsOptional()
  deleteAssociatedPages: boolean;
}

export class ReorderDiffDto {
  index: number;
  @IsOptional()
  pageGroupId?: string;
}
export class ReorderPagesDto {
  diff: ReorderDiffDto;
}

export class UpdatePageDto {
  pageId: string;
  diff: Partial<CreatePageDto>;
}
