import { AppVersion } from '@entities/app_version.entity';
import { AppEnvironment } from '@entities/app_environments.entity';

export interface IAppEnvironmentResponse {
  editorVersion: Partial<AppVersion>;
  editorEnvironment: AppEnvironment;
  appVersionEnvironment: AppEnvironment;
  shouldRenderPromoteButton: boolean;
  shouldRenderReleaseButton: boolean;
  environments: AppEnvironment[];
}
