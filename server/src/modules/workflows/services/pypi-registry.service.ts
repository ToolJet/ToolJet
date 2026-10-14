import { Injectable } from '@nestjs/common';
import {
  IPyPiRegistryService,
  PythonPackageSearchResult,
  PythonPackageInfo,
} from '../interfaces/IPyPiRegistryService';

@Injectable()
export class PyPiRegistryService implements IPyPiRegistryService {
  async searchPackages(query: string, limit = 20): Promise<PythonPackageSearchResult[]> {
    throw new Error('PyPI package search is not available in Community Edition');
  }

  async getPackageInfo(packageName: string): Promise<PythonPackageInfo> {
    throw new Error('PyPI package info is not available in Community Edition');
  }

  async getPackageVersions(packageName: string): Promise<string[]> {
    throw new Error('PyPI package versions is not available in Community Edition');
  }

  async hasPrebuiltWheel(packageName: string, version: string): Promise<boolean> {
    throw new Error('PyPI wheel check is not available in Community Edition');
  }
}
