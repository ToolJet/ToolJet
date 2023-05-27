import { Transform } from 'class-transformer';
import { IsString, IsNotEmpty, MaxLength, Matches } from 'class-validator';
import { sanitizeInput } from 'src/helpers/utils.helper';

export class CreateFolderDto {
  @IsString()
  @IsNotEmpty()
  @Transform(({ value }) => {
    const newValue = sanitizeInput(value);
    return newValue.trim();
  })
  @Matches("^[A-Za-z0-9 '-]+$", '', { message: 'Special characters are not accepted.' })
  @MaxLength(40, { message: 'Maximum length has been reached.' })
  name: string;
}
