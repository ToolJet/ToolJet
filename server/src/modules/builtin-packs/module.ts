import { DynamicModule } from '@nestjs/common';
import { BuiltinPacksController } from './controller';

// The component packs that ship with ToolJet, served from the release in every edition (no EE variant).
export class BuiltinPacksModule {
  static async register(configs?: { IS_GET_CONTEXT: boolean }, isMainImport = false): Promise<DynamicModule> {
    return {
      module: BuiltinPacksModule,
      controllers: isMainImport ? [BuiltinPacksController] : [],
    };
  }
}
