import { MigrationProgress, processDataInBatches } from '@helpers/migration.helper';
import { EntityManager, MigrationInterface, QueryRunner } from 'typeorm';

const MIGRATION_NAME = 'UpdateOldTjdbJoinQuerySnakeCaseToCamelCaseFormat';
const BATCH_SIZE = 100;

const OLD_FORMAT_WHERE_CLAUSE = `
  INNER JOIN data_sources ds ON ds.id = dq.data_source_id
  WHERE ds.kind = 'tooljetdb'
    AND dq.options::jsonb ? 'join_table'
    AND jsonb_array_length(dq.options::jsonb->'join_table'->'joins') > 0
    AND (
      (dq.options::jsonb->'join_table'->'joins'->0) ? 'join_type'
      OR (dq.options::jsonb->'join_table'->'joins'->0->'conditions') ? 'conditions_list'
      OR (dq.options::jsonb->'join_table'->'conditions') ? 'conditions_list'
    )
`;

export class UpdateOldTjdbJoinQuerySnakeCaseToCamelCaseFormat1778639657919 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const entityManager = queryRunner.manager;

    const [{ count }] = await entityManager.query(
      `SELECT COUNT(*) AS count FROM data_queries dq ${OLD_FORMAT_WHERE_CLAUSE}`
    );
    const totalCount = parseInt(count, 10);

    if (totalCount === 0) {
      console.log(`${MIGRATION_NAME}: no matching data queries found.`);
      return;
    }

    const migrationProgress = new MigrationProgress(MIGRATION_NAME, totalCount);
    let totalUpdated = 0;

    try {
      await entityManager.transaction(async (transactionManager: EntityManager) => {
        await processDataInBatches(
          transactionManager,
          // Processed rows leave the WHERE clause after update, so always fetch from offset 0.
          async (transactionManager: EntityManager, _skip: number, take: number) => {
            return await transactionManager.query(
              `SELECT dq.id FROM data_queries dq ${OLD_FORMAT_WHERE_CLAUSE} ORDER BY dq.id LIMIT $1`,
              [take]
            );
          },
          async (transactionManager: EntityManager, dataQueryRows: { id: string }[]) => {
            const dataQueryIds = dataQueryRows.map((dataQueryRow) => dataQueryRow.id);

            const dataQueries: { id: string; options: Record<string, any> }[] = await transactionManager.query(
              `SELECT id, options FROM data_queries WHERE id = ANY($1)`,
              [dataQueryIds]
            );

            const ids: string[] = [];
            const updatedOptions: string[] = [];

            for (const dataQuery of dataQueries) {
              const options = typeof dataQuery.options === 'string' ? JSON.parse(dataQuery.options) : dataQuery.options;
              options.join_table = this.convertJoinTableToNewFormat(options.join_table);
              ids.push(dataQuery.id);
              updatedOptions.push(JSON.stringify(options));
            }

            await transactionManager.query(
              `UPDATE data_queries AS dq
               SET options = bulk_update.new_options::json
               FROM unnest($1::uuid[], $2::text[]) AS bulk_update(id, new_options)
               WHERE dq.id = bulk_update.id`,
              [ids, updatedOptions]
            );

            totalUpdated += dataQueryIds.length;
            dataQueryRows.forEach(() => migrationProgress.show());
          },
          BATCH_SIZE
        );
      });
    } catch (error) {
      console.error(`Error during ${MIGRATION_NAME} migration:`, error);
      throw error;
    }

    console.log(`${MIGRATION_NAME}: completed. Updated ${totalUpdated} data queries.`);
  }

  public async down(_queryRunner: QueryRunner): Promise<void> {
    // no-op
  }

  private convertField(field: Record<string, any>): Record<string, any> {
    if (!field) return field;
    const columnName = field.columnName ?? field.column_name;
    return {
      type: field.type,
      ...(field.table !== undefined && { table: field.table }),
      ...(columnName !== undefined && { columnName }),
      ...(field.value !== undefined && { value: field.value }),
      ...(field.jsonpath !== undefined && { jsonpath: field.jsonpath }),
    };
  }

  private convertConditions(conditions: Record<string, any>): Record<string, any> {
    if (!conditions) return conditions;
    const rawConditionsList: Array<Record<string, any>> = conditions.conditions_list ?? [];
    return {
      operator: conditions.operator,
      conditionsList: rawConditionsList.map((condition) => ({
        operator: condition.operator,
        leftField: this.convertField(condition.leftField ?? condition.left_field),
        rightField: this.convertField(condition.rightField ?? condition.right_field),
      })),
    };
  }

  private convertJoinTableToNewFormat(joinTable: Record<string, any>): Record<string, any> {
    const converted = { ...joinTable };

    converted.joins = (joinTable.joins ?? []).map(({ join_type, ...restJoin }) => ({
      ...restJoin,
      joinType: restJoin.joinType ?? join_type,
      conditions: this.convertConditions(restJoin.conditions),
    }));

    if (joinTable.conditions) {
      converted.conditions = this.convertConditions(joinTable.conditions);
    }

    if (joinTable.order_by?.length) {
      converted.order_by = joinTable.order_by.map(({ column_name, columnName, ...rest }) => ({
        ...rest,
        columnName: columnName ?? column_name,
      }));
    }

    return converted;
  }
}
