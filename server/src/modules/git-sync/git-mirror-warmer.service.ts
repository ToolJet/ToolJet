import { Injectable } from '@nestjs/common';

// CE stub. Mirror warming rides the EE-only git object cache; CE has no mirror
// to warm, so the broadcast is inert.
@Injectable()
export class GitMirrorWarmerService {
  async broadcastWarm(_organizationId: string): Promise<void> {
    // no cache to warm in CE
  }
}
