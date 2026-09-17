import { IsBoolean, IsNotEmpty } from 'class-validator';

export class UpdateEnvLicenseSettingDto {
  @IsBoolean()
  @IsNotEmpty()
  useEnv: boolean;
}
