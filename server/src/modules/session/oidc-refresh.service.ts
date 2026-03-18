import { Injectable } from '@nestjs/common';

@Injectable()
export class OidcRefreshService {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async checkAndRefreshIfNeeded(_user: any): Promise<void> {
    // No-op in CE — OIDC token refresh is an EE feature
  }
}
