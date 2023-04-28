import React, { useEffect, useState } from 'react';
import { Modal, Container, Row, Col } from 'react-bootstrap';
import Categories from './Categories';
import AppList from './AppList';
import { libraryAppService } from '@/_services';
import { toast } from 'react-hot-toast';
import _ from 'lodash';
import TemplateDisplay from './TemplateDisplay';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ButtonSolid } from '@/_ui/AppButton/AppButton';
import { getWorkspaceId } from '../../_helpers/utils';

const identifyUniqueCategories = (templates) =>
  ['all', ...new Set(_.map(templates, 'category'))].map((categoryId) => ({
    id: categoryId,
    count: templates.filter((template) => categoryId === 'all' || template.category === categoryId).length,
  }));

export default function TemplateLibraryModal(props) {
  const navigate = useNavigate();
  const [libraryApps, setLibraryApps] = useState([]);
  const [selectedCategory, selectCategory] = useState({ id: 'all', count: 0 });
  const filteredApps = libraryApps.filter(
    (app) => selectedCategory.id === 'all' || app.category === selectedCategory.id
  );
  const [selectedApp, selectApp] = useState(undefined);
  const { t } = useTranslation();

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

  function deployApp(event) {
    event.preventDefault();
    const id = selectedApp.id;
    setDeploying(true);
    libraryAppService
      .deploy(id)
      .then((data) => {
        setDeploying(false);
        props.onCloseButtonClick();
        toast.success('App created.', {
          position: 'top-center',
        });
        navigate(`/${getWorkspaceId()}/apps/${data.id}`);
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
      className={`template-library-modal ${props.darkMode ? 'dark-mode dark-theme' : ''}`}
      aria-labelledby="contained-modal-title-vcenter"
      centered
    >
      <Modal.Header>
        <Modal.Title>{t('homePage.templateLibraryModal.select', 'Select template')}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Container fluid>
          <Row>
            <Col className="categories-column" xs={3} style={{ borderRight: '1px solid #D2DDEC', height: '100%' }}>
              <Categories
                categories={identifyUniqueCategories(libraryApps)}
                selectedCategory={selectedCategory}
                selectCategory={selectCategory}
              />
            </Col>
            <Col xs={9} style={{ height: '100%' }}>
              <Container fluid>
                <Row style={{ height: '90%' }}>
                  <Col className="template-list-column" xs={3} style={{ height: '100%', overflowY: 'auto' }}>
                    <AppList apps={filteredApps} selectApp={selectApp} selectedApp={selectedApp} />
                  </Col>
                  <Col xs={9} style={{}}>
                    <TemplateDisplay app={selectedApp} darkMode={props.darkMode} />
                  </Col>
                </Row>
                <Row style={{ height: '10%' }}>
                  <Col
                    xs={12}
                    className="d-flex flex-column align-items-end template-modal-control-column"
                    style={{ borderTop: '1px solid #D2DDEC', zIndex: 1 }}
                  >
                    <div className="d-flex flex-row align-items-center" style={{ height: '100%' }}>
                      <ButtonSolid variant="tertiary" onClick={props.onCloseButtonClick}>
                        {t('globals.cancel', 'Cancel')}
                      </ButtonSolid>
                      <ButtonSolid
                        onClick={(e) => {
                          deployApp(e);
                        }}
                        isLoading={deploying}
                        className=" ms-2 "
                      >
                        {t('homePage.templateLibraryModal.createAppfromTemplate', 'Create application from template')}
                      </ButtonSolid>
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
