export const nocodbUIConfig = {
    defaultFields: [
        {
            type: "dropdown",
            fieldName: "Host",
            validations: {
                defaultValue: "Nocodb Cloud",
                disabled: false
            }
        },
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
        }
    ]
};

export const nocodbFormConfig = {
    valid: [
        {
            type: "encrypted",
            fieldName: "API token",
            text: `${Cypress.env('nocodb_api_key')}`
        }
    ]
};

export const nocodbApiOptions = [
    { key: "nocodb_host", value: "nocodb_cloud", encrypted: false },
    { key: "api_token", value: null, encrypted: true }
];
