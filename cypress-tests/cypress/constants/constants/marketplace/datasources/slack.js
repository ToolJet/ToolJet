export const slackApiOptions = [
    { key: "provider", value: "slack", encrypted: false },
    { key: "oauth2", value: false, encrypted: false },
    { key: "access_type", value: "read", encrypted: false },
    { key: "client_id", value: "", encrypted: false },
    { key: "client_secret", value: null, encrypted: true },
    { key: "credential_source", value: "from_datasource_configuration", encrypted: false },
    { key: "code", value: null, encrypted: true },
    { key: "api_key", value: null, encrypted: true }
];

export const slackFormConfig = {
    valid: [
        {
            type: "input",
            label: "Client ID",
            text: `${Cypress.env('slack_client_id')}`
        },
        {
            type: "input",
            label: "Client Secret",
            text: `${Cypress.env('slack_client_secret')}`
        }
    ]
};

export const slackUIConfig = {
    labels: [
        "Authorize",
        "Slack app",
        "Client ID",
        "Client Secret",
        "Redirect URI"
    ],
    defaultScopes: [
        "users:read",
        "channels:read",
        "groups:read",
        "im:read",
        "mpim:read",
        "channels:history",
        "groups:history",
        "im:history",
        "mpim:history"
    ],
    dropdownOptions: [
        "Use environment variables",
        "Custom slack app"
    ]
};
