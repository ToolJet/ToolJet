import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';

@Injectable()
export class IsPluginApiEnabledGuard implements CanActivate {
  constructor() {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const enablePluginApi = process.env.ENABLE_MARKETPLACE_FEATURE === 'true';

    if (!enablePluginApi) {
      // If the environment variable is not set or is not 'true',
      return false;
    }

    return true;
  }
}
