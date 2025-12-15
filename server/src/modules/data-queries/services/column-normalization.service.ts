import { Injectable } from '@nestjs/common';
import { EntityManager } from 'typeorm';
import { DataSource } from 'src/entities/data_source.entity';
import { InternalTable } from 'src/entities/internal_table.entity';

@Injectable()
export class ColumnNormalizationService {
  constructor(protected readonly manager: EntityManager) {}

  async normalizeOptionsToUuids(
    options: any,
    dataSource: DataSource,
    organizationId: string
  ): Promise<any> {
    if (dataSource.kind !== 'tooljetdb' || !options) return options;

    const normalized = { ...options };
    const tableId = normalized.table_id;

    if (!tableId) return normalized;

    const nameToUuid = await this.getNameToUuidMap(tableId, organizationId);

    // Normalize list_rows
    if (normalized.list_rows) {
      this.normalizeListRows(normalized.list_rows, nameToUuid);
    }

    // Normalize create_row
    if (normalized.create_row) {
      this.normalizeCreateRow(normalized.create_row, nameToUuid);
    }

    // Normalize update_rows
    if (normalized.update_rows) {
      this.normalizeUpdateRows(normalized.update_rows, nameToUuid);
    }

    // Normalize delete_rows
    if (normalized.delete_rows) {
      this.normalizeDeleteRows(normalized.delete_rows, nameToUuid);
    }

    // Normalize bulk_update_with_primary_key
    if (normalized.bulk_update_with_primary_key) {
      this.normalizeBulkUpdateWithPrimaryKey(normalized.bulk_update_with_primary_key, nameToUuid);
    }

    // Normalize bulk_upsert_with_primary_key
    if (normalized.bulk_upsert_with_primary_key) {
      this.normalizeBulkUpsertWithPrimaryKey(normalized.bulk_upsert_with_primary_key, nameToUuid);
    }

    // Normalize join_table
    if (normalized.join_table) {
      await this.normalizeJoinTable(normalized.join_table, organizationId);
    }

    return normalized;
  }

  async denormalizeOptionsFromUuids(
    options: any,
    dataSource: DataSource,
    organizationId: string
  ): Promise<any> {
    if (dataSource.kind !== 'tooljetdb' || !options) return options;

    const denormalized = { ...options };
    const tableId = denormalized.table_id;

    if (!tableId) return denormalized;

    const uuidToName = await this.getUuidToNameMap(tableId, organizationId);

    // Denormalize list_rows
    if (denormalized.list_rows) {
      this.denormalizeListRows(denormalized.list_rows, uuidToName);
    }

    // Denormalize create_row
    if (denormalized.create_row) {
      this.denormalizeCreateRow(denormalized.create_row, uuidToName);
    }

    // Denormalize update_rows
    if (denormalized.update_rows) {
      this.denormalizeUpdateRows(denormalized.update_rows, uuidToName);
    }

    // Denormalize delete_rows
    if (denormalized.delete_rows) {
      this.denormalizeDeleteRows(denormalized.delete_rows, uuidToName);
    }

    // Denormalize bulk_update_with_primary_key
    if (denormalized.bulk_update_with_primary_key) {
      this.denormalizeBulkUpdateWithPrimaryKey(denormalized.bulk_update_with_primary_key, uuidToName);
    }

    // Denormalize bulk_upsert_with_primary_key
    if (denormalized.bulk_upsert_with_primary_key) {
      this.denormalizeBulkUpsertWithPrimaryKey(denormalized.bulk_upsert_with_primary_key, uuidToName);
    }

    // Denormalize join_table
    if (denormalized.join_table) {
      await this.denormalizeJoinTable(denormalized.join_table, organizationId);
    }

    return denormalized;
  }

  // Private helper methods
  private isUuid(str: string): boolean {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);
  }

  private async getNameToUuidMap(tableId: string, organizationId: string): Promise<Record<string, string>> {
    const table = await this.manager.findOne(InternalTable, {
      where: { id: tableId, organizationId },
    });
    if (!table) return {};

    const columnNames = table.configurations?.columns?.column_names || {};
    return columnNames as Record<string, string>;
  }

  private async getUuidToNameMap(tableId: string, organizationId: string): Promise<Record<string, string>> {
    const table = await this.manager.findOne(InternalTable, {
      where: { id: tableId, organizationId },
    });
    if (!table) return {};

    const columnNames = table.configurations?.columns?.column_names || {};
    const uuidToName: Record<string, string> = {};
    for (const [name, uuid] of Object.entries(columnNames)) {
      uuidToName[uuid as string] = name;
    }
    return uuidToName;
  }

  // Normalization methods
  private normalizeListRows(listRows: any, nameToUuid: Record<string, string>): void {
    // Normalize where_filters
    if (listRows.where_filters) {
      Object.values(listRows.where_filters).forEach((filter: any) => {
        if (filter?.column && !this.isUuid(filter.column)) {
          const column_uuid = nameToUuid[filter.column];
          if (column_uuid) {
            filter.column = column_uuid;
          }
        }
      });
    }

    // Normalize aggregates
    if (listRows.aggregates) {
      Object.values(listRows.aggregates).forEach((agg: any) => {
        if (agg?.column && !this.isUuid(agg.column)) {
          const column_uuid = nameToUuid[agg.column];
          if (column_uuid) {
            agg.column = column_uuid;
          }
        }
      });
    }

    // Normalize order_filters
    if (listRows.order_filters) {
      Object.values(listRows.order_filters).forEach((filter: any) => {
        if (filter?.column && !this.isUuid(filter.column)) {
          const column_uuid = nameToUuid[filter.column];
          if (column_uuid) {
            filter.column = column_uuid;
          }
        }
      });
    }

    // Normalize group_by
    if (listRows.group_by) {
      Object.keys(listRows.group_by).forEach((key) => {
        const columns = listRows.group_by[key];
        if (Array.isArray(columns)) {
          listRows.group_by[key] = columns.map((col: string) => {
            if (!this.isUuid(col)) {
              return nameToUuid[col] || col;
            }
            return col;
          });
        }
      });
    }
  }

  private normalizeCreateRow(createRow: any, nameToUuid: Record<string, string>): void {
    Object.keys(createRow).forEach((key) => {
      const col = createRow[key];
      if (col?.column && !this.isUuid(col.column)) {
        const column_uuid = nameToUuid[col.column];
        if (column_uuid) {
          col.column = column_uuid;
        }
      }
    });
  }

  private normalizeUpdateRows(updateRows: any, nameToUuid: Record<string, string>): void {
    // Normalize columns
    if (updateRows.columns) {
      Object.keys(updateRows.columns).forEach((key) => {
        const col = updateRows.columns[key];
        if (col?.column && !this.isUuid(col.column)) {
          const column_uuid = nameToUuid[col.column];
          if (column_uuid) {
            col.column = column_uuid;
          }
        }
      });
    }

    // Normalize where_filters
    if (updateRows.where_filters) {
      Object.values(updateRows.where_filters).forEach((filter: any) => {
        if (filter?.column && !this.isUuid(filter.column)) {
          const column_uuid = nameToUuid[filter.column];
          if (column_uuid) {
            filter.column = column_uuid;
          }
        }
      });
    }
  }

  private normalizeDeleteRows(deleteRows: any, nameToUuid: Record<string, string>): void {
    // Normalize where_filters
    if (deleteRows.where_filters) {
      Object.values(deleteRows.where_filters).forEach((filter: any) => {
        if (filter?.column && !this.isUuid(filter.column)) {
          const column_uuid = nameToUuid[filter.column];
          if (column_uuid) {
            filter.column = column_uuid;
          }
        }
      });
    }
  }

  private normalizeBulkUpdateWithPrimaryKey(bulkUpdate: any, nameToUuid: Record<string, string>): void {
    if (bulkUpdate.primary_key && Array.isArray(bulkUpdate.primary_key)) {
      bulkUpdate.primary_key = bulkUpdate.primary_key.map((col: string) => {
        if (!this.isUuid(col)) {
          return nameToUuid[col] || col;
        }
        return col;
      });
    }
  }

  private normalizeBulkUpsertWithPrimaryKey(bulkUpsert: any, nameToUuid: Record<string, string>): void {
    if (bulkUpsert.primary_key && Array.isArray(bulkUpsert.primary_key)) {
      bulkUpsert.primary_key = bulkUpsert.primary_key.map((col: string) => {
        if (!this.isUuid(col)) {
          return nameToUuid[col] || col;
        }
        return col;
      });
    }
  }

  private async normalizeJoinTable(joinTable: any, organizationId: string): Promise<void> {
    const tableIds = new Set<string>();

    // Collect all table IDs
    if (joinTable.from?.name) {
      tableIds.add(joinTable.from.name);
    }

    (joinTable.joins || []).forEach((join: any) => {
      if (join.table) tableIds.add(join.table);
      (join.conditions?.conditionsList || []).forEach((cond: any) => {
        if (cond.leftField?.table) tableIds.add(cond.leftField.table);
        if (cond.rightField?.table) tableIds.add(cond.rightField.table);
      });
    });

    if (joinTable.conditions?.conditionsList) {
      joinTable.conditions.conditionsList.forEach((cond: any) => {
        if (cond.leftField?.table) tableIds.add(cond.leftField.table);
        if (cond.rightField?.table) tableIds.add(cond.rightField.table);
      });
    }

    if (joinTable.fields) {
      joinTable.fields.forEach((field: any) => {
        if (field.table) tableIds.add(field.table);
      });
    }

    if (joinTable.order_by) {
      joinTable.order_by.forEach((orderBy: any) => {
        if (orderBy.table) tableIds.add(orderBy.table);
      });
    }

    if (joinTable.aggregates) {
      Object.values(joinTable.aggregates).forEach((agg: any) => {
        if (agg?.table_id) tableIds.add(agg.table_id);
      });
    }

    if (joinTable.group_by) {
      Object.keys(joinTable.group_by).forEach((tableId) => {
        tableIds.add(tableId);
      });
    }

    // Build table maps
    const tableMaps: Record<string, Record<string, string>> = {};
    for (const tableId of Array.from(tableIds)) {
      tableMaps[tableId] = await this.getNameToUuidMap(tableId, organizationId);
    }

    // Normalize fields
    if (joinTable.fields) {
      joinTable.fields.forEach((field: any) => {
        if (field.table && field.name && !this.isUuid(field.name)) {
          const column_uuid = tableMaps[field.table]?.[field.name];
          if (column_uuid) {
            field.name = column_uuid;
          }
        }
      });
    }

    // Normalize join conditions
    (joinTable.joins || []).forEach((join: any) => {
      (join.conditions?.conditionsList || []).forEach((cond: any) => {
        if (cond.leftField?.table && cond.leftField?.columnName && !this.isUuid(cond.leftField.columnName)) {
          const left_column_uuid = tableMaps[cond.leftField.table]?.[cond.leftField.columnName];
          if (left_column_uuid) {
            cond.leftField.columnName = left_column_uuid;
          }
        }
        if (cond.rightField?.table && cond.rightField?.columnName && !this.isUuid(cond.rightField.columnName)) {
          const right_column_uuid = tableMaps[cond.rightField.table]?.[cond.rightField.columnName];
          if (right_column_uuid) {
            cond.rightField.columnName = right_column_uuid;
          }
        }
      });
    });

    // Normalize root-level conditions
    if (joinTable.conditions?.conditionsList) {
      joinTable.conditions.conditionsList.forEach((cond: any) => {
        if (cond.leftField?.table && cond.leftField?.columnName && !this.isUuid(cond.leftField.columnName)) {
          const left_column_uuid = tableMaps[cond.leftField.table]?.[cond.leftField.columnName];
          if (left_column_uuid) {
            cond.leftField.columnName = left_column_uuid;
          }
        }
        if (cond.rightField?.table && cond.rightField?.columnName && !this.isUuid(cond.rightField.columnName)) {
          const right_column_uuid = tableMaps[cond.rightField.table]?.[cond.rightField.columnName];
          if (right_column_uuid) {
            cond.rightField.columnName = right_column_uuid;
          }
        }
      });
    }

    // Normalize order_by
    if (joinTable.order_by) {
      joinTable.order_by.forEach((orderBy: any) => {
        if (orderBy.table && orderBy.columnName && !this.isUuid(orderBy.columnName)) {
          const column_uuid = tableMaps[orderBy.table]?.[orderBy.columnName];
          if (column_uuid) {
            orderBy.columnName = column_uuid;
          }
        }
      });
    }

    // Normalize aggregates
    if (joinTable.aggregates) {
      Object.values(joinTable.aggregates).forEach((agg: any) => {
        if (agg?.table_id && agg?.column && !this.isUuid(agg.column)) {
          const column_uuid = tableMaps[agg.table_id]?.[agg.column];
          if (column_uuid) {
            agg.column = column_uuid;
          }
        }
      });
    }

    // Normalize group_by
    if (joinTable.group_by) {
      Object.keys(joinTable.group_by).forEach((tableId) => {
        const columns = joinTable.group_by[tableId];
        if (Array.isArray(columns) && tableMaps[tableId]) {
          joinTable.group_by[tableId] = columns.map((col: string) => {
            if (!this.isUuid(col)) {
              return tableMaps[tableId][col] || col;
            }
            return col;
          });
        }
      });
    }
  }

  // Denormalization methods
  private denormalizeListRows(listRows: any, uuidToName: Record<string, string>): void {
    // Denormalize where_filters
    if (listRows.where_filters) {
      Object.values(listRows.where_filters).forEach((filter: any) => {
        if (filter?.column && this.isUuid(filter.column)) {
          filter.column = uuidToName[filter.column] || filter.column;
        }
      });
    }

    // Denormalize aggregates
    if (listRows.aggregates) {
      Object.values(listRows.aggregates).forEach((agg: any) => {
        if (agg?.column && this.isUuid(agg.column)) {
          agg.column = uuidToName[agg.column] || agg.column;
        }
      });
    }

    // Denormalize order_filters
    if (listRows.order_filters) {
      Object.values(listRows.order_filters).forEach((filter: any) => {
        if (filter?.column && this.isUuid(filter.column)) {
          filter.column = uuidToName[filter.column] || filter.column;
        }
      });
    }

    // Denormalize group_by
    if (listRows.group_by) {
      Object.keys(listRows.group_by).forEach((key) => {
        const columns = listRows.group_by[key];
        if (Array.isArray(columns)) {
          listRows.group_by[key] = columns.map((col: string) => {
            if (this.isUuid(col)) {
              return uuidToName[col] || col;
            }
            return col;
          });
        }
      });
    }
  }

  private denormalizeCreateRow(createRow: any, uuidToName: Record<string, string>): void {
    Object.keys(createRow).forEach((key) => {
      const col = createRow[key];
      if (col?.column && this.isUuid(col.column)) {
        col.column = uuidToName[col.column] || col.column;
      }
    });
  }

  private denormalizeUpdateRows(updateRows: any, uuidToName: Record<string, string>): void {
    // Denormalize columns
    if (updateRows.columns) {
      Object.keys(updateRows.columns).forEach((key) => {
        const col = updateRows.columns[key];
        if (col?.column && this.isUuid(col.column)) {
          col.column = uuidToName[col.column] || col.column;
        }
      });
    }

    // Denormalize where_filters
    if (updateRows.where_filters) {
      Object.values(updateRows.where_filters).forEach((filter: any) => {
        if (filter?.column && this.isUuid(filter.column)) {
          filter.column = uuidToName[filter.column] || filter.column;
        }
      });
    }
  }

  private denormalizeDeleteRows(deleteRows: any, uuidToName: Record<string, string>): void {
    // Denormalize where_filters
    if (deleteRows.where_filters) {
      Object.values(deleteRows.where_filters).forEach((filter: any) => {
        if (filter?.column && this.isUuid(filter.column)) {
          filter.column = uuidToName[filter.column] || filter.column;
        }
      });
    }
  }

  private denormalizeBulkUpdateWithPrimaryKey(bulkUpdate: any, uuidToName: Record<string, string>): void {
    if (bulkUpdate.primary_key && Array.isArray(bulkUpdate.primary_key)) {
      bulkUpdate.primary_key = bulkUpdate.primary_key.map((col: string) => {
        if (this.isUuid(col)) {
          return uuidToName[col] || col;
        }
        return col;
      });
    }
  }

  private denormalizeBulkUpsertWithPrimaryKey(bulkUpsert: any, uuidToName: Record<string, string>): void {
    if (bulkUpsert.primary_key && Array.isArray(bulkUpsert.primary_key)) {
      bulkUpsert.primary_key = bulkUpsert.primary_key.map((col: string) => {
        if (this.isUuid(col)) {
          return uuidToName[col] || col;
        }
        return col;
      });
    }
  }

  private async denormalizeJoinTable(joinTable: any, organizationId: string): Promise<void> {
    const tableIds = new Set<string>();

    // Collect all table IDs
    if (joinTable.from?.name) {
      tableIds.add(joinTable.from.name);
    }

    (joinTable.joins || []).forEach((join: any) => {
      if (join.table) tableIds.add(join.table);
      (join.conditions?.conditionsList || []).forEach((cond: any) => {
        if (cond.leftField?.table) tableIds.add(cond.leftField.table);
        if (cond.rightField?.table) tableIds.add(cond.rightField.table);
      });
    });

    if (joinTable.conditions?.conditionsList) {
      joinTable.conditions.conditionsList.forEach((cond: any) => {
        if (cond.leftField?.table) tableIds.add(cond.leftField.table);
        if (cond.rightField?.table) tableIds.add(cond.rightField.table);
      });
    }

    if (joinTable.fields) {
      joinTable.fields.forEach((field: any) => {
        if (field.table) tableIds.add(field.table);
      });
    }

    if (joinTable.order_by) {
      joinTable.order_by.forEach((orderBy: any) => {
        if (orderBy.table) tableIds.add(orderBy.table);
      });
    }

    if (joinTable.aggregates) {
      Object.values(joinTable.aggregates).forEach((agg: any) => {
        if (agg?.table_id) tableIds.add(agg.table_id);
      });
    }

    if (joinTable.group_by) {
      Object.keys(joinTable.group_by).forEach((tableId) => {
        tableIds.add(tableId);
      });
    }

    // Build table maps
    const tableMaps: Record<string, Record<string, string>> = {};
    for (const tableId of Array.from(tableIds)) {
      tableMaps[tableId] = await this.getUuidToNameMap(tableId, organizationId);
    }

    // Denormalize fields
    if (joinTable.fields) {
      joinTable.fields.forEach((field: any) => {
        if (field.table && field.name && this.isUuid(field.name)) {
          field.name = tableMaps[field.table]?.[field.name] || field.name;
        }
      });
    }

    // Denormalize join conditions
    (joinTable.joins || []).forEach((join: any) => {
      (join.conditions?.conditionsList || []).forEach((cond: any) => {
        if (cond.leftField?.table && cond.leftField?.columnName && this.isUuid(cond.leftField.columnName)) {
          cond.leftField.columnName = tableMaps[cond.leftField.table]?.[cond.leftField.columnName] || cond.leftField.columnName;
        }
        if (cond.rightField?.table && cond.rightField?.columnName && this.isUuid(cond.rightField.columnName)) {
          cond.rightField.columnName = tableMaps[cond.rightField.table]?.[cond.rightField.columnName] || cond.rightField.columnName;
        }
      });
    });

    // Denormalize root-level conditions
    if (joinTable.conditions?.conditionsList) {
      joinTable.conditions.conditionsList.forEach((cond: any) => {
        if (cond.leftField?.table && cond.leftField?.columnName && this.isUuid(cond.leftField.columnName)) {
          cond.leftField.columnName = tableMaps[cond.leftField.table]?.[cond.leftField.columnName] || cond.leftField.columnName;
        }
        if (cond.rightField?.table && cond.rightField?.columnName && this.isUuid(cond.rightField.columnName)) {
          cond.rightField.columnName = tableMaps[cond.rightField.table]?.[cond.rightField.columnName] || cond.rightField.columnName;
        }
      });
    }

    // Denormalize order_by
    if (joinTable.order_by) {
      joinTable.order_by.forEach((orderBy: any) => {
        if (orderBy.table && orderBy.columnName && this.isUuid(orderBy.columnName)) {
          orderBy.columnName = tableMaps[orderBy.table]?.[orderBy.columnName] || orderBy.columnName;
        }
      });
    }

    // Denormalize aggregates
    if (joinTable.aggregates) {
      Object.values(joinTable.aggregates).forEach((agg: any) => {
        if (agg?.table_id && agg?.column && this.isUuid(agg.column)) {
          agg.column = tableMaps[agg.table_id]?.[agg.column] || agg.column;
        }
      });
    }

    // Denormalize group_by
    if (joinTable.group_by) {
      Object.keys(joinTable.group_by).forEach((tableId) => {
        const columns = joinTable.group_by[tableId];
        if (Array.isArray(columns) && tableMaps[tableId]) {
          joinTable.group_by[tableId] = columns.map((col: string) => {
            if (this.isUuid(col)) {
              return tableMaps[tableId][col] || col;
            }
            return col;
          });
        }
      });
    }
  }
}