export const graphqlUIConfig = {
    defaultFields: [
        {
            type: "input",
            fieldName: "Base URL",
            validations: {
                isRequired: false,
                placeholder: "https://api.example.com/v1/graphql",
                defaultValue: "",
                disabled: false
            }
        }
    ],
    headerSections: [
        "Headers",
        "URL parameters",
        "Body",
        "Cookies"
    ],
    accordionSections: {
        credentials: "CREDENTIALS",
        authentication: "AUTHENTICATION",
        ssl: "SECURE SOCKETS LAYER"
    },
    authenticationTypeDefault: "None",
    sslCertificateDefault: "None"
};

export const graphqlFormConfig = {
    valid: [
        {
            type: "input",
            fieldName: "Base URL",
            text: `${Cypress.env('GraphQl_Url')}`
        }
    ],
    invalidUrl: [
        {
            type: "input",
            fieldName: "Base URL",
            text: "https://invalid-graphql-endpoint.example.com/graphql"
        }
    ]
};

export const graphqlAPIOptions = [
    { key: "url", value: "" },
    { key: "auth_type", value: "none" },
    { key: "grant_type", value: "authorization_code" },
    { key: "add_token_to", value: "header" },
    { key: "header_prefix", value: "Bearer " },
    { key: "access_token_url", value: "" },
    { key: "client_id", value: "" },
    { key: "client_secret", value: "", encrypted: true },
    { key: "audience", value: "" },
    { key: "scopes", value: "read, write" },
    { key: "username", value: "" },
    { key: "password", value: "", encrypted: true },
    { key: "bearer_token", value: "", encrypted: true },
    { key: "auth_url", value: "" },
    { key: "client_auth", value: "header" },
    { key: "headers", value: [["", ""]] },
    { key: "url_params", value: [["", ""]] },
    { key: "body", value: [["", ""]] },
    { key: "cookies", value: [["", ""]] },
    { key: "custom_query_params", value: [["", ""]] },
    { key: "custom_auth_params", value: [["", ""]] },
    { key: "access_token_custom_headers", value: [["", ""]] },
    { key: "multiple_auth_enabled", value: false },
    { key: "ssl_certificate", value: "none" },
];
