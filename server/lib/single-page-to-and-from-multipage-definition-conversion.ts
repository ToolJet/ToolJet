import { cloneDeep, omit } from 'lodash';
import { v4 as uuid } from 'uuid';

export function convertAppDefinitionFromSinglePageToMultiPage(appDefinition: any) {
  const components = cloneDeep(appDefinition.components);
  const newPageId = uuid();
  const handle = 'home';
  const name = 'Home';
  const newAppDefinition = omit(
    {
      homePageId: newPageId,
      pages: {
        [newPageId]: { name, handle, components },
      },
      ...appDefinition,
    },
    ['components']
  );
  return newAppDefinition;
}

export function convertAppDefinitionFromMultiPageToSinglePage(appDefinition: any) {
  const components = cloneDeep(Object.values(appDefinition?.pages ?? {})?.[0]?.['components'] ?? {});
  const newAppDefinition = omit(
    {
      components,
      ...appDefinition,
    },
    ['pages']
  );
  return newAppDefinition;
}
