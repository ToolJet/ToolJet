/** @group platform */
import { EntityManager, FindOperator } from 'typeorm';
import { AppVersion } from '@entities/app_version.entity';
import { Page } from '@entities/page.entity';
import { Component } from '@entities/component.entity';
import { DataQuery } from '@entities/data_query.entity';
import { AppImportExportService } from '@modules/apps/services/app-import-export.service';

const sourceComponentId = '11111111-1111-4111-8111-111111111111';
const sourceQueryId = '22222222-2222-4222-8222-222222222222';
const componentId = '33333333-3333-4333-8333-333333333333';
const queryId = '44444444-4444-4444-8444-444444444444';
const sourcePageId = '66666666-6666-4666-8666-666666666666';
const pageId = '77777777-7777-4777-8777-777777777777';
const versionId = '88888888-8888-4888-8888-888888888888';

// Saved maps are keyed by variable name.
const definitions = (value: string): NonNullable<Page['variables']> => ({ result: { value, fxActive: false } });

async function importVariables(
  variables: Page['variables'],
  git: boolean,
  versionVariables: Page['variables'] = definitions(`{{components.${sourceComponentId}.value}}`)
) {
  const original = structuredClone(variables);
  const sourcePage = Object.assign(new Page(), { id: sourcePageId, variables: structuredClone(variables) });
  const importedPage = Object.assign(new Page(), { id: pageId, variables: structuredClone(variables) });
  const unrelatedPage = Object.assign(new Page(), { id: 'unrelated-page', variables: structuredClone(variables) });
  const pages = [sourcePage, importedPage, unrelatedPage];
  const component = Object.assign(new Component(), {
    id: componentId,
    properties: { text: { value: `{{queries.${sourceQueryId}.data}}` } },
  });
  const query = Object.assign(new DataQuery(), {
    id: queryId,
    options: { code: `{{components.${sourceComponentId}.value}}` },
  });
  const version = Object.assign(new AppVersion(), {
    id: versionId,
    globalSettings: { variables: structuredClone(versionVariables) },
  });
  const mapping: Parameters<AppImportExportService['updateEntityReferencesForImportedApp']>[1] = {
    componentsMapping: { [sourceComponentId]: componentId },
    dataQueryMapping: { [sourceQueryId]: queryId },
    pagesMapping: { [sourcePageId]: pageId },
    appVersionMapping: { 'source-version': versionId },
    defaultDataSourceIdMapping: {},
    appEnvironmentMapping: {},
    appDefaultEnvironmentMapping: {},
    dataSourceMapping: {},
    dataSourceOptionsMapping: {},
    layoutMapping: {},
    versionGitIdMapping: {},
  };
  const manager = {
    createQueryBuilder: (entity: unknown) => {
      const builder = {
        where: () => builder,
        select: () => builder,
        leftJoinAndSelect: () => builder,
        getMany: async () =>
          entity === Component
            ? [structuredClone(component)]
            : entity === DataQuery
              ? [structuredClone(query)]
              : entity === Page
                ? [{ id: pageId }]
                : [],
      };
      return builder;
    },
    find: async (entity: unknown, options: { where: { id: FindOperator<string[]> } }) => {
      const ids = options.where.id.value;
      return (entity === Page ? pages : [version])
        .filter((row) => ids.includes(row.id))
        .map((row) => structuredClone(row));
    },
    save: async (rows: Array<{ id: string }>) => {
      for (const row of rows)
        Object.assign(
          [component, query, ...pages].find((target) => target.id === row.id),
          row
        );
      return rows;
    },
    update: async (entity: unknown, criteria: { id: string }, changes: Partial<Page> | Partial<AppVersion>) => {
      Object.assign(entity === Page ? pages.find((p) => p.id === criteria.id) : version, changes);
    },
  } as unknown as EntityManager;
  const service = Object.create(AppImportExportService.prototype) as AppImportExportService;
  await service.updateEntityReferencesForImportedApp(manager, mapping, git);
  expect(sourcePage.variables).toEqual(original);
  expect(unrelatedPage.variables).toEqual(original);
  expect(component.properties.text.value).toBe(`{{queries.${queryId}.data}}`);
  expect(query.options.code).toBe(`{{components.${componentId}.value}}`);
  expect(version.globalSettings.variables).toEqual(definitions(`{{components.${componentId}.value}}`));
  if (git) expect(importedPage.co_relation_id).toBe(sourcePageId);
  return importedPage.variables;
}

describe.each([false, true])('AppImportExportService | page variables (git correlation ids: %s)', (git) => {
  // Break this catches: imports remap component/query/app expressions but leave page expressions on foreign ids.
  it.each([
    ['component', `{{'Hi ' + components.${sourceComponentId}.value}}`, `{{'Hi ' + components.${componentId}.value}}`],
    ['query', `{{queries.${sourceQueryId}.data?.value}}`, `{{queries.${queryId}.data?.value}}`],
    [
      'combined',
      `{{components.${sourceComponentId}.value + queries.${sourceQueryId}.data}}`,
      `{{components.${componentId}.value + queries.${queryId}.data}}`,
    ],
    [
      'bracket',
      `{{components['${sourceComponentId}'].value + queries['${sourceQueryId}'].data}}`,
      `{{components["${componentId}"].value + queries["${queryId}"].data}}`,
    ],
  ])('should remap %s references like other imported entities and keep name keys', async (_kind, value, expected) => {
    expect(await importVariables(definitions(value), git)).toEqual(definitions(expected));
  });

  it.each(['0', 'false', 'null', '', '{"name":"Ada"}', '{{variables.shared + page.variables.local}}'])(
    'should preserve values without imported entity references: %s',
    async (value) => {
      expect(await importVariables(definitions(value), git)).toEqual(definitions(value));
    }
  );
  it.each([null, {}])('should preserve pages without declarations (%j)', async (variables) => {
    expect(await importVariables(variables, git)).toEqual(variables);
  });
  it.each(['app', 'page'])('should reject ID-keyed %s maps rather than convert them', async (scope) => {
    const map = { old: { id: 'old', name: 'result', value: '1', fxActive: false } } as unknown as Page['variables'];
    await expect(importVariables(scope === 'page' ? map : {}, git, scope === 'app' ? map : {})).rejects.toThrow(
      'ID-keyed variable definitions are not supported'
    );
  });
});
