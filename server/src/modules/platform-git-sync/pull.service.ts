import { Injectable } from '@nestjs/common';

@Injectable()
export class PlatformGitPullService {
  async pullApps(..._args: any[]): Promise<{ imported: number; skipped: number; stale: number }> {
    return { imported: 0, skipped: 0, stale: 0 };
  }

  async pullDataSources(..._args: any[]): Promise<void> {
    return;
  }

  async hydrateStubApp(..._args: any[]): Promise<any> {
    return null;
  }
}
