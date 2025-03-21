import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { EntityManager } from 'typeorm';
import { InternalTable } from 'src/entities/internal_table.entity';
import * as csv from 'fast-csv';
import { TooljetDbTableOperationsService } from './tooljet-db-table-operations.service';
import { InjectEntityManager } from '@nestjs/typeorm';
import { isEmpty } from 'lodash';
import { pipeline } from 'stream/promises';
import { PassThrough } from 'stream';
import { v4 as uuid } from 'uuid';
import { findTenantSchema } from 'src/helpers/tooljet_db.helper';
import {
  TJDB,
  TooljetDatabaseColumn,
  TooljetDatabaseDataTypes,
  TooljetDatabaseError,
  TooljetDatabaseForeignKey,
} from '../types';

@Injectable()
export class TooljetDbBulkUploadService {
  protected MAX_ROW_COUNT;

  constructor(
    protected readonly manager: EntityManager,
    @InjectEntityManager('tooljetDb')
    protected readonly tooljetDbManager: EntityManager,
    protected readonly tableOperationsService: TooljetDbTableOperationsService
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
    const rowsToUpsert = [];
    const passThrough = new PassThrough();

    const {
      columns: internalTableDatabaseColumn,
      foreign_keys: foreignKeys,
    }: { columns: TooljetDatabaseColumn[]; foreign_keys: TooljetDatabaseForeignKey[] } =
      await this.tableOperationsService.perform(organizationId, 'view_table', {
        id: internalTableId,
      });

    const tablesInvolvedList = [
      internalTableId,
      ...(foreignKeys.length ? foreignKeys.map((foreignKey) => foreignKey.referenced_table_id) : []),
    ];

    const internalTables = await this.tableOperationsService.findOrFailInternalTableFromTableId(
      tablesInvolvedList,
      organizationId
    );

    const csvStream = csv.parseString(fileBuffer.toString(), {
      headers: true,
      strictColumnHandling: true,
      discardUnmappedColumns: true,
    });
    const primaryKeyColumnSchema = internalTableDatabaseColumn.filter(
      (colDetails) => colDetails.keytype === 'PRIMARY KEY'
    );
    const primaryKeyValuesToUpsert = new Set();
    let rowsProcessed = 0;

    csvStream
      .on('headers', (headers) => this.validateHeadersAsColumnSubset(internalTableDatabaseColumn, headers, csvStream))
      .transform((row) =>
        this.validateAndParseColumnDataType(
          internalTableDatabaseColumn,
          primaryKeyColumnSchema,
          row,
          rowsProcessed,
          csvStream
        )
      )
      .on('data', (row) => {
        rowsProcessed++;

        const primaryKeyValuesIdentifier = Object.entries(row)
          .map(([columnName, value]) => {
            const primaryKey = this.findPrimaryKey(columnName, primaryKeyColumnSchema);

            if (isEmpty(primaryKey)) return null;
            if (isEmpty(value) && !isEmpty(primaryKey.column_default)) return uuid();
            return value;
          })
          .filter((value) => value !== null)
          .join('-');

        if (primaryKeyValuesToUpsert.has(primaryKeyValuesIdentifier)) {
          throw new BadRequestException(`Duplicate primary key found on row[${rowsProcessed + 1}]`);
        }

        primaryKeyValuesToUpsert.add(primaryKeyValuesIdentifier);
        rowsToUpsert.push(row);
      })
      .on('error', (error) => {
        csvStream.destroy();
        passThrough.emit('error', new BadRequestException(error));
      })
      .on('end', () => {
        passThrough.emit('end');
      });

    await pipeline(passThrough, csvStream);

    await this.tooljetDbManager.transaction(async (tooljetDbManager) => {
      await this.bulkUpsertRows(
        tooljetDbManager,
        rowsToUpsert,
        internalTableId,
        internalTableDatabaseColumn,
        organizationId,
        internalTables
      );
    });

    return { processedRows: rowsProcessed };
  }

  async bulkUpsertRows(
    tooljetDbManager: EntityManager,
    rowsToUpsert: unknown[],
    internalTableId: string,
    internalTableDatabaseColumn: TooljetDatabaseColumn[],
    organizationId: string,
    internalTables: InternalTable[]
  ) {
    if (isEmpty(rowsToUpsert)) return;

    const primaryKeyColumns = internalTableDatabaseColumn
      .filter((colDetails) => colDetails.keytype === 'PRIMARY KEY')
      .map((colDetails) => colDetails.column_name);

    const serialTypeColumns = internalTableDatabaseColumn
      .filter((colDetails) => colDetails.data_type === 'integer' && /^nextval\(/.test(colDetails.column_default))
      .map((colDetails) => colDetails.column_name);

    const allValueSets = [];
    let allPlaceholders = [];
    let parameterIndex = 1;

    for (const row of rowsToUpsert) {
      const valueSet = [];
      const currentPlaceholders = [];

      for (const col of Object.keys(row)) {
        if (serialTypeColumns.includes(col) || (row[col] === null && primaryKeyColumns.includes(col))) {
          valueSet.push('DEFAULT');
        } else {
          valueSet.push(`$${parameterIndex++}`);
          currentPlaceholders.push(row[col]);
        }
      }

      allValueSets.push(`(${valueSet.join(', ')})`);
      allPlaceholders = allPlaceholders.concat(currentPlaceholders);
    }

    const allColumns = Object.keys(rowsToUpsert[0]);

    const onConflictUpdate = allColumns
      .filter((col) => !primaryKeyColumns.includes(col))
      .map((col) => `"${col}" = EXCLUDED."${col}"`)
      .join(', ');

    const primaryKeyColumnsQuoted = primaryKeyColumns.map((column) => `"${column}"`);
    const columnsQuoted = allColumns.map((column) => `"${column}"`);
    const tenantSchema = findTenantSchema(organizationId);
    const queryText =
      `INSERT INTO "${tenantSchema}"."${internalTableId}" (${columnsQuoted.join(', ')}) ` +
      `VALUES ${allValueSets.join(', ')} ` +
      `ON CONFLICT (${primaryKeyColumnsQuoted.join(', ')}) ` +
      `DO UPDATE SET ${onConflictUpdate};`;

    try {
      await tooljetDbManager.query(queryText, allPlaceholders);
    } catch (error) {
      throw new TooljetDatabaseError(
        error.message,
        {
          origin: 'bulk_upload',
          internalTables: internalTables,
        },
        error
      );
    }
  }

  async validateHeadersAsColumnSubset(
    internalTableDatabaseColumn: TooljetDatabaseColumn[],
    headers: string[],
    csvStream: csv.CsvParserStream<csv.ParserRow<any>, csv.ParserRow<any>>
  ) {
    const internalTableColumns = new Set<string>(internalTableDatabaseColumn.map((c) => c.column_name));
    const columnsInCsv = new Set<string>(headers);
    const isSubset = (subset: Set<string>, superset: Set<string>) => [...subset].every((item) => superset.has(item));

    if (!isSubset(columnsInCsv, internalTableColumns)) {
      const columnsNotIntable = [...columnsInCsv].filter((element) => !internalTableColumns.has(element));

      csvStream.emit('error', `Columns ${columnsNotIntable.join(',')} not found in table`);
    }
  }

  findPrimaryKey(columnName: string, primaryKeyColumns: TooljetDatabaseColumn[]) {
    return primaryKeyColumns.find(
      (colDetails) => colDetails.column_name === columnName && colDetails.keytype === 'PRIMARY KEY'
    );
  }

  validateAndParseColumnDataType(
    internalTableDatabaseColumn: TooljetDatabaseColumn[],
    primaryKeyColumnSchema: TooljetDatabaseColumn[],
    row: unknown,
    rowsProcessed: number,
    csvStream: csv.CsvParserStream<csv.ParserRow<any>, csv.ParserRow<any>>
  ) {
    if (rowsProcessed >= this.MAX_ROW_COUNT)
      csvStream.emit('error', `Row count cannot be greater than ${this.MAX_ROW_COUNT}`);

    try {
      const columnsInCsv = Object.keys(row);
      const transformedRow = columnsInCsv.reduce((result, columnInCsv) => {
        const columnDetails = internalTableDatabaseColumn.find((colDetails) => colDetails.column_name === columnInCsv);
        const primaryKey = this.findPrimaryKey(columnInCsv, primaryKeyColumnSchema);

        if (!isEmpty(primaryKey) && isEmpty(primaryKey.column_default) && isEmpty(row[columnInCsv]))
          throw `Primary key required for column ${columnDetails.column_name}`;

        result[columnInCsv] = this.convertToDataType(row[columnInCsv], columnDetails.data_type);
        return result;
      }, {});

      return transformedRow;
    } catch (error) {
      csvStream.emit('error', `Error at row[${rowsProcessed + 1}]: ${error}`);
    }
  }

  convertToDataType(columnValue: string, supportedDataType: TooljetDatabaseDataTypes) {
    if (!columnValue) return null;

    switch (supportedDataType) {
      case TJDB.boolean:
        return this.convertBoolean(columnValue);
      case TJDB.integer:
      case TJDB.double_precision:
      case TJDB.bigint:
        return this.convertNumber(columnValue, supportedDataType);
      case TJDB.jsonb:
        return JSON.parse(columnValue);
      default:
        return columnValue;
    }
  }

  convertBoolean(str: string) {
    const parsedString = str.toLowerCase().trim();
    if (parsedString === 'true' || parsedString === 'false') return str;

    throw `${str} is not a valid boolean string`;
  }

  convertNumber(str: string, dataType: 'integer' | 'bigint' | 'double precision') {
    if (dataType === 'integer' && !isNaN(parseInt(str, 10))) return str;
    if (dataType === 'double precision' && !isNaN(parseFloat(str))) return str;
    if (dataType === 'bigint' && typeof BigInt(str) === 'bigint') return str;

    throw `${str} is not a valid ${dataType}`;
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

  async getTableInfo(tableId: string, organizationId: string) {
    const internalTable = await this.manager.findOne(InternalTable, {
      where: { organizationId, id: tableId },
    });

    if (!internalTable) {
      console.log('No internal table found');
      return null;
    }

    const result = await this.tableOperationsService.perform(organizationId, 'view_table', {
      id: tableId,
    });

    return {
      table_name: internalTable.tableName,
      columns: result?.columns?.map((col: Record<string, any>) => col.column_name) || [],
      foreign_keys: result?.foreign_keys || [],
    };
  }

  async bulkUpsertRowsWithPrimaryKey(
    rowsToUpsert: Record<string, any>[],
    tableId: string,
    primaryKeyColumns: string[],
    organizationId: string
  ): Promise<{ status: string; inserted: number; updated: number; rows: any[]; error?: string }> {
    if (isEmpty(rowsToUpsert)) {
      return {
        status: 'failed',
        error: 'No rows provided for upsert operation',
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

    // Validate primary keys exist in table
    const invalidPrimaryKeys = primaryKeyColumns.filter((pk) => !tableColumns.some((col) => col.column_name === pk));
    if (invalidPrimaryKeys.length > 0) {
      return {
        status: 'failed',
        error: `Invalid primary key columns: ${invalidPrimaryKeys.join(', ')}`,
        inserted: 0,
        updated: 0,
        rows: [],
      };
    }

    // Find NOT NULL columns without defaults
    const notNullColumns = tableColumns
      .filter((col) => (col.constraints_type as any)?.is_not_null && !col.column_default)
      .map((col) => col.column_name);

    const serialTypeColumns = tableColumns
      .filter((col) => col.data_type === 'integer' && /^nextval\(/.test(col.column_default))
      .map((col) => col.column_name);

    const tenantSchema = findTenantSchema(organizationId);

    // First, get all existing rows that match our primary keys
    const existingDataMap = new Map();
    for (const row of rowsToUpsert) {
      // Validate primary keys are present
      const missingPrimaryKeys = primaryKeyColumns.filter((pk) => row[pk] === undefined);
      if (missingPrimaryKeys.length > 0) {
        return {
          status: 'failed',
          error: `Missing primary key values: ${missingPrimaryKeys.join(', ')}`,
          inserted: 0,
          updated: 0,
          rows: [],
        };
      }

      const whereConditions = primaryKeyColumns.map((pk, index) => `"${pk}" = $${index + 1}`).join(' AND ');
      const pkValues = primaryKeyColumns.map((pk) => row[pk]);

      const existingDataQuery = `
        SELECT *
        FROM "${tenantSchema}"."${tableId}"
        WHERE ${whereConditions};
      `;

      try {
        const existingData = await this.tooljetDbManager.query(existingDataQuery, pkValues);
        if (existingData?.[0]) {
          const key = primaryKeyColumns.map((pk) => row[pk]).join('-');
          existingDataMap.set(key, existingData[0]);
        }
      } catch (error) {
        console.error('Error fetching existing data:', error);
        throw new Error(`Error fetching existing data: ${error.message}`);
      }
    }

    // Merge existing data with updates, preserving non-specified columns
    const mergedRowsToUpsert = rowsToUpsert.map((row) => {
      const key = primaryKeyColumns.map((pk) => row[pk]).join('-');
      const existingData = existingDataMap.get(key);

      if (existingData) {
        // For updates: only update specified columns, preserve others
        const merged = { ...existingData };
        // Only update columns that were explicitly provided
        Object.keys(row).forEach((col) => {
          merged[col] = row[col];
        });
        return merged;
      } else {
        // For inserts: validate all NOT NULL constraints
        const missingNotNullColumns = notNullColumns.filter((col) => row[col] === undefined);
        if (missingNotNullColumns.length > 0) {
          throw new Error(`Missing required NOT NULL columns for new row: ${missingNotNullColumns.join(', ')}`);
        }
        return row;
      }
    });

    // Build the upsert query
    const allValueSets = [];
    let allPlaceholders = [];
    let parameterIndex = 1;

    for (const row of mergedRowsToUpsert) {
      const valueSet = [];
      const currentPlaceholders = [];
      const providedColumns = Object.keys(row);

      for (const col of providedColumns) {
        // Always use provided value for primary keys
        if (primaryKeyColumns.includes(col)) {
          valueSet.push(`$${parameterIndex++}`);
          currentPlaceholders.push(row[col]);
        }
        // Use DEFAULT for null serial columns (if not primary key)
        else if (serialTypeColumns.includes(col) && !primaryKeyColumns.includes(col) && row[col] === null) {
          valueSet.push('DEFAULT');
        }
        // Handle all other columns
        else {
          valueSet.push(`$${parameterIndex++}`);
          const value = typeof row[col] === 'object' && row[col] !== null ? JSON.stringify(row[col]) : row[col];
          currentPlaceholders.push(value);
        }
      }

      allValueSets.push(`(${valueSet.join(', ')})`);
      allPlaceholders = allPlaceholders.concat(currentPlaceholders);
    }

    // Only update columns that were provided in the original input
    const providedColumns = Object.keys(mergedRowsToUpsert[0]);
    const providedNonPKColumns = providedColumns.filter((col) => !primaryKeyColumns.includes(col));

    // Filter update columns to only those in original input
    const columnsToUpdate = providedNonPKColumns.filter((col) => Object.keys(rowsToUpsert[0]).includes(col));

    const onConflictUpdate =
      columnsToUpdate.length > 0
        ? `DO UPDATE SET ${columnsToUpdate.map((col) => `"${col}" = EXCLUDED."${col}"`).join(', ')}`
        : 'DO NOTHING';

    const primaryKeyColumnsQuoted = primaryKeyColumns.map((column) => `"${column}"`);
    const columnsQuoted = providedColumns.map((column) => `"${column}"`);

    const queryText =
      `INSERT INTO "${tenantSchema}"."${tableId}" (${columnsQuoted.join(', ')}) ` +
      `VALUES ${allValueSets.join(', ')} ` +
      `ON CONFLICT (${primaryKeyColumnsQuoted.join(', ')}) ` +
      `${onConflictUpdate} ` +
      `RETURNING *, (xmax = 0) as inserted;`;

    try {
      const result = await this.tooljetDbManager.query(queryText, allPlaceholders);
      const inserted = result.filter((row) => row.inserted).length;
      const updated = result.length - inserted;

      return {
        status: 'ok',
        inserted,
        updated,
        rows: result.map(({ inserted, ...row }) => row),
      };
    } catch (error) {
      console.error('Error executing upsert:', error);
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
