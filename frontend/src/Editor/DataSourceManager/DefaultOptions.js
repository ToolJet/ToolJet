export const defaultOptions = { 
    'postgresql': {
        host: 'localhost',
        port: 5432,
        username: '',
        password: ''
    },
    'mysql': {
        host: 'localhost',
        port: 3306,
        username: '',
        password: ''
    },
    'redis': {
        host: 'localhost',
        port: 6379,
        username: '',
        password: ''
    },
    'elasticsearch': {
        host: 'localhost',
        port: 9000,
        username: '',
        password: ''
    },
    'stripe': { 
        api_key: ''
    },
    'firestore': { 
        gcp_key: ''
    },
    'restapi': {
        url: '',
        auth_type: 'none',
        grant_type: 'client_credentials',
        add_token_to: 'header',
        header_prefix: 'Bearer ',
        access_token_url: '',
        client_id: '',
        client_secret: '',
        scopes: 'read, write',
        auth_url: '',
        client_auth: 'header',
        headers: [['', '']],
        custom_auth_params: [['', '']]
    }
}
