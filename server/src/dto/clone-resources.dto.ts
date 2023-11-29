import { IsUUID, IsOptional, IsString } from 'class-validator';

export class CloneResourcesDto {
  @IsOptional()
  app: CloneAppDto[];

  @IsOptional()
  tooljet_database: CloneTooljetDatabaseDto[];

  @IsUUID()
  organization_id: string;
}

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
