import {
  registerDecorator,
  ValidationOptions,
  ValidationArguments,
  ValidatorConstraint,
  ValidatorConstraintInterface,
  IsArray,
  IsEmail,
  IsEnum,
  IsObject,
  IsOptional,
  IsString,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { lowercaseString, sanitizeInput, areAllUnique } from '@helpers/utils.helper';
import { USER_ROLE } from '@modules/group-permissions/constants';

// Custom Validator Constraint
@ValidatorConstraint({ async: true })
class IsUserMetadataValidConstraint implements ValidatorConstraintInterface {
  validate(userMetadata: any, args: ValidationArguments) {
    // Check if the input is a valid object
    if (typeof userMetadata !== 'object' || userMetadata == null) {
      return false;
    }

    // Ensure all keys are unique
    if (!areAllUnique(Object.keys(userMetadata))) {
      return false;
    }

    // Initialize total length variable
    let totalLength = 0;

    for (const key of Object.keys(userMetadata)) {
      const value = userMetadata[key];

      // Add key and value lengths to the total length
      totalLength += key?.length + (typeof value === 'string' ? value?.length : 0);

      // Check if any string value exceeds 2000 characters
      if (typeof value === 'string' && value?.length > 2000) {
        return false;
      }
    }

    // Check if the total length exceeds 200,000 characters
    if (totalLength > 200000) {
      return false;
    }

    // If all checks pass
    return true;
  }

  defaultMessage(args: ValidationArguments) {
    return 'Each value in user metadata should not exceed 2000 characters and keys should be unique.';
  }
}

// Custom Validator Decorator
function IsUserMetadataValid(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsUserMetadataValidConstraint,
    });
  };
}

// DTO Class
export class InviteNewUserDto {
  @IsString()
  @Transform(({ value }) => sanitizeInput(value))
  @IsOptional()
  firstName: string;

  @IsString()
  @Transform(({ value }) => sanitizeInput(value))
  @IsOptional()
  lastName: string;

  @IsEmail()
  @Transform(({ value }) => lowercaseString(value))
  email: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  groups: string[];

  @IsString()
  @IsEnum(USER_ROLE)
  role: USER_ROLE;

  @IsObject()
  @IsOptional()
  @IsUserMetadataValid({
    message: 'Each value in user metadata should not exceed 2000 characters and keys should be unique.',
  })
  userMetadata: Record<string, any>;
}
