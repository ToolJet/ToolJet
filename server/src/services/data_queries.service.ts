import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { App } from '../entities/app.entity';
import { Repository } from 'typeorm';
import { User } from 'src/entities/user.entity';
import { DataQuery } from 'src/entities/data_query.entity';

@Injectable()
export class DataQueriesService {

  constructor(
    @InjectRepository(DataQuery)
    private dataQueriesRepository: Repository<DataQuery>,
  ) { }

  async all(user: User, appId: string): Promise<DataQuery[]> {

    return await this.dataQueriesRepository.find({
        where: {
          appId,
        },
    });
  }
}
