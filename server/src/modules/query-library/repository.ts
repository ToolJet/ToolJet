import { Injectable } from '@nestjs/common';
import { DataSource, EntityManager, Repository } from 'typeorm';
import { LibraryQuery } from '@entities/library_query.entity';
@Injectable()
export class QueryLibraryRepository extends Repository<LibraryQuery> {
  constructor(dataSource: DataSource) {
    super(LibraryQuery, dataSource.createEntityManager());
  }
  findInWorkspace(id: string, organizationId: string, manager?: EntityManager): Promise<LibraryQuery | null> {
    return (manager ?? this.manager).findOne(LibraryQuery, {
      where: { id, organizationId },
    });
  }
  listForWorkspace(organizationId: string): Promise<LibraryQuery[]> {
    return this.find({ where: { organizationId }, order: { name: 'ASC' } });
  }
}
