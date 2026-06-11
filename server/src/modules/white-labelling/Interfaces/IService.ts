import { User } from '@entities/user.entity';
import { UpdateWhiteLabellingDto } from '../dto';

export interface IWhiteLabellingService {
  getProcessedSettings(organizationId: string): Promise<any>;

  updateSettings(updateDto: UpdateWhiteLabellingDto, user: User, organizationId?: string | null): Promise<any>;
}
