import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { JSONTree } from 'react-json-tree';
import { Tab, ListGroup, Row, Col, Table } from 'react-bootstrap';
import {
  usePreviewLoading,
  usePreviewData,
  useQueryPanelActions,
  useSelectedDataSource,
} from '@/_stores/queryPanelStore';
import { getTheme, tabs } from '../constants';
import RemoveRectangle from '@/_ui/Icon/solidIcons/RemoveRectangle';
import { ButtonSolid } from '@/_ui/AppButton/AppButton';

const Preview = ({ darkMode }) => {
  const [key, setKey] = useState('raw');
  const [columns, setColumns] = useState(null);
  const [isJson, setIsJson] = useState(false);
  const [theme, setTheme] = useState(() => getTheme(darkMode));
  const queryPreviewData = usePreviewData();
  const previewLoading = usePreviewLoading();
  const { setPreviewData } = useQueryPanelActions();
  const { kind } = useSelectedDataSource();
  //console.log("jhgfcdxzcfghjmhgdxsdfghjmkmjhgfcdx", kind)
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
      setColumns(Object.keys(queryPreviewData[0]));
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

  return (
    <div className="preview-header preview-section d-flex align-items-baseline font-weight-500" ref={previewPanelRef}>
      <div className="w-100" style={{ borderRadius: '0px 0px 6px 6px' }}>
        <Tab.Container activeKey={key} onSelect={(k) => setKey(k)} defaultActiveKey="raw">
          <div className="position-relative">
            {previewLoading && (
              <center className="position-absolute w-100">
                <div className="spinner-border text-azure mt-5" role="status"></div>
              </center>
            )}
            <Row className="py-2 border-bottom preview-section-header m-0">
              <Col className="d-flex align-items-center color-slate9">Preview</Col>
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
                      disabled={
                        !queryPreviewData || (tab == 'JSON' && !isJson) || (tab == 'Table' && kind != 'tooljetdb')
                      }
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
              <Col className="text-right d-flex align-items-center justify-content-end">
                {queryPreviewData !== '' && (
                  <ButtonSolid variant="ghostBlack" size="sm" onClick={() => setPreviewData('')}>
                    <RemoveRectangle width={17} viewBox="0 0 28 28" fill="var(--slate8)" /> Clear
                  </ButtonSolid>
                )}
              </Col>
            </Row>
            <Row className="m-0">
              <Tab.Content
                style={{
                  overflow: 'hidden',
                  overflowWrap: 'anywhere',
                  padding: 0,
                  border: '1px solid var(--slate5)',
                  borderBottomLeftRadius: '6px',
                  borderBottomRightRadius: '6px',
                }}
              >
                <Tab.Pane eventKey="json" transition={false}>
                  <div className="w-100 preview-data-container" data-cy="preview-json-data-container">
                    <JSONTree
                      theme={theme}
                      data={queryPreviewData}
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
                {queryPreviewData !== '' && kind === 'tooljetdb' && (
                  <Tab.Pane eventKey="table" transition={false}>
                    <div
                      className={` raw-container preview-data-container overflow-x-scroll`}
                      data-cy="preview-raw-data-container"
                    >
                      <Table stripped hover variant={darkMode && 'dark'} size="lg" className="py-2">
                        <thead>
                          <tr>
                            {columns?.map((columnName, i) => (
                              <th key={i} className=" p-2 text-nowrap ">
                                {columnName}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {console.log('cdfvdcsxadfvgbrdfvcsxcfvgrdfcsxcfvdcxsdfvc', queryPreviewData)}
                          {queryPreviewData?.map((rowData, index) => {
                            if (index < 100) {
                              return (
                                <tr key={index} p-2>
                                  {columns?.map((columnName, i) => (
                                    <td key={i} className=" p-2 text-nowrap">
                                      {rowData[columnName] ? rowData[columnName] : 'NULL'}
                                    </td>
                                  ))}
                                </tr>
                              );
                            }
                          })}
                        </tbody>
                      </Table>
                      {queryPreviewData.length > 100 && <p className="p-2">Showing first 100 rows</p>}
                    </div>
                  </Tab.Pane>
                )}
              </Tab.Content>
            </Row>
          </div>
        </Tab.Container>
      </div>
    </div>
  );
};

export default Preview;
