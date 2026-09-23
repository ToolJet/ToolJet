import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { WorkspaceBanList } from '@entities/workspace_ban_list.entity';

@Injectable()
export class WorkspaceBanListRepository extends Repository<WorkspaceBanList> {
  constructor(private dataSource: DataSource) {
    super(WorkspaceBanList, dataSource.createEntityManager());
  }

  async findByOrganizationId(organizationId: string): Promise<WorkspaceBanList | null> {
    return this.findOne({ where: { organizationId } });
  }
}
