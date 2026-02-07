import { CrmIntegrationDto } from '../dto/crm-integration-dto';

export interface ICRMController {
  pushToHubspot(hubspotPushDto: CrmIntegrationDto): Promise<any>;
}
