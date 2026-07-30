import { CustomComponentLibrary } from '@entities/custom_component_library.entity';

export interface ICustomComponentLibrariesService {
  createLibrary(organizationId: string, name: string): Promise<{ id: string; name: string }>;
  getLibrary(organizationId: string, id: string): Promise<CustomComponentLibrary>;
}
