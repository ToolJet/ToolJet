import { IsNotEmpty, IsNumber, IsObject, IsString, IsUUID, MaxLength } from 'class-validator';

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

  @IsObject()
  @IsNotEmpty()
  components: Record<string, unknown>;
}

export class UpdatePageDto {
  @IsUUID()
  pageId: string;

  diff: Partial<CreatePageDto>;
}

export class DeletePageDto {
  @IsUUID()
  @IsNotEmpty()
  pageId: string;
}
