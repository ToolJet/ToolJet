import React, { useEffect, useState, useRef } from 'react';
import { isEqual } from 'lodash';
import iframeContent from './iframe.html';
import useStore from '@/AppBuilder/_stores/store';
import { shallow } from 'zustand/shallow';

export const CustomComponent = (props) => {
  const { height, properties, styles, id, setExposedVariable, dataCy } = props;
  const exposedVariables = useStore((state) => state.getExposedValueOfComponent(id), shallow);
  const onEvent = useStore((state) => state.eventsSlice.onEvent, shallow);
  const { visibility, boxShadow } = styles;
  const { code, data } = properties;
  const [customProps, setCustomProps] = useState(data);
  const iFrameRef = useRef(null);

  const customPropRef = useRef(data);

  useEffect(() => {
    setCustomProps(data);
    customPropRef.current = data;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(data)]);

  useEffect(() => {
    if (!isEqual(exposedVariables.data, customProps)) {
      setExposedVariable('data', customProps);
      sendMessageToIframe({ message: 'DATA_UPDATED' });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [customProps, exposedVariables.data]);

  useEffect(() => {
    sendMessageToIframe({ message: 'CODE_UPDATED' });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code]);

  useEffect(() => {
    window.addEventListener('message', (e) => {
      try {
        if (e.data.from === 'customComponent' && e.data.componentId === id) {
          if (e.data.message === 'UPDATE_DATA') {
            setCustomProps({ ...customPropRef.current, ...e.data.updatedObj });
          } else if (e.data.message === 'RUN_QUERY') {
            const options = {
              parameters: JSON.parse(e.data.parameters),
              queryName: e.data.queryName,
            };
            onEvent('onTrigger', [], options);
          } else {
            sendMessageToIframe(e.data);
          }
        }
      } catch (err) {
        console.log(err);
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const sendMessageToIframe = ({ message }) => {
    if (!iFrameRef.current) return;
    switch (message) {
      case 'INIT':
        return iFrameRef.current.contentWindow.postMessage(
          {
            message: 'INIT_RESPONSE',
            componentId: id,
            data: customPropRef.current,
            code: code,
          },
          '*'
        );
      case 'CODE_UPDATED':
        return iFrameRef.current.contentWindow.postMessage(
          {
            message: 'CODE_UPDATED',
            componentId: id,
            data: customProps,
            code: code,
          },
          '*'
        );
      case 'DATA_UPDATED':
        return iFrameRef.current.contentWindow.postMessage(
          {
            message: 'DATA_UPDATED',
            componentId: id,
            data: customProps,
          },
          '*'
        );
      default:
        return;
    }
  };

  return (
    <div className="card" style={{ display: visibility ? '' : 'none', height, boxShadow }} data-cy={dataCy}>
      <iframe
        srcDoc={iframeContent}
        style={{ width: '100%', height: '100%', border: 'none' }}
        ref={iFrameRef}
        data-id={id}
      ></iframe>
    </div>
  );
};
