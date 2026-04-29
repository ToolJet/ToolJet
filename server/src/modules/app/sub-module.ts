import { getImportPath, TOOLJET_EDITIONS } from './constants';

function isMissingModuleError(error: unknown, modulePath: string): boolean {
  if (!(error instanceof Error)) {
    return false;
  }

  const importError = error as NodeJS.ErrnoException;
  return (
    (importError.code === 'MODULE_NOT_FOUND' || importError.code === 'ERR_MODULE_NOT_FOUND') &&
    importError.message.includes(modulePath)
  );
}

export abstract class SubModule {
  protected static async getProviders(
    configs: { IS_GET_CONTEXT: boolean },
    module: string,
    paths: string[]
  ): Promise<any> {
    const importPath = await getImportPath(configs.IS_GET_CONTEXT);
    const ceImportPath = await getImportPath(configs.IS_GET_CONTEXT, TOOLJET_EDITIONS.CE);
    const providers = {};

    for (const path of paths) {
      const fullPath = `${importPath}/${module}/${path}`;
      let imported;

      try {
        imported = await import(fullPath);
      } catch (error) {
        const fallbackPath = `${ceImportPath}/${module}/${path}`;
        if (fallbackPath === fullPath || !isMissingModuleError(error, fullPath)) {
          throw error;
        }
        imported = await import(fallbackPath);
      }

      Object.assign(providers, imported);
    }

    return providers;
  }
}
