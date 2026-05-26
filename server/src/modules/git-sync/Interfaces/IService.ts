import { ProviderConfigDTO } from '@modules/git-sync/dto/provider-config.dto';
import { UpdateGitEnvConfigDTO } from '@ee/git-sync/providers/dto/provider-config.dto';
import { TestConnectionPayloadDTO } from '@ee/git-sync/providers/dto/test-provider-connection.dto';

// Strategy-only contract after DB-only operations moved to GitSyncConfigsService.
export interface IGitSyncService {
  saveProviderConfig(userId: string, organizationId: string, configData: ProviderConfigDTO): Promise<void>;

  toggleEnvProviderConfig(
    userId: string,
    organizationId: string,
    configData: UpdateGitEnvConfigDTO
  ): Promise<void>;

  testProviderConnection(userId: string, organizationId: string, payload: TestConnectionPayloadDTO): Promise<any>;
}
