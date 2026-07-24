/**
 * Cypress Custom Tasks
 * All custom tasks for PDF reading, Excel parsing, file/folder operations, and database queries
 * Used by config.js
 */

const fs = require("fs");
const { rmdir } = require("fs");
const XLSX = require("node-xlsx");
const pg = require("pg");
const path = require("path");
const pdf = require("pdf-parse");

module.exports = (on) => {
  on("task", {
    // Read PDF file and extract text
    readPdf(pathToPdf) {
      return new Promise((resolve) => {
        const pdfPath = path.resolve(pathToPdf);
        let dataBuffer = fs.readFileSync(pdfPath);
        pdf(dataBuffer).then(function ({ text }) {
          resolve(text);
        });
      });
    },

    // Read Excel file and convert to JSON
    readXlsx(filePath) {
      return new Promise((resolve, reject) => {
        try {
          let dataBuffer = fs.readFileSync(filePath);
          const jsonData = XLSX.parse(dataBuffer);
          resolve(jsonData[0]["data"].toString());
        } catch (e) {
          reject(e);
        }
      });
    },

    // Delete a single file
    deleteFile(filePath) {
      return new Promise((resolve, reject) => {
        const fullPath = path.resolve(filePath);
        if (fs.existsSync(fullPath)) {
          fs.unlink(fullPath, (err) => {
            if (err) {
              console.error("Failed to delete file:", fullPath, err);
              return reject(err);
            }
            console.log("Deleted file:", fullPath);
            resolve(true);
          });
        } else {
          console.log("File not found, skipping delete:", fullPath);
          resolve(false);
        }
      });
    },

    // Delete folder recursively
    deleteFolder(folderName) {
      return new Promise((resolve, reject) => {
        if (fs.existsSync(folderName)) {
          rmdir(folderName, { maxRetries: 10, recursive: true }, (err) => {
            if (err) {
              console.error(err);
              return reject(err);
            }
            return resolve(null);
          });
        } else {
          return resolve(null);
        }
      });
    },

    // Execute PostgreSQL database queries
    dbConnection({ dbconfig, sql }) {
      const client = new pg.Pool(dbconfig);
      return client.query(sql).then(result => {
        return result;
      });
    },
  });
};
