import React, { useEffect } from 'react';
import { JSONTree } from 'react-json-tree';
import { Tab, ListGroup, Row } from 'react-bootstrap';
import { useTranslation } from 'react-i18next';
const Preview = ({ previewPanelRef, previewLoading, queryPreviewData, theme, darkMode }) => {
  const { t } = useTranslation();
  const [key, setKey] = React.useState('raw');
  const [isJson, setIsJson] = React.useState(false);
  const tabs = ['Json', 'Raw'];

  useEffect(() => {
    if (typeof queryPreviewData === 'object') {
      setKey('json');
    } else {
      setKey('raw');
    }
    setIsJson(typeof queryPreviewData === 'object');
  }, [queryPreviewData]);

  const renderRawData = () => {
    if (queryPreviewData) {
      return isJson ? JSON.stringify(queryPreviewData).toString() : queryPreviewData.toString();
    }
    return '';
  };

  return (
    <div>
      <div className="row preview-header border-top" ref={previewPanelRef}>
        <div className="py-2" style={{ fontWeight: 600 }} data-cy={`header-query-preview`}>
          {t('editor.preview', 'Preview')}
        </div>
      </div>
      <Tab.Container activeKey={key} onSelect={(k) => setKey(k)} defaultActiveKey="raw">
        <Row>
          <div className="keys">
            <ListGroup className={`query-preview-list-group ${darkMode ? 'dark' : ''}`} variant="flush">
              {tabs.map((tab) => (
                <ListGroup.Item key={tab} eventKey={tab.toLowerCase()}>
                  <span data-cy={`preview-tab-${String(tab).toLowerCase()}`}>{tab}</span>
                </ListGroup.Item>
              ))}
            </ListGroup>
          </div>
          {previewLoading && (
            <center>
              <div className="spinner-border text-azure mt-5" role="status"></div>
            </center>
          )}
          <div className="col" style={{ userSelect: 'text' }}>
            <Tab.Content>
              <Tab.Pane eventKey="json" transition={false}>
                <div className="mb-3 mt-2">
                  {previewLoading === false && isJson && (
                    <div>
                      <JSONTree theme={theme} data={queryPreviewData} invertTheme={!darkMode} collectionLimit={100} />
                    </div>
                  )}
                </div>
              </Tab.Pane>
              <Tab.Pane eventKey="raw" transition={false}>
                <div className={`mb-3 mt-2 raw-container ${darkMode ? 'dark' : ''}`}>{renderRawData()}</div>
              </Tab.Pane>
            </Tab.Content>
          </div>
        </Row>
      </Tab.Container>
    </div>
  );
};

export default Preview;
