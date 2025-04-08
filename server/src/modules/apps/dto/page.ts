import { IsNotEmpty, IsNumber, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

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
  isPageGroup: boolean;

  @IsOptional()
  autoComputeLayout: boolean;

  @IsOptional()
  icon: string;
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
