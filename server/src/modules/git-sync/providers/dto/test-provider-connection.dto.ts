import { GITConnectionType } from '@entities/organization_git_sync.entity';
import { IsBoolean, IsEnum, IsOptional } from 'class-validator';

export class TestConnectionBaseDTO {
  @IsEnum(GITConnectionType)
  gitType: GITConnectionType;

  @IsBoolean()
  @IsOptional()
  useEnvConfig?: boolean;

  @IsBoolean()
  @IsOptional()
  hasStoredConfig?: boolean;
}

export type TestConnectionPayloadDTO = TestConnectionBaseDTO;
