import { Injectable } from '@nestjs/common';
import { IOrganizationEnvRegistryService } from '@modules/organization-env/interfaces/IService';

@Injectable()
export class OrganizationEnvRegistryService implements IOrganizationEnvRegistryService {
  async initialize(): Promise<void> {}

  has(_organizationId: string, _key: string): boolean {
    return false;
  }

  hasAll(_organizationId: string, _keys: readonly string[]): boolean {
    return false;
  }

  async get(_organizationId: string, _key: string): Promise<string | undefined> {
    return undefined;
  }

  async ensureResolved(_organizationId: string): Promise<void> {}

  getResolvedOrganizationIds(): string[] {
    return [];
  }
}
