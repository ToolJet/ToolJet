export const appwriteUIConfig = {
    defaultFields: [
        {
            type: "input",
            fieldName: "Host",
            validations: {
                isRequired: false,
                placeholder: "Appwrite database host/endpoint",
                defaultValue: "",
                disabled: false
            }
        },
        {
            type: "input",
            fieldName: "Project ID",
            validations: {
                isRequired: false,
                placeholder: "Appwrite project id",
                defaultValue: "",
                disabled: false
            }
        },
        {
            type: "input",
            fieldName: "Database ID",
            validations: {
                isRequired: false,
                placeholder: "Appwrite Database id",
                defaultValue: "",
                disabled: false
            }
        },
        {
            type: "encrypted",
            fieldName: "Secret Key",
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

export const appwriteFormConfig = {
    valid: [
        {
            type: "input",
            fieldName: "Host",
            text: `${Cypress.env('appwrite_host')}`
        },
        {
            type: "input",
            fieldName: "Project ID",
            text: `${Cypress.env('appwrite_project_id')}`
        },
        {
            type: "input",
            fieldName: "Database ID",
            text: `${Cypress.env('appwrite_database_id')}`
        },
        {
            type: "encrypted",
            fieldName: "Secret Key",
            text: `${Cypress.env('appwrite_secret_key')}`
        }
    ],
    invalidHost: [
        {
            type: "input",
            fieldName: "Host",
            text: "invalid-host"
        }
    ],
    invalidProjectId: [
        {
            type: "input",
            fieldName: "Project ID",
            text: "invalid-project-id"
        }
    ],
    invalidSecretKey: [
        {
            type: "encrypted",
            fieldName: "Secret Key",
            text: "invalid-secret-key"
        }
    ]
};
