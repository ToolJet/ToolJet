export const n8nUIConfig = {
    defaultFields: [
        {
            type: "dropdown",
            fieldName: "Authentication type",
            validations: {
                defaultValue: "None",
                disabled: false
            }
        }
    ]
};

export const n8nFormConfig = {
    valid: [
        {
            type: "dropdown",
            fieldName: "Authentication type",
            text: "Basic Auth"
        },
        {
            type: "input",
            fieldName: "Username",
            text: `${Cypress.env('n8n_username')}`
        },
        {
            type: "encrypted",
            fieldName: "Password",
            text: `${Cypress.env('n8n_password')}`
        }
    ]
};

export const n8nApiOptions = [
    { key: "auth_type", value: "none", encrypted: false },
    { key: "password", value: null, encrypted: true },
    { key: "name", value: null, encrypted: true },
    { key: "value", value: null, encrypted: true }
];
