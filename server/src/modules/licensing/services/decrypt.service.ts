import { Terms } from '@modules/licensing/interfaces/terms';
import { Injectable } from '@nestjs/common';
import { ILicenseDecryptService } from '../interfaces/IService';

@Injectable()
export class LicenseDecryptService implements ILicenseDecryptService {
  decrypt(toDecrypt: string): Partial<Terms> {
    return {};
  }
}
