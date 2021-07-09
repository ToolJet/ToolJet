
module.exports = {
    type: 'postgres',
    host: process.env.PG_HOST,
    port: parseInt(process.env.PG_PORT) || 5432,
    username: process.env.PG_USER,
    password: process.env.PG_PASS,
    database: process.env.PG_DB,
    synchronize: false,
    logging: true,
    migrations: ["migrations/*.ts"],
    cli: {
        migrationsDir: "migrations"
    }
};
