import { Injectable } from '@nestjs/common';
import { INpmRegistryService, PackageSearchResult, PackageInfo } from '../interfaces/INpmRegistryService';

@Injectable()
export class NpmRegistryService implements INpmRegistryService {
  async searchPackages(query: string, limit = 20): Promise<PackageSearchResult[]> {
    throw new Error('NPM package search is not available in Community Edition');
  }

  async getPackageInfo(packageName: string): Promise<PackageInfo> {
    throw new Error('NPM package info is not available in Community Edition');
  }
}
