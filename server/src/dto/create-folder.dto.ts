import { Transform } from 'class-transformer';
import {
  IsString,
  IsNotEmpty,
  MaxLength,
  Validate,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';
import { sanitizeInput } from 'src/helpers/utils.helper';

@ValidatorConstraint({ name: 'AllowedCharactersValidator', async: false })
class AllowedCharactersValidator implements ValidatorConstraintInterface {
  private errorMsg: string;

  validate(value: string) {
    if (value.match(/^[a-z0-9 -]+$/) === null) {
      if (/[A-Z]/.test(value)) {
        this.errorMsg = 'Only lowercase letters are accepted.';
      } else {
        this.errorMsg = 'Special characters are not accepted.';
      }
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
}
