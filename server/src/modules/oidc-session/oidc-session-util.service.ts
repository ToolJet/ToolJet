import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TransactionLogger } from '@modules/logging/service';
import { LoginConfigsUtilService } from '@modules/login-configs/util.service';

@Injectable()
export class OidcSessionUtilService {
  constructor(
    protected readonly configService: ConfigService,
    protected readonly loginConfigsUtilService: LoginConfigsUtilService,
    protected readonly transactionLogger: TransactionLogger
  ) {}

  async refreshAccessToken(
    refreshToken: string,
    configId: string
  ): Promise<{ accessToken: string; refreshToken: string | null; tokenExpiresAt: Date | null }> {
    return null;
  }
}
