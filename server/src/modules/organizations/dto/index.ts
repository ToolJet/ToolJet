import { Transform } from 'class-transformer';
import {
  IsDefined,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  Validate,
  ValidateIf,
  ValidatorConstraint,
  ValidatorConstraintInterface,
  IsEnum,
} from 'class-validator';
import { applyDecorators } from '@nestjs/common';
import { sanitizeInput } from '@helpers/utils.helper';

@ValidatorConstraint({ name: 'AllowedCharactersValidator', async: false })
export class AllowedCharactersValidator implements ValidatorConstraintInterface {
  private errorMsg: string;

  validate(value: unknown) {
    if (typeof value !== 'string') return true; // @IsString reports non-strings
    if (value.match(/^[a-z0-9 -]+$/) === null) {
      if (/[A-Z]/.test(value)) {
        this.errorMsg = 'Only lowercase letters are accepted.';
      } else {
        this.errorMsg = 'Special characters are not accepted.';
      }
      return false;
    }
    if (/\s/g.test(value)) {
      this.errorMsg = 'Cannot contain spaces.';
      return false;
    }
    return true;
  }

  defaultMessage() {
    return this.errorMsg;
  }
}

const SanitizeAndTrim = () => Transform(({ value }) => sanitizeInput(value)?.trim() || '');

// Shared by the dashboard and External API v2, so a workspace name or slug means the same thing on both.
export const WorkspaceNameField = () =>
  applyDecorators(
    IsString(),
    SanitizeAndTrim(),
    IsNotEmpty({ message: "Workspace name can't be empty" }),
    MaxLength(50, { message: 'Maximum length has been reached.' })
  );

export const WorkspaceSlugField = () =>
  applyDecorators(
    IsString(),
    SanitizeAndTrim(),
    IsNotEmpty({ message: "Workspace slug can't be empty" }),
    MaxLength(50, { message: 'Maximum length has been reached.' }),
    Validate(AllowedCharactersValidator)
  );

export class OrganizationCreateDto {
  @WorkspaceNameField()
  name: string;

  @WorkspaceSlugField()
  slug: string;
}

export enum organizationStatusType {
  active,
  archived,
}

export class OrganizationUpdateDto {
  @IsOptional()
  @IsString()
  @Transform(({ value }) => sanitizeInput(value)?.trim() || '')
  @MaxLength(50, { message: 'Maximum length has been reached.' })
  @ValidateIf((o) => !o.slug)
  @IsDefined({ message: 'At least one of name or slug must be provided' })
  name?: string;

  @IsOptional()
  @IsString()
  @Transform(({ value }) => sanitizeInput(value)?.trim() || '')
  @MaxLength(50, { message: 'Maximum length has been reached.' })
  @Validate(AllowedCharactersValidator)
  @ValidateIf((o) => !o.name)
  @IsDefined({ message: 'At least one of name or slug must be provided' })
  slug?: string;
}
export class OrganizationStatusUpdateDto {
  @IsString()
  @IsEnum(organizationStatusType)
  status?: string; //check ws and user archibing unarchiving xD
}
