import * as winston from 'winston';
import 'winston-daily-rotate-file';
const path = require('path');
const os = require('os');
const fs = require('fs');

const writeJsonFile = (filePath) => {
  // Read the contents of the file
  fs.readFile(filePath, 'utf8', (err, data) => {
    if (err) {
      console.error('Error reading file:', err);
      return;
    }
    // Append a comma to the end of the content
    const modifiedContent = data.trim() + ',\n';
    let jsonContent = '[' + modifiedContent + ']';
    jsonContent = JSON.stringify(eval(jsonContent), null, 2);

    // Write the modified content back to the file
    fs.writeFile(`${filePath}.json`, jsonContent, (err) => {
      if (err) {
        console.error('Error writing file:', err);
        return;
      }
    });
    fs.writeFile(filePath, modifiedContent, (err) => {
      if (err) {
        console.error('Error writing file:', err);
        return;
      }
    });
  });
};

export const auditlog = winston.format((info) => {
  info.auditLog = info.options;
  delete info.options;
  info.label = info.auditLog.resourceType;
  return info;
});
const logForm = winston.format.printf((info) => `${info.timestamp} ${info.level} [${info.label}]: ${info.message}`);

export const logfileTransportConfig = (filePath, processId) => {
  const absoluteLogDir = path.join(os.homedir(), filePath, 'tooljet_log');
  const transport = new winston.transports.DailyRotateFile({
    filename: `audit.log`,
    level: 'info',
    zippedArchive: false,
    dirname: `${absoluteLogDir}/${processId}-%DATE%`,
    datePattern: 'YYYY-MM-DD',
    format: winston.format.combine(winston.format.prettyPrint()),
    json: true,
  });
  transport.on('rotate', function (oldFilename, newFilename) {
    console.log(`Rotating old log file - ${oldFilename} and creating new log file ${newFilename}`);
  });
  transport.on('logged', function (transport) {
    const currentDate = new Date();
    const formattedDate = currentDate.toISOString().slice(0, 10);
    const filePath = `${absoluteLogDir}/${processId}-${formattedDate}/audit.log`;
    writeJsonFile(filePath);
  });
  return transport;
};

export const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  auditlog(),
  logForm
);
