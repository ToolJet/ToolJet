export interface IPyPiRegistryService {
  searchPackages(query: string, limit?: number): Promise<PythonPackageSearchResult[]>;
  getPackageInfo(packageName: string): Promise<PythonPackageInfo>;
  getPackageVersions(packageName: string): Promise<string[]>;
  hasPrebuiltWheel(packageName: string, version: string): Promise<boolean>;
}

export interface PythonPackageSearchResult {
  name: string;
  version: string;
  description: string;
  author?: string;
  keywords?: string[];
  releaseDate?: string;
  hasWheel?: boolean;
}

export interface PythonPackageInfo {
  name: string;
  version: string;
  description: string;
  versions: string[];
  author?: string;
  authorEmail?: string;
  license?: string;
  homepage?: string;
  projectUrl?: string;
  requiresPython?: string;
  keywords?: string[];
}
