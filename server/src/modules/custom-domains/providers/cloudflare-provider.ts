import { Injectable } from '@nestjs/common';
import { IDomainProvider, DomainProviderResult } from './domain-provider.interface';

@Injectable()
export class CloudflareProvider implements IDomainProvider {
  async createCustomHostname(_domain: string): Promise<DomainProviderResult> {
    throw new Error('Method not implemented.');
  }

  async deleteCustomHostname(_hostnameId: string): Promise<void> {
    throw new Error('Method not implemented.');
  }

  async getHostnameStatus(_hostnameId: string): Promise<DomainProviderResult> {
    throw new Error('Method not implemented.');
  }

  async verifyDomain(_domain: string): Promise<{ valid: boolean; errors?: string[] }> {
    throw new Error('Method not implemented.');
  }
}
