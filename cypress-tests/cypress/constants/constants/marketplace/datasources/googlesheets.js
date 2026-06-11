export const googlesheetsUIConfig = {
    defaultFields: [
        {
            type: "dropdown",
            fieldName: "Authentication Type",
            validations: {
                defaultValue: "OAuth 2.0",
                disabled: false
            }
        }
    ],
    serviceAccountFields: [
        {
            type: "dropdown",
            fieldName: "Authentication Type",
            validations: {
                defaultValue: "Service Account",
                disabled: false
            }
        },
        {
            type: "encrypted",
            fieldName: "Service Account Key",
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

export const googlesheetsFormConfig = {
    valid: [
        {
            type: "encrypted",
            fieldName: "Service Account Key",
            text: `${JSON.stringify(Cypress.env('bigquery_private_key'))}`
        }
    ]
};

export const googlesheetsApiOptions = [
    { key: "authentication_type", value: "oauth2", encrypted: false },
    { key: "access_type", value: "read", encrypted: false },
    { key: "api_key", value: null, encrypted: true },
    { key: "service_account_key", value: null, encrypted: true }
];

export const googlesheetsApiOptionsServiceAccount = [
    { key: "authentication_type", value: "service_account", encrypted: false },
    { key: "access_type", value: "read", encrypted: false },
    { key: "api_key", value: null, encrypted: true },
    { key: "service_account_key", value: null, encrypted: true }
];
