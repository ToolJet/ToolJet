export const Environments = {
    development: "development",
    staging: "staging",
    production: "production",
};

export const EnvironmentValues = {
    development: "dev",
    staging: "stage",
    production: "prod",
};

export const WidgetPositions = {
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

export const DBValues = {
    development: "multi_env_development_db",
    staging: "multi_env_staging_db",
    production: "multi_env_production_db",
};

export const TableValues = {
    development: "multi_env_development_table",
    staging: "multi_env_staging_table",
    production: "multi_env_production_table",
};

export const WaitTimes = {
    promotion: 2000,
    queryExecution: 1000,
};
