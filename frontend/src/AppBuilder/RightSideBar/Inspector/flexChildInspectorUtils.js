import React from 'react';
import { FlexChildLayoutPanel } from './Components/FlexChildLayoutPanel';

const ADDITIONAL_ACTIONS_TITLE_RE = /additional\s+actions?/i;

export const isAdditionalActionsAccordionTitle = (title) => {
  if (typeof title === 'string') {
    return ADDITIONAL_ACTIONS_TITLE_RE.test(title.trim());
  }
  return false;
};

export const buildFlexChildWidthAccordionItem = ({ selectedComponentId, allComponents, title = 'Width' }) => ({
  title,
  children: <FlexChildLayoutPanel selectedComponentId={selectedComponentId} allComponents={allComponents} />,
});

export const injectFlexChildWidthBeforeAdditionalActions = (items, flexChildItem) => {
  if (!flexChildItem || !Array.isArray(items)) return items;

  const additionalActionsIndex = items.findIndex((item) => isAdditionalActionsAccordionTitle(item?.title));
  if (additionalActionsIndex === -1) return items;

  const next = [...items];
  next.splice(additionalActionsIndex, 0, flexChildItem);
  return next;
};
