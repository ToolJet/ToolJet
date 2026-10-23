import { Injectable } from '@nestjs/common';

@Injectable()
export class PlatformGitPushService {
  async pushApp(..._args: any[]): Promise<void> {
    return;
  }

  async writeDataSourceMeta(..._args: any[]): Promise<void> {
    return;
  }

  readAppMeta(_repoPath: string): Record<string, any> {
    return {};
  }

  writeAppMeta(_repoPath: string, _meta: Record<string, any>): void {
    return;
  }
}
