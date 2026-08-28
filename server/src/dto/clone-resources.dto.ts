import {
  IsUUID,
  IsOptional,
  IsString,
  ValidateNested,
  IsArray,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CloneAppDto {
  @IsUUID()
  id: string;

  @IsString()
  name: string;
}

export class CloneTooljetDatabaseDto {
  @IsUUID()
  id: string;
}

export class CloneResourcesDto {
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CloneAppDto)
  app?: CloneAppDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CloneTooljetDatabaseDto)
  tooljet_database?: CloneTooljetDatabaseDto[];

  @IsUUID()
  organization_id: string;

  @IsOptional()
  @IsUUID()
  branchId?: string;
}