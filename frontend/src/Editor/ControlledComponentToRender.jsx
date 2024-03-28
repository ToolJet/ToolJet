import React from 'react';
import { getComponentToRender } from '@/_helpers/editorHelpers';
import _ from 'lodash';
// eslint-disable-next-line import/no-unresolved
import { diff } from 'deep-object-diff';
import { getCurrentState, useCurrentStateStore } from '@/_stores/currentStateStore';
import useRenderCount from '@/_hooks/useRenderCount';
import { flushComponentsToRender, getComponentsToRenders } from '@/_stores/editorStore';

function deepEqualityCheckusingLoDash(obj1, obj2) {
  return _.isEqual(obj1, obj2);
}

export const shouldUpdate = (prevProps, nextProps) => {
  // const { queries } = getCurrentState();
  // const currentStateChanged = _.isEmpty(diff(prevProps?.currentState?.queries, queries));

  const listToRender = getComponentsToRenders();

  let needToRender = false;

  // console.log('---tooljetcr---piku', {
  //   x: prevProps?.id,
  //   listToRender,
  // });

  const componentId = prevProps?.id === nextProps?.id ? prevProps?.id : null;

  if (componentId) {
    const componentToRender = listToRender.find((item) => item === componentId);
    if (componentToRender) {
      needToRender = true;
      setTimeout(() => {
        flushComponentsToRender();
      }, 300);
    }
  }

  console.log('---tooljetcr---piku', {
    x: prevProps?.id,
    listToRender,
    needToRender,
    componentId,
  });

  return (
    deepEqualityCheckusingLoDash(prevProps?.id, nextProps?.id) &&
    deepEqualityCheckusingLoDash(prevProps?.component?.definition, nextProps?.component?.definition) &&
    prevProps?.width === nextProps?.width &&
    prevProps?.height === nextProps?.height &&
    !needToRender
  );
};

const ComponentWrapper = React.memo(({ componentName, ...props }) => {
  const ComponentToRender = getComponentToRender(componentName);

  // Render the component with the passed props
  return <ComponentToRender {...props} />;
}, shouldUpdate);

export default ComponentWrapper;
