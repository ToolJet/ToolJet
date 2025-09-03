export interface PackageSearchResult {
  name: string;
  version: string;
  description: string;
  author?: string;
  keywords?: string[];
  modified?: string;
}

export interface PackageInfo {
  name: string;
  version?: string;
  description?: string;
  author?: any;
  keywords?: string[];
  'dist-tags': {
    latest: string;
    [key: string]: string;
  };
  versions: Record<string, any>;
  time?: Record<string, string>;
  maintainers?: any[];
  repository?: any;
  homepage?: string;
  bugs?: any;
  license?: string;
}

export interface INpmRegistryService {
  searchPackages(query: string, limit?: number): Promise<PackageSearchResult[]>;
  getPackageInfo(packageName: string): Promise<PackageInfo>;
}