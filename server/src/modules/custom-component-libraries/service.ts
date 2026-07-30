import { Injectable } from '@nestjs/common';
import { ICustomComponentLibrariesService } from './interface/IService';
import { CustomComponentLibrary } from '@entities/custom_component_library.entity';

@Injectable()
export class CustomComponentLibrariesService implements ICustomComponentLibrariesService {
  async createLibrary(organizationId: string, name: string): Promise<{ id: string; name: string }> {
    throw new Error('Method not implemented.');
  }

  async getLibrary(organizationId: string, id: string): Promise<CustomComponentLibrary> {
    throw new Error('Method not implemented.');
  }
}
