import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { EntityManager } from 'typeorm';
import { InternalTable } from 'src/entities/internal_table.entity';
import * as csv from 'fast-csv';
import { SupportedDataTypes, TableColumnSchema, TooljetDbService } from './tooljet_db.service';
import { InjectEntityManager } from '@nestjs/typeorm';
import { isEmpty } from 'lodash';
import { pipeline } from 'stream/promises';
import { PassThrough } from 'stream';

const MAX_ROW_COUNT = 1000;

@Injectable()
export class TooljetDbBulkUploadService {
  constructor(
    private readonly manager: EntityManager,
    @InjectEntityManager('tooljetDb')
    private readonly tooljetDbManager: EntityManager,
    private readonly tooljetDbService: TooljetDbService
  ) {}

  async perform(organizationId: string, tableName: string, fileBuffer: Buffer) {
    const internalTable = await this.manager.findOne(InternalTable, {
      select: ['id'],
      where: { organizationId, tableName },
    });

    if (!internalTable) {
      throw new NotFoundException(`Table ${tableName} not found`);
    }

    const internalTableColumnSchema = await this.tooljetDbService.perform(organizationId, 'view_table', {
      table_name: tableName,
    });

    return await this.bulkUploadCsv(internalTable.id, internalTableColumnSchema, fileBuffer);
  }

  async bulkUploadCsv(
    internalTableId: string,
    internalTableColumnSchema: TableColumnSchema[],
    fileBuffer: Buffer
  ): Promise<{ processedRows: number }> {
    const rowsToUpsert = [];
    const passThrough = new PassThrough();
    const csvStream = csv.parseString(fileBuffer.toString(), {
      headers: true,
      strictColumnHandling: true,
      discardUnmappedColumns: true,
    });
    const primaryKeyColumns = internalTableColumnSchema
      .filter((colDetails) => colDetails.keytype === 'PRIMARY KEY')
      .map((colDetails) => colDetails.column_name);
    const primaryKeyValuesToUpsert = new Set();
    let rowsProcessed = 0;

    csvStream
      .on('headers', (headers) => this.validateHeadersAsColumnSubset(internalTableColumnSchema, headers, csvStream))
      .transform((row) => this.validateAndParseColumnDataType(internalTableColumnSchema, row, rowsProcessed, csvStream))
      .on('data', (row) => {
        rowsProcessed++;

        const primaryKeyValuesIdentifier = Object.entries(row)
          .filter(([columnName, _]) => primaryKeyColumns.includes(columnName))
          .map(([_, value]) => value)
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
      await this.bulkUpsertRows(tooljetDbManager, rowsToUpsert, internalTableId, internalTableColumnSchema);
    });

    return { processedRows: rowsProcessed };
  }

  async bulkUpsertRows(
    tooljetDbManager: EntityManager,
    rowsToUpsert: unknown[],
    internalTableId: string,
    internalTableColumnSchema: TableColumnSchema[]
  ) {
    if (isEmpty(rowsToUpsert)) return;

    const primaryKeyColumns = internalTableColumnSchema
      .filter((colDetails) => colDetails.keytype === 'PRIMARY KEY')
      .map((colDetails) => colDetails.column_name);

    const valueSets = [];
    let placeholders = [];
    let rowIndex = 1;
    for (const row of rowsToUpsert) {
      // Filter out null primary keys if they have default values set (e.g., auto-incremented IDs)
      const rowColumns = Object.keys(row).filter((col) => row[col] !== null || !primaryKeyColumns.includes(col));
      const rowData = rowColumns.map((col) => row[col]);
      const rowPlaceholders = rowData.map((_, idx) => `$${rowIndex + idx}`).join(', ');

      valueSets.push(`(${rowPlaceholders})`);
      placeholders = placeholders.concat(rowData);
      rowIndex += rowData.length;
    }

    // Columns for insert should exclude primary keys that might be null
    const insertColumns = Object.keys(rowsToUpsert[0]).filter(
      (col) => rowsToUpsert.some((row) => row[col] !== null) || !primaryKeyColumns.includes(col)
    );

    const onConflictUpdate = insertColumns
      .filter((col) => !primaryKeyColumns.includes(col))
      .map((col) => `"${col}" = EXCLUDED."${col}"`)
      .join(', ');

    const queryText = `
    INSERT INTO "${internalTableId}" ("${insertColumns.join('", "')}")
    VALUES ${valueSets.join(', ')}
    ON CONFLICT (${primaryKeyColumns.join(', ')})
    DO UPDATE SET ${onConflictUpdate}
  `;

    await tooljetDbManager.query(queryText, placeholders);
  }

  async validateHeadersAsColumnSubset(
    internalTableColumnSchema: TableColumnSchema[],
    headers: string[],
    csvStream: csv.CsvParserStream<csv.ParserRow<any>, csv.ParserRow<any>>
  ) {
    const internalTableColumns = new Set<string>(internalTableColumnSchema.map((c) => c.column_name));
    const columnsInCsv = new Set<string>(headers);
    const isSubset = (subset: Set<string>, superset: Set<string>) => [...subset].every((item) => superset.has(item));

    if (!isSubset(columnsInCsv, internalTableColumns)) {
      const columnsNotIntable = [...columnsInCsv].filter((element) => !internalTableColumns.has(element));

      csvStream.emit('error', `Columns ${columnsNotIntable.join(',')} not found in table`);
    }
  }

  validateAndParseColumnDataType(
    internalTableColumnSchema: TableColumnSchema[],
    row: unknown,
    rowsProcessed: number,
    csvStream: csv.CsvParserStream<csv.ParserRow<any>, csv.ParserRow<any>>
  ) {
    if (rowsProcessed >= MAX_ROW_COUNT) csvStream.emit('error', `Row count cannot be greater than ${MAX_ROW_COUNT}`);

    try {
      const columnsInCsv = Object.keys(row);
      const transformedRow = columnsInCsv.reduce((result, columnInCsv) => {
        const columnDetails = internalTableColumnSchema.find((colDetails) => colDetails.column_name === columnInCsv);
        const { keytype, column_default } = columnDetails;
        const primaryKeyHasNoDefaultValue = keytype === 'PRIMARY KEY' && isEmpty(column_default);

        if (primaryKeyHasNoDefaultValue && isEmpty(row[columnInCsv]))
          throw `Primary key required for column ${columnDetails.column_name}`;

        result[columnInCsv] = this.convertToDataType(row[columnInCsv], columnDetails.data_type);
        return result;
      }, {});

      return transformedRow;
    } catch (error) {
      csvStream.emit('error', `Error at row[${rowsProcessed + 1}]: ${error}`);
    }
  }

  convertToDataType(columnValue: string, supportedDataType: SupportedDataTypes) {
    if (!columnValue) return null;

    switch (supportedDataType) {
      case 'boolean':
        return this.convertBoolean(columnValue);
      case 'integer':
      case 'double precision':
      case 'bigint':
        return this.convertNumber(columnValue, supportedDataType);
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
