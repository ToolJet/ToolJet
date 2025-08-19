import React, { useState, useEffect, useRef } from 'react';
import { toast } from 'react-hot-toast';
import Modal from '../../Modal';
import { ButtonSolid } from '@/_ui/AppButton/AppButton';
import { v4 as uuidv4 } from 'uuid';

export function CreateAppWithAIModal({
  show,
  closeModal,
  processApp,
  title = 'Create app with AI',
  actionButton = 'Create app',
  actionLoadingButton = 'Creating app',
}) {
  const [isLoading, setIsLoading] = useState(false);
  const [inputText, setInputText] = useState('');
  const inputRef = useRef(null);
  const placeholderText = `Describe the app you want to build`;

  useEffect(() => {
    if (show) {
      setInputText('');
      console.log('Modal show state:', show);
    }
  }, [show]);

  const handleInputChange = (e) => {
    const text = e.target.value || '';
    setInputText(text);
  };

  const handleSubmit = async (text) => {
    if (!text.trim()) {
      return toast.error('Prompt can not be empty');
    }

    if (!processApp) {
      toast.error('App creation function not available');
      return;
    }

    setIsLoading(true);
    try {
      const appName = `Untitled App: ${uuidv4()}`;
      const success = await processApp(appName, undefined, text);

      if (success !== false) {
        closeModal();
        toast.success('App creation started with AI');
      }
    } catch (error) {
      console.error('Error creating app with AI:', error);
      toast.error('Failed to create app with AI');
    } finally {
      setIsLoading(false);
    }
  };

  console.log('Rendering modal, show:', show);

  return (
    <Modal
      show={show}
      closeModal={closeModal}
      title={title}
      size="md"
      customClassName="create-app-with-ai-modal"
      footerContent={
        <>
          <ButtonSolid
            variant="tertiary"
            onClick={closeModal}
            data-cy="cancel-button"
            className="modal-footer-divider"
            disabled={isLoading}
          >
            Cancel
          </ButtonSolid>
          <ButtonSolid
            onClick={() => handleSubmit(inputText)}
            data-cy="create-app-with-ai-button"
            disabled={isLoading || !inputText.trim()}
          >
            {isLoading ? actionLoadingButton : actionButton}
          </ButtonSolid>
        </>
      }
    >
      <div>
        <label htmlFor="prompt-input" className="tw-block tw-text-lg tw-font-medium tw-text-text-default tw-mb-3">
          What do you want to build today?
        </label>
        <div className="tw-mb-1">
          <textarea
            id="prompt-input"
            ref={inputRef}
            className="tw-w-full tw-min-h-[80px] tw-p-3 tw-border tw-border-border-default tw-rounded-md tw-text-lg tw-font-normal tw-text-text-default tw-bg-background-surface-layer-01 tw-resize-none tw-outline-none tw-transition-all tw-duration-200 focus:tw-border-border-accent-strong focus:tw-shadow-interactive-focus-outline disabled:tw-bg-background-surface-layer-02 disabled:tw-text-text-disabled disabled:tw-cursor-not-allowed placeholder:tw-text-text-placeholder"
            value={inputText}
            onChange={handleInputChange}
            placeholder={placeholderText}
            rows={3}
            disabled={isLoading}
          />
        </div>
        <div className="tw-text-sm tw-font-normal tw-text-text-placeholder">
          AI will generate a fully functional app from this input
        </div>
      </div>
    </Modal>
  );
}

export default CreateAppWithAIModal;
