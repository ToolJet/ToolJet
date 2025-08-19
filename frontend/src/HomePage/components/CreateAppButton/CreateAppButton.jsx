import React, { useRef, useState } from "react";
import { Button } from "@/components/ui/Button/Button";
import SolidIcon from "@/_ui/Icon/SolidIcons";
import { useTranslation } from "react-i18next";
import CreateAppButtonBase from "./CreateAppButtonBase";
import CreateAppWithAIModal from "../CreateAppWithAIModal/CreateAppWithAIModal";

const CreateAppButton = ({
  canCreateApp,
  appsLimit,
  creatingApp,
  isImportingApp,
  disabled,
  featureAccess,
  orgGit,
  onShowCreateAppModal,
  createApp,
  onShowTemplateLibraryModal,
  onToggleGitRepositoryImportModal,
  onReadAndImport,
  t,
}) => {
  const { t: translate } = useTranslation();
  const fileInputRef = useRef(null);
  const [showCreateAppWithAIModal, setShowCreateAppWithAIModal] =
    useState(false);

  console.log("CreateAppButton render:", {
    createApp: !!createApp,
    showCreateAppWithAIModal,
    canCreateApp,
  });

  const getButtonText = () => {
    return t("homePage.header.createNewApplication", "Create new app");
  };

  const handleTemplateLibrary = () => {
    if (onShowTemplateLibraryModal) {
      onShowTemplateLibraryModal();
    }
  };

  const handleFileImport = (event) => {
    if (onReadAndImport) {
      onReadAndImport(event);
    }
  };

  const handleGitImport = () => {
    if (onToggleGitRepositoryImportModal) {
      onToggleGitRepositoryImportModal();
    }
  };

  const handleCreateAppWithAI = () => {
    console.log("Create app with AI clicked");
    setShowCreateAppWithAIModal(true);
    console.log("Modal state set to true");
  };

  const isButtonLoading = creatingApp || isImportingApp;
  const loaderText = isButtonLoading ? "Importing app" : "Creating app";

  const dropdownItems = (
    <>
      <Button
        variant="ghost"
        size="default"
        className="tw-w-full tw-justify-start tw-font-medium tw-gap-2"
        onClick={() => {
          onShowCreateAppModal();
        }}
        data-cy="create-new-app-button"
      >
        <SolidIcon name="plus" width="16" height="16" />
        {getButtonText()}
      </Button>

      {createApp && (
        <Button
          variant="ghost"
          size="default"
          className="tw-w-full tw-justify-start tw-font-medium tw-gap-2"
          onClick={handleCreateAppWithAI}
          data-cy="create-app-with-ai-button"
        >
          <SolidIcon
            name="tooljetai"
            width="16"
            height="16"
            fill="currentColor"
          />
          Create app with AI
        </Button>
      )}

      <Button
        variant="ghost"
        size="default"
        className="tw-w-full tw-justify-start tw-gap-2"
        onClick={handleTemplateLibrary}
        data-cy="choose-from-template-button"
      >
        <SolidIcon name="apps" width="16" height="16" />
        {translate(
          "homePage.header.chooseFromTemplate",
          "Choose from template"
        )}
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
        data-cy="import-option-input"
      />

      {featureAccess?.gitSync && orgGit && (
        <Button
          variant="ghost"
          size="default"
          className="tw-w-full tw-justify-start tw-gap-2"
          onClick={handleGitImport}
        >
          <SolidIcon name="gitsync" width="16" height="16" />
          {translate("homePage.header.importFromGit", "Import from Git")}
        </Button>
      )}
    </>
  );

  return (
    <>
      <CreateAppButtonBase
        canCreateApp={canCreateApp}
        appsLimit={appsLimit}
        featureType="apps"
        disabled={disabled}
        isButtonLoading={isButtonLoading}
        loaderText={loaderText}
        buttonText={getButtonText()}
        dropdownItems={dropdownItems}
      />

      {/* Temporarily remove conditional rendering for testing */}
      <CreateAppWithAIModal
        show={showCreateAppWithAIModal}
        closeModal={() => setShowCreateAppWithAIModal(false)}
        processApp={createApp}
        title="Create app with AI"
        actionButton="Create app"
        actionLoadingButton="Creating app"
      />
    </>
  );
};

export default CreateAppButton;
