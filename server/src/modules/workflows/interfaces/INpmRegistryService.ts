export interface INpmRegistryService {
  searchPackages(query: string, limit?: number): Promise<PackageSearchResult[]>;
  getPackageInfo(packageName: string): Promise<PackageInfo>;
}

export interface PackageSearchResult {
  name: string;
  version: string;
  description: string;
  downloads?: number;
  links?: {
    npm?: string;
    homepage?: string;
    repository?: string;
    bugs?: string;
  };
  keywords?: string[];
  author?: string;
  modified?: string;
}

export interface PackageInfo {
  name: string;
  version: string;
  description: string;
  versions: Record<string, any>;
  'dist-tags': {
    latest: string;
    [key: string]: string;
  };
  time: Record<string, string>;
  maintainers?: Array<{
    name: string;
    email: string;
  }>;
  license?: string;
  homepage?: string;
  repository?: {
    type: string;
    url: string;
  };
}
