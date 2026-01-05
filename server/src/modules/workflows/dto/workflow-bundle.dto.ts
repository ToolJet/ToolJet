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

/**
 * DTO for JavaScript package updates (JSON object)
 */
export class UpdateJavascriptPackagesDto {
  @IsObject()
  dependencies: Record<string, string>;
}

/**
 * DTO for Python package updates (raw requirements.txt content)
 */
export class UpdatePythonPackagesDto {
  @IsString()
  dependencies: string; // Raw requirements.txt content, e.g., "requests==2.31.0\nnumpy>=1.24.0"
}

export class RebuildBundleDto {}

export class PackageSearchQueryDto {
  @IsString()
  q: string;

  @IsOptional()
  @Type(() => Number)
  limit?: number;
}

export class JavascriptPackageSearchResult {
  name: string;
  version: string;
  description: string;
  author?: string;
  keywords?: string[];
  modified?: string;
}

export class GetJavascriptPackagesResult {
  dependencies: Record<string, string>;
}

export class JavascriptBundleStatus {
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
  dependencies?: string; // Raw requirements.txt content
  bundleSha?: string;
  language: 'python';
  runtimeVersion?: string;
}

/**
 * Result for getting Python packages (raw requirements.txt)
 */
export class GetPythonPackagesResult {
  dependencies: string; // Raw requirements.txt content
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
 * Note: dependencies format varies by language:
 * - JavaScript: JSON object { "lodash": "4.17.21" }
 * - Python: string (requirements.txt content) "requests==2.31.0\nnumpy>=1.24.0"
 */
export class UnifiedBundleStatus {
  status: 'none' | 'building' | 'ready' | 'failed';
  sizeBytes?: number;
  generationTimeMs?: number;
  error?: string;
  dependencies?: Record<string, string> | string;
  bundleSha?: string;
  language: BundleLanguage;
  runtimeVersion?: string;
}