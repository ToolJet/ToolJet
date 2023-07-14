import React, { useEffect, useState, useRef } from 'react';
import { isEqual } from 'lodash';
import iframeContent from './iframe.html';

import { useDataQueries } from '@/_stores/dataQueriesStore';

export const CustomComponent = (props) => {
  const dataQueries = useDataQueries();
  const { height, properties, styles, id, setExposedVariable, exposedVariables, fireEvent, dataCy } = props;
  const { visibility, boxShadow } = styles;
  const { code, data } = properties;
  const [customProps, setCustomProps] = useState(data);
  const iFrameRef = useRef(null);
  const dataQueryRef = useRef(dataQueries);
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
  }, [setExposedVariable, customProps, exposedVariables.data]);

  useEffect(() => {
    sendMessageToIframe({ message: 'CODE_UPDATED' });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code]);

  useEffect(() => {
    dataQueryRef.current = dataQueries;
  }, [dataQueries]);

  useEffect(() => {
    window.addEventListener('message', (e) => {
      try {
        if (e.data.from === 'customComponent' && e.data.componentId === id) {
          if (e.data.message === 'UPDATE_DATA') {
            setCustomProps({ ...customPropRef.current, ...e.data.updatedObj });
          } else if (e.data.message === 'RUN_QUERY') {
            const filteredQuery = dataQueryRef.current.filter((query) => query.name === e.data.queryName);
            const queryArgs = e.data.queryArgs ? JSON.parse(e.data.queryArgs) : {};
            filteredQuery.length === 1 &&
              fireEvent('onTrigger', {
                queryId: filteredQuery[0].id,
                queryName: filteredQuery[0].name,
                arguments: queryArgs,
              });
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
            data: customProps,
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
