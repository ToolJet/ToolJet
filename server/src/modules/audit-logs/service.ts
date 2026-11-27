import { Injectable } from '@nestjs/common';
import { EntityManager } from 'typeorm';
import { AuditLogFields } from './types';

// CE has no audit output. EE supplies the database and licensed file sinks.
@Injectable()
export class AuditLoggerService {
  async perform(_fields: AuditLogFields, _manager?: EntityManager): Promise<void> {
    return;
  }
}
