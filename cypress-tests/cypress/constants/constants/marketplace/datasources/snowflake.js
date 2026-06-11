export const snowflakeUIConfig = {
    defaultFields: [
        {
            type: "input",
            fieldName: "Account",
            validations: {
                isRequired: false,
                placeholder: "Enter Snowflake account identifier (e.g. xy12345.us-east-1)",
                defaultValue: "",
                disabled: false
            }
        },
        {
            type: "input",
            fieldName: "Database",
            validations: {
                isRequired: false,
                placeholder: "Enter database name",
                defaultValue: "",
                disabled: false
            }
        },
        {
            type: "input",
            fieldName: "Schema",
            validations: {
                isRequired: false,
                placeholder: "Enter schema name",
                defaultValue: "",
                disabled: false
            }
        },
        {
            type: "input",
            fieldName: "Warehouse",
            validations: {
                isRequired: false,
                placeholder: "Enter warehouse name",
                defaultValue: "",
                disabled: false
            }
        },
        {
            type: "input",
            fieldName: "Role",
            validations: {
                isRequired: false,
                placeholder: "Enter role",
                defaultValue: "",
                disabled: false
            }
        }
    ]
};

export const snowflakeFormConfig = {
    valid: [
        {
            type: "input",
            fieldName: "Account",
            text: `${Cypress.env('snowflake_account')}`
        },
        {
            type: "input",
            fieldName: "Database",
            text: `${Cypress.env('snowflake_database')}`
        }
    ],
    invalidAccount: [
        {
            type: "input",
            fieldName: "Account",
            text: "invalid-account"
        }
    ]
};
