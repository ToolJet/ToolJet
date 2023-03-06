import { Transform } from 'class-transformer';
import { IsString, IsNotEmpty, MaxLength, MinLength } from 'class-validator';
import { sanitizeInput } from 'src/helpers/utils.helper';

export class CreateFolderDto {
  @IsString()
  @IsNotEmpty()
  @Transform(({ value }) => sanitizeInput(value))
  @MaxLength(25, { message: 'Folder name cannot be longer than 25 characters' })
  @MinLength(0, { message: 'Folder name cannot be empty' })
  name: string;
}
