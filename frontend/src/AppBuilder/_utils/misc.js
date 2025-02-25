import { resolveReferences } from '@/_helpers/utils';
import _ from 'lodash';
import { toast } from 'react-hot-toast';

export const navigate = (url, options = {}) => {
  const cleanUrl = url.replace(/\?$/, '');

  const normalizedUrl = cleanUrl.startsWith('/') ? cleanUrl : `/${cleanUrl}`;

  history.pushState(options.state || null, '', normalizedUrl);
  window.dispatchEvent(
    new CustomEvent('navigation', {
      detail: { url: normalizedUrl, options },
    })
  );
};

export const setPageStateOnLoad = (pageId, pageHandle) => {
  // function to set page id and handle in the url state on first load
  const currentState = history.state || {};
  if (currentState.isSwitchingPage) return;

  const newState = { ...currentState, id: pageId, handle: pageHandle };
  history.replaceState(newState, '', window.location.href);
};

export async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard!');
  } catch (err) {
    console.log('Failed to copy!', err);
  }
}

export const extractEnvironmentConstantsFromConstantsList = (constantsList = [], environmentName = 'development') => {
  try {
    return constantsList.map((constant) => {
      if (constant.values && Array.isArray(constant.values)) {
        const { value } = constant.values.find((value) => value.environmentName === environmentName);
        return {
          id: constant.id,
          name: constant.name,
          value,
          type: constant.type,
        };
      } else {
        return constant;
      }
    });
  } catch (error) {
    return [];
  }
};

export function setTablePageIndex(tableId, index) {
  if (_.isEmpty(tableId)) {
    console.log('No table is associated with this event.');
    return Promise.resolve();
  }

  //   const table = Object.entries(getCurrentState().components).filter((entry) => entry?.[1]?.id === tableId)?.[0]?.[1];
  const table = [];
  const newPageIndex = resolveReferences(index);
  table.setPage(newPageIndex ?? 1);
  return Promise.resolve();
}
