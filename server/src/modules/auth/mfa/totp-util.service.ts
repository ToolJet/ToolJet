import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import * as OTPAuth from 'otpauth';

@Injectable()
export class TotpUtilService {
  constructor(private readonly configService: ConfigService) {}

  deriveUserSecret(identifier: string): string {
    const MFA_MASTER_SECRET = this.configService.get<string>('MFA_MASTER_SECRET');
    if (!MFA_MASTER_SECRET) {
      throw new InternalServerErrorException(
        'MFA_MASTER_SECRET is not configured. Set it in the environment before enabling two-factor authentication.'
      );
    }
    // Unique for each email
    return crypto.createHmac('sha256', MFA_MASTER_SECRET).update(identifier).digest('hex');
  }

  createTotp(identifier: string): OTPAuth.TOTP {
    const userSecretHex = this.deriveUserSecret(identifier);

    return new OTPAuth.TOTP({
      issuer: 'Tooljet',
      label: identifier,
      algorithm: 'SHA1',
      digits: 6,
      period: 30,
      secret: OTPAuth.Secret.fromHex(userSecretHex),
    });
  }

  generateOtpAuthUrl(identifier: string): { otpauthUrl: string; secret: string } {
    const totp = this.createTotp(identifier);
    return { otpauthUrl: totp.toString(), secret: totp.secret.base32 };
  }

  generate(identifier: string): string {
    return this.createTotp(identifier).generate();
  }

  // window=10 (~5 min either side) matches the existing, more lenient email-OTP behavior.
  // window=1 (~30s either side) is used for login-security-critical paths (login verify, profile confirm).
  validate(identifier: string, otp: string, window: number): boolean {
    const totp = this.createTotp(identifier);
    const delta = totp.validate({ token: otp, window });
    return delta !== null && delta <= 0;
  }
}
