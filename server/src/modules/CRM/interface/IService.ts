import { CrmIntegrationDto } from '../dto/crm-integration-dto';

export interface ICRMService {
  pushToHubspot(hubspotPushDto: CrmIntegrationDto): Promise<any>;
}
