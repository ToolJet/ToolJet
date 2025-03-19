import { Injectable } from '@nestjs/common';
import { IExternalApiUtilService } from './Interfaces/IUtilService';
@Injectable()
export class ExternalApiUtilService implements IExternalApiUtilService {
  generateRandomPassword(length?: number): string {
    throw new Error('Method not implemented.');
  }
}
