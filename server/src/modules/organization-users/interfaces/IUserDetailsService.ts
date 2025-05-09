import { EntityManager } from 'typeorm';

export interface IUserDetailsService {
  updateUserMetadata(manager: EntityManager, userId: string, organizationId: string, userMetadata: any): Promise<void>;
}
