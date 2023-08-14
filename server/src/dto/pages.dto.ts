import { IsNumber, IsString } from 'class-validator';

export class CreatePageDto {
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
