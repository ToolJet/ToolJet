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
  ): Promise<{ processedRows: number; rowsInserted: number; rowsUpdated: number }> {
    const csvStream = csv.parseString(fileBuffer.toString(), {
      headers: true,
      strictColumnHandling: true,
      discardUnmappedColumns: true,
    });
    const rowsToInsert = [];
    const rowsToUpdate = [];
    const idstoUpdate = new Set();
    let rowsProcessed = 0;

    const passThrough = new PassThrough();

    csvStream
      .on('headers', (headers) => this.validateHeadersAsColumnSubset(internalTableColumnSchema, headers, csvStream))
      .transform((row) => this.validateAndParseColumnDataType(internalTableColumnSchema, row, rowsProcessed, csvStream))
      .on('data', (row) => {
        rowsProcessed++;
        if (row.id) {
          if (idstoUpdate.has(row.id)) {
            throw new BadRequestException(`Duplicate 'id' value found on row[${rowsProcessed + 1}]: ${row.id}`);
          }

          idstoUpdate.add(row.id);
          rowsToUpdate.push(row);
        } else {
          // TODO: Revise logic for primary key instead of hardcoded id column
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const { id, ...rowWithoutId } = row;
          rowsToInsert.push(rowWithoutId);
        }
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
      await this.bulkInsertRows(tooljetDbManager, rowsToInsert, internalTableId, internalTableColumnSchema);
      await this.bulkUpdateRows(tooljetDbManager, rowsToUpdate, internalTableId);
    });

    return { processedRows: rowsProcessed, rowsInserted: rowsToInsert.length, rowsUpdated: rowsToUpdate.length };
  }

  async bulkUpdateRows(tooljetDbManager: EntityManager, rowsToUpdate: unknown[], internalTableId: string) {
    if (isEmpty(rowsToUpdate)) return;

    const updateQueries = rowsToUpdate.map((row) => {
      const columnNames = Object.keys(rowsToUpdate[0]);
      const setClauses = columnNames
        .map((column) => {
          return `${column} = $${columnNames.indexOf(column) + 1}`;
        })
        .join(', ');

      return {
        text: `UPDATE "${internalTableId}" SET ${setClauses} WHERE id = $${columnNames.indexOf('id') + 1}`,
        values: columnNames.map((column) => row[column]),
      };
    });

    for (const updateQuery of updateQueries) {
      await tooljetDbManager.query(updateQuery.text, updateQuery.values);
    }
  }

  async bulkInsertRows(
    tooljetDbManager: EntityManager,
    rowsToInsert: unknown[],
    internalTableId: string,
    internalTableColumnSchema: TableColumnSchema[]
  ) {
    if (isEmpty(rowsToInsert)) return;

    const excludedColumns = Object.keys(rowsToInsert[0]).filter((column) => {
      const columnDetails = internalTableColumnSchema.find((colDetails) => colDetails.column_name === column);
      return columnDetails && columnDetails.keytype !== 'PRIMARY KEY' && columnDetails.data_type === 'integer';
    });

    const insertQueries = rowsToInsert.map((row, index) => {
      const filteredRow = Object.fromEntries(Object.entries(row).filter(([key, _]) => !excludedColumns.includes(key)));

      return {
        text: `INSERT INTO "${internalTableId}" (${Object.keys(filteredRow).join(', ')}) VALUES (${Object.values(
          filteredRow
        ).map((_, index) => `$${index + 1}`)})`,
        values: Object.values(filteredRow),
      };
    });
    for (const insertQuery of insertQueries) {
      await tooljetDbManager.query(insertQuery.text, insertQuery.values);
    }
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

        const { keytype, data_type } = columnDetails;

        if (keytype === 'PRIMARY KEY' && data_type !== 'serial') {
          if (!row[columnInCsv]) {
            throw new BadRequestException(
              `Primary key value cannot be empty, Row - ${rowsProcessed + 1} is empty for Column - ${
                columnDetails.column_name
              }`
            );
          }
        }

        result[columnInCsv] = this.convertToDataType(row[columnInCsv], columnDetails.data_type);
        return result;
      }, {});

      return transformedRow;
    } catch (error) {
      csvStream.emit('error', `Data type error at row[${rowsProcessed + 1}]: ${error}`);
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
