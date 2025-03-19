import { UpdateWhiteLabellingDto } from '../dto';

export interface IWhiteLabellingService {
  getProcessedSettings(organizationId: string): Promise<any>;

  updateSettings(updateDto: UpdateWhiteLabellingDto, organizationId?: string | null): Promise<any>;
}
