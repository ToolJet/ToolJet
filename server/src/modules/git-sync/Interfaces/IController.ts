import { User as UserEntity } from '@entities/user.entity';
import { ProviderConfigDTO } from '../dto/provider-config.dto';

// Strategy-only contract after the DB-only endpoints moved to GitSyncConfigsController.
export interface IGitSyncController {
  saveProviderConfigs(user: UserEntity, configData: ProviderConfigDTO): Promise<any>;

  toggleEnvConfig(user: UserEntity, configData: unknown): Promise<any>;

  testConnection(user: UserEntity, payload: unknown): Promise<any>;

  setFinalizeConfig(
    user: UserEntity,
    organizationGitId: string,
    configDto: ProviderConfigDTO
  ): Promise<void>;
}
