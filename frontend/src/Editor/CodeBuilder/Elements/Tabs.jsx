import React from 'react';
import { Tab, ListGroup, Row, Col } from 'react-bootstrap';

const Tabs = ({ fieldMeta, tabs, darkMode }) => {
  console.log(fieldMeta, 'tabs');
  return (
    <Tab.Container activeKey={'raw'} defaultActiveKey="raw">
      <Row className="m-0">
        {}
        <Tab.Content
        //   style={{
        //     overflowWrap: 'anywhere',
        //     padding: 0,
        //     border: '1px solid var(--slate5)',
        //     borderBottomLeftRadius: '6px',
        //     borderBottomRightRadius: '6px',
        //   }}
        >
          <Tab.Pane eventKey="json" transition={false}>
            <div className="w-100 preview-data-container" data-cy="preview-json-data-container">
              {/* <JSONTree theme={theme} data={queryPreviewData} invertTheme={!darkMode} collectionLimit={100} /> */}
            </div>
          </Tab.Pane>
          <Tab.Pane eventKey="raw" transition={false}>
            <div className={`p-3 raw-container preview-data-container`} data-cy="preview-raw-data-container">
              {/* {renderRawData()} */}
            </div>
          </Tab.Pane>
        </Tab.Content>
      </Row>
    </Tab.Container>
  );
};

export default Tabs;
