import { cloneDeep, omit } from 'lodash';
import { randomUUID } from 'crypto';

export function convertAppDefinitionFromSinglePageToMultiPage(appDefinition: any) {
  const components = cloneDeep(appDefinition?.components ?? {});
  const newPageId = randomUUID();
  const handle = 'home';
  const name = 'Home';
  const newAppDefinition = omit(
    {
      ...appDefinition,
      homePageId: newPageId,
      pages: {
        [newPageId]: { name, handle, components },
      },
      showViewerNavigation: false,
    },
    ['components']
  );
  return newAppDefinition;
}

export function convertAppDefinitionFromMultiPageToSinglePage(appDefinition: any) {
  const components = cloneDeep(Object.values(appDefinition?.pages ?? {})?.[0]?.['components'] ?? {});
  const newAppDefinition = omit(
    {
      ...appDefinition,
      components,
    },
    ['pages']
  );
  return newAppDefinition;
}
