import { ArrayMaxSize, IsArray, IsBoolean, IsString } from 'class-validator';
import { Exclude, Expose } from 'class-transformer';
import { SSRF_ALLOWLIST_MAX_ENTRIES } from '../constants';

export class UpdateSsrfSettingsDto {
  @IsBoolean()
  enabled: boolean;

  @IsArray()
  @ArrayMaxSize(SSRF_ALLOWLIST_MAX_ENTRIES)
  @IsString({ each: true })
  allowed_addresses: string[];
}

@Exclude()
export class SsrfSettingsResponseDto {
  @Expose()
  enabled: boolean;

  @Expose({ name: 'allowed_addresses' })
  allowedAddresses: string[];

  @Expose({ name: 'upgrade_notice_dismissed' })
  upgradeNoticeDismissed: boolean;
}
