import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
// import { LoginConfigsUtilService } from '@ee/login-configs/util.service';
// import { AuthUtilService } from '@ee/auth/util.service';
import { TransactionLogger } from '@modules/logging/service';
import { LoginConfigsUtilService } from '@modules/login-configs/util.service';
import { AuthUtilService } from '@modules/auth/util.service';

@Injectable()
export class OidcSessionUtilService {
  constructor(
    private readonly configService: ConfigService,
    private readonly loginConfigsUtilService: LoginConfigsUtilService,
    private readonly authUtilService: AuthUtilService,
    private readonly transactionLogger: TransactionLogger
  ) {
    this.tooljetHost = this.configService.get<string>('TOOLJET_HOST');
    this.supath = this.configService.get<string>('SUB_PATH');
  }
  private readonly tooljetHost: string;
  private readonly supath: string;

  async refreshAccessToken(
    refreshToken: string,
    configId: string
  ): Promise<{ accessToken: string; refreshToken: string | null; tokenExpiresAt: Date | null }> {
    return null;
  }
}
