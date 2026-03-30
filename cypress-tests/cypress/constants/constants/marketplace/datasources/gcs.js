export const gcsUIConfig = {
    defaultFields: [
        {
            type: "encrypted",
            fieldName: "Private key",
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

export const gcsFormConfig = {
    valid: [
        {
            type: "encrypted",
            fieldName: "Private key",
            text: JSON.stringify(Cypress.env('bigquery_private_key'))
        }
    ],
    invalidPrivateKey: [
        {
            type: "encrypted",
            fieldName: "Private key",
            text: "invalid-private-key"
        }
    ]
};
