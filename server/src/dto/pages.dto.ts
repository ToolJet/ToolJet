import { IsNotEmpty, IsNumber, IsObject, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class CreatePageDto {
  @IsUUID()
  @IsNotEmpty()
  id: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(32)
  name: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  handle: string;

  @IsNumber()
  @IsNotEmpty()
  index: number;

  @IsOptional()
  disabled: boolean;

  @IsOptional()
  @IsObject()
  hidden: Record<string, any>;

  @IsOptional()
  autoComputeLayout: boolean;

  @IsOptional()
  icon: string;
}

export class DeletePageDto {
  @IsUUID()
  @IsNotEmpty()
  pageId: string;
}

export class UpdatePageDto {
  pageId: string;
  diff: Partial<CreatePageDto>;
}
