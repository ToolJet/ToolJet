import React, { useMemo } from 'react';
import Accordion from '@/_ui/Accordion';
import { useFlexChildInspectorContext } from './Components/FlexContainer/FlexChildInspectorContext';
import {
  buildFlexChildWidthAccordionItem,
  injectFlexChildWidthBeforeAdditionalActions,
} from './Components/FlexContainer/flexChildInspectorUtils';

const InspectorAccordion = ({ items, ...rest }) => {
  const flexChildContext = useFlexChildInspectorContext();

  const resolvedItems = useMemo(() => {
    if (!flexChildContext?.isFlexContainerChild) return items;

    const flexChildItem = buildFlexChildWidthAccordionItem(flexChildContext);
    return injectFlexChildWidthBeforeAdditionalActions(items, flexChildItem);
  }, [items, flexChildContext]);

  return <Accordion items={resolvedItems} {...rest} />;
};

export default InspectorAccordion;
