import { Transform } from 'class-transformer';
import {
  IsString,
  IsNotEmpty,
  MaxLength,
  Validate,
  ValidatorConstraint,
  ValidatorConstraintInterface,
  MinLength,
} from 'class-validator';
import { sanitizeInput } from 'src/helpers/utils.helper';

@ValidatorConstraint({ name: 'AllowedCharactersValidator', async: false })
class AllowedCharactersValidator implements ValidatorConstraintInterface {
  private errorMsg: string;

  validate(value: string) {
    if (value.match(/^[a-zA-Z0-9 -]+$/) === null) {
      this.errorMsg = 'Special characters are not accepted.';
      return false;
    }
    return true;
  }

  defaultMessage() {
    return this.errorMsg;
  }
}

export class CreateFolderDto {
  @IsString()
  @IsNotEmpty({ message: "Folder name can't be empty" })
  @Transform(({ value }) => {
    const newValue = sanitizeInput(value);
    return newValue.trim();
  })
  @Validate(AllowedCharactersValidator)
  @MaxLength(50, { message: 'Maximum length has been reached.' })
  name: string;

  @IsString()
  type: string;
}

export class UpdateFolderDto {
  @IsString()
  @IsNotEmpty()
  @Transform(({ value }) => sanitizeInput(value).trim())
  // Match CreateFolderDto: folder names become git path segments (apps/<folder>/<app>,
  // data-sources/<folder>/<ds>), so slash/backslash and other special chars must be rejected on
  // rename too — sanitizeInput only HTML-escapes and leaves '/' and '\' intact.
  @Validate(AllowedCharactersValidator)
  @MaxLength(50, { message: 'Folder name cannot be longer than 50 characters' })
  @MinLength(0, { message: 'Folder name cannot be empty' })
  name: string;
}
