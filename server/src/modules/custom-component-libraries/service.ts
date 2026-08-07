import { Injectable } from '@nestjs/common';
import { ICustomComponentLibrariesService, CliTokenView, UploadFiles, ServedFile, LibraryListItem } from './interface/IService';
import { CustomComponentLibrary } from '@entities/custom_component_library.entity';

@Injectable()
export class CustomComponentLibrariesService implements ICustomComponentLibrariesService {
  async createLibrary(organizationId: string, name: string): Promise<{ id: string; name: string }> {
    throw new Error('Method not implemented.');
  }

  async getLibrary(organizationId: string, id: string): Promise<CustomComponentLibrary> {
    throw new Error('Method not implemented.');
  }

  async listLibraries(organizationId: string): Promise<LibraryListItem[]> {
    throw new Error('Method not implemented.');
  }

  async createCliToken(userId: string, organizationId: string, name: string): Promise<CliTokenView & { token: string }> {
    throw new Error('Method not implemented.');
  }

  async listCliTokens(userId: string, organizationId: string): Promise<CliTokenView[]> {
    throw new Error('Method not implemented.');
  }

  async deleteCliToken(userId: string, organizationId: string, id: string): Promise<void> {
    throw new Error('Method not implemented.');
  }

  async uploadDev(
    userId: string,
    organizationId: string,
    libraryId: string,
    files: UploadFiles
  ): Promise<{ devUploadedAt: Date }> {
    throw new Error('Method not implemented.');
  }

  async publishRevision(
    organizationId: string,
    libraryId: string,
    files: UploadFiles,
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
