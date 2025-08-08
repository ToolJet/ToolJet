import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';

@Injectable()
export class WhitelistPluginGuard implements CanActivate {
  // Configurable whitelist of allowed dataSource kinds for method invocation
  private readonly allowedKinds = new Set(['grpcv2']); // Start with grpcv2, easily expandable

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const dataSource = request.tj_data_source; // From @DataSource() decorator
    const body = request.body;

    if (!this.allowedKinds.has(dataSource?.kind)) {
      return false;
    }

    if (!body?.method || typeof body.method !== 'string') {
      return false;
    }

    return true;
  }
}