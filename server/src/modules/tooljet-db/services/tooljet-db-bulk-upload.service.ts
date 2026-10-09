import { Injectable, NotFoundException } from '@nestjs/common';
import { EntityManager } from 'typeorm';
import { InternalTable } from 'src/entities/internal_table.entity';
import { TooljetDbTableOperationsService } from './tooljet-db-table-operations.service';
import { InjectEntityManager } from '@nestjs/typeorm';
import { isEmpty } from 'lodash';
import { findTenantSchema } from 'src/helpers/tooljet_db.helper';
import { TooljetDbUtilService } from './tooljet-db-util.service';

@Injectable()
export class TooljetDbBulkUploadService {
  protected MAX_ROW_COUNT;

  constructor(
    protected readonly manager: EntityManager,
    @InjectEntityManager('tooljetDb')
    protected readonly tooljetDbManager: EntityManager,
    protected readonly tableOperationsService: TooljetDbTableOperationsService,
    protected readonly bulkUploadUtilService: TooljetDbUtilService
  ) {
    this.MAX_ROW_COUNT =
      process.env?.TOOLJET_DB_BULK_UPLOAD_MAX_ROWS && !isNaN(Number(process.env.TOOLJET_DB_BULK_UPLOAD_MAX_ROWS))
        ? Number(process.env.TOOLJET_DB_BULK_UPLOAD_MAX_ROWS)
        : 1000;
  }

  async perform(organizationId: string, tableName: string, fileBuffer: Buffer) {
    const internalTable = await this.manager.findOne(InternalTable, {
      select: ['id'],
      where: { organizationId, tableName },
    });

    if (!internalTable) {
      throw new NotFoundException(`Table ${tableName} not found`);
    }

    return await this.bulkUploadCsv(internalTable.id, fileBuffer, organizationId);
  }

  async bulkUploadCsv(
    internalTableId: string,
    fileBuffer: Buffer,
    organizationId: string
  ): Promise<{ processedRows: number }> {
    return await this.bulkUploadUtilService.bulkUploadCsv(internalTableId, fileBuffer, organizationId);
  }

  async bulkUpdateRowsWithPrimaryKey(
    payload: Array<{ [key: string]: any }>,
    tableId: string,
    primaryKeyColumns: string | string[],
    organizationId: string
  ): Promise<{ status: string; updatedRows: number; error?: string; data?: Array<{ [key: string]: any }> }> {
    if (!payload || payload.length === 0) {
      throw new Error('Payload is empty. Nothing to update.');
    }

    const internalTable = await this.manager.findOne(InternalTable, {
      where: { organizationId, id: tableId },
    });

    if (!internalTable) {
      throw new NotFoundException(`Table not found`);
    }

    const primaryKeys = Array.isArray(primaryKeyColumns) ? primaryKeyColumns : [primaryKeyColumns];
    const tenantSchema = findTenantSchema(organizationId);
    let updatedRowsCount = 0;
    const updatedRowsData = [];

    try {
      for (const row of payload) {
        // Validate primary keys
        const primaryKeyConditions = primaryKeys.map((key) => {
          if (row[key] === undefined) {
            throw new Error(`Primary key "${key}" is missing in row: ${JSON.stringify(row)}`);
          }
          return { key, value: row[key] };
        });

        // Build query dynamically for each row
        const columnsToUpdate = Object.entries(row).filter(([key]) => !primaryKeys.includes(key));

        if (columnsToUpdate.length === 0) continue; // No updateable fields

        const setClause = columnsToUpdate.map(([column, _], index) => `"${column}" = $${index + 1}`).join(', ');

        const whereClause = primaryKeyConditions
          .map(({ key }, index) => `"${key}" = $${columnsToUpdate.length + index + 1}`)
          .join(' AND ');

        const query = `
          UPDATE "${tenantSchema}"."${tableId}"
          SET ${setClause}
          WHERE ${whereClause}
          RETURNING *;
        `;

        const parameters = [
          ...columnsToUpdate.map(([, value]) => value),
          ...primaryKeyConditions.map(({ value }) => value),
        ];

        const result = await this.tooljetDbManager.query(query, parameters);

        if (result[0]?.length) {
          updatedRowsCount += result[0].length;
          updatedRowsData.push(...result[0]);
        }
      }

      return {
        status: 'ok',
        updatedRows: updatedRowsCount,
        data: updatedRowsData,
      };
    } catch (error) {
      return {
        status: 'failed',
        updatedRows: 0,
        error: error.message,
      };
    }
  }

  async bulkUpsertRowsWithPrimaryKey(
    rows: Record<string, any>[],
    tableId: string,
    primaryKeyColumns: string[],
    organizationId: string
  ): Promise<{ status: string; inserted: number; updated: number; rows: any[]; error?: string }> {
    const rowsToUpsert = [...rows];
    if (isEmpty(rowsToUpsert)) {
      return {
        status: 'failed',
        error: 'No rows provided for upsert operation',
        inserted: 0,
        updated: 0,
        rows: [],
      };
    }

    if (rowsToUpsert.length > this.MAX_ROW_COUNT) {
      return {
        status: 'failed',
        error: `Row count cannot be greater than ${this.MAX_ROW_COUNT}`,
        inserted: 0,
        updated: 0,
        rows: [],
      };
    }

    const internalTable = await this.manager.findOne(InternalTable, {
      where: { organizationId, id: tableId },
    });
    if (!internalTable) {
      return {
        status: 'failed',
        error: 'Table not found',
        inserted: 0,
        updated: 0,
        rows: [],
      };
    }

    const result = await this.tableOperationsService.perform(organizationId, 'view_table', {
      id: tableId,
    });
    const tableColumns = result?.columns || [];

    // Check if pk columns exist in the table
    const nonExistentColumns = primaryKeyColumns.filter((pk) => !tableColumns.some((col) => col.column_name === pk));
    if (nonExistentColumns.length > 0) {
      return {
        status: 'failed',
        error: `Primary key columns not found in table: ${nonExistentColumns.join(', ')}`,
        inserted: 0,
        updated: 0,
        rows: [],
      };
    }

    // Check if columns are actually primary keys
    const nonPrimaryKeyColumns = primaryKeyColumns.filter(
      (pk) => !tableColumns.some((col) => col.column_name === pk && col.constraints_type.is_primary_key)
    );
    if (nonPrimaryKeyColumns.length > 0) {
      return {
        status: 'failed',
        error: `Columns are not primary keys: ${nonPrimaryKeyColumns.join(', ')}`,
        inserted: 0,
        updated: 0,
        rows: [],
      };
    }

    const serialTypeColumns = tableColumns
      .filter((col) => col.data_type === 'integer' && /^nextval\(/.test(col.column_default))
      .map((col) => col.column_name);

    const serialPrimaryKeys = [];
    const nonSerialPrimaryKeys = [];
    primaryKeyColumns.forEach((pk) =>
      serialTypeColumns.includes(pk) ? serialPrimaryKeys.push(pk) : nonSerialPrimaryKeys.push(pk)
    );

    // Group rows by the exact set of provided keys
    const rowGroups = new Map<string, Record<string, any>[]>();
    for (const row of rowsToUpsert) {
      // Ensure required non-serial PKs are provided
      const missingNonSerialPKs = nonSerialPrimaryKeys.filter((pk) => row[pk] === undefined);
      if (missingNonSerialPKs.length > 0) {
        return {
          status: 'failed',
          error: `Missing required non-serial primary key values: ${missingNonSerialPKs.join(', ')}`,
          inserted: 0,
          updated: 0,
          rows: [],
        };
      }
      // Create a group key based on the sorted keys present in this row.
      const keys = Object.keys(row).sort();
      const groupKey = keys.join(',');
      if (!rowGroups.has(groupKey)) {
        rowGroups.set(groupKey, []);
      }
      rowGroups.get(groupKey)!.push(row);
    }

    // Process each group separately – each group has a consistent set of keys.
    const tenantSchema = findTenantSchema(organizationId);
    let totalInserted = 0;
    let totalUpdated = 0;
    const allResultRows: any[] = [];

    try {
      for (const [groupKey, groupRows] of rowGroups.entries()) {
        // The provided columns for this group are exactly the keys in the group.
        const providedColumns = groupKey.split(','); // sorted keys
        const columnsQuoted = providedColumns.map((col) => `"${col}"`);

        // Build the VALUES clause for this group
        let parameterIndex = 1;
        const allValueSets: string[] = [];
        const allPlaceholders: any[] = [];
        for (const row of groupRows) {
          const valueSet: string[] = [];
          for (const col of providedColumns) {
            // Since the group is built by the row's own keys, if the row doesn't have a key, that column won't be in providedColumns.
            if (Object.prototype.hasOwnProperty.call(row, col)) {
              if (row[col] === 'DEFAULT') {
                valueSet.push('DEFAULT');
              } else {
                valueSet.push(`$${parameterIndex++}`);
                allPlaceholders.push(row[col]);
              }
            } else {
              valueSet.push('DEFAULT');
            }
          }
          allValueSets.push(`(${valueSet.join(', ')})`);
        }

        // Determine if this group omits any serial PK
        const omittedSerialPKs = serialPrimaryKeys.filter((pk) => !providedColumns.includes(pk));

        let queryText: string;
        if (omittedSerialPKs.length > 0) {
          // For groups omitting serial PKs, use plain INSERT (so PostgreSQL auto-generates those values)
          queryText = `
            INSERT INTO "${tenantSchema}"."${tableId}" (${columnsQuoted.join(', ')})
            VALUES ${allValueSets.join(', ')}
            RETURNING *, true as inserted;
          `;
        } else {
          // For groups with all primary keys provided, use UPSERT
          const conflictTarget = primaryKeyColumns.map((col) => `"${col}"`).join(', ');
          // Update only non-PK columns
          const updateColumns = providedColumns.filter((col) => !primaryKeyColumns.includes(col));
          const onConflictUpdates = updateColumns.map((col) => `"${col}" = EXCLUDED."${col}"`).join(',\n        ');
          queryText = `
            INSERT INTO "${tenantSchema}"."${tableId}" (${columnsQuoted.join(', ')})
            VALUES ${allValueSets.join(', ')}
            ON CONFLICT (${conflictTarget})
            DO UPDATE SET
              ${onConflictUpdates}
            RETURNING *, (xmax = 0) as inserted;
          `;
        }

        const result = await this.tooljetDbManager.query(queryText, allPlaceholders);
        totalInserted += result.filter((row: any) => row.inserted).length;
        totalUpdated += result.length - result.filter((row: any) => row.inserted).length;
        allResultRows.push(...result.map(({ inserted, ...row }: any) => row));
      }

      return {
        status: 'ok',
        inserted: totalInserted,
        updated: totalUpdated,
        rows: allResultRows,
      };
    } catch (error) {
      return {
        status: 'failed',
        error: error.message,
        inserted: 0,
        updated: 0,
        rows: [],
      };
    }
  }
}
