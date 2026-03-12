import { Injectable } from '@nestjs/common';
import { ICRMService } from './interface/IService';
import { CrmIntegrationDto } from './dto/crm-integration-dto';
@Injectable()
export class CRMService implements ICRMService {
  async pushToHubspot(hubspotPushDto: CrmIntegrationDto): Promise<any> {
    throw new Error('Method not implemented.');
  }
}
