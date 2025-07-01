import { User } from '@entities/user.entity';
import { UpdateWhiteLabellingDto } from '@modules/white-labelling/dto';

export interface IWhiteLabellingController {
  get(req: any): Promise<any>; // Method to fetch white labeling settings

  update(updateWhiteLabellingDto: UpdateWhiteLabellingDto, user: User): Promise<any>; // Method to update white labeling settings

  getWorkspaceSettings(workspaceId: string): Promise<any>; // Method to get specific white labeling settings for an organization

  updateWorkspaceSettings(
    organizationId: string,
    updateWhiteLabellingDto: UpdateWhiteLabellingDto,
    user: User
  ): Promise<any>; // Method to update white labeling settings for a specific organization
}
