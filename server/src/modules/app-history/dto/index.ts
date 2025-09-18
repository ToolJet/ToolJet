import { IsString, IsOptional, IsEnum, IsNotEmpty, IsUUID } from 'class-validator';
import { ACTION_TYPE, HISTORY_TYPE } from '../constants';

export class CreateHistoryEntryDto {
  @IsUUID()
  @IsNotEmpty()
  appVersionId: string;

  @IsEnum(ACTION_TYPE)
  @IsNotEmpty()
  actionType: ACTION_TYPE;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsOptional()
  operationScope?: Record<string, any>;

  @IsNotEmpty()
  changePayload: any;

  @IsEnum(HISTORY_TYPE)
  @IsNotEmpty()
  historyType: HISTORY_TYPE;

  @IsOptional()
  @IsUUID()
  parentId?: string;
}

export class UpdateDescriptionDto {
  @IsString()
  @IsNotEmpty()
  description: string;
}

export class HistoryFiltersDto {
  @IsOptional()
  @IsUUID()
  userId?: string;

  @IsOptional()
  @IsString()
  actionType?: string;

  @IsOptional()
  @IsString()
  startDate?: string;

  @IsOptional()
  @IsString()
  endDate?: string;
}
