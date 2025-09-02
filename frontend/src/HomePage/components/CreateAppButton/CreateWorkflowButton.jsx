import React, { useRef } from "react";
import { Button } from "@/components/ui/Button/Button";
import SolidIcon from "@/_ui/Icon/SolidIcons";
import { useTranslation } from "react-i18next";
import CreateAppButtonBase from "./CreateAppButtonBase";

const CreateWorkflowButton = ({
  canCreateApp,
  appsLimit,
  creatingApp,
  isImportingApp,
  disabled,
  onShowCreateAppModal,
  onReadAndImport,
  t,
}) => {
  const { t: translate } = useTranslation();
  const fileInputRef = useRef(null);

  const getButtonText = () => {
    return t(
      "workflowsDashboard.header.createNewApplication",
      "Create new workflow"
    );
  };

  const handleFileImport = (event) => {
    if (onReadAndImport) {
      onReadAndImport(event);
    }
  };

  const isButtonLoading = creatingApp || isImportingApp;
  const loaderText = isButtonLoading
    ? "Importing workflow"
    : "Creating workflow";

  const dropdownItems = (
    <>
      <Button
        variant="ghost"
        size="default"
        className="tw-w-full tw-justify-start tw-font-medium tw-gap-2"
        onClick={() => {
          onShowCreateAppModal();
        }}
        data-cy="create-new-workflow-button"
      >
        <SolidIcon name="plus" width="16" height="16" />
        {getButtonText()}
      </Button>

      <Button
        variant="ghost"
        size="default"
        className="tw-w-full tw-justify-start tw-gap-2"
        onClick={() => fileInputRef.current?.click()}
      >
        <SolidIcon name="fileupload" width="16" height="16" />
        {translate("homePage.header.import", "Import from device")}
      </Button>
      <input
        type="file"
        accept=".json"
        ref={fileInputRef}
        onChange={handleFileImport}
        className="tw-hidden"
        data-cy="import-workflow-option-input"
      />
    </>
  );

  return (
    <CreateAppButtonBase
      canCreateApp={canCreateApp}
      appsLimit={appsLimit}
      featureType="workflows"
      disabled={disabled}
      isButtonLoading={isButtonLoading}
      loaderText={loaderText}
      buttonText={getButtonText()}
      dropdownItems={dropdownItems}
    />
  );
};

export default CreateWorkflowButton;
