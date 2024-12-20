import { cyParamName } from "Selectors/common";

export const editVersionText = {
  editVersionTitle: "Edit Version",
  saveButton: "Save",
  VersionNameUpdatedToastMessage: "Version name updated",
};

export const deleteVersionText = {
  deleteModalText: (text) => {
    return `Are you sure you want to delete this version - ${cyParamName(
      text
    )}?`;
  },
  deleteToastMessage: (version) => {
    return `Version - ${cyParamName(version)} Deleted`;
  },
};

export const onlydeleteVersionText = {
  deleteModalText: (text) => {
    return `Are you sure you want to delete this version - ${cyParamName(
      text
    )}?`;
  },
  deleteToastMessage: (version) => {
    return `Cannot delete only version of app`;
  },
};

export const releasedVersionText = {
  cannotUpdateReleasedVersionToastMessage:
    "You cannot update a released version",
  releasedToastMessage: (version) => {
    return `Version ${cyParamName(version)} released`;
  },
  releasedModalText:
    "You cannot make changes to a version that has already been released. Create a new version or switch to a different version if you want to make changes.",
  cannotDeleteReleasedVersionToastMessage:
    "You cannot delete a released version",
  releasedAppText:
    "App cannot be edited after promotion. Please create a new version from Development to make any changes.",
  releasedVersionConfirmText:
    "Are you sure you want to release this version of the app?",
  buttonReleaseApp: "Release App",
};
