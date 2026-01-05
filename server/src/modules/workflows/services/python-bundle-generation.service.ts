import { Injectable } from '@nestjs/common';

/**
 * CE stub for PythonBundleGenerationService.
 * Python bundle generation is only available in Enterprise Edition.
 */
@Injectable()
export class PythonBundleGenerationService {
  async updatePackages(appVersionId: string, dependencies: Record<string, string>): Promise<void> {
    throw new Error('Python bundle generation is not available in Community Edition');
  }

  async generateBundle(appVersionId: string, dependencies: Record<string, string>): Promise<void> {
    throw new Error('Python bundle generation is not available in Community Edition');
  }

  async getBundleForExecution(appVersionId: string): Promise<Buffer | null> {
    return null; // CE workflows have no Python bundles
  }

  async getCurrentDependencies(appVersionId: string): Promise<Record<string, string>> {
    return {};
  }

  async getBundleStatus(appVersionId: string): Promise<{
    status: 'none' | 'building' | 'ready' | 'failed';
    sizeBytes?: number;
    generationTimeMs?: number;
    error?: string;
    dependencies?: Record<string, string>;
    bundleSha?: string;
    language?: string;
    runtimeVersion?: string;
  }> {
    return { status: 'none' };
  }

  async rebuildBundle(appVersionId: string): Promise<void> {
    throw new Error('Python bundle generation is not available in Community Edition');
  }
}
