import { EntityManager } from 'typeorm';
import { Response } from 'express';
import { TrialUserDto } from '../dto/user.dto';
import { User } from '@entities/user.entity';
import { Organization } from '@entities/organization.entity';
import { OrganizationUser } from '@entities/organization_user.entity';
export interface IOnboardingUtilService {
  activateTrialForUser(userCreateDto: TrialUserDto): Promise<void>;
  getCommonOnboardingDetails(user: User): Promise<{
    adminDetails: { name: string; email: string };
    companyInfo: { companyName: string; buildPurpose: string };
    workspaceName: string;
    currentOrganizationId: string;
    currentOrganizationSlug: string;
    onboardingStatus: string;
  }>;
  createUserOrPersonalWorkspace(
    userParams: { email: string; password: string; firstName: string; lastName: string },
    existingUser: User,
    signingUpOrganization: Organization,
    redirectTo?: string,
    manager?: EntityManager
  ): Promise<void>;
  whatIfTheSignUpIsAtTheWorkspaceLevel(
    existingUser: User,
    signingUpOrganization: Organization,
    userParams: { firstName: string; lastName: string; password: string },
    redirectTo?: string,
    defaultWorkspace?: Organization,
    manager?: EntityManager
  ): Promise<void>;
  processOrganizationSignup(
    response: Response,
    user: User,
    organizationParams: Partial<OrganizationUser>,
    manager?: EntityManager,
    defaultOrganization?: Organization,
    source?: string
  ): Promise<{
    session: any;
    organizationInviteUrl: string;
  }>;
  splitName(name: string): { firstName: string; lastName: string };
  updateExistingUserDefaultWorkspace(
    userParams: { password: string; firstName: string; lastName: string },
    existingUser: User,
    defaultWorkspace: Organization,
    manager?: EntityManager
  )
}
