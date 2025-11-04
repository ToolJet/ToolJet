export const ENVIRONMENTS = {
    development: "development",
    staging: "staging",
    production: "production",
};

export const ENVIRONMENT_VALUES = {
    development: "dev",
    staging: "stage",
    production: "prod",
};

export const WIDGET_POSITIONS = {
    queryData: {
        desktop: { top: 100, left: 20 },
        mobile: { width: 8, height: 50 },
    },
    constantData: {
        desktop: { top: 70, left: 25 },
        mobile: { width: 8, height: 50 },
    },
    textInput: {
        x: 550,
        y: 650,
    },
};

export const DB_VALUES = {
    development: "multi_env_development_db",
    staging: "multi_env_staging_db",
    production: "multi_env_production_db",
};

export const TABLE_VALUES = {
    development: "multi_env_development_table",
    staging: "multi_env_staging_table",
    production: "multi_env_production_table",
};

export const WAIT_TIMES = {
    promotion: 2000,
    queryExecution: 1000,
};
