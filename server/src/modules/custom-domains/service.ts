import { Injectable } from '@nestjs/common';

@Injectable()
export class CustomDomainsService {
  async getCustomDomain(organizationId: string): Promise<any> {
    return null;
  }

  async createCustomDomain(organizationId: string, domain: string): Promise<any> {
    throw new Error('Method not implemented.');
  }

  async verifyCustomDomain(organizationId: string): Promise<any> {
    throw new Error('Method not implemented.');
  }

  async getCustomDomainStatus(organizationId: string): Promise<any> {
    throw new Error('Method not implemented.');
  }

  async deleteCustomDomain(organizationId: string): Promise<any> {
    throw new Error('Method not implemented.');
  }

  async resolveCustomDomain(domain: string): Promise<any> {
    return null;
  }
}
