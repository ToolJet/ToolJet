/** @group platform */
import { EntityManager } from 'typeorm';
import { AppVersion } from '@entities/app_version.entity';
import { Page } from '@entities/page.entity';
import { VersionsCreateService } from '@modules/versions/services/create.service';

const componentId = '11111111-1111-4111-8111-111111111111';
const otherComponentId = '22222222-2222-4222-8222-222222222222';
const queryId = '33333333-3333-4333-8333-333333333333';
const newComponentId = '44444444-4444-4444-8444-444444444444';
const newOtherComponentId = '55555555-5555-4555-8555-555555555555';
const newQueryId = '66666666-6666-4666-8666-666666666666';
const variableId = '77777777-7777-4777-8777-777777777777';
const appVariableId = '88888888-8888-4888-8888-888888888888';
const sourcePageId = '99999999-9999-4999-8999-999999999999';
const copiedPageId = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';

// Other copy stages are independent of this orchestration's reference rewriting.
class CopyService extends VersionsCreateService {
  constructor() {
    super(...([null, null, null, null, null] as unknown as ConstructorParameters<typeof VersionsCreateService>));
  }
  protected async createNewDataSourcesAndQueriesForVersion() {
    return { [queryId]: newQueryId };
  }
  protected async createNewPagesAndComponentsForVersion() {
    return {
      oldComponentToNewComponentMapping: { [componentId]: newComponentId, [otherComponentId]: newOtherComponentId },
      oldPageToNewPageMapping: { [sourcePageId]: copiedPageId },
    };
  }
  protected async updateEventActionsForNewVersionWithNewMappingIds() {}
}

async function copy(variables: Page['variables']) {
  const original = structuredClone(variables);
  const sourceVersion = Object.assign(new AppVersion(), {
    id: 'source-version',
    globalSettings: {
      variables: {
        [appVariableId]: { id: appVariableId, name: 'comparison', value: `{{components.${componentId}.value}}` },
      },
    },
  });
  const version = Object.assign(new AppVersion(), { id: 'copied-version', appId: 'app-1' });
  const sourcePage = Object.assign(new Page(), { id: sourcePageId, appVersionId: sourceVersion.id, variables });
  const copiedPage = Object.assign(new Page(), {
    id: copiedPageId,
    appVersionId: version.id,
    variables: structuredClone(variables),
  });
  const unrelatedPage = Object.assign(new Page(), {
    id: 'unrelated-page',
    appVersionId: 'other-version',
    variables: structuredClone(variables),
  });
  const pages = [sourcePage, copiedPage, unrelatedPage];
  const builder = { where: () => builder, select: () => builder, getMany: async () => [] };
  const manager = {
    save: async () => version,
    createQueryBuilder: () => builder,
    findOne: async () => null,
    find: async (_entity: unknown, options: { where: { appVersionId: string } }) =>
      pages.filter((p) => p.appVersionId === options.where.appVersionId).map((p) => structuredClone(p)),
    update: async (entity: unknown, criteria: { id: string }, changes: Partial<Page> | Partial<AppVersion>) => {
      if (entity === Page)
        Object.assign(
          pages.find((p) => p.id === criteria.id),
          changes
        );
      if (entity === AppVersion) Object.assign(version, changes);
    },
  } as unknown as EntityManager;

  await new CopyService().setupNewVersion(version, sourceVersion, 'workspace-1', manager);
  expect(sourcePage.variables).toEqual(original);
  expect(unrelatedPage.variables).toEqual(original);
  expect(version.globalSettings.variables[appVariableId].value).toBe(`{{components.${newComponentId}.value}}`);
  return copiedPage.variables;
}

const definitions = (value: string): NonNullable<Page['variables']> => ({
  [variableId]: { id: variableId, name: 'result', value, fxActive: false },
});

describe('VersionsCreateService | copied page variables', () => {
  // Break this catches: only global settings are remapped, leaving page references on the source version.
  it.each([
    ['component', `{{'Hi ' + components.${componentId}.value}}`, `{{'Hi ' + components.${newComponentId}.value}}`],
    ['query', `{{queries.${queryId}.data?.value}}`, `{{queries.${newQueryId}.data?.value}}`],
    [
      'cross-page component and query',
      `{{components.${otherComponentId}.value + queries.${queryId}.data}}`,
      `{{components.${newOtherComponentId}.value + queries.${newQueryId}.data}}`,
    ],
    [
      'bracket references',
      `{{components['${componentId}'].value + queries['${queryId}'].data}}`,
      `{{components["${newComponentId}"].value + queries["${newQueryId}"].data}}`,
    ],
  ])('should remap %s references while preserving definition ids and the source', async (_kind, value, expected) => {
    expect(await copy(definitions(value))).toEqual(definitions(expected));
  });

  it.each(['0', 'false', 'null', '', '{"name":"Ada"}', '{{variables.shared + page.variables.local}}'])(
    'should preserve a value without component or query references: %s',
    async (value) => {
      expect(await copy(definitions(value))).toEqual(definitions(value));
    }
  );

  it.each([null, {}])('should preserve pages without declarations (%j)', async (variables) => {
    expect(await copy(variables)).toEqual(variables);
  });
});
