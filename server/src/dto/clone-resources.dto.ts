import { IsUUID, IsOptional, IsString, Matches } from 'class-validator';

export class CloneResourcesDto {
  @IsOptional()
  app: CloneAppDto[];

  @IsOptional()
  tooljet_database: CloneTooljetDatabaseDto[];

  @IsUUID()
  organization_id: string;

  @IsOptional()
  @IsUUID()
  branchId?: string;
}

export class CloneAppDto {
  @IsUUID()
  id: string;

  @IsString()
  @Matches(/^[^/\\]*$/, { message: "Name should not contain '/' or '\\'" })
  name: string;
}

export class CloneTooljetDatabaseDto {
  @IsUUID()
  id: string;
}
