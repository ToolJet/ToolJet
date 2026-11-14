import { CustomComponentLibrary } from '@entities/custom_component_library.entity';

export interface UploadFiles {
  bundle: Buffer;
  css?: Buffer;
  manifest: Record<string, any>;
}

export interface LibraryListItem {
  id: string;
  name: string;
  correlationId: string;
  /** Shipped with ToolJet (builtin-packs): installed in every workspace, not deletable. */
  builtIn?: boolean;
  createdAt: Date;
  // The latest revision's, without its embedded `source`; null = nothing published yet.
  manifest: Record<string, any> | null;
  // Set when that manifest had a `source` this list left out: its manifest file still has it.
  manifestSourceOmitted?: boolean;
  revisions: { id: string; version: string; message: string | null; createdAt: Date }[]; // newest first
  // Who built each dev preview, by user id; sourceContentHash: the source the build was made from, null when unknown.
  devBundles: { userId: string; uploadedAt: Date; sourceContentHash: string | null }[];
}

export interface ICustomComponentLibrariesService {
  createLibrary(organizationId: string, name: string): Promise<{ id: string; name: string; correlationId: string }>;
  findOrCreateLibrary(
    organizationId: string,
    correlationId: string,
    name: string
  ): Promise<{ id: string; name: string; correlationId: string; created: boolean }>;
  getLibrary(organizationId: string, id: string): Promise<CustomComponentLibrary>;
  getLibraryByCorrelationId(organizationId: string, correlationId: string): Promise<CustomComponentLibrary>;
  listLibraries(organizationId: string): Promise<LibraryListItem[]>;
  deleteLibrary(organizationId: string, id: string): Promise<void>;
  uploadDev(
    userId: string,
    organizationId: string,
    correlationId: string,
    files: UploadFiles
  ): Promise<{ devUploadedAt: Date }>;
  publishRevision(
    organizationId: string,
    correlationId: string,
    files: UploadFiles,
    version: string,
    message?: string
  ): Promise<{ id: string; version: string; bundleUrl: string }>;
  serveRevisionFile(libraryId: string, version: string, file: string): Promise<ServedFile>;
  serveDevFile(libraryId: string, userId: string, file: string): Promise<ServedFile>;
}

export interface ServedFile {
  data: Buffer;
  contentType: string;
}
