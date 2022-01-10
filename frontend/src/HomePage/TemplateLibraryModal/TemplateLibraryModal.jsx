import React, { useEffect, useState } from 'react';
import { Modal, Button, Container, Row, Col } from 'react-bootstrap';
import Categories from './Categories';
import AppList from './AppList';
import { libraryAppService } from '@/_services';
import { toast } from 'react-hot-toast';
import _ from 'lodash';

const identifyUniqueCategories = (templates) => ['all', ...new Set(_.map(templates, 'category'))];

export default function TemplateLibraryModal(props) {
  const [libraryApps, setLibraryApps] = useState([]);
  const [selectedCategory, selectCategory] = useState('all');
  const filteredApps = libraryApps.filter((app) => selectedCategory === 'all' || app.category === selectedCategory);
  const [selectedApp, selectApp] = useState(undefined);

  useEffect(() => {
    selectApp(filteredApps[0]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCategory]);

  useEffect(() => {
    libraryAppService
      .templateManifests()
      .then((data) => {
        if (data['template_app_manifests']) {
          setLibraryApps(data['template_app_manifests']);
          selectApp(data['template_app_manifests'][0]);
        }
      })
      .catch(() => {
        toast.error('Could not fetch library apps', {
          position: 'top-center',
        });
        setLibraryApps([]);
      });
  }, []);

  return (
    <Modal
      {...props}
      className={`template-library-modal ${props.darkMode ? 'dark-mode' : ''}`}
      aria-labelledby="contained-modal-title-vcenter"
      centered
    >
      <Modal.Header>
        <Modal.Title>Select template</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Container fluid>
          <Row>
            <Col xs={3} style={{ borderRight: '1px solid #D2DDEC', height: '100%' }}>
              <Categories
                categories={identifyUniqueCategories(libraryApps)}
                selectedCategory={selectedCategory}
                selectCategory={selectCategory}
              />
            </Col>
            <Col xs={9} style={{ height: '100%' }}>
              <Container fluid>
                <Row style={{ height: '90%' }}>
                  <Col xs={3} style={{ borderRight: '1px solid #D2DDEC' }}>
                    <AppList apps={filteredApps} selectApp={selectApp} selectedApp={selectedApp} />
                  </Col>
                  <Col xs={9} style={{}}>
                    abc
                  </Col>
                </Row>
                <Row style={{ height: '10%' }}>
                  <Col
                    xs={12}
                    className="d-flex flex-column align-items-end"
                    style={{ borderTop: '1px solid #D2DDEC' }}
                  >
                    <div className="d-flex flex-row align-items-center" style={{ height: '100%' }}>
                      <Button onClick={props.onHide}> Close </Button>
                    </div>
                  </Col>
                </Row>
              </Container>
            </Col>
          </Row>
        </Container>
      </Modal.Body>
      {/* <Modal.Footer>
      </Modal.Footer> */}
    </Modal>
  );
}
