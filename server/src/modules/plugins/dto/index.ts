import { PartialType } from '@nestjs/mapped-types';
import { IsNotEmpty, IsString, IsUUID, IsOptional, IsSemVer } from 'class-validator';

export class CreatePluginDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  repo: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsString()
  @IsNotEmpty()
  id: string;

  @IsString()
  @IsNotEmpty()
  @IsSemVer()
  version: string;

  @IsUUID()
  @IsOptional()
  organizationId: string;
}

export class UpdatePluginDto extends PartialType(CreatePluginDto) {
  @IsString()
  @IsOptional()
  pluginId: string;
}
