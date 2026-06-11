import React from 'react';
import { FlexChildLayoutPanel } from './Components/FlexChildLayoutPanel';

export const ADDITIONAL_ACTIONS_ACCORDION_ID = 'additional-actions';

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
