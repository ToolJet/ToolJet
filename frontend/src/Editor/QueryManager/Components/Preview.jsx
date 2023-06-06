import React, { useEffect, useState } from 'react';
import { JSONTree } from 'react-json-tree';
import { Tab, ListGroup, Row } from 'react-bootstrap';
import { useTranslation } from 'react-i18next';
import { getTheme, tabs } from '../constants';

const Preview = ({ previewPanelRef, previewLoading, queryPreviewData, darkMode }) => {
  const { t } = useTranslation();
  const [key, setKey] = useState('raw');
  const [isJson, setIsJson] = useState(false);
  const [theme, setTheme] = useState(() => getTheme(darkMode));

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
    if (queryPreviewData) {
      return isJson ? JSON.stringify(queryPreviewData).toString() : queryPreviewData.toString();
    }
    return '';
  };

  return (
    <div>
      <div className="preview-header preview-section d-flex align-items-baseline font-weight-500" ref={previewPanelRef}>
        <div className={`py-2 font-weight-400 ${darkMode ? 'color-dark-slate12' : 'color-light-slate-12'}`}>
          {t('editor.preview', 'Preview')}
        </div>
        <Tab.Container activeKey={key} onSelect={(k) => setKey(k)} defaultActiveKey="raw">
          <Row style={{ width: '100%', paddingLeft: '20px' }}>
            <div className="keys">
              <ListGroup className={`query-preview-list-group ${darkMode ? 'dark' : ''}`} variant="flush">
                {tabs.map((tab) => (
                  <ListGroup.Item key={tab} eventKey={tab.toLowerCase()} disabled={!queryPreviewData}>
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
            <Tab.Content style={{ overflowWrap: 'anywhere' }}>
              {!queryPreviewData && <div className="col preview-default-container"></div>}
              <Tab.Pane eventKey="json" transition={false}>
                {previewLoading === false && isJson && (
                  <div className="w-100 " data-cy="preview-json-data-container">
                    <JSONTree theme={theme} data={queryPreviewData} invertTheme={!darkMode} collectionLimit={100} />
                  </div>
                )}
              </Tab.Pane>
              <Tab.Pane eventKey="raw" transition={false}>
                <div className={`p-3 raw-container `} data-cy="preview-raw-data-container">
                  {renderRawData()}
                </div>
              </Tab.Pane>
            </Tab.Content>
          </Row>
        </Tab.Container>
      </div>
    </div>
  );
};

export default Preview;
