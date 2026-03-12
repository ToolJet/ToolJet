import { IsObject, IsString, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

export class UpdatePackagesDto {
  @IsObject()
  dependencies: Record<string, string>;
}

export class RebuildBundleDto {}

export class PackageSearchQueryDto {
  @IsString()
  q: string;

  @IsOptional()
  @Type(() => Number)
  limit?: number;
}

export class PackageSearchResult {
  name: string;
  version: string;
  description: string;
  author?: string;
  keywords?: string[];
  modified?: string;
}

export class GetPackagesResult {
  dependencies: Record<string, string>;
}

export class BundleStatus {
  status: 'none' | 'building' | 'ready' | 'failed';
  sizeBytes?: number;
  generationTimeMs?: number;
  error?: string;
  dependencies?: Record<string, string>;
  bundleSha?: string;
}

export class UpdatePackagesResult {
  success: boolean;
  message?: string;
  bundleStatus?: 'building' | 'ready' | 'failed';
}

export class RebuildBundleResult {
  success: boolean;
  message: string;
  bundleStatus: 'building';
}