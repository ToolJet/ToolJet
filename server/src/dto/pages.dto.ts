import { IsNumber, IsString, IsUUID, MaxLength } from 'class-validator';

export class CreatePageDto {
  @IsUUID()
  id: string;

  @IsString()
  @MaxLength(32)
  name: string;

  @IsString()
  @MaxLength(50)
  handle: string;

  @IsNumber()
  index: number;
}

export class UpdatePageDto {
  @IsUUID()
  pageId: string;

  diff: Partial<CreatePageDto>;
}
