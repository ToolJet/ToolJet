import React, { useState } from 'react';
import Modal from '@/HomePage/Modal';
import { organizationService } from '@/_services';
import { toast } from 'react-hot-toast';

function EnableModal({ key }) {
  console.log(key, 'andar');
  const [showModal, setShowModal] = useState(true); // Control the modal visibility

  const saveSettingsAndCloseModal = async () => {
    // Call the service to save the settings
    try {
      await organizationService.editOrganizationConfigs({
        /* ...config data... */
      });
      toast.success(`${key} has been enabled and configurations have been saved.`, { position: 'top-center' });
      // Close the modal after saving
      setShowModal(false);
    } catch (error) {
      // Handle any errors that occur during saving
      toast.error(`Error while saving configurations: ${error.message}`, { position: 'top-center' });
    }
  };

  const handleEnableClick = () => {
    saveSettingsAndCloseModal();
  };

  const handleClose = () => {
    setShowModal(false); // Just close the modal without saving
  };

  const footerContent = (
    <div>
      <button onClick={handleClose} className="btn btn-secondary">
        Cancel
      </button>
      <button onClick={handleEnableClick} className="btn btn-primary">
        Enable
      </button>
    </div>
  );

  return showModal ? (
    <Modal title={`Enable ${key}`} show={showModal} closeModal={handleClose} footerContent={footerContent} size="md">
      <p>Enabling {key} will override LDAP configured at the instance level. Are you sure you want to continue?</p>
    </Modal>
  ) : null;
}

export default EnableModal;
