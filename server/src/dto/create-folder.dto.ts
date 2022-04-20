import { Transform } from 'class-transformer';
import { IsString, IsNotEmpty } from 'class-validator';
import { sanitizeInput } from 'src/helpers/utils.helper';

export class CreateFolderDto {
  @IsString()
  @IsNotEmpty()
  @Transform(({ value }) => sanitizeInput(value))
  name: string;
}
