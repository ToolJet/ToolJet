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
    'components'
  );
  return newAppDefinition;
}
