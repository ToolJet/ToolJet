import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from 'src/entities/user.entity';
import { AppUser } from 'src/entities/app_user.entity';
import { OrganizationUser } from 'src/entities/organization_user.entity';

@Injectable()
export class AppUsersService {
  constructor(
    @InjectRepository(AppUser)
    private appUsersRepository: Repository<AppUser>,
    @InjectRepository(OrganizationUser)
    private organizationUsersRepository: Repository<AppUser>
  ) {}

  async create(user: User, appId: string, organizationUserId: string, role: string): Promise<AppUser> {
    const organizationUser = await this.organizationUsersRepository.findOne(organizationUserId);

    return await this.appUsersRepository.save(
      this.appUsersRepository.create({
        appId,
        userId: organizationUser.userId,
        role,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
    );
  }
}
