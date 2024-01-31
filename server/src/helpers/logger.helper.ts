import * as winston from 'winston';
import 'winston-daily-rotate-file';
const path = require('path');
const os = require('os');

export const auditlog = winston.format((info, opt) => {
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
  });
  transport.on('rotate', function (oldFilename, newFilename) {
    console.log(`Rotating old log file - ${oldFilename} and creating new log file ${newFilename}`);
  });
  return transport;
};

export const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  auditlog(),
  logForm
);
