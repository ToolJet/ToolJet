// test-mariadb.js

const Mariadb = require('./index').default;
// or:
// import Mariadb from './src/index';

async function main() {
  const service = new Mariadb();
  const sourceOptions2 = {
  host: '9.234.17.31',
  port: '3309',
  user: 'root',
  password: 'y4brCMAwTDkhSntE',
  database: 'mariadd',

  connectionLimit: 10,

  allow_dynamic_connection_parameters: false,

  ssl_enabled: false,
  ssl_certificate: 'none',

  // SSH
  ssh_enabled: 'enabled',
  ssh_auth_type: 'password',

  ssh_host: 'localhost',
  ssh_port: 3309,

  ssh_username: 'root',
  ssh_password: 'y4brCMAwTDkhSntE',
};

  const sourceOptions = {
    host: '9.234.17.31',
    port: '3309',
    user: 'root',
    password: 'y4brCMAwTDkhSntE',
    database: 'mariadd',

    connectionLimit: 10,

    allow_dynamic_connection_parameters: false,

    ssl_enabled: false,
    ssl_certificate: 'none',

    ssh_enabled: 'disabled',
    ssh_auth_type: 'private_key',
    ssh_port: 22,
  };

  try {
    console.log('Testing connection...');

    const result = await service.testConnection(sourceOptions2);

    console.log('SUCCESS');
    console.log(result);
  } catch (err) {
    console.error('\nERROR OBJECT');
    console.error(err);

    console.error('\nMESSAGE');
    console.error(err?.message);

    console.error('\nSTACK');
    console.error(err?.stack);

    console.error('\nFULL JSON');
    console.error(JSON.stringify(err, null, 2));
  }
}

main();