export const airtableUIConfig = {
    defaultFields: [
        {
            type: "encrypted",
            fieldName: "Personal access token",
            validations: {
                isRequired: true,
                placeholder: "**************",
                defaultValue: "",
                disabled: true,
                hasEditButton: true,
                showEncrypted: true,
                hasEyeIcon: false
            }
        }
    ]
};

export const airtableFormConfig = {
    valid: [
        {
            type: "encrypted",
            fieldName: "Personal access token",
            text: `${Cypress.env('airTable_apikey')}`
        }
    ],
    invalidToken: [
        {
            type: "encrypted",
            fieldName: "Personal access token",
            text: "invalid-token"
        }
    ]
};
