export const dataBaseSources = [
    {
        name: 'PostgreSQL',
        kind: 'postgresql',
        icon: 'https://www.svgrepo.com/show/303301/postgresql-logo.svg',
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
        }
    },
    {
        name: 'Firestore',
        kind: 'firestore',
        icon: 'https://static.invertase.io/assets/firebase/cloud-firestore.svg',
        exposedVariables: {
            isLoading: {},
            data: {},
            rawData: {}
        }
    },
    {
        name: 'ElasticSearch',
        kind: 'elasticsearch',
        icon: 'https://www.svgrepo.com/show/305988/elasticsearch.svg',
        exposedVariables: {
            isLoading: {},
            data: {},
            rawData: {}
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
        }
    }
]

export const apiSources = [
    {
        name: 'Rest API',
        kind: 'restapi',
        icon: 'https://www.svgrepo.com/show/120283/api.svg',
        exposedVariables: {
            isLoading: {},
            data: {},
            rawData: {}
        }
    },
    {
        name: 'Stripe',
        kind: 'stripe',
        icon: 'https://upload.wikimedia.org/wikipedia/commons/b/ba/Stripe_Logo%2C_revised_2016.svg',
        exposedVariables: {
            isLoading: {},
            data: {},
            rawData: {}
        }
    },
    {
        name: 'Slack',
        kind: 'slack',
        icon: 'https://www.svgrepo.com/show/303320/slack-new-logo-logo.svg',
        exposedVariables: {
            isLoading: {},
            data: {},
            rawData: {}
        }
    },
    {
        name: 'Github',
        kind: 'github',
        icon: 'https://www.svgrepo.com/show/305241/github.svg',
        exposedVariables: {
            isLoading: {},
            data: {},
            rawData: {}
        }
    }
]

export const DataSourceTypes = [
   ...dataBaseSources,
   ...apiSources
]
