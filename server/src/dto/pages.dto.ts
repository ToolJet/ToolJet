import { IsNumber, IsString, IsUUID } from 'class-validator';

export class CreatePageDto {
  @IsUUID()
  id: string;

  @IsString()
  name: string;

  @IsString()
  handle: string;

  @IsNumber()
  index: number;
}

export class UpdatePageDto {
  pageId: string;
  diff: Partial<CreatePageDto>;
}
