import { cloneDeep } from 'lodash';
import { merge } from 'lodash';
import { mergeWith } from 'lodash';
import { isArray } from 'lodash';
import { componentTypes } from './widget-config';

export enum LayoutDimensionUnits {
  COUNT = 'count',
  PERCENT = 'percent',
}

export const resolveGridPositionForComponent = (dimension: number, type: string) => {
  // const numberOfGrids = type === 'desktop' ? 43 : 12;
  const numberOfGrids = 43;
  return Math.round((dimension * numberOfGrids) / 100);
};

export const mergeDefaultComponentData = (pages) => {
  return pages.map((page) => ({
    ...page,
    components: buildComponentMetaDefinition(page.components),
  }));
};

export const buildComponentMetaDefinition = (components = {}) => {
  for (const componentId in components) {
    const currentComponentData = components[componentId];

    const componentMeta = cloneDeep(
      componentTypes.find((comp) => currentComponentData.component.component === comp.component)
    );

    const mergedDefinition = {
      // ...componentMeta.definition,
      properties: mergeWith(
        componentMeta.definition.properties,
        currentComponentData?.component?.definition?.properties,
        (objValue, srcValue) => {
          if (['Table'].includes(currentComponentData?.component?.component) && isArray(objValue)) {
            return srcValue;
          } else if (
            ['DropdownV2', 'MultiselectV2'].includes(currentComponentData?.component?.component) &&
            isArray(objValue)
          ) {
            return isArray(srcValue) ? srcValue : Object.values(srcValue);
          }
        }
      ),
      styles: merge(componentMeta.definition.styles, currentComponentData?.component.definition.styles),
      generalStyles: merge(
        componentMeta.definition.generalStyles,
        currentComponentData?.component.definition.generalStyles
      ),
      validation: merge(componentMeta.definition.validation, currentComponentData?.component.definition.validation),
      others: merge(componentMeta.definition.others, currentComponentData?.component.definition.others),
      general: merge(componentMeta.definition.general, currentComponentData?.component.definition.general),
    };

    const mergedComponent = {
      component: {
        ...componentMeta,
        ...currentComponentData.component,
      },
      layouts: {
        ...currentComponentData.layouts,
      },
      withDefaultChildren: componentMeta.withDefaultChildren ?? false,
    };

    mergedComponent.component.definition = mergedDefinition;

    components[componentId] = mergedComponent;
  }

  return components;
};
