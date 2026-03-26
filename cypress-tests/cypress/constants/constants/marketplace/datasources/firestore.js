export const firestoreUIConfig = {
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

export const firestoreFormConfig = {
    valid: [
        {
            type: "encrypted",
            fieldName: "Private key",
            text: `${JSON.stringify(Cypress.env('firestore_pvt_key'))}`
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
