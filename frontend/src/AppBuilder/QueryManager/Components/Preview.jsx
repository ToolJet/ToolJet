import React, { useEffect, useLayoutEffect, useRef, useState, useMemo } from 'react';
import { JSONTree } from 'react-json-tree';
import { Tab, ListGroup, Row, Col } from 'react-bootstrap';
import { getTheme, tabs } from '../constants';
import ArrowDownTriangle from '@/_ui/Icon/solidIcons/ArrowDownTriangle';
import { useEventListener } from '@/_hooks/use-event-listener';
import { reservedKeywordReplacer } from '@/_lib/reserved-keyword-replacer';
import useStore from '@/AppBuilder/_stores/store';
import { generateCypressDataCy } from '@/modules/common/helpers/cypressHelpers';
import { PREVIEW_PANEL } from '@/AppBuilder/panelLayout';

const Preview = ({ darkMode, calculatePreviewHeight }) => {
  const [key, setKey] = useState('raw');
  const [isJson, setIsJson] = useState(false);
  const [isDragging, setDragging] = useState(false);
  const [isTopOfPreviewPanel, setIsTopOfPreviewPanel] = useState(false);
  const storedHeight = useStore((state) => state.queryPanel.previewPanelHeight);
  const setPreviewPanelHeight = useStore((state) => state.queryPanel.setPreviewPanelHeight);
  const previewPanelExpanded = useStore((state) => state.queryPanel.previewPanelExpanded);
  const setPreviewPanelExpanded = useStore((state) => state.queryPanel.setPreviewPanelExpanded);
  const [height, setHeight] = useState(storedHeight);
  const [theme, setTheme] = useState(() => getTheme(darkMode));
  const queryPreviewData = useStore((state) => state.queryPanel.queryPreviewData);
  const previewLoading = useStore((state) => state.queryPanel.previewLoading);
  const previewPanelRef = useRef();
  const dragStartRef = useRef(null);

  // The preview docks at the bottom of the query panel and is sized against it.
  const getContainerHeight = () =>
    previewPanelRef.current?.closest(`.${PREVIEW_PANEL.containerClassName}`)?.clientHeight ?? 0;
  const getDefaultHeight = () => Math.round(getContainerHeight() * PREVIEW_PANEL.defaultRatio);
  const clampHeight = (value) => {
    const containerHeight = getContainerHeight();
    if (!containerHeight) return value;
    return Math.min(value, Math.max(PREVIEW_PANEL.minPx, containerHeight - PREVIEW_PANEL.reservedAbovePx));
  };

  useLayoutEffect(() => {
    const initialHeight = clampHeight(storedHeight || getDefaultHeight());
    setHeight(initialHeight);
    calculatePreviewHeight(initialHeight, previewPanelExpanded);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // The panel also opens from outside (running a preview from the query header), so the fields above
  // learn its size whenever it opens or closes, not only from its own toggle.
  const hasMountedRef = useRef(false);
  useEffect(() => {
    if (!hasMountedRef.current) {
      hasMountedRef.current = true;
      return;
    }
    calculatePreviewHeight(height, previewPanelExpanded);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [previewPanelExpanded]);

  useEffect(() => {
    setTheme(() => getTheme(darkMode));
  }, [darkMode]);

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

  // Drag state lives in refs: a quick drag can deliver mousedown, mousemove and mouseup before React
  // re-renders, and the window listeners only pick up a new handler after a render.
  const isOnTopEdgeRef = useRef(false);
  const heightRef = useRef(height);
  heightRef.current = height;

  const resize = (nextHeight) => {
    heightRef.current = nextHeight;
    setHeight(nextHeight);
  };

  const onMouseMove = (e) => {
    if (!previewPanelRef.current) return;
    const componentTop = Math.round(previewPanelRef.current.getBoundingClientRect().top);
    isOnTopEdgeRef.current = e.clientY >= componentTop - 12 && e.clientY <= componentTop + 1;
    setIsTopOfPreviewPanel(isOnTopEdgeRef.current);

    const dragStart = dragStartRef.current;
    if (!dragStart) return;
    const newHeight = dragStart.height + (dragStart.y - e.clientY);
    if (newHeight < PREVIEW_PANEL.minPx) {
      // Dragged shut: collapse, and reopen at the default size next time.
      dragStartRef.current = null;
      setDragging(false);
      const reopenHeight = clampHeight(getDefaultHeight());
      resize(reopenHeight);
      setPreviewPanelHeight(reopenHeight);
      setPreviewPanelExpanded(false);
      return;
    }
    resize(clampHeight(newHeight));
  };

  const onMouseUp = () => {
    if (!dragStartRef.current) return;
    dragStartRef.current = null;
    setDragging(false);
    setPreviewPanelHeight(heightRef.current);
    calculatePreviewHeight(heightRef.current, previewPanelExpanded);
  };

  // Listened for on the window: the grab zone reaches above the panel, over the fields, so the press
  // often lands on an element outside it.
  const onMouseDown = (e) => {
    if (!previewPanelExpanded || !isOnTopEdgeRef.current) return;
    e.preventDefault(); // no text selection while dragging
    dragStartRef.current = { y: e.clientY, height: heightRef.current };
    setDragging(true);
  };

  useEventListener('mousedown', onMouseDown);
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
      style={{
        cursor: previewPanelExpanded && (isDragging || isTopOfPreviewPanel) ? 'row-resize' : 'default',
        height: `${height}px`,
        ...(!previewPanelExpanded && { height: `${PREVIEW_PANEL.collapsedPx}px` }),
        ...(isDragging && {
          transition: 'none',
        }),
      }}
    >
      <div className="preview-toggle">
        <div
          onClick={() => {
            setPreviewPanelExpanded(!previewPanelExpanded);
          }}
          className="left"
          data-cy="preview-toggle-button"
        >
          <ArrowDownTriangle
            width={15}
            style={{
              transform: !previewPanelExpanded ? 'rotate(180deg)' : '',
              transition: 'transform 0.2s ease-in-out',
              marginRight: '4px',
            }}
          />
          <span data-cy="preview-section-label">Preview</span>
        </div>
        {previewPanelExpanded && (
          <div className="right" data-cy="preview-tabs-container">
            <Tab.Container activeKey={key} onSelect={(k) => setKey(k)} defaultActiveKey="raw">
              <Row className="m-0">
                <Col className="keys text-center d-flex align-items-center">
                  <ListGroup
                    className={`query-preview-list-group rounded ${darkMode ? 'dark' : ''}`}
                    variant="flush"
                    style={{ backgroundColor: '#ECEEF0', padding: '2px' }}
                    data-cy="preview-tabs-list"
                  >
                    {tabs.map((tab) => (
                      <ListGroup.Item
                        key={tab}
                        eventKey={tab.toLowerCase()}
                        disabled={!queryPreviewData || (tab == 'JSON' && !isJson)}
                        style={{ minWidth: '74px', textAlign: 'center' }}
                        className="rounded"
                        data-cy={`preview-tab-${generateCypressDataCy(tab)}-item`}
                      >
                        <span
                          data-cy={`preview-tab-${generateCypressDataCy(tab)}`}
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
      <div className="preview-content" data-cy="preview-content">
        <Tab.Container activeKey={key} onSelect={(k) => setKey(k)} defaultActiveKey="raw">
          <div className="position-relative h-100">
            {previewLoading && (
              <center
                style={{ display: 'grid', placeItems: 'center' }}
                className="position-absolute w-100 h-100"
                data-cy="preview-loading-container"
              >
                <div className="spinner-border text-azure" role="status" data-cy="preview-loading-spinner"></div>
              </center>
            )}
            <Tab.Content
              style={{
                overflowWrap: 'anywhere',
                padding: 0,
                border: '1px solid var(--slate5)',
                height: '100%',
              }}
              data-cy="preview-tab-content"
            >
              <Tab.Pane eventKey="json" transition={false} data-cy="preview-json-pane">
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
              <Tab.Pane eventKey="raw" transition={false} data-cy="preview-raw-pane">
                <div
                  style={{ padding: '1rem' }}
                  className={`raw-container preview-data-container`}
                  data-cy="preview-raw-data-container"
                >
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
