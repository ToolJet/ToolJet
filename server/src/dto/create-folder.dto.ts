import { Transform } from 'class-transformer';
import { IsString, IsNotEmpty, MaxLength, Matches } from 'class-validator';
import { sanitizeInput } from 'src/helpers/utils.helper';

export class CreateFolderDto {
  @IsString()
  @IsNotEmpty()
  @Transform(({ value }) => sanitizeInput(value))
  @Matches('^[A-Za-z0-9 ]+$', '', { message: 'Folder name must contain only letters and numbers' })
  @MaxLength(40, { message: 'Folder name cannot be longer than 40 characters' })
  name: string;
}
