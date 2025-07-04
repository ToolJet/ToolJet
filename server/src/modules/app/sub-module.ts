import { getImportPath } from './constants';

export abstract class SubModule {
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
