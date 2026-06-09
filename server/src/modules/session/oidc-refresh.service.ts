import { Injectable } from '@nestjs/common';

@Injectable()
export class OidcRefreshService {
  async checkAndRefreshIfNeeded(_user: any): Promise<boolean> {
    // No-op in CE — see server/ee/session/oidc-refresh.service.ts for EE implementation
    return false;
  }
}
