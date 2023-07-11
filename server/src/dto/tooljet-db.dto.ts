import { Transform, Type } from 'class-transformer';
import {
  IsString,
  IsNotEmpty,
  MaxLength,
  MinLength,
  ArrayMinSize,
  IsArray,
  IsOptional,
  Matches,
  ValidatorConstraint,
  ValidatorConstraintInterface,
  Validate,
  registerDecorator,
  ValidationArguments,
  ValidationOptions,
  ValidateNested,
} from 'class-validator';
import { sanitizeInput, validateDefaultValue } from 'src/helpers/utils.helper';

export function Match(property: string, validationOptions?: ValidationOptions) {
  return (object: any, propertyName: string) => {
    registerDecorator({
      target: object.constructor,
      propertyName,
      options: validationOptions,
      constraints: [property],
      validator: MatchTypeConstraint,
    });
  };
}

@ValidatorConstraint({ name: 'Match' })
export class MatchTypeConstraint implements ValidatorConstraintInterface {
  validate(value: any, args: ValidationArguments) {
    const [relatedPropertyName] = args.constraints;
    const relatedType = (args.object as any)[relatedPropertyName];

    return this.matchType(value, relatedType);
  }

  defaultMessage(args: ValidationArguments) {
    const [relatedPropertyName] = args.constraints;
    return `${relatedPropertyName} and ${args.property} don't match`;
  }

  matchType(value, relatedType) {
    if (relatedType === 'character varying') {
      return typeof value === 'string';
    }

    if (relatedType === 'integer' || relatedType === 'double precision') {
      const isInt = Number.isInteger(value);
      const isFloat = !Number.isInteger(value) && !isNaN(value);
      return isInt || isFloat;
    }

    if (relatedType === 'boolean') {
      return value === 'true' || value === 'false';
    }

    return typeof value === relatedType;
  }
}

@ValidatorConstraint({ name: 'SQLInjection' })
export class SQLInjectionValidator implements ValidatorConstraintInterface {
  validate(value: any) {
    // Todo: add validations to overcome for SQL Injection
    const sql_meta = new RegExp('^[a-zA-Z0-9_ .]*$', 'i');
    // . and @ are allowed in email
    const allowedSpecialChars = new RegExp('^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+.[a-zA-Z0-9-.]+$', 'i');

    if (sql_meta.test(value)) {
      return true;
    }

    if (allowedSpecialChars.test(value)) {
      return true;
    }

    return false;
  }

  defaultMessage(args: ValidationArguments) {
    return `special characters not supported for ${args.property} field`;
  }
}

@ValidatorConstraint({ name: 'reservedkeyword', async: false })
class ReservedKeywordConstraint implements ValidatorConstraintInterface {
  validate(value: string) {
    return !/^(ABORT|ABS|ABSOLUTE|ACCESS|ACTION|ADA|ADD|ADMIN|AFTER|AGGREGATE|ALL|ALLOCATE|ALTER|ANALYSE|ANALYZE|AND|ANY|ARE|ARRAY|AS|ASC|ASENSITIVE|ASSERTION|ASSIGNMENT|ASYMMETRIC|AT|ATOMIC|ATTRIBUTE|ATTRIBUTES|AUTHORIZATION|AVG|BACKWARD|BEFORE|BEGIN|BERNOULLI|BETWEEN|BIGINT|BINARY|BIT|BITVAR|BIT_LENGTH|BLOB|BOOLEAN|BOTH|BREADTH|BY|C|CACHE|CALL|CALLED|CARDINALITY|CASCADE|CASCADED|CASE|CAST|CATALOG|CATALOG_NAME|CEIL|CEILING|CHAIN|CHAR|CHARACTER|CHARACTERISTICS|characters|CHARACTER_LENGTH|CHARACTER_SET_CATALOG|CHARACTER_SET_NAME|CHARACTER_SET_SCHEMA|CHAR_LENGTH|CHECK|CHECKED|CHECKPOINT|CLASS|CLASS_ORIGIN|CLOB|CLOSE|CLUSTER|COALESCE|COBOL|COLLATE|COLLATION|COLLATION_CATALOG|COLLATION_NAME|COLLATION_SCHEMA|COLLECT|COLUMN|COLUMN_NAME|COMMAND_FUNCTION|COMMAND_FUNCTION_CODE|COMMENT|COMMIT|COMMITTED|COMPLETION|CONDITION|CONDITION_NUMBER|CONNECT|CONNECTION|CONNECTION_NAME|CONSTRAINT|CONSTRAINTS|CONSTRAINT_CATALOG|CONSTRAINT_NAME|CONSTRAINT_SCHEMA|CONSTRUCTOR|CONTAINS|CONTINUE|CONVERSION|CONVERT|COPY|CORR|CORRESPONDING|COUNT|COVAR_POP|COVAR_SAMP|CREATE|CREATEDB|CREATEROLE|CREATEUSER|CROSS|CSV|CUBE|CUME_DIST|CURRENT|CURRENT_DATE|CURRENT_DEFAULT_TRANSFORM_GROUP|CURRENT_PATH|CURRENT_ROLE|CURRENT_TIME|CURRENT_TIMESTAMP|CURRENT_TRANSFORM_GROUP_FOR_TYPE|CURRENT_USER|CURSOR|CURSOR_NAME|CYCLE|DATA|DATABASE|DATE|DATETIME_INTERVAL_CODE|DATETIME_INTERVAL_PRECISION|DAY|DEALLOCATE|DEC|DECIMAL|DECLARE|DEFAULT|DEFAULTS|DEFERRABLE|DEFERRED|DEFINED|DEFINER|DELETE|DELIMITER|DELIMITERS|DENSE_RANK|DEPTH|DEREF|DERIVED) *$/i.test(
      value
    ) as boolean;
  }
}

export class CreatePostgrestTableDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(31, { message: 'Table name must be less than 32 characters' })
  @MinLength(1, { message: 'Table name must be at least 1 character' })
  @Matches(/^[a-zA-Z0-9_]*$/, {
    message: 'Table name can only contain letters, numbers and underscores',
  })
  @Validate(SQLInjectionValidator)
  table_name: string;

  @IsArray()
  @ArrayMinSize(1, { message: 'Table must have at least 1 column' })
  @ValidateNested({ each: true })
  @Type(() => PostgrestTableColumnDto)
  columns: PostgrestTableColumnDto[];
}

export class PostgrestTableColumnDto {
  @IsString()
  @IsNotEmpty()
  @Transform(({ value }) => sanitizeInput(value))
  @MaxLength(31, { message: 'Column name must be less than 32 characters' })
  @MinLength(1, { message: 'Column name must be at least 1 character' })
  @Matches(/^[a-zA-Z_][a-zA-Z0-9_]*$/, {
    message:
      '  $value : Column name must start with a letter or underscore and can only contain letters, numbers and underscores',
  })
  @Validate(ReservedKeywordConstraint, {
    message: ' $value : Column name cannot be a reserved keyword',
  })
  @Validate(SQLInjectionValidator, { message: 'Column name does not support special characters' })
  column_name: string;

  @IsString()
  @IsNotEmpty()
  @Transform(({ value }) => sanitizeInput(value))
  @Validate(SQLInjectionValidator)
  data_type: string;

  @IsString()
  @Transform(({ value }) => sanitizeInput(value))
  @IsOptional()
  @Validate(SQLInjectionValidator)
  constraint: string;

  @IsOptional()
  @Transform(({ value, obj }) => {
    const sanitizedValue = sanitizeInput(value);
    return validateDefaultValue(sanitizedValue, obj);
  })
  @Match('data_type', {
    message: 'Default value must match the data type',
  })
  @Validate(SQLInjectionValidator, { message: 'Default value does not support special characters except "." and "@"' })
  default: string | number | boolean;
}

export class RenamePostgrestTableDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(31, { message: 'Table name must be less than 32 characters' })
  @MinLength(1, { message: 'Table name must be at least 1 character' })
  @Matches(/^[a-zA-Z0-9_]*$/, {
    message: 'Table name can only contain letters, numbers and underscores',
  })
  @Validate(SQLInjectionValidator, { message: 'Table name does not support special characters' })
  table_name: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(31, { message: 'Table name must be less than 32 characters' })
  @MinLength(1, { message: 'Table name must be at least 1 character' })
  @Matches(/^[a-zA-Z0-9_]*$/, {
    message: 'Table name can only contain letters, numbers and underscores',
  })
  @Validate(SQLInjectionValidator, { message: 'Table name does not support special characters' })
  new_table_name: string;
}
