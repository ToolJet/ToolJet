import React, { useEffect, useState, useRef } from 'react';
import { isEqual } from 'lodash';
import iframeContent from './iframe.html';
import useStore from '@/AppBuilder/_stores/store';
import { shallow } from 'zustand/shallow';
import { useModuleContext } from '@/AppBuilder/_contexts/ModuleContext';

export const CustomComponent = (props) => {
  const { height, properties, styles, id, setExposedVariable, dataCy, componentName, currentMode } = props;
  const { moduleId } = useModuleContext();
  const onEvent = useStore((state) => state.eventsSlice.onEvent, shallow);
  const { visibility, boxShadow, borderColor, borderRadius } = styles;
  const { code, data } = properties;
  const [customProps, setCustomProps] = useState(data);
  const iFrameRef = useRef(null);
  const messageEventListenerRef = useRef(null);

  const customPropRef = useRef(data);
  // The data last published and sent to the frame. Kept here rather than read back from the store,
  // which inside a ListView holds one value per row
  const syncedDataRef = useRef();

  useEffect(() => {
    setCustomProps(data);
    customPropRef.current = data;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(data)]);

  useEffect(() => {
    if (!isEqual(syncedDataRef.current, customProps)) {
      syncedDataRef.current = customProps;
      setExposedVariable('data', customProps);
      sendMessageToIframe({ message: 'DATA_UPDATED' });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [customProps]);

  useEffect(() => {
    sendMessageToIframe({ message: 'CODE_UPDATED' });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code]);

  useEffect(() => {
    messageEventListenerRef.current = (e) => {
      try {
        // Only this component's own frame may drive it.
        // Every ListView row shares the id, and any other window on the page can forge the tag and id.
        const frameWindow = iFrameRef.current?.contentWindow;
        if (!frameWindow || e.source !== frameWindow) return;
        if (e.data.from === 'customComponent' && e.data.componentId === id) {
          if (e.data.message === 'UPDATE_DATA') {
            setCustomProps({ ...customPropRef.current, ...e.data.updatedObj });
          } else if (e.data.message === 'RUN_QUERY') {
            const options = {
              parameters: JSON.parse(e.data.parameters),
              queryName: e.data.queryName,
            };
            // requestId is used to correlate the response back to the correct runQuery call in the iframe
            const requestId = e.data.requestId;
            // Run the query and post the result back to the iframe
            // Result structure matches queries.queryName.run() — always resolves with { status, data, ... }
            onEvent('onTrigger', [], options, currentMode, moduleId)
              .then((result) => {
                if (iFrameRef.current?.contentWindow) {
                  iFrameRef.current.contentWindow.postMessage(
                    {
                      message: 'RUN_QUERY_RESPONSE',
                      componentId: id,
                      requestId,
                      queryResult: result,
                    },
                    '*'
                  );
                }
              })
              .catch((error) => {
                // Safety net for unexpected JS exceptions — queryPanel.runQuery normally always resolves
                if (iFrameRef.current?.contentWindow) {
                  iFrameRef.current.contentWindow.postMessage(
                    {
                      message: 'RUN_QUERY_RESPONSE',
                      componentId: id,
                      requestId,
                      queryResult: {
                        status: 'failed',
                        message: error?.message || 'Query execution failed',
                      },
                    },
                    '*'
                  );
                }
              });
          } else {
            sendMessageToIframe(e.data);
          }
        }
      } catch (err) {
        console.log(err);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    window.addEventListener('message', messageEventListenerRef.current);

    // Re-registering for a new mode or module only swaps the listener; the frame keeps running
    return () => {
      if (messageEventListenerRef.current) {
        window.removeEventListener('message', messageEventListenerRef.current);
        messageEventListenerRef.current = null;
      }
    };
  }, [id, onEvent, currentMode, moduleId]);

  // Tear the frame down on unmount only
  useEffect(() => {
    return () => {
      // Send cleanup message to iframe
      if (iFrameRef.current?.contentWindow) {
        try {
          iFrameRef.current.contentWindow.postMessage(
            {
              message: 'CLEANUP',
              componentId: id,
            },
            '*'
          );
        } catch (err) {
          console.log('Error during iframe cleanup:', err);
        }
      }
    };
  }, [id]);

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
    <div
      className="card"
      style={{
        '--cc-custom-component-border-color': borderColor,
        display: visibility ? '' : 'none',
        height,
        boxShadow,
        border: `1px solid var(--cc-custom-component-border-color) !important`,
        borderRadius: `${borderRadius}px`,
        overflow: 'clip',
        outline: 'none', // To override outline coming from card.scss
      }}
      data-cy={dataCy}
    >
      <iframe
        title={componentName}
        srcDoc={iframeContent}
        style={{ width: '100%', height: '100%', border: 'none' }}
        ref={iFrameRef}
        data-id={id}
      ></iframe>
    </div>
  );
};
