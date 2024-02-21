import { useCallback } from 'react';
import { useStoreApi } from '@reactflow/core';
import config from 'config';

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

export const copyClipboard = (Url) => {
  const tempInput = document.createElement('input');
  tempInput.value = Url;
  document.body.appendChild(tempInput);
  tempInput.select();
  document.execCommand('copy');
  document.body.removeChild(tempInput);
};

export const getServerUrl = () => {
  const SERVER_URL = config.TOOLJET_SERVER_URL || window.public_config?.TOOLJET_HOST;
  const apiUrl = config.apiUrl;
  try {
    new URL(apiUrl);
    return apiUrl;
  } catch (error) {
    return `${SERVER_URL}${apiUrl}`;
  }
};
