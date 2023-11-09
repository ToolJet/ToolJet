import { useCallback } from 'react';
import { useStoreApi } from '@reactflow/core';

export const useToggleInteractivity = () => {
  const store = useStoreApi();
  const onToggleInteractivity = useCallback(() => {
    const { nodesDraggable, nodesConnectable, elementsSelectable } = store.getState();

    store.setState({
      nodesDraggable: !nodesDraggable,
      nodesConnectable: !nodesConnectable,
      elementsSelectable: !elementsSelectable,
    });
  }, [store]);

  return onToggleInteractivity;
};

export const generateQueryName = (kind, existingQueries) => {
  const queriesOfTheSameKind = existingQueries.filter((query) => query.kind === kind);

  let index = queriesOfTheSameKind.length + 1;
  while (existingQueries.map((query) => query.name).includes(`${kind}${index}`)) {
    index++;
  }

  return `${kind}${index}`;
};
