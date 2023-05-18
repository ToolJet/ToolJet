import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';

@Injectable()
export class IsPluginApiEnabledGuard implements CanActivate {
  constructor() {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Check if the plugin API is enabled based on your environment variable
    const enablePluginApi = process.env.ENABLE_MARKETPLACE_FEATURE === 'true';

    if (!enablePluginApi) {
      // If the environment variable is not set or is not 'true',
      // you can choose how to handle the request.
      // For example, you can return a 404 Not Found response or a custom error message.
      return false;
    }

    // If the environment variable is 'true', allow the request to proceed.
    return true;
  }
}
