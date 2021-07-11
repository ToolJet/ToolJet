import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { App } from '../entities/app.entity';
import { Repository } from 'typeorm';
import { User } from 'src/entities/user.entity';

@Injectable()
export class AppsService {

  constructor(
    @InjectRepository(App)
    private appsRepository: Repository<App>,
  ) { }

  async create(user: User): Promise<App> {
    return this.appsRepository.save(this.appsRepository.create({
        name: 'Untitled app',
        createdAt: new Date(),
        updatedAt: new Date(),
        organizationId: user.organizationId,
        user: user
    }));
  }

  async count(user: User) {
    return await this.appsRepository.count({ 
        where: {
            organizationId: user.organizationId,
        },
     });
  }

  async all(user: User, page: number): Promise<App[]> {

    return await this.appsRepository.find({
        relations: ['user'],
        where: {
            organizationId: user.organizationId,
        },
        take: 10,
        skip: 10 * ( page || 0 ),
        order: {
            createdAt: 'DESC'
        }
    });
  }
}
