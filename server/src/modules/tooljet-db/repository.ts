import { App } from '@entities/app.entity';
import { InternalTable } from '@entities/internal_table.entity';
import { Injectable } from '@nestjs/common';
import { isEmpty } from 'lodash';
import { DataSource, Repository } from 'typeorm';

@Injectable()
export class InternalTableRepository extends Repository<InternalTable> {
  constructor(private dataSource: DataSource) {
    super(App, dataSource.createEntityManager());
  }

  async findTables(appId: string): Promise<{ table_id: string }[]> {
    const tooljetDbDataQueries = await this.dataSource
      .getRepository('data_queries')
      .createQueryBuilder('data_queries')
      .innerJoin('data_sources', 'data_sources', 'data_queries.data_source_id = data_sources.id')
      .innerJoin('app_versions', 'app_versions', 'app_versions.id = data_sources.app_version_id')
      .where('app_versions.app_id = :appId', { appId })
      .andWhere('data_sources.kind = :kind', { kind: 'tooljetdb' })
      .getMany();

    const addTablesInJoinOperation = (uniqTableIds: Set<string>, joinOptions: Record<string, any>[]) => {
      if (isEmpty(joinOptions)) return;

      joinOptions.forEach((join) => {
        const { table, conditions } = join;

        if (table) uniqTableIds.add(table);
        conditions?.conditionsList?.forEach((condition) => {
          const { leftField, rightField } = condition;
          if (leftField?.table) uniqTableIds.add(leftField.table);
          if (rightField?.table) uniqTableIds.add(rightField.table);
        });
      });
    };

    const uniqTableIds = new Set<string>();
    tooljetDbDataQueries.forEach((dq) => {
      if (dq.options?.table_id) uniqTableIds.add(dq.options.table_id);
      if (dq.options?.operation === 'join_tables')
        addTablesInJoinOperation(uniqTableIds, dq.options?.join_table?.joins || []);
    });

    return [...uniqTableIds].map((table_id) => ({ table_id }));
  }
}
