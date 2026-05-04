export const openapiUIConfig = {
    defaultFields: [
        {
            type: "input",
            fieldName: "Host",
            validations: {
                isRequired: false,
                placeholder: "Enter host",
                defaultValue: "",
                disabled: false
            }
        }
    ]
};

export const openapiFormConfig = {
    valid: [
        {
            type: "input",
            fieldName: "Host",
            text: `${Cypress.env('openapi_host')}`
        }
    ]
};

export const openapiApiOptions = [
    { key: "host", value: "", encrypted: false },
    { key: "format", value: "json", encrypted: false },
    { key: "definition", value: "", encrypted: false },
    { key: "password", value: null, encrypted: true },
    { key: "bearer_token", value: null, encrypted: true },
    { key: "client_secret", value: null, encrypted: true }
];
