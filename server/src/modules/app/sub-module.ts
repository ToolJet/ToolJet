import { DynamicModule } from '@nestjs/common';
import { getImportPath } from './constants';

export abstract class SubModule {
  /**
   * Per-subclass cache of built DynamicModules keyed by config signature.
   * Each subclass has its own array entry — cache lookups never cross classes.
   * The cache exists to avoid re-running dynamic imports + module assembly when
   * the same module is registered repeatedly with the same configs during
   * bootstrap (e.g. AppsModule.register and FoldersModule.register both pulling
   * UsersModule.register through the dependency graph).
   */
  private static cachedModules: Map<Function, Array<{ key: string; module: DynamicModule }>> = new Map();

  /**
   * Build a stable string key from the register() arguments. Default
   * implementation handles the common (configs, isMainImport) shape; subclasses
   * with extra register args can override.
   */
  protected static buildCacheKey(configs?: { IS_GET_CONTEXT: boolean }, ...rest: any[]): string {
    return JSON.stringify([configs ?? {}, ...rest]);
  }

  /** Look up a cached DynamicModule for this subclass + cache key. */
  protected static getCachedModule(this: any, key: string): DynamicModule | null {
    const list = SubModule.cachedModules.get(this);
    if (!list) return null;
    return list.find((entry) => entry.key === key)?.module ?? null;
  }

  /** Store a DynamicModule under this subclass + cache key. */
  protected static cacheModule(this: any, key: string, module: DynamicModule): DynamicModule {
    let list = SubModule.cachedModules.get(this);
    if (!list) {
      list = [];
      SubModule.cachedModules.set(this, list);
    }
    list.push({ key, module });
    return module;
  }

  protected static async getProviders(
    configs: { IS_GET_CONTEXT: boolean },
    module: string,
    paths: string[]
  ): Promise<any> {
    const importPath = await getImportPath(configs.IS_GET_CONTEXT);
    const providers = {};

    for (const path of paths) {
      const fullPath = `${importPath}/${module}/${path}`;
      const imported = await import(fullPath);
      Object.assign(providers, imported);
    }

    return providers;
  }
}
