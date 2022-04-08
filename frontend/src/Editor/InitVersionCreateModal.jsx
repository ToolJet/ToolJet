import React from 'react';
import cx from 'classnames';
// eslint-disable-next-line import/no-named-as-default
import toast from 'react-hot-toast';
import Modal from 'react-bootstrap/Modal';
import Button from 'react-bootstrap/Button';
import { isEmpty } from 'lodash';
import { appVersionService } from '@/_services';
import { initEditorWalkThrough } from '@/_helpers/createWalkThrough';

const InitVersionCreateModal = ({ appId, showModal, hideModal, fetchApp, darkMode }) => {
  const [initVersionName, setInitVersionName] = React.useState('v1');
  const [isCreatingInitVersion, setIsCreatingInitVersion] = React.useState(false);

  const handleKeyPress = (event) => {
    if (event.key === 'Enter') {
      // eslint-disable-next-line no-undef
      createInitVersion();
    }
  };

  const createInitVersion = async () => {
    if (!isEmpty(initVersionName?.trim())) {
      setIsCreatingInitVersion(true);
      await appVersionService.create(appId, initVersionName);
      setIsCreatingInitVersion(false);
      initEditorWalkThrough();
      fetchApp();
      hideModal();
      toast.success('Version Created');
    } else {
      setIsCreatingInitVersion(false);
      toast.error('The name of version should not be empty');
    }
  };

  return (
    <Modal
      contentClassName={darkMode ? 'theme-dark' : ''}
      show={showModal}
      size="md"
      backdrop="static"
      keyboard={true}
      enforceFocus={false}
      animation={false}
      centered={true}
    >
      <Modal.Header>
        <Modal.Title>Create Version</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <div className="row m-2">
          <div className="col">
            <input
              type="text"
              className="form-control"
              placeholder="version name"
              defaultValue={initVersionName}
              onChange={(e) => setInitVersionName(e.target.value)}
              onKeyPress={(e) => handleKeyPress(e)}
              autoFocus={true}
            />
          </div>
        </div>

        <div className="row m-2">
          <div className="col">
            <small className="muted">Create a version to start building your app</small>
          </div>
        </div>
      </Modal.Body>
      <Modal.Footer>
        <Button className={cx({ 'btn-loading': isCreatingInitVersion })} onClick={() => createInitVersion()}>
          Create
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default InitVersionCreateModal;
