import { readFileSync } from 'fs';
import * as path from 'path';
import { TemplatesService } from '../../../../src/modules/templates/service';

type TemplateTable = {
  id: string;
  table_name: string;
  schema: { foreign_keys?: Array<{ referenced_table_id: string }> };
};
type TemplateDefinition = {
  tooljet_database: TemplateTable[];
  app: Array<{ definition: { appV2: { dataQueries: Array<{ options?: { table_id?: unknown } }> } } }>;
};

class TestableTemplatesService extends TemplatesService {
  constructor() {
    super(
      null as unknown as never,
      null as unknown as never,
      null as unknown as never,
      null as unknown as never,
      null as unknown as never,
      null as unknown as never
    );
  }
  public exposeWithFreshTableIds<T extends { tooljet_database?: Array<{ id?: string }> }>(templateDefinition: T): T {
    return this.withFreshTableIds(templateDefinition);
  }
}

const loadTemplate = (identifier: string): TemplateDefinition =>
  JSON.parse(readFileSync(path.join(__dirname, '../../../../templates', identifier, 'definition.json'), 'utf-8'));

const tableIds = (definition: TemplateDefinition): string[] => definition.tooljet_database.map((table) => table.id);

const queryTableIds = (definition: TemplateDefinition): string[] =>
  definition.app[0].definition.appV2.dataQueries
    .map((query) => query.options?.table_id)
    .filter((tableId): tableId is string => typeof tableId === 'string');

/** @group platform */
describe('TemplatesService.withFreshTableIds', () => {
  let service: TestableTemplatesService;

  beforeEach(() => {
    service = new TestableTemplatesService();
  });

  // Template table ids become each table's co_relation_id on import, so reusing them made a second app from the same
  // template attach to the first app's tables and fail to seed them again.
  it('gives the tables different ids on every import', () => {
    const template = loadTemplate('backup-restore-testing');
    const first = tableIds(service.exposeWithFreshTableIds(template));
    const second = tableIds(service.exposeWithFreshTableIds(template));

    expect(first).toHaveLength(tableIds(template).length);
    first.forEach((id, index) => {
      expect(id).not.toBe(tableIds(template)[index]);
      expect(id).not.toBe(second[index]);
    });
  });

  it('points queries and foreign keys at the new table ids and leaves no template table id behind', () => {
    const template = loadTemplate('backup-restore-testing');
    const result = service.exposeWithFreshTableIds(template);
    const newIdByOldId = Object.fromEntries(tableIds(template).map((id, index) => [id, tableIds(result)[index]]));

    expect(queryTableIds(result)).toEqual(queryTableIds(template).map((tableId) => newIdByOldId[tableId]));

    template.tooljet_database.forEach((table, tableIndex) =>
      (table.schema.foreign_keys ?? []).forEach((foreignKey, keyIndex) =>
        expect(result.tooljet_database[tableIndex].schema.foreign_keys[keyIndex].referenced_table_id).toBe(
          newIdByOldId[foreignKey.referenced_table_id]
        )
      )
    );

    const serialised = JSON.stringify(result);
    tableIds(template).forEach((oldId) => expect(serialised).not.toContain(oldId));
  });

  it('keeps table names and does not modify the template definition', () => {
    const template = loadTemplate('backup-restore-testing');
    const original = JSON.stringify(template);
    const result = service.exposeWithFreshTableIds(template);

    expect(result.tooljet_database.map((table) => table.table_name)).toEqual(
      template.tooljet_database.map((table) => table.table_name)
    );
    expect(JSON.stringify(template)).toBe(original);
  });

  it('returns definitions without ToolJet DB tables unchanged', () => {
    const definition = { tooljet_version: '3.0.0' };
    expect(service.exposeWithFreshTableIds(definition)).toBe(definition);
  });
});
