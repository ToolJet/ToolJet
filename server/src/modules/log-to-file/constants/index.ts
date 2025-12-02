import * as winston from 'winston';
import { auditLog } from '@modules/audit-logs/constants';
import 'winston-daily-rotate-file';
import * as path from 'path';
import * as os from 'os';
import * as fs from 'fs';
import * as readline from 'readline';
import { createLogger } from '@helpers/bootstrap.helper';

const logForm = winston.format.printf((info) => `${info.timestamp} ${info.level} [${info.label}]: ${info.message}`);

export const logFileTransportConfig = (filePath, processId) => {
  const logger = createLogger('Log-to-file-transport');

  try {
    const absoluteLogDir = path.join(os.homedir(), filePath, 'tooljet_log');
    if (!fs.existsSync(absoluteLogDir)) {
      // Ensure the directory exists
      logger.log(`Creating log directory at ${absoluteLogDir}`);
      fs.mkdirSync(absoluteLogDir, { recursive: true });
      logger.log(`✅ Log directory created at ${absoluteLogDir}`);
    } else {
      logger.log(`✅ Log directory already exists at ${absoluteLogDir}`);
    }
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
      readObjectFromLines(oldFilename);
    });
    transport.on('error', (err) => {
      console.error('Log file generation error:', err);
    });
    return transport;
  } catch (error) {
    logger.error('❌ Error while creating log file transport:', error);
    throw error;
  }
};

export const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  auditLog(),
  logForm
);

export const readObjectFromLines = (logFilePath) => {
  const fileStream = fs.createReadStream(logFilePath);
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity,
  });

  let objectLines = [];
  const objectsList = [];

  rl.on('line', (line) => {
    if (line.trim() === '{' && objectLines.length !== 0) {
      const object = objectLines.join('\n');
      objectsList.push(object);
      objectLines = [];
    }
    objectLines.push(line);
  });

  rl.on('close', () => {
    const object = objectLines.join('\n');
    objectsList.push(object);
    const modifiedContent = `[ ${objectsList.join(',')} ]`;
    const jsonContent = JSON.stringify(eval(modifiedContent), null, 2);
    fs.writeFile(`${logFilePath}.json`, jsonContent, (err) => {
      if (err) {
        console.error('Error writing file:', err);
        return;
      }
    });
  });

  rl.on('error', (err) => {
    console.error('Error reading file:', err);
  });
};
