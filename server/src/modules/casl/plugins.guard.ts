import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';

@Injectable()
export class IsPluginApiEnabledGuard implements CanActivate {
  constructor() {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Check if the plugin API is enabled based on your environment variable
    const enablePluginApi = process.env.ENABLE_MARKETPLACE_FEATURE === 'true';

    if (!enablePluginApi) {
      return false;
    }
    return true;
  }
}
