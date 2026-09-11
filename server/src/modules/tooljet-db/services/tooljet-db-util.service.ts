import { BadRequestException, Injectable } from '@nestjs/common';
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
export class TooljetDbUtilService {
  protected MAX_ROW_COUNT;

  constructor(
    @InjectEntityManager('tooljetDb')
    protected readonly tooljetDbManager: EntityManager,
    protected readonly tableOperationsService: TooljetDbTableOperationsService
  ) {
    this.MAX_ROW_COUNT =
      process.env?.TOOLJET_DB_BULK_UPLOAD_MAX_ROWS && !isNaN(Number(process.env.TOOLJET_DB_BULK_UPLOAD_MAX_ROWS))
        ? Number(process.env.TOOLJET_DB_BULK_UPLOAD_MAX_ROWS)
        : 1000;
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
            //Primary key can be undefined auto generated case
            if (!primaryKey) return uuid();

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

    // Columns with a real DB-level default (serial PKs, gen_random_uuid(), a plain boolean/
    // number default, etc.) - an empty CSV cell for one of these should fall back to that
    // default instead of an explicit NULL. Only columns with no default at all should ever
    // receive NULL (and, correctly, error out if they're also NOT NULL).
    const columnsWithDefault = new Set(
      internalTableDatabaseColumn
        .filter((colDetails) => !isEmpty(colDetails.column_default))
        .map((colDetails) => colDetails.column_name)
    );

    const allValueSets = [];
    let allPlaceholders = [];
    let parameterIndex = 1;

    for (const row of rowsToUpsert) {
      const valueSet = [];
      const currentPlaceholders = [];

      for (const col of Object.keys(row)) {
        if (row[col] === null && (columnsWithDefault.has(col) || primaryKeyColumns.includes(col))) {
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

  async bulkUpdateCsv(
    internalTableId: string,
    fileBuffer: Buffer,
    organizationId: string
  ): Promise<{ processedRows: number }> {
    const rowsToUpdate: Record<string, any>[] = [];
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

    const primaryKeyColumnSchema = internalTableDatabaseColumn.filter(
      (colDetails) => colDetails.keytype === 'PRIMARY KEY'
    );

    const csvStream = csv.parseString(fileBuffer.toString(), {
      headers: true,
      strictColumnHandling: true,
      discardUnmappedColumns: true,
    });

    let primaryKeyColumnsInCsv: string[] = [];
    let dataColumnsInCsv: string[] = [];
    const primaryKeyValuesSeen = new Set();
    let rowsProcessed = 0;

    csvStream
      .on('headers', (headers) => {
        const resolved = this.resolvePrimaryKeyAndDataColumns(
          internalTableDatabaseColumn,
          primaryKeyColumnSchema,
          headers
        );
        primaryKeyColumnsInCsv = resolved.primaryKeyColumns;
        dataColumnsInCsv = resolved.dataColumns;

        if (primaryKeyColumnsInCsv.length === 0) {
          csvStream.emit(
            'error',
            `CSV must include at least one primary key column: ${primaryKeyColumnSchema
              .map((colDetails) => colDetails.column_name)
              .join(', ')}`
          );
          return;
        }
        if (dataColumnsInCsv.length === 0) {
          csvStream.emit('error', 'CSV must include at least one column to update besides the primary key');
        }
      })
      .transform((row) =>
        this.filterAndParseKnownColumns(
          [...primaryKeyColumnsInCsv, ...dataColumnsInCsv],
          primaryKeyColumnsInCsv,
          internalTableDatabaseColumn,
          row,
          rowsProcessed,
          csvStream
        )
      )
      .on('data', (row: Record<string, any>) => {
        rowsProcessed++;

        const primaryKeyValuesIdentifier = primaryKeyColumnsInCsv.map((col) => row[col]).join('-');
        if (primaryKeyValuesSeen.has(primaryKeyValuesIdentifier)) {
          throw new BadRequestException(`Duplicate primary key found on row[${rowsProcessed + 1}]`);
        }
        primaryKeyValuesSeen.add(primaryKeyValuesIdentifier);

        rowsToUpdate.push(row);
      })
      .on('error', (error) => {
        csvStream.destroy();
        passThrough.emit('error', new BadRequestException(error));
      })
      .on('end', () => {
        passThrough.emit('end');
      });

    await pipeline(passThrough, csvStream);

    const processedRows = await this.tooljetDbManager.transaction(async (tooljetDbManager) => {
      return this.bulkUpdateRows(
        tooljetDbManager,
        rowsToUpdate,
        internalTableId,
        primaryKeyColumnsInCsv,
        dataColumnsInCsv,
        organizationId,
        internalTables,
        internalTableDatabaseColumn
      );
    });

    return { processedRows };
  }

  async bulkUpdateRows(
    tooljetDbManager: EntityManager,
    rowsToUpdate: Record<string, any>[],
    internalTableId: string,
    primaryKeyColumns: string[],
    dataColumns: string[],
    organizationId: string,
    internalTables: InternalTable[],
    internalTableDatabaseColumn: TooljetDatabaseColumn[]
  ): Promise<number> {
    if (isEmpty(rowsToUpdate)) return 0;

    const tenantSchema = findTenantSchema(organizationId);
    const allColumns = [...primaryKeyColumns, ...dataColumns];
    // The VALUES(...) list below has no target-column context for Postgres to infer parameter
    // types from (unlike a plain INSERT), so every parameter defaults to text/unknown - explicit
    // casts are required or comparisons like `t."id" = v."id"` fail with "operator does not
    // exist: integer = text".
    const columnCasts = allColumns.map((col) => {
      const columnDetails = internalTableDatabaseColumn.find((colDetails) => colDetails.column_name === col);
      return columnDetails ? `::${columnDetails.data_type}` : '';
    });

    const allValueSets = [];
    let allPlaceholders = [];
    let parameterIndex = 1;

    for (const row of rowsToUpdate) {
      const valueSet = allColumns.map((col, index) => `$${parameterIndex++}${columnCasts[index]}`);
      allValueSets.push(`(${valueSet.join(', ')})`);
      allPlaceholders = allPlaceholders.concat(allColumns.map((col) => row[col]));
    }

    const valuesColumnsAliased = allColumns.map((col) => `"${col}"`).join(', ');
    const setClause = dataColumns.map((col) => `"${col}" = v."${col}"`).join(', ');
    const whereClause = primaryKeyColumns.map((col) => `t."${col}" = v."${col}"`).join(' AND ');

    const queryText =
      `UPDATE "${tenantSchema}"."${internalTableId}" AS t ` +
      `SET ${setClause} ` +
      `FROM (VALUES ${allValueSets.join(', ')}) AS v(${valuesColumnsAliased}) ` +
      `WHERE ${whereClause} ` +
      `RETURNING t."${primaryKeyColumns[0]}";`;

    try {
      const result = await tooljetDbManager.query(queryText, allPlaceholders);
      return this.resolveAffectedRowCount(result);
    } catch (error) {
      throw new TooljetDatabaseError(
        error.message,
        {
          origin: 'bulk_update',
          internalTables: internalTables,
        },
        error
      );
    }
  }

  async bulkDeleteCsv(
    internalTableId: string,
    fileBuffer: Buffer,
    organizationId: string
  ): Promise<{ processedRows: number }> {
    const rowsToDelete: Record<string, any>[] = [];
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

    const primaryKeyColumnSchema = internalTableDatabaseColumn.filter(
      (colDetails) => colDetails.keytype === 'PRIMARY KEY'
    );

    const csvStream = csv.parseString(fileBuffer.toString(), {
      headers: true,
      strictColumnHandling: true,
      discardUnmappedColumns: true,
    });

    let primaryKeyColumnsInCsv: string[] = [];
    let rowsProcessed = 0;

    csvStream
      .on('headers', (headers) => {
        const resolved = this.resolvePrimaryKeyAndDataColumns(
          internalTableDatabaseColumn,
          primaryKeyColumnSchema,
          headers
        );
        primaryKeyColumnsInCsv = resolved.primaryKeyColumns;

        if (primaryKeyColumnsInCsv.length === 0) {
          csvStream.emit(
            'error',
            `CSV must include at least one primary key column: ${primaryKeyColumnSchema
              .map((colDetails) => colDetails.column_name)
              .join(', ')}`
          );
        }
      })
      .transform((row) =>
        this.filterAndParseKnownColumns(
          primaryKeyColumnsInCsv,
          primaryKeyColumnsInCsv,
          internalTableDatabaseColumn,
          row,
          rowsProcessed,
          csvStream
        )
      )
      .on('data', (row: Record<string, any>) => {
        rowsProcessed++;
        rowsToDelete.push(row);
      })
      .on('error', (error) => {
        csvStream.destroy();
        passThrough.emit('error', new BadRequestException(error));
      })
      .on('end', () => {
        passThrough.emit('end');
      });

    await pipeline(passThrough, csvStream);

    const processedRows = await this.tooljetDbManager.transaction(async (tooljetDbManager) => {
      return this.bulkDeleteRows(
        tooljetDbManager,
        rowsToDelete,
        internalTableId,
        primaryKeyColumnsInCsv,
        organizationId,
        internalTables,
        internalTableDatabaseColumn
      );
    });

    return { processedRows };
  }

  async bulkDeleteRows(
    tooljetDbManager: EntityManager,
    rowsToDelete: Record<string, any>[],
    internalTableId: string,
    primaryKeyColumns: string[],
    organizationId: string,
    internalTables: InternalTable[],
    internalTableDatabaseColumn: TooljetDatabaseColumn[]
  ): Promise<number> {
    if (isEmpty(rowsToDelete)) return 0;

    const tenantSchema = findTenantSchema(organizationId);
    const primaryKeyColumnsQuoted = primaryKeyColumns.map((col) => `"${col}"`).join(', ');
    // Same reasoning as bulkUpdateRows: parameters in a bare VALUES(...) list default to
    // text/unknown, so the IN (VALUES ...) row-constructor comparison needs explicit casts.
    const columnCasts = primaryKeyColumns.map((col) => {
      const columnDetails = internalTableDatabaseColumn.find((colDetails) => colDetails.column_name === col);
      return columnDetails ? `::${columnDetails.data_type}` : '';
    });

    const allValueSets = [];
    let allPlaceholders = [];
    let parameterIndex = 1;

    for (const row of rowsToDelete) {
      const valueSet = primaryKeyColumns.map((col, index) => `$${parameterIndex++}${columnCasts[index]}`);
      allValueSets.push(`(${valueSet.join(', ')})`);
      allPlaceholders = allPlaceholders.concat(primaryKeyColumns.map((col) => row[col]));
    }

    const queryText =
      `DELETE FROM "${tenantSchema}"."${internalTableId}" ` +
      `WHERE (${primaryKeyColumnsQuoted}) IN (VALUES ${allValueSets.join(', ')}) ` +
      `RETURNING "${primaryKeyColumns[0]}";`;

    try {
      const result = await tooljetDbManager.query(queryText, allPlaceholders);
      return this.resolveAffectedRowCount(result);
    } catch (error) {
      throw new TooljetDatabaseError(
        error.message,
        {
          origin: 'bulk_delete',
          internalTables: internalTables,
        },
        error
      );
    }
  }

  // TypeORM's Postgres query runner special-cases UPDATE/DELETE commands: `manager.query()`
  // returns a `[rows, rowCount]` tuple for them (not a plain rows array like every other
  // query), so `result.length` is always 2 regardless of how many rows were actually
  // affected. `rowCount` is Postgres's own affected-row count and is what we want here.
  private resolveAffectedRowCount(result: unknown): number {
    if (Array.isArray(result) && result.length === 2 && typeof result[1] === 'number') {
      return result[1];
    }
    return Array.isArray(result) ? result.length : 0;
  }

  resolvePrimaryKeyAndDataColumns(
    internalTableDatabaseColumn: TooljetDatabaseColumn[],
    primaryKeyColumnSchema: TooljetDatabaseColumn[],
    headers: string[]
  ): { primaryKeyColumns: string[]; dataColumns: string[] } {
    const knownColumnNames = new Set(internalTableDatabaseColumn.map((colDetails) => colDetails.column_name));
    const primaryKeyColumnNames = new Set(primaryKeyColumnSchema.map((colDetails) => colDetails.column_name));
    // Columns in the CSV that aren't real columns on the table are silently ignored,
    // rather than rejected the way bulkUploadCsv's validateHeadersAsColumnSubset does.
    const knownHeaders = headers.filter((header) => knownColumnNames.has(header));

    return {
      primaryKeyColumns: knownHeaders.filter((header) => primaryKeyColumnNames.has(header)),
      dataColumns: knownHeaders.filter((header) => !primaryKeyColumnNames.has(header)),
    };
  }

  filterAndParseKnownColumns(
    columnsToKeep: string[],
    requiredColumns: string[],
    internalTableDatabaseColumn: TooljetDatabaseColumn[],
    row: Record<string, any>,
    rowsProcessed: number,
    csvStream: csv.CsvParserStream<csv.ParserRow<any>, csv.ParserRow<any>>
  ) {
    if (rowsProcessed >= this.MAX_ROW_COUNT)
      csvStream.emit('error', `Row count cannot be greater than ${this.MAX_ROW_COUNT}`);

    try {
      const filteredRow: Record<string, any> = {};
      for (const columnName of columnsToKeep) {
        if (requiredColumns.includes(columnName) && isEmpty(row[columnName]))
          throw `Primary key value required for column ${columnName}`;

        const columnDetails = internalTableDatabaseColumn.find((colDetails) => colDetails.column_name === columnName);
        filteredRow[columnName] = this.convertToDataType(row[columnName], columnDetails!.data_type);
      }

      return filteredRow;
    } catch (error) {
      csvStream.emit('error', `Error at row[${rowsProcessed + 1}]: ${error}`);
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
    if (typeof columnValue === 'boolean') return columnValue;
    // An empty CSV cell means "no value" for every column type - let the column's
    // own default/NULL apply rather than trying (and failing) to parse "" as a boolean/number/json.
    if (!columnValue) return null;

    switch (supportedDataType) {
      case TJDB.boolean:
        return this.convertBoolean(columnValue);
      case TJDB.integer:
      case TJDB.double_precision:
      case TJDB.bigint:
        return this.convertNumber(columnValue, supportedDataType);
      case TJDB.jsonb:
        if (typeof columnValue !== 'string') return columnValue;
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
}
