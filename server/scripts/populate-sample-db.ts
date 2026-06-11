import * as fs from 'fs';
import * as path from 'path';
import { Client } from 'pg';
import { buildAndValidateDatabaseConfig } from './database-config-utils';

interface Config {
  user: any;
  host: any;
  database: any;
  password: any;
  port: any;
  ssl?: {
    rejectUnauthorized: boolean;
    ca?: any;
  };
}

// PostgreSQL connection configuration
function createPGconnection(envVars): Client {
  let config: Config = {
    user: envVars.SAMPLE_PG_DB_USER,
    host: envVars.SAMPLE_PG_DB_HOST,
    database: envVars.SAMPLE_DB,
    password: envVars.SAMPLE_PG_DB_PASS,
    port: envVars.SAMPLE_PG_DB_PORT,
  };
  if (envVars?.CA_CERT) {
    config = {
      ...config,
      ssl: { rejectUnauthorized: false, ca: envVars.CA_CERT },
    };
  }

  return new Client(config);
}

const folderPath = path.join(__dirname, '../src/assets/sample-data-json-files');
// Replace 'your_table_name' with the desired table name in your PostgreSQL database
// Read Excel file

async function connectToPostgreSQL(client) {
  return new Promise<void>((resolve, reject) => {
    client.connect((err) => {
      if (err) {
        console.error('Error connecting to PostgreSQL:', err);
        reject(err); // Reject the promise if there's an error
      } else {
        console.log('Connected to PostgreSQL');
        resolve(); // Resolve the promise if connected successfully
      }
    });
  });
}

export async function populateSampleData(envVars) {
  const client = createPGconnection(envVars);

  try {
    //Checking postgres connection
    await connectToPostgreSQL(client);

    // Read files from the folder asynchronously
    const files = await fs.promises.readdir(folderPath);

    for (const file of files) {
      if (file.startsWith('.')) continue; // Skip hidden files

      const filePath = path.join(folderPath, file);

      // Read file contents asynchronously
      const jsonString = await fs.promises.readFile(filePath, 'utf-8');

      const parsedData = JSON.parse(jsonString);

      const tableName = file
        .replace(/\.json$/, '')
        .replace(/[^\w]/g, '')
        .replace(/\s+/g, '_')
        .toLowerCase();

      // Drop table if it exists
      await dropTable(client, tableName);

      // Create table query
      await createTable(client, tableName, parsedData);

      // Insert data into the table
      await insertData(client, tableName, parsedData);

      console.log(`Data populated for table: ${tableName}`);
    }
  } catch (error) {
    console.error('Error populating sample data:', error);
  } finally {
    // Close the database connection
    await client.end();
  }
}

// Drop PostgreSQL table if it exists
async function dropTable(client: Client, tableName) {
  const dropTableQuery = `DROP TABLE IF EXISTS ${tableName};`;
  await client.query(dropTableQuery);
}

// Create PostgreSQL table
async function createTable(client, tableName, parsedData) {
  let createTableQuery = `CREATE TABLE IF NOT EXISTS ${tableName} (`;

  Object.keys(parsedData[0]).forEach((header) => {
    const columnName = header;
    const columnValues = parsedData.map((row) => row[header]);
    let dataType;

    // Analyze the data to determine the appropriate data type
    if (columnValues.every((value) => typeof value === 'string' && (value === null || value.length <= 255))) {
      dataType = 'VARCHAR';
    } else if (columnValues.every((value) => typeof value === 'number' || value === null)) {
      dataType = 'NUMERIC';
    } else if (columnValues.every((value) => value instanceof Date || value === null || !isNaN(Date.parse(value)))) {
      dataType = 'DATE';
    } else if (columnValues.every((value) => typeof value === 'boolean' || value === null)) {
      dataType = 'BOOLEAN';
    } else {
      dataType = 'VARCHAR(255)'; // Default to VARCHAR if data type is uncertain
    }

    createTableQuery += `${columnName
      .trim()
      .replace(/[^\w]/g, '_')
      .replace(/\s+/g, '_')
      .replace(/_+/g, '_')
      .replace(/^_+|_+$/g, '')
      .toLowerCase()} ${dataType}, `;
  });

  createTableQuery = createTableQuery.slice(0, -2); // Remove the last comma
  createTableQuery += ' );';

  console.log('creating table');
  await client.query(createTableQuery);
}

export async function runPopulateScript() {
  const { value: envVars, error } = buildAndValidateDatabaseConfig();
  if (error) return;
  populateSampleData(envVars);
}

// Insert data into PostgreSQL table
async function insertData(client: Client, tableName: string, data) {
  const keys = Object.keys(data[0]);
  const columns = keys
    .map((key) =>
      key
        .trim()
        .replace(/[^\w]/g, '_')
        .replace(/\s+/g, '_')
        .replace(/_+/g, '_')
        .replace(/^_+|_+$/g, '')
        .toLowerCase()
    )
    .join(', ');
  const rows = data.map((row) => keys.map((key) => row[key]));
  const insertQuery = `INSERT INTO ${tableName} (${columns}) VALUES ${rows
    .map(
      (row) =>
        `(${row
          .map((key, index) => {
            if (key === null || key === undefined) {
              return 'NULL';
            } else if (typeof key === 'string') {
              return `'${key.replace(/['",]/g, ' ')}'`; // Replace special characters only for strings
            } else if (typeof key === 'number' && !Number.isInteger(key)) {
              // For decimal numbers, convert them to string with proper decimal separator
              return key.toString().replace(',', '.');
            }
            return key; // For non-string, non-decimal values, leave them unchanged
          })
          .join(', ')})`
    )
    .join(', ')}`;

  await client.query(insertQuery);
}
