import { AppVersion } from '@entities/app_version.entity';
import { AppVersionUpdateDto } from '@dto/app-version-update.dto';

export interface IVersionUtilService {
  updateVersion(appVersion: AppVersion, appVersionUpdateDto: AppVersionUpdateDto): Promise<void>;
}
