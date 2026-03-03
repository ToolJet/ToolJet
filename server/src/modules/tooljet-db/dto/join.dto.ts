import { IsString, IsArray, ValidateNested, IsIn, IsOptional, IsObject, IsNotEmpty, Matches, Validate, IsUUID } from 'class-validator';
import { Type } from 'class-transformer';
import { SQLInjectionValidator } from './index';

// TODO: We need to remove custom error messages and make use of dto
// default errors and let frontend show the errors on the specific fields
class Table {
  @IsString()
  @IsNotEmpty({ message: '::Table name for join not selected' })
  @IsUUID('4', { message: '::Table identifier must be a valid UUID' })
  name: string;

  @IsString()
  @IsNotEmpty({ message: '::Table type for join not selected' })
  type: string;
}

class Field {
  @IsString()
  @IsNotEmpty({ message: '::Columns names for join not selected' })
  @Matches(/^[a-zA-Z_][a-zA-Z0-9_]*$/, {
    message: '::Column name must start with a letter or underscore and can only contain letters, numbers and underscores',
  })
  @Validate(SQLInjectionValidator, { message: '::Column name does not support special characters' })
  name: string;

  @IsString()
  @IsNotEmpty({ message: '::Table names for join not selected' })
  @IsUUID('4', { message: '::Table identifier must be a valid UUID' })
  table: string;

  @IsString()
  @IsOptional()
  @Matches(/^[a-zA-Z0-9_'>\-\s]*$/, {
    message: '::Jsonpath contains invalid characters',
  })
  jsonpath: string;
}

class Conditions {
  @IsString()
  @IsIn(['AND', 'OR'], { message: '::Operator for condition not selected (AND | OR)' })
  @IsOptional()
  operator: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ConditionsList)
  conditionsList: ConditionsList[];
}

class ConditionField {
  @IsString()
  @IsIn(['Column', 'Value'], { message: '::Condition parameter not specified' })
  type: string;

  @IsOptional() // present only when type is value
  value: unknown;

  @IsString()
  @IsOptional() // present only when type is column
  @IsUUID('4', { message: '::Table identifier must be a valid UUID' })
  table: string;

  @IsString()
  @IsOptional() // present only when type is column
  @Matches(/^[a-zA-Z_][a-zA-Z0-9_]*$/, {
    message: '::Column name must start with a letter or underscore and can only contain letters, numbers and underscores',
  })
  @Validate(SQLInjectionValidator, { message: '::Column name does not support special characters' })
  columnName: string;

  @IsString()
  @IsOptional()
  @Matches(/^[a-zA-Z0-9_'>\-\s]*$/, {
    message: '::Jsonpath contains invalid characters',
  })
  jsonpath: string;
}

class ConditionsList {
  @IsObject()
  @IsNotEmpty({ message: '::Condition value is empty' })
  @ValidateNested()
  @Type(() => ConditionField)
  leftField: ConditionField;

  @IsString()
  @IsIn(['=', '>', '>=', '<', '<=', '!=', 'LIKE', 'NOT LIKE', 'ILIKE', 'NOT ILIKE', '~', '~*', 'IN', 'NOT IN', 'IS'], {
    message: '::Condition operator not selected',
  })
  operator: string;

  @IsObject()
  @IsNotEmpty({ message: '::Condition value is empty' })
  @ValidateNested()
  @Type(() => ConditionField)
  rightField: ConditionField;

  @ValidateNested()
  @Type(() => Conditions)
  @IsOptional()
  conditions: Conditions;
}

class Join {
  @IsString()
  @IsIn(['INNER', 'LEFT', 'RIGHT', 'FULL OUTER'], { message: '::Join type not selected' })
  joinType: string;

  @IsString()
  @IsNotEmpty({ message: '::Join table is not selected' })
  @IsUUID('4', { message: '::Table identifier must be a valid UUID' })
  table: string;

  @ValidateNested()
  @IsNotEmpty({ message: '::Join condition is not selected' })
  @Type(() => Conditions)
  conditions: Conditions;
}

class GroupBy {
  @IsString()
  @IsNotEmpty()
  @IsUUID('4', { message: '::Table identifier must be a valid UUID' })
  table: string;

  @IsString()
  @IsNotEmpty()
  @Matches(/^[a-zA-Z_][a-zA-Z0-9_]*$/, {
    message: '::Column name must start with a letter or underscore and can only contain letters, numbers and underscores',
  })
  @Validate(SQLInjectionValidator, { message: '::Column name does not support special characters' })
  columnName: string;
}

class Order {
  @IsString()
  @IsNotEmpty({ message: '::Sort column not selected' })
  @Matches(/^[a-zA-Z_][a-zA-Z0-9_]*$/, {
    message: '::Column name must start with a letter or underscore and can only contain letters, numbers and underscores',
  })
  @Validate(SQLInjectionValidator, { message: '::Column name does not support special characters' })
  columnName: string;

  @IsString()
  @IsNotEmpty({ message: '::Sort table not selected' })
  @IsUUID('4', { message: '::Table identifier must be a valid UUID' })
  table: string;

  @IsIn(['ASC', 'DESC'], { message: '::Sort direction not selected' })
  direction: string;

  @IsString()
  @IsOptional()
  @Matches(/^[a-zA-Z0-9_'>\-\s]*$/, {
    message: '::Jsonpath contains invalid characters',
  })
  jsonpath: string;
}

export class TooljetDbJoinDto {
  @ValidateNested()
  @Type(() => Table)
  @IsNotEmpty({ message: '::Join table is empty' })
  from: Table;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => Field)
  @IsNotEmpty({ message: '::Join fields are empty' })
  fields: Field[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => Join)
  @IsNotEmpty({ message: '::Join parameters are empty' })
  joins: Join[];

  @ValidateNested()
  @Type(() => Conditions)
  @IsOptional()
  conditions: Conditions;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => GroupBy)
  @IsOptional()
  group_by: GroupBy[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => Order)
  @IsOptional()
  order_by: Order[];

  @IsString()
  @IsOptional()
  limit: string;

  @IsString()
  @IsOptional()
  offset: string;
}
