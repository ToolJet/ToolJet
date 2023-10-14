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
  @IsNotEmpty()
  @MaxLength(50)
  handle: string;

  @IsNumber()
  @IsNotEmpty()
  index: number;

  @IsOptional()
  disabled: boolean;

  @IsOptional()
  hidden: boolean;
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
