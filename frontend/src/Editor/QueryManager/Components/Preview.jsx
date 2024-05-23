import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { JSONTree } from 'react-json-tree';
import { Tab, ListGroup, Row, Col } from 'react-bootstrap';
import { usePreviewLoading, usePreviewData, usePreviewPanelExpanded } from '@/_stores/queryPanelStore';
import { getTheme, tabs } from '../constants';
import ArrowDownTriangle from '@/_ui/Icon/solidIcons/ArrowDownTriangle';

const Preview = ({ darkMode }) => {
  const [key, setKey] = useState('raw');
  const [isJson, setIsJson] = useState(false);
  const [theme, setTheme] = useState(() => getTheme(darkMode));
  const queryPreviewData = usePreviewData();
  const previewLoading = usePreviewLoading();
  const previewPanelRef = useRef();
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
      return isJson ? JSON.stringify(queryPreviewData).toString() : queryPreviewData.toString();
    }
  };
  const [previewPanelExpanded, setPreviewPanelExpanded] = usePreviewPanelExpanded();
  return (
    <div
      className={`
        preview-header preview-section d-flex flex-column  align-items-baseline font-weight-500 ${
          previewPanelExpanded ? 'expanded' : ''
        }`}
      ref={previewPanelRef}
    >
      <div className="preview-toggle">
        <div
          onClick={() => {
            setPreviewPanelExpanded(!previewPanelExpanded);
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
              }}
            >
              <Tab.Pane eventKey="json" transition={false}>
                <div className="w-100 preview-data-container" data-cy="preview-json-data-container">
                  <JSONTree theme={theme} data={queryPreviewData} invertTheme={!darkMode} collectionLimit={100} />
                </div>
              </Tab.Pane>
              <Tab.Pane eventKey="raw" transition={false}>
                <div className={`p-3 h-100 raw-container preview-data-container`} data-cy="preview-raw-data-container">
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
