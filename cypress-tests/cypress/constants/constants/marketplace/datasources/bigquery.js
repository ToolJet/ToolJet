export const bigqueryUIConfig = {
    defaultFields: [
        {
            type: "encrypted",
            fieldName: "Private key",
            validations: {
                isRequired: true,
                placeholder: "**************",
                defaultValue: "",
                disabled: true,
                hasEditButton: true,
                showEncrypted: true,
                hasEyeIcon: false
            }
        },
        {
            type: "input",
            fieldName: "Scope",
            validations: {
                isRequired: false,
                placeholder: "Enter required scopes",
                defaultValue: "",
                disabled: false
            }
        }
    ]
};

export const bigqueryFormConfig = {
    valid: [
        {
            type: "encrypted",
            fieldName: "Private key",
            text: JSON.stringify(Cypress.env("bigquery_private_key"))
        },
        {
            type: "input",
            fieldName: "Scope",
            text: Cypress.env("bigquery_scope")
        }
    ],
    invalidPrivateKey: [
        {
            type: "encrypted",
            fieldName: "Private key",
            text: "invalid-private-key"
        }
    ],
    invalidScope: [
        {
            type: "input",
            fieldName: "Scope",
            text: "invalid-scope-value"
        }
    ]
};