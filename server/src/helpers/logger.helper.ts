import * as winston from 'winston';
import 'winston-daily-rotate-file';

export const auditlog = winston.format((info, opt) => {
  info.auditLog = info.options;
  delete info.options;
  info.label = info.auditLog.resourceType;
  return info;
});
const logForm = winston.format.printf((info) => `${info.timestamp} ${info.level} [${info.label}]: ${info.message}`);

export const logfileTransportConfig = (filePath, processId) => {
  let logPath = filePath;
  if (!logPath.endsWith('.log')) {
    logPath += '.log';
  }
  const transport = new winston.transports.DailyRotateFile({
    filename: `${logPath}`,
    level: 'info',
    zippedArchive: false,
    dirname: `tooljet/log/${processId}-%DATE%`,
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
