export const notionUIConfig = {
    defaultFields: [
        {
            type: "encrypted",
            fieldName: "Token",
            validations: {
                isRequired: false,
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

export const notionFormConfig = {
    valid: [
        {
            type: "encrypted",
            fieldName: "Token",
            text: `${Cypress.env('notion_api_key')}`
        }
    ],
    invalidToken: [
        {
            type: "encrypted",
            fieldName: "Token",
            text: "invalid-token"
        }
    ]
};
