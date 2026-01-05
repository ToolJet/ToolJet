import { IsObject, IsString, IsOptional, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';

/**
 * Supported bundle languages for workflow package management
 */
export enum BundleLanguage {
  JAVASCRIPT = 'javascript',
  PYTHON = 'python',
}

/**
 * DTO for validating language path parameter in unified endpoints
 */
export class LanguageParamDto {
  @IsEnum(BundleLanguage)
  language: BundleLanguage;
}

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

// Python-specific DTOs
export class PythonPackageSearchResult {
  name: string;
  version: string;
  description: string;
  author?: string;
  keywords?: string[];
  releaseDate?: string;
  hasWheel?: boolean;
}

export class PythonPackageInfo {
  name: string;
  version: string;
  description: string;
  versions: string[];
  author?: string;
  license?: string;
  homepage?: string;
  requiresPython?: string;
}

export class PythonPackageVersionsResult {
  versions: string[];
}

export class WheelCheckResult {
  hasWheel: boolean;
  packageName: string;
  version: string;
}

export class PythonBundleStatus {
  status: 'none' | 'building' | 'ready' | 'failed';
  sizeBytes?: number;
  generationTimeMs?: number;
  error?: string;
  dependencies?: Record<string, string>;
  bundleSha?: string;
  language: 'python';
  runtimeVersion?: string;
}

// Unified DTOs for language-agnostic endpoints

/**
 * Unified package info response for both JS (NPM) and Python (PyPI)
 */
export class UnifiedPackageInfo {
  name: string;
  version: string;
  description: string;
  versions: string[];
  author?: string;
  license?: string;
  homepage?: string;
  language: BundleLanguage;
  // Python-specific
  requiresPython?: string;
  // JS-specific
  downloads?: number;
}

/**
 * Unified package versions response
 */
export class UnifiedPackageVersionsResult {
  versions: string[];
  language: BundleLanguage;
}

/**
 * Unified bundle status that includes language field
 */
export class UnifiedBundleStatus {
  status: 'none' | 'building' | 'ready' | 'failed';
  sizeBytes?: number;
  generationTimeMs?: number;
  error?: string;
  dependencies?: Record<string, string>;
  bundleSha?: string;
  language: BundleLanguage;
  runtimeVersion?: string;
}