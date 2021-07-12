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

  async create(user: User, name: string, kind: string, options: object, appId: string, dataSourceId: string): Promise<DataQuery> {
    const newDataQuery = this.dataQueriesRepository.create({
      name,
      kind,
      options,
      appId,
      dataSourceId,
      createdAt: new Date(),
      updatedAt: new Date(),
    })

    return this.dataQueriesRepository.save(newDataQuery);
  }

  async update(user: User,dataQueryId: string, name: string, options: object): Promise<DataQuery> {
    const dataQuery = this.dataQueriesRepository.save({
      id: dataQueryId,
      name,
      options,
      updatedAt: new Date(),
    })

    return dataQuery;
  }
}
