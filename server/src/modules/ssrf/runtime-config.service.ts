import { Injectable } from '@nestjs/common';

/**
 * CE stub. The SSRF runtime config is an EE feature: CE never publishes it, so the SSRF checks keep
 * their env-var behaviour. The EE override does the real work.
 */
@Injectable()
export class SsrfRuntimeConfigService {
  async refresh(): Promise<void> {
    return;
  }
}
