import { cyParamName } from "Selectors/common";

export const editVersionText = {
	editVersionTitle: 'Edit Version',
	saveButton: 'Save',
	VersionNameUpdatedToastMessage: 'Version name updated'
}

export const deleteVersionText = {
	deleteModalText: (text) => {
		return `Are you sure you want to delete this version - ${cyParamName(text)}`;
	},
	deleteToastMessage: (version) => {
		return `Version - ${cyParamName(version)} Deleted`
	}
}