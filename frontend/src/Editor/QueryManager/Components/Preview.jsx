import React, { useEffect, useLayoutEffect, useRef, useState, useMemo } from 'react';
import { JSONTree } from 'react-json-tree';
import { Tab, ListGroup, Row, Col } from 'react-bootstrap';
import {
  usePreviewLoading,
  usePreviewData,
  usePreviewPanelExpanded,
  useQueryPanelStore,
  usePreviewPanelHeight,
  usePanelHeight,
} from '@/_stores/queryPanelStore';
import { getTheme, tabs } from '../constants';
import ArrowDownTriangle from '@/_ui/Icon/solidIcons/ArrowDownTriangle';
import { useEventListener } from '@/_hooks/use-event-listener';
import { reservedKeywordReplacer } from '@/_lib/reserved-keyword-replacer';

const Preview = ({ darkMode, calculatePreviewHeight }) => {
  const [key, setKey] = useState('raw');
  const [isJson, setIsJson] = useState(false);
  const [isDragging, setDragging] = useState(false);
  const [isTopOfPreviewPanel, setIsTopOfPreviewPanel] = useState(false);

  const storedHeight = usePreviewPanelHeight();
  // initialize height with stored height if present in state
  const heightSetOnce = useRef(!!storedHeight);
  const previewPanelExpanded = usePreviewPanelExpanded();
  const [height, setHeight] = useState(storedHeight);
  const [theme, setTheme] = useState(() => getTheme(darkMode));
  const queryPreviewData = usePreviewData();
  const previewLoading = usePreviewLoading();
  const previewPanelRef = useRef();
  const queryPanelHeight = usePanelHeight();

  useEffect(() => {
    calculatePreviewHeight(height, previewPanelExpanded);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    useQueryPanelStore.getState().actions.updatePreviewPanelHeight(height);
  }, [height]);

  useEffect(() => {
    setTheme(() => getTheme(darkMode));
  }, [darkMode]);

  useLayoutEffect(() => {
    if (queryPreviewData || previewLoading) {
      previewPanelRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
        inline: 'nearest',
      });
    }
  }, [queryPreviewData, previewLoading]);

  useEffect(() => {
    if (queryPreviewData !== null && typeof queryPreviewData === 'object') {
      setKey('json');
    } else {
      setKey('raw');
    }
    setIsJson(queryPreviewData !== null && typeof queryPreviewData === 'object');
  }, [queryPreviewData]);

  const renderRawData = () => {
    if (!queryPreviewData) {
      return queryPreviewData === null ? '' : `${queryPreviewData}`;
    } else {
      return isJson
        ? JSON.stringify(queryPreviewData, reservedKeywordReplacer).toString()
        : queryPreviewData.toString();
    }
  };

  useEffect(() => {
    // query panel collapse scenario
    if (queryPanelHeight === 95 || queryPanelHeight === 0) {
      return;
    }
    if (queryPanelHeight - 85 < 40) {
      setHeight(40);
      return;
    }
    if (queryPanelHeight - 85 < height) {
      setHeight((queryPanelHeight - 85) * 0.7);
    } else if (!heightSetOnce.current) {
      setHeight((queryPanelHeight - 85) * 0.7);
      heightSetOnce.current = true;
    }
  }, [queryPanelHeight]);

  const onMouseMove = (e) => {
    if (previewPanelRef.current) {
      const componentTop = Math.round(previewPanelRef.current.getBoundingClientRect().top);
      const clientY = e.clientY;
      if ((clientY >= componentTop - 12) & (clientY <= componentTop + 1)) {
        setIsTopOfPreviewPanel(true);
      } else if (isTopOfPreviewPanel) {
        setIsTopOfPreviewPanel(false);
      }

      if (isDragging) {
        const parentHeight = queryPanelHeight;
        const shift = componentTop - clientY;
        const currentHeight = previewPanelRef.current.offsetHeight;
        const newHeight = currentHeight + shift;
        if (newHeight < 50) {
          useQueryPanelStore.getState().actions.setPreviewPanelExpanded(false);

          setHeight((queryPanelHeight - 85) * 0.7);
          return;
        }
        if (newHeight > parentHeight - 95) {
          return;
        }
        setHeight(newHeight);
      }
    }
  };

  const onMouseUp = () => {
    setDragging(false);
    calculatePreviewHeight(height, previewPanelExpanded);
  };

  const onMouseDown = () => {
    isTopOfPreviewPanel && setDragging(true);
  };

  useEventListener('mousemove', onMouseMove);
  useEventListener('mouseup', onMouseUp);
  const queryPreviewDataWithCircularDependenciesRemoved = useMemo(() => {
    const stringifiedValue = JSON.stringify(queryPreviewData, reservedKeywordReplacer);

    return stringifiedValue ? JSON.parse(stringifiedValue) : undefined;
  }, [queryPreviewData]);

  return (
    <div
      className={`
        preview-header preview-section d-flex flex-column  align-items-baseline font-weight-500 ${
          previewPanelExpanded ? 'expanded' : ''
        }`}
      ref={previewPanelRef}
      onMouseDown={onMouseDown}
      style={{
        cursor: previewPanelExpanded && (isDragging || isTopOfPreviewPanel) ? 'row-resize' : 'default',
        height: `${height}px`,
        ...(!previewPanelExpanded && { height: '29px' }),
        ...(isDragging && {
          transition: 'none',
        }),
      }}
    >
      <div className="preview-toggle">
        <div
          onClick={() => {
            useQueryPanelStore.getState().actions.setPreviewPanelExpanded(!previewPanelExpanded);
            calculatePreviewHeight(height, !previewPanelExpanded);
          }}
          className="left"
        >
          <ArrowDownTriangle
            width={15}
            style={{
              transform: !previewPanelExpanded ? 'rotate(180deg)' : '',
              transition: 'transform 0.2s ease-in-out',
              marginRight: '4px',
            }}
          />
          <span>Preview</span>
        </div>
        {previewPanelExpanded && (
          <div className="right">
            <Tab.Container activeKey={key} onSelect={(k) => setKey(k)} defaultActiveKey="raw">
              <Row className="m-0">
                <Col className="keys text-center d-flex align-items-center">
                  <ListGroup
                    className={`query-preview-list-group rounded ${darkMode ? 'dark' : ''}`}
                    variant="flush"
                    style={{ backgroundColor: '#ECEEF0', padding: '2px' }}
                  >
                    {tabs.map((tab) => (
                      <ListGroup.Item
                        key={tab}
                        eventKey={tab.toLowerCase()}
                        disabled={!queryPreviewData || (tab == 'JSON' && !isJson)}
                        style={{ minWidth: '74px', textAlign: 'center' }}
                        className="rounded"
                      >
                        <span
                          data-cy={`preview-tab-${String(tab).toLowerCase()}`}
                          style={{ width: '100%' }}
                          className="rounded"
                        >
                          {tab}
                        </span>
                      </ListGroup.Item>
                    ))}
                  </ListGroup>
                </Col>
              </Row>
            </Tab.Container>
          </div>
        )}
      </div>
      <div className="preview-content">
        <Tab.Container activeKey={key} onSelect={(k) => setKey(k)} defaultActiveKey="raw">
          <div className="position-relative h-100">
            {previewLoading && (
              <center style={{ display: 'grid', placeItems: 'center' }} className="position-absolute w-100 h-100">
                <div className="spinner-border text-azure" role="status"></div>
              </center>
            )}
            <Tab.Content
              style={{
                overflowWrap: 'anywhere',
                padding: 0,
                border: '1px solid var(--slate5)',
                height: '100%',
              }}
            >
              <Tab.Pane eventKey="json" transition={false}>
                <div className="w-100 preview-data-container" data-cy="preview-json-data-container">
                  <JSONTree
                    theme={theme}
                    data={queryPreviewDataWithCircularDependenciesRemoved}
                    invertTheme={!darkMode}
                    collectionLimit={100}
                    hideRoot={true}
                  />
                </div>
              </Tab.Pane>
              <Tab.Pane eventKey="raw" transition={false}>
                <div className={`p-3 raw-container preview-data-container`} data-cy="preview-raw-data-container">
                  {renderRawData()}
                </div>
              </Tab.Pane>
            </Tab.Content>
          </div>
        </Tab.Container>
      </div>
    </div>
  );
};

export default Preview;
