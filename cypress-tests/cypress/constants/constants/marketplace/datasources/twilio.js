export const twilioUIConfig = {
    defaultFields: [
        {
            type: "encrypted",
            fieldName: "Auth token",
            validations: {
                isRequired: false,
                placeholder: "**************",
                defaultValue: "",
                disabled: true,
                hasEditButton: false,
                showEncrypted: false,
                hasEyeIcon: true
            }
        },

        {
            type: "input",
            fieldName: "Account SID",
            validations: {
                isRequired: false,
                placeholder: "Account SID for Twilio",
                defaultValue: "",
                disabled: false
            }
        },

        {
            type: "input",
            fieldName: "Messaging service SID",
            validations: {
                isRequired: false,
                placeholder: "Messaging Service SID for Twilio",
                defaultValue: "",
                disabled: false
            }
        }
    ]
};

export const twilioFormConfig = {
    valid: [
        {
            type: "input",
            fieldName: "Account SID",
            text: `${Cypress.env('twilio_account_sid')}`
        },
        {
            type: "input",
            fieldName: "Messaging service SID",
            text: `${Cypress.env('twilio_messaging_service_sid')}`
        }
    ]
};
