import React, { useEffect, useState } from 'react';
import { Modal, Button, Container, Row, Col } from 'react-bootstrap';
import Categories from './Categories';
import AppList from './AppList';
import { libraryAppService } from '@/_services';
import { toast } from 'react-hot-toast';
import _ from 'lodash';
import TemplateDisplay from './TemplateDisplay';
import { history } from '@/_helpers';

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

  const [deploying, setDeploying] = useState(false);

  function deployApp() {
    console.log('selectedApp', selectedApp);
    const id = selectedApp.id;
    setDeploying(true);
    libraryAppService
      .deploy(id)
      .then((data) => {
        console.log('dataa', data);
        setDeploying(false);
        toast.success('App created.', {
          position: 'top-center',
        });
        history.push(`/apps/${data.id}`);
      })
      .catch((e) => {
        toast.error(e.error, {
          position: 'top-center',
        });
        setDeploying(false);
      });
  }

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
                    <TemplateDisplay app={selectedApp} />
                  </Col>
                </Row>
                <Row style={{ height: '10%' }}>
                  <Col
                    xs={12}
                    className="d-flex flex-column align-items-end"
                    style={{ borderTop: '1px solid #D2DDEC' }}
                  >
                    <div className="d-flex flex-row align-items-center" style={{ height: '100%' }}>
                      <Button variant="outline-primary" onClick={props.onCloseButtonClick}>
                        Cancel
                      </Button>
                      <Button
                        variant="primary"
                        onClick={() => {
                          deployApp();
                          props.onCloseButtonClick();
                        }}
                        className="ms-2"
                      >
                        Deploy
                      </Button>
                    </div>
                  </Col>
                </Row>
              </Container>
            </Col>
          </Row>
        </Container>
      </Modal.Body>
    </Modal>
  );
}
