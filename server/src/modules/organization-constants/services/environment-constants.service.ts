import { Injectable } from '@nestjs/common';
import { IEnvironmentConstantsService } from '../interfaces/IEnvironmentConstantsService';

@Injectable()
export class EnvironmentConstantsService implements IEnvironmentConstantsService {
  constructor() {}
  parseEnvironmentConstants(organizationId: string): Promise<any> {
    throw new Error('Method not implemented.');
  }

  async getConstants(organizationId, environmentId?, type?, resolveSecrets = false): Promise<any> {
    throw new Error('Method not implemented.');
  }

  async getOrgEnvironmentConstant(
    appEnvironments,
    name,
    organizationId,
    environmentId,
    type,
    resolveSecrets = false
  ): Promise<any> {
    throw new Error('Method not implemented.');
  }
}
