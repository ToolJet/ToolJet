import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  ArrayUnique,
  IsArray,
  IsIn,
  IsOptional,
  IsUUID,
  ValidateNested,
} from 'class-validator';
import { PinKind } from '../queries';

const PIN_KINDS: PinKind[] = ['data_source', 'folder'];

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
  @ArrayMaxSize(500)
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

// No `type` field: unlike apps, the data sources dashboard has one pin space, not one per app type.
export class ReorderPinsDto extends BranchQueryDto {
  @IsArray()
  @ArrayMaxSize(500)
  @ValidateNested({ each: true })
  @Type(() => PinRefDto)
  items: PinRefDto[];
}
