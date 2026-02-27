import { Injectable } from '@nestjs/common';

@Injectable()
export class OidcRefreshService {
  async checkAndRefreshIfNeeded(_user: any): Promise<void> {
    // No-op in CE — OIDC refresh is an EE feature
  }
}
