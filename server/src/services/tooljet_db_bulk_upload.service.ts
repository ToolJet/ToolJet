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
      ignoreEmpty: true,
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
          rowsToInsert.push(row);
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
      await this.bulkInsertRows(tooljetDbManager, rowsToInsert, internalTableId);
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

  async bulkInsertRows(tooljetDbManager: EntityManager, rowsToInsert: unknown[], internalTableId: string) {
    if (isEmpty(rowsToInsert)) return;

    const insertQueries = rowsToInsert.map((row, index) => {
      return {
        text: `INSERT INTO "${internalTableId}" (${Object.keys(row).join(', ')}) VALUES (${Object.values(row).map(
          (_, index) => `$${index + 1}`
        )})`,
        values: Object.values(row),
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
        const convertedValue = this.validateDataType(row[columnInCsv], columnDetails.data_type);

        if (convertedValue) result[columnInCsv] = this.validateDataType(row[columnInCsv], columnDetails.data_type);

        return result;
      }, {});

      return transformedRow;
    } catch (error) {
      csvStream.emit('error', `Data type error at row[${rowsProcessed + 1}]: ${error}`);
    }
  }

  validateDataType(columnValue: string, supportedDataType: SupportedDataTypes) {
    if (!columnValue) return null;

    switch (supportedDataType) {
      case 'boolean':
        return this.validateBoolean(columnValue);
      case 'integer':
      case 'double precision':
      case 'bigint':
        return this.validateNumber(columnValue, supportedDataType);
      default:
        return columnValue;
    }
  }

  validateBoolean(str: string) {
    const parsedString = str.toLowerCase().trim();
    if (parsedString === 'true' || parsedString === 'false') return str;

    throw `${str} is not a valid boolean string`;
  }

  validateNumber(str: string, dataType: 'integer' | 'bigint' | 'double precision') {
    if (dataType === 'integer' && !isNaN(parseInt(str, 10))) return str;
    if (dataType === 'double precision' && !isNaN(parseFloat(str))) return str;
    if (dataType === 'bigint' && typeof BigInt(str) === 'bigint') return str;

    throw `${str} is not a valid ${dataType}`;
  }
}
