import { Transform } from 'class-transformer';
import {
  IsString,
  IsNotEmpty,
  MaxLength,
  Validate,
  ValidatorConstraint,
  ValidatorConstraintInterface,
  IsUUID,
  IsArray,
} from 'class-validator';
import { sanitizeInput } from 'src/helpers/utils.helper';

@ValidatorConstraint({ name: 'AllowedCharactersValidator', async: false })
class AllowedCharactersValidator implements ValidatorConstraintInterface {
  private errorMsg: string;

  validate(value: string) {
    if (value.match(/^[a-zA-Z0-9_ -]+$/) === null) {
      this.errorMsg = 'Special characters are not accepted.';
      return false;
    }
    return true;
  }

  defaultMessage() {
    return this.errorMsg;
  }
}

export class CreateFolderDataSourceDto {
  @IsString()
  @IsNotEmpty({ message: 'Folder name cannot be empty' })
  @Transform(({ value }) => {
    const newValue = sanitizeInput(value);
    return newValue.trim();
  })
  @Validate(AllowedCharactersValidator)
  @MaxLength(50, { message: 'Folder name has exceeded 50 characters' })
  name: string;
}

export class UpdateFolderDataSourceDto {
  @IsString()
  @IsNotEmpty({ message: 'Folder name cannot be empty' })
  @Transform(({ value }) => {
    const newValue = sanitizeInput(value);
    return newValue.trim();
  })
  @Validate(AllowedCharactersValidator)
  @MaxLength(50, { message: 'Folder name has exceeded 50 characters' })
  name: string;
}

export class AddDataSourceToFolderDto {
  @IsUUID()
  dataSourceId: string;
}

export class BulkMoveDataSourcesDto {
  @IsArray()
  @IsUUID('4', { each: true })
  dataSourceIds: string[];
}

