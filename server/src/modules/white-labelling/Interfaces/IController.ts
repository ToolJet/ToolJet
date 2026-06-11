import { User } from '@entities/user.entity';
import { UpdateWhiteLabellingDto } from '@modules/white-labelling/dto';

export interface IWhiteLabellingController {
  getInstanceWhiteLabelling(): Promise<any>; // Method to fetch instance level white labeling settings

  updateInstanceWhiteLabelling(updateWhiteLabellingDto: UpdateWhiteLabellingDto, user: User): Promise<any>; // Method to update instance level white labeling settings

  getWorkspaceWhiteLabelling(organizationId: string): Promise<any>; // Method to get workspace level white labeling settings

  updateWorkspaceWhiteLabelling(
    organizationId: string,
    updateWhiteLabellingDto: UpdateWhiteLabellingDto,
    user: User
  ): Promise<any>; // Method to update workspace level white labeling settings
}
