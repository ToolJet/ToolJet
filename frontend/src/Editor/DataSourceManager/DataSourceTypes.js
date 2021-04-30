export const dataBaseSources = [
    {
        name: 'PostgreSQL',
        kind: 'postgresql',
        icon: 'https://www.svgrepo.com/show/303301/postgresql-logo.svg',
        options: {
            host: { type: "string" },
            port: { type: "string" },
            database: { type: "string" },
            username: { type: "string" },
            password: { type: "string", encrypted: true }
        },
        exposedVariables: {
            isLoading: {},
            data: {},
            rawData: {}
        }
    },
    {
        name: 'MySQL',
        kind: 'mysql',
        icon: 'https://www.svgrepo.com/show/303251/mysql-logo.svg',
        exposedVariables: {
            isLoading: {},
            data: {},
            rawData: {}
        },
        options: {
            host: { type: "string" },
            port: { type: "string" },
            database: { type: "string" },
            username: { type: "string" },
            password: { type: "string", encrypted: true }
        },
    },
    {
        name: 'Firestore',
        kind: 'firestore',
        icon: 'https://static.invertase.io/assets/firebase/cloud-firestore.svg',
        exposedVariables: {
            isLoading: {},
            data: [],
            rawData: []
        },
        options: {
            gcp_key: { type: "string", encrypted: true }
        },
    },
    {
        name: 'Elasticsearch',
        kind: 'elasticsearch',
        icon: 'https://www.svgrepo.com/show/305988/elasticsearch.svg',
        exposedVariables: {
            isLoading: {},
            data: {},
            rawData: {}
        },
        options: {
            host: { type: "string" },
            port: { type: "string" },
            username: { type: "string" },
            password: { type: "string", encrypted: true }
        }
    },
    {
        name: 'Redis',
        kind: 'redis',
        icon: 'https://www.svgrepo.com/show/303460/redis-logo.svg',
        exposedVariables: {
            isLoading: {},
            data: {},
            rawData: {}
        },
        options: {
            host: { type: "string" },
            port: { type: "string" },
            username: { type: "string" },
            password: { type: "string", encrypted: true }
        },
    }
]

export const apiSources = [
    {
        name: 'Rest API',
        kind: 'restapi',
        icon: 'https://www.svgrepo.com/show/120283/api.svg',
        options: {
            url: { type: "string" },
            auth_type: { type: "string" },
            grant_type: { type: "string" },
            add_token_to: { type: "string" },
            header_prefix: { type: "string" },
            access_token_url: { type: "string" },
            client_id: { type: "string" },
            client_secret: { type: "string", encrypted: true },
            scopes: { type: "string" },
            auth_url: { type: "string" },
            client_auth: { type: "string" },
            headers: { type: "array" },
            custom_auth_params: { type: "array" },
        },
        exposedVariables: {
            isLoading: {},
            data: {},
            rawData: {}
        },
        customTesting: true
    },
    {
        name: 'Stripe',
        kind: 'stripe',
        icon: 'https://upload.wikimedia.org/wikipedia/commons/b/ba/Stripe_Logo%2C_revised_2016.svg',
        exposedVariables: {
            isLoading: {},
            data: {},
            rawData: {}
        },
        options: {
            api_key: { type: "string", encrypted: true }
        },
        customTesting: true
    },
    {
        name: 'Google Sheets',
        kind: 'googlesheets',
        icon: 'https://upload.wikimedia.org/wikipedia/commons/3/30/Google_Sheets_logo_%282014-2020%29.svg',
        exposedVariables: {
            isLoading: {},
            data: {},
            rawData: {}
        },
        options: {
            api_key: { type: "string", encrypted: true }
        },
        customTesting: true
    },
]

export const DataSourceTypes = [
   ...dataBaseSources,
   ...apiSources
]
