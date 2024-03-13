import * as fs from 'fs';
import * as path from 'path';
import { Client } from 'pg';
import * as xlsx from 'xlsx';
import * as Papa from 'papaparse';
// PostgreSQL connection configuration
function createPGconnetion(envVars): Client {
  return new Client({
    user: envVars.SAMPLE_PG_DB_USER,
    host: envVars.SAMPLE_PG_DB_HOST,
    database: envVars.SAMPLE_DB,
    password: envVars.SAMPLE_PG_DB_PASS,
    port: envVars.SAMPLE_PG_DB_PORT,
  });
}

const folderPath = path.join(__dirname, '../src/assets/sample-data-excel');
// Replace 'your_table_name' with the desired table name in your PostgreSQL database
// Read Excel file

export async function populateSampleData(envVars) {
  const client = createPGconnetion(envVars);
  try {
    fs.readdir(folderPath, async (err, files) => {
      if (err) {
        console.error('Error reading directory:', err);
        return;
      }
      client.connect();
      const filesToRead = fs.readdirSync(folderPath).filter((file) => !file.startsWith('.'));
      for (const file of filesToRead) {
        const filePath = path.join(folderPath, file);

        const workbook = xlsx.readFile(filePath);

        for (const sheetName of workbook.SheetNames) {
          const worksheet = workbook.Sheets[sheetName];
          const data = xlsx.utils.sheet_to_csv(worksheet);
          const parsedData = Papa.parse(data, { header: true, delimiter: ',', dynamicTyping: true });
          const tableName = `${file}_${sheetName}`.replace(/[^\w]/g, '').replace(/\s+/g, '_').toLowerCase();

          //Drop table it exist
          await dropTable(client, tableName);

          // Create table query
          console.log(parsedData.data[0]);
          await createTable(client, tableName, parsedData);

          //insert data to table
          await insertData(client, tableName, parsedData.data);
        }
      }
      client.end();
    });
  } catch (error) {
    console.error(error);
  }
}

// Drop PostgreSQL table if it exists
async function dropTable(client: Client, tableName) {
  console.log('Dropping tables');
  const dropTableQuery = `DROP TABLE IF EXISTS ${tableName};`;
  await client.query(dropTableQuery);
}

// Create PostgreSQL table
async function createTable(client, tableName, parsedData) {
  let createTableQuery = `CREATE TABLE IF NOT EXISTS ${tableName} (`;

  Object.keys(parsedData.data[0]).forEach((header) => {
    const columnName = header;
    const columnValues = parsedData.data.map((row) => row[header]);
    let dataType;

    // Analyze the data to determine the appropriate data type
    if (columnValues.every((value) => typeof value === 'string' && value.length <= 255)) {
      console.log('it is varchar');
      dataType = 'VARCHAR';
    } else if (columnValues.every((value) => typeof value === 'number')) {
      console.log('numeric ');
      dataType = 'NUMERIC';
    } else if (columnValues.every((value) => value instanceof Date || !isNaN(Date.parse(value)))) {
      console.log('date');
      dataType = 'DATE';
    } else {
      console.log('anything');
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
  console.log(createTableQuery);

  await client.query(createTableQuery);
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
  console.log(insertQuery.slice(0, 1000));

  await client.query(insertQuery);
  console.log(`Data inserted into ${tableName} successfully.`);
}
