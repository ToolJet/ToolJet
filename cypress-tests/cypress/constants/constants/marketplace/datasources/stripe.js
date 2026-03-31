export const stripeUIConfig = {
    defaultFields: [
        {
            type: "encrypted",
            fieldName: "API key",
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

export const stripeFormConfig = {
    valid: [
        {
            type: "encrypted",
            fieldName: "API key",
            text: `${Cypress.env('stripe_api_key')}`
        }
    ],
    invalidApiKey: [
        {
            type: "encrypted",
            fieldName: "API key",
            text: "invalid-api-key"
        }
    ]
};

export const stripeApiOptions = [
    { key: "api_key", value: null, encrypted: true }
];
