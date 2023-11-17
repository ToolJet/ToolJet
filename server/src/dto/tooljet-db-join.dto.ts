import { IsString, IsArray, ValidateNested, IsIn, IsOptional, IsObject, IsNotEmpty } from 'class-validator';
import { Type } from 'class-transformer';

// TODO: We need to remove custom error messages and make use of dto
// default errors and let frontend show the errors on the specific fields
class Table {
  @IsString()
  @IsNotEmpty({ message: '::Table name for join not selected' })
  name: string;

  @IsString()
  @IsNotEmpty({ message: '::Table type for join not selected' })
  type: string;
}

class Field {
  @IsString()
  @IsNotEmpty({ message: '::Columns names for join not selected' })
  name: string;

  @IsString()
  @IsNotEmpty({ message: '::Table names for join not selected' })
  table: string;
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
  table: string;

  @IsString()
  @IsOptional() // present only when type is column
  columnName: string;
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
  table: string;

  @ValidateNested()
  @IsNotEmpty({ message: '::Join condition is not selected' })
  @Type(() => Conditions)
  conditions: Conditions;
}

class GroupBy {
  @IsString()
  @IsNotEmpty()
  table: string;

  @IsString()
  @IsNotEmpty()
  columnName: string;
}

class Order {
  @IsString()
  @IsNotEmpty({ message: '::Sort column not selected' })
  columnName: string;

  @IsString()
  @IsNotEmpty({ message: '::Sort table not selected' })
  table: string;

  @IsIn(['ASC', 'DESC'], { message: '::Sort direction not selected' })
  direction: string;
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
