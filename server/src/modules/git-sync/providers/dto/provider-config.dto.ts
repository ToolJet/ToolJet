import { GITConnectionType } from '@entities/organization_git_sync.entity';
import { IsBoolean, IsEnum } from 'class-validator';

export class UpdateGitEnvConfigDTO {
  @IsBoolean()
  useEnvConfig: boolean;

  @IsEnum(GITConnectionType)
  provider: GITConnectionType;
}
