import { Injectable } from '@nestjs/common';
import { ICustomComponentLibrariesService, UploadFiles, ServedFile, LibraryListItem } from './interface/IService';
import { CustomComponentLibrary } from '@entities/custom_component_library.entity';

@Injectable()
export class CustomComponentLibrariesService implements ICustomComponentLibrariesService {
  async createLibrary(
    organizationId: string,
    name: string
  ): Promise<{ id: string; name: string; correlationId: string }> {
    throw new Error('Method not implemented.');
  }

  async findOrCreateLibrary(
    organizationId: string,
    correlationId: string,
    name: string
  ): Promise<{ id: string; name: string; correlationId: string; created: boolean }> {
    throw new Error('Method not implemented.');
  }

  async getLibrary(organizationId: string, id: string): Promise<CustomComponentLibrary> {
    throw new Error('Method not implemented.');
  }

  async getLibraryByCorrelationId(organizationId: string, correlationId: string): Promise<CustomComponentLibrary> {
    throw new Error('Method not implemented.');
  }

  async listLibraries(organizationId: string): Promise<LibraryListItem[]> {
    throw new Error('Method not implemented.');
  }

  async deleteLibrary(organizationId: string, id: string): Promise<void> {
    throw new Error('Method not implemented.');
  }

  async uploadDev(
    userId: string,
    organizationId: string,
    correlationId: string,
    files: UploadFiles
  ): Promise<{ devUploadedAt: Date }> {
    throw new Error('Method not implemented.');
  }

  async publishRevision(
    organizationId: string,
    correlationId: string,
    files: UploadFiles,
    version: string,
    message?: string
  ): Promise<{ id: string; version: string; bundleUrl: string }> {
    throw new Error('Method not implemented.');
  }

  async serveRevisionFile(libraryId: string, version: string, file: string): Promise<ServedFile> {
    throw new Error('Method not implemented.');
  }

  async serveDevFile(libraryId: string, userId: string, file: string): Promise<ServedFile> {
    throw new Error('Method not implemented.');
  }
}
