import { Injectable } from '@nestjs/common';
import { ProviderConfigDTO } from './dto/provider-config.dto';
import { IGitSyncService } from './Interfaces/IService';

// CE stub — strategy-only contract. The EE implementation lives in ee/git-sync/service.ts.
@Injectable()
export class GitSyncService implements IGitSyncService {
  constructor() {}

  async saveProviderConfig(_userId: string, _organizationId: string, _configData: ProviderConfigDTO): Promise<void> {
    throw new Error('Method not implemented.');
  }

  async toggleEnvProviderConfig(_userId: string, _organizationId: string, _configData: any): Promise<void> {
    throw new Error('Method not implemented.');
  }

  async testProviderConnection(_userId: string, _organizationId: string, _payload: any): Promise<any> {
    throw new Error('Method not implemented.');
  }
}
