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
    });
    const rowsToInsert = [];
    const rowsToUpdate = [];
    const idstoUpdate = new Set();
    let rowsProcessed = 0;

    const passThrough = new PassThrough();

    csvStream
      .on('headers', (headers) => this.validateHeadersAsColumnSubset(internalTableColumnSchema, headers))
      .transform((row) => this.validateAndParseColumnDataType(internalTableColumnSchema, row, rowsProcessed))
      .on('data', (row) => {
        rowsProcessed++;
        if (row.id) {
          if (idstoUpdate.has(row.id))
            throw new BadRequestException(`Duplicate 'id' value found on row [${rowsProcessed + 1}]: ${row.id}`);

          idstoUpdate.add(row.id);
          rowsToUpdate.push(row);
        } else {
          rowsToInsert.push(row);
        }
      })
      .on('error', (error) => {
        passThrough.emit('error', new BadRequestException(error.message));
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

    const rowsWithoutIdColumn = rowsToInsert.map((row: { id: string }) => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { id, ...rest } = row;
      return rest;
    });

    const columns = Object.keys(rowsWithoutIdColumn[0]);
    const rowValues = rowsWithoutIdColumn.map((r) => Object.values(r));

    await tooljetDbManager.createQueryBuilder().insert().into(internalTableId, columns).values(rowValues).execute();
  }

  async validateHeadersAsColumnSubset(internalTableColumnSchema: TableColumnSchema[], headers: string[]) {
    const internalTableColumns = new Set<string>(internalTableColumnSchema.map((c) => c.column_name));
    const columnsInCsv = new Set<string>(headers);
    const isSubset = (subset: Set<string>, superset: Set<string>) => [...subset].every((item) => superset.has(item));

    if (!isSubset(new Set<string>(headers), internalTableColumns)) {
      const columnsNotIntable = [...columnsInCsv].filter((element) => !internalTableColumns.has(element));

      throw new BadRequestException(`Columns ${columnsNotIntable.join(',')} not found in table`);
    }
  }

  validateAndParseColumnDataType(internalTableColumnSchema: TableColumnSchema[], row: unknown, rowsProcessed: number) {
    if (rowsProcessed >= MAX_ROW_COUNT)
      throw new BadRequestException(`Row count cannot be greater than ${MAX_ROW_COUNT}`);

    try {
      const columnsInCsv = Object.keys(row);
      const transformedRow = columnsInCsv.reduce((result, columnInCsv) => {
        const columnDetails = internalTableColumnSchema.find((colDetails) => colDetails.column_name === columnInCsv);
        result[columnInCsv] = this.convertToDataType(row[columnInCsv], columnDetails.data_type);
        return result;
      }, {});

      return transformedRow;
    } catch (error) {
      throw new BadRequestException(`Data type error at row[${rowsProcessed + 1}]: ${error}`);
    }
  }

  convertToDataType(columnValue: string, supportedDataType: SupportedDataTypes) {
    switch (supportedDataType) {
      case 'boolean':
        return this.stringToBoolean(columnValue);
      case 'integer':
      case 'double precision':
        return +columnValue;
      default:
        return columnValue;
    }
  }

  stringToBoolean(str: string) {
    if (str === 'true') return true;
    if (str === 'false') return false;

    throw `${str} is not a valid boolean string`;
  }
}
