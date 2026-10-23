import { Injectable, NotImplementedException } from '@nestjs/common';
import { App } from '@entities/app.entity';
import { User } from '@entities/user.entity';
import { AppVersionUpdateDto } from '@dto/app-version-update.dto';

// CE stub. The git-aware version save/delete flow is EE-only; the real implementation lives in
// ee/app-git/versions.service.ts. (Non-git version save/delete still goes through the versions module.)
@Injectable()
export class AppGitVersionService {
  async saveVersion(_app: App, _user: User, _dto: AppVersionUpdateDto): Promise<any> {
    throw new NotImplementedException();
  }

  async deleteVersion(_app: App, _user: User): Promise<any> {
    throw new NotImplementedException();
  }
}
