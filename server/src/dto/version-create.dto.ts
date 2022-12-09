import { IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';

export class VersionCreateDto {
  @IsString()
  @IsNotEmpty()
  versionName: string;

  @IsUUID()
  @IsOptional()
  versionFromId: string;
}
