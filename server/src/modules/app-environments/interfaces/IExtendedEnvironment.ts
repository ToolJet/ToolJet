import { AppEnvironment } from 'src/entities/app_environments.entity';

export interface IExtendedEnvironment extends AppEnvironment {
  appVersionsCount: number;
}
