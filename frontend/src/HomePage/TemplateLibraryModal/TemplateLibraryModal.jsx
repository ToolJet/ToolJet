import React, { useEffect, useState } from 'react';
import { Modal, Button, Container, Row, Col } from 'react-bootstrap';
import Categories from './Categories';
import { libraryAppService } from '@/_services';
import { toast } from 'react-hot-toast';
import _ from 'lodash';

const identifyUniqueCategories = (templates) => ['all', ...new Set(_.map(templates, 'category'))];

export default function TemplateLibraryModal(props) {
  const [libraryApps, setLibraryApps] = useState([]);

  useEffect(() => {
    libraryAppService
      .templateManifests()
      .then((data) => {
        if (data['template_app_manifests']) {
          setLibraryApps(data['template_app_manifests']);
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
              <Categories categories={identifyUniqueCategories(libraryApps)} />
            </Col>
            <Col xs={9} style={{ height: '100%' }}>
              second
            </Col>
          </Row>
        </Container>
      </Modal.Body>
      {/* <Modal.Footer>
        <Button onClick={props.onHide}>Close</Button>
      </Modal.Footer> */}
    </Modal>
  );
}
