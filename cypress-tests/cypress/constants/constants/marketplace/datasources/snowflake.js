export const snowflakeUIConfig = {
    defaultFields: [
        {
            type: "input",
            fieldName: "Account",
            validations: {
                isRequired: false,
                placeholder: "Enter account",
                defaultValue: "",
                disabled: false
            }
        },
        {
            type: "input",
            fieldName: "Database",
            validations: {
                isRequired: false,
                placeholder: "Enter database",
                defaultValue: "",
                disabled: false
            }
        },
        {
            type: "input",
            fieldName: "Schema",
            validations: {
                isRequired: false,
                placeholder: "Enter schema",
                defaultValue: "",
                disabled: false
            }
        },
        {
            type: "input",
            fieldName: "Warehouse",
            validations: {
                isRequired: false,
                placeholder: "Enter warehouse",
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
        },
        {
            type: "dropdown",
            fieldName: "OAuth",
            text: "Basic"
        },
        {
            type: "input",
            fieldName: "Username",
            validations: {
                isRequired: false,
                placeholder: "Username",
                defaultValue: "",
                disabled: false
            }
        },
        {
            type: "encrypted",
            fieldName: "Password",
            validations: {
                isRequired: false,
                placeholder: "**************",
                defaultValue: "",
                disabled: true,
                hasEditButton: true,
                showEncrypted: true,
                hasEyeIcon: true
            }
        },
        {
            type: "input",
            fieldName: "Scope(s)",
            validations: {
                isRequired: false,
                placeholder: "",
                defaultValue: "",
                disabled: false
            }
        },
        {
            type: "input",
            fieldName: "Redirect URI",
            validations: {
                isRequired: false,
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
            text: `${Cypress.env('snowflake_new_account') || ''}`
        },
        {
            type: "input",
            fieldName: "Database",
            text: `${Cypress.env('snowflake_new_database') || ''}`
        },
        {
            type: "input",
            fieldName: "Schema",
            text: `${Cypress.env('snowflake_new_schema') || ''}`
        },
        {
            type: "input",
            fieldName: "Warehouse",
            text: `${Cypress.env('snowflake_new_warehouse') || ''}`
        },
        {
            type: "input",
            fieldName: "Role",
            text: `${Cypress.env('snowflake_new_role') || ''}`
        },
        {
            type: "dropdown",
            fieldName: "OAuth",
            authType: "basic",
            credentials: {
                username: `${Cypress.env('snowflake_user') || ''}`,
                password: `${Cypress.env('snowflake_password') || ''}`
            }
        }
    ],
    invalidAccount: [
        {
            type: "input",
            fieldName: "Account",
            text: "invalid-account"
        }
    ],
    invalidDatabase: [
        {
            type: "input",
            fieldName: "Database",
            text: "invalid-database"
        }
    ],
    invalidSchema: [
        {
            type: "input",
            fieldName: "Schema",
            text: "invalid-schema"
        }
    ],
    invalidWarehouse: [
        {
            type: "input",
            fieldName: "Warehouse",
            text: "invalid-warehouse"
        }
    ],
    invalidRole: [
        {
            type: "input",
            fieldName: "Role",
            text: "invalid-role"
        }
    ],
    invalidUsername: [
        {
            type: "oauth",
            fieldName: "OAuth",
            authType: "basic",
            credentials: {
                username: "invalid-username",
                password: `${Cypress.env('snowflake_password') || ''}`
            }
        }
    ],
    invalidPassword: [
        {
            type: "oauth",
            fieldName: "OAuth",
            authType: "basic",
            credentials: {
                username: `${Cypress.env('snowflake_user') || ''}`,
                password: "invalid-password"
            }
        }
    ],
    oauth2Config: [
        {
            type: "oauth",
            fieldName: "OAuth",
            authType: "oauth2",
            oauthType: "custom_app",
            grantType: "authorization_code",
            credentials: {
                client_id: "test-client-id",
                client_secret: "test-client-secret",
                auth_url: `${Cypress.env('snowflake_new_auth_urls') && Cypress.env('snowflake_new_auth_urls')[0] || 'https://account.snowflakecomputing.com/oauth/authorize'}`,
                access_token_url: `${Cypress.env('snowflake_new_token_urls') && Cypress.env('snowflake_new_token_urls')[0] || 'https://account.snowflakecomputing.com/oauth/token-request'}`,
                scope: `${Cypress.env('snowflake_new_scope') || 'session:role:public'}`,
                content_type: `${Cypress.env('snowflake_new_content_type') || 'application/x-www-form-urlencoded'}`
            }
        }
    ]
};