export const baserowUIConfig = {
    defaultFields: [
        {
            type: "encrypted",
            fieldName: "API token",
            validations: {
                isRequired: false,
                placeholder: "**************",
                defaultValue: "",
                disabled: true,
                hasEditButton: true,
                showEncrypted: true,
                hasEyeIcon: false
            }
        },

        {
            type: "dropdown",
            fieldName: "Host",
            validations: {
                defaultValue: "Baserow Cloud",
                disabled: false
            }
        }
    ]
};

export const baserowFormConfig = {
    valid: [
        {
            type: "encrypted",
            fieldName: "API token",
            text: `${Cypress.env('baserow_apikey')}`
        },
        {
            type: "dropdown",
            fieldName: "Host",
            text: "Baserow Cloud"
        }
    ]
};
