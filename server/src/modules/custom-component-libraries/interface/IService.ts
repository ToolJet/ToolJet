import { CustomComponentLibrary } from '@entities/custom_component_library.entity';

export interface CliTokenView {
  id: string;
  name: string;
  createdAt: Date;
}

export interface UploadFiles {
  bundle: Buffer;
  css?: Buffer;
  manifest: Record<string, any>;
}

// B9: what the builder's Custom tab needs — lean on purpose. Only the LATEST
// revision's manifest ships inline (drives the component list); older revision
// manifests are fetchable via the public /files/manifest.json endpoint when F5
// actually switches versions.
export interface LibraryListItem {
  id: string;
  name: string;
  createdAt: Date;
  manifest: Record<string, any> | null; // latest revision's; null = nothing published yet
  revisions: { id: string; version: string; message: string | null; createdAt: Date }[]; // newest first
  devBundles: { userId: string; userEmail: string | null; uploadedAt: Date }[]; // "Dev preview @email"
}

export interface ICustomComponentLibrariesService {
  createLibrary(organizationId: string, name: string): Promise<{ id: string; name: string }>;
  getLibrary(organizationId: string, id: string): Promise<CustomComponentLibrary>;
  listLibraries(organizationId: string): Promise<LibraryListItem[]>;
  createCliToken(userId: string, organizationId: string, name: string): Promise<CliTokenView & { token: string }>;
  listCliTokens(userId: string, organizationId: string): Promise<CliTokenView[]>;
  deleteCliToken(userId: string, organizationId: string, id: string): Promise<void>;
  uploadDev(
    userId: string,
    organizationId: string,
    libraryId: string,
    files: UploadFiles
  ): Promise<{ devUploadedAt: Date }>;
  publishRevision(
    organizationId: string,
    libraryId: string,
    files: UploadFiles,
    message?: string
  ): Promise<{ id: string; version: string; bundleUrl: string }>;
  serveRevisionFile(libraryId: string, version: string, file: string): Promise<ServedFile>;
  serveDevFile(libraryId: string, userId: string, file: string): Promise<ServedFile>;
}

export interface ServedFile {
  data: Buffer;
  contentType: string;
}
