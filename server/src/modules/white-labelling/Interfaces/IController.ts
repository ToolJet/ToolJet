import { UpdateWhiteLabellingDto } from '@modules/white-labelling/dto';

export interface IWhiteLabellingController {
  get(): Promise<any>; // Method to fetch white labeling settings

  update(updateWhiteLabellingDto: UpdateWhiteLabellingDto): Promise<any>; // Method to update white labeling settings

  getWorkspaceSettings(workspaceId: string): Promise<any>; // Method to get specific white labeling settings for an organization

  updateWorkspaceSettings(organizationId: string, updateWhiteLabellingDto: UpdateWhiteLabellingDto): Promise<any>; // Method to update white labeling settings for a specific organization
}
