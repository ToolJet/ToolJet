import { IsString, IsArray, ValidateNested, IsIn, IsOptional, IsObject, IsNotEmpty } from 'class-validator';
import { Type } from 'class-transformer';

class Table {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  type: string;
}

class Field {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  table: string;
}

class Conditions {
  @IsString()
  @IsIn(['AND', 'OR'])
  operator: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ConditionsList)
  conditionsList: ConditionsList[];
}

class ConditionField {
  @IsString()
  @IsIn(['Column', 'Value'])
  type: string;

  @IsString()
  @IsNotEmpty()
  table: string;

  @IsString()
  @IsOptional() // present only when type is column
  columnName: string;

  value: unknown;
}

class ConditionsList {
  @IsObject()
  @IsNotEmpty()
  @ValidateNested()
  @Type(() => ConditionField)
  leftField: ConditionField;

  @IsString()
  @IsIn(['=', '>', '>=', '<', '<=', '!=', 'LIKE', 'NOT LIKE', 'ILIKE', 'NOT ILIKE', '~', '~*', 'IN', 'NOT IN', 'IS'])
  operator: string;

  @IsObject()
  @IsNotEmpty()
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
  @IsIn(['INNER', 'LEFT', 'RIGHT', 'FULL OUTER'])
  joinType: string;

  @IsString()
  @IsNotEmpty()
  table: string;

  @ValidateNested()
  @IsNotEmpty()
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
  @IsNotEmpty()
  columnName: string;

  @IsString()
  @IsNotEmpty()
  table: string;

  @IsIn(['ASC', 'DESC'])
  @IsNotEmpty()
  direction: string;
}

export class TooljetDbJoinDto {
  @ValidateNested()
  @Type(() => Table)
  @IsNotEmpty()
  from: Table;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => Field)
  @IsNotEmpty()
  fields: Field[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => Join)
  @IsNotEmpty()
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
