import React from 'react';
import { FlexChildLayoutPanel } from './FlexChildLayoutPanel';
import { ADDITIONAL_ACTIONS_ACCORDION_ID } from '../../inspectorConstants';
import { resolveReferences } from '@/_helpers/utils';

const FLEX_AXIS_ICONS = {
  row: {
    justifyContent: [
      'align-horizontal-justify-start',
      'align-horizontal-justify-center',
      'align-horizontal-justify-end',
    ],
    alignItems: ['align-vertical-justify-start', 'align-vertical-justify-center', 'align-vertical-justify-end'],
  },
  column: {
    justifyContent: ['align-vertical-justify-start', 'align-vertical-justify-center', 'align-vertical-justify-end'],
    alignItems: ['align-horizontal-justify-start', 'align-horizontal-justify-center', 'align-horizontal-justify-end'],
  },
};

export function getFlexAxisAwareMeta(paramMeta, component, paramName) {
  if (paramName !== 'justifyContent' && paramName !== 'alignItems') return paramMeta;
  if (!Array.isArray(paramMeta?.options)) return paramMeta;

  const rawDirection = component?.component?.definition?.properties?.direction?.value;
  const resolved = resolveReferences(rawDirection);
  const direction = resolved === 'column' ? 'column' : 'row';
  const iconNames = FLEX_AXIS_ICONS[direction][paramName];

  const nextOptions = paramMeta.options.map((option, index) => ({
    ...option,
    lucideIconName: iconNames[index] ?? option.lucideIconName,
  }));
  return { ...paramMeta, options: nextOptions };
}

export const buildFlexChildWidthAccordionItem = ({ selectedComponentId, allComponents, title = 'Width' }) => ({
  title,
  children: <FlexChildLayoutPanel selectedComponentId={selectedComponentId} allComponents={allComponents} />,
});

export const injectFlexChildWidthBeforeAdditionalActions = (items, flexChildItem) => {
  if (!flexChildItem || !Array.isArray(items)) return items;

  const additionalActionsIndex = items.findIndex((item) => item?.id === ADDITIONAL_ACTIONS_ACCORDION_ID);
  if (additionalActionsIndex === -1) return items;

  const next = [...items];
  next.splice(additionalActionsIndex, 0, flexChildItem);
  return next;
};
