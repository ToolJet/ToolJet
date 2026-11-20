/** @group database */
import { getMetadataArgsStorage } from 'typeorm';
import { InternalTable } from 'src/entities/internal_table.entity';
import { InternalTableRelation } from 'src/entities/internal_table_relation.entity';

// internal_tables.configurations stays in the database until the previous release stops reading it,
// but it is no longer kept up to date. Table configurations live on internal_table_relations.
const mappedColumns = (target: object) =>
  getMetadataArgsStorage()
    .columns.filter((column) => column.target === target)
    .map((column) => column.options.name ?? column.propertyName);

describe('Table configurations | storage', () => {
  it('should not map the stale internal_tables.configurations column', () => {
    expect(mappedColumns(InternalTable)).not.toContain('configurations');
  });

  it('should map configurations on internal_table_relations', () => {
    expect(mappedColumns(InternalTableRelation)).toContain('configurations');
  });
});
