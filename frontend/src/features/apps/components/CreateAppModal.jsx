import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogFooter, DialogTitle } from '@/components/ui/Rocket/dialog';
import { Input } from '@/components/ui/Rocket/input';
import { Field, FieldGroup, FieldLabel, FieldDescription, FieldError } from '@/components/ui/Rocket/field';
import { Button } from '@/components/ui/Button/Button';

export function CreateAppModal({ open, onOpenChange, onCreate, isLoading = false }) {
  const [appName, setAppName] = useState('');
  const [isValid, setIsValid] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');

  const validateAppName = (value) => {
    if (!value || value.trim() === '') {
      return { valid: false, message: 'App name is required' };
    }
    if (value.length > 50) {
      return { valid: false, message: 'App name must be max 50 characters' };
    }
    return { valid: true, message: '' };
  };

  const handleInputChange = (e, validateObj) => {
    const value = e.target.value;
    setAppName(value);

    if (validateObj) {
      setIsValid(validateObj.valid);
      setErrorMessage(validateObj.message);
    } else {
      const validation = validateAppName(value);
      setIsValid(validation.valid);
      setErrorMessage(validation.message);
    }
  };

  const handleCreate = () => {
    const validation = validateAppName(appName);
    if (validation.valid && onCreate) {
      onCreate(appName.trim());
      handleClose();
    } else {
      setIsValid(false);
      setErrorMessage(validation.message);
    }
  };

  const handleClose = () => {
    setAppName('');
    setIsValid(null);
    setErrorMessage('');
    onOpenChange?.(false);
  };

  const isCreateDisabled = !isValid || isLoading;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="tw-w-full tw-max-w-lg tw-p-0 tw-gap-0">
        <DialogHeader className="tw-border-b tw-border-border-weak tw-px-6 tw-py-4 tw-h-14">
          <DialogTitle className="font-title-x-large tw-text-text-default tw-leading-6">Create app</DialogTitle>
        </DialogHeader>

        <div className="tw-px-6 tw-py-6">
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="name">Full name</FieldLabel>
              <Input
                id="name"
                autoComplete="off"
                placeholder="Enter app name"
                value={appName}
                onChange={handleInputChange}
              />
              <FieldDescription>App name must be unique and max 50 characters</FieldDescription>
              {errorMessage && <FieldError>{errorMessage}</FieldError>}
            </Field>
          </FieldGroup>
        </div>

        <DialogFooter className="tw-border-t tw-border-border-weak tw-px-6 tw-py-6 tw-flex tw-flex-row !tw-justify-between tw-items-center tw-gap-2">
          <Button variant="secondary" size="default" onClick={handleClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button
            variant="primary"
            size="default"
            onClick={handleCreate}
            disabled={isCreateDisabled}
            leadingIcon="plus"
            isLucid={true}
            isLoading={isLoading}
          >
            Create app
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default CreateAppModal;
