import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  ArrayUnique,
  IsArray,
  IsEnum,
  IsIn,
  IsOptional,
  IsUUID,
  ValidateNested,
} from 'class-validator';
import { APP_TYPES } from '@modules/apps/constants';
import { PinKind } from '../queries';

const PIN_KINDS: PinKind[] = ['app', 'folder'];

export class BranchQueryDto {
  @IsOptional()
  @IsUUID()
  branch_id?: string;
}

export class CreatePinsDto extends BranchQueryDto {
  @IsIn(PIN_KINDS)
  resource_type: PinKind;

  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(50)
  @ArrayUnique()
  @IsUUID('all', { each: true })
  resource_ids: string[];
}

export class UnpinParamsDto {
  @IsIn(PIN_KINDS)
  resource_type: PinKind;

  @IsUUID()
  resource_id: string;
}

export class PinRefDto {
  @IsIn(PIN_KINDS)
  resource_type: PinKind;

  @IsUUID()
  resource_id: string;
}

export class ReorderPinsDto extends BranchQueryDto {
  @IsEnum(APP_TYPES)
  type: APP_TYPES;

  @IsArray()
  @ArrayMaxSize(500)
  @ValidateNested({ each: true })
  @Type(() => PinRefDto)
  items: PinRefDto[];
}
