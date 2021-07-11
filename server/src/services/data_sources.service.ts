import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from 'src/entities/user.entity';
import { DataSource } from 'src/entities/data_source.entity';

@Injectable()
export class DataSourcesService {

  constructor(
    @InjectRepository(DataSource)
    private dataSourcesRepository: Repository<DataSource>,
  ) { }

  async all(user: User, appId: string): Promise<DataSource[]> {

    return await this.dataSourcesRepository.find({
        where: {
          appId
        },
    });
  }
}
