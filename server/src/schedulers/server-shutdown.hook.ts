import { Injectable, OnApplicationShutdown } from '@nestjs/common';
import { readObjectFromLines } from 'src/helpers/logger.helper';
const path = require('path');
const os = require('os');

@Injectable()
export class ShutdownService implements OnApplicationShutdown {
  async onApplicationShutdown(signal?: string): Promise<void> {
    console.log('Creating log json file before shutting down server');
    const envFilePath = process.env.LOG_FILE_PATH;

    if (envFilePath) {
      const absoluteLogDir = path.join(os.homedir(), envFilePath, 'tooljet_log');
      const currentDate = new Date();
      const formattedDate = currentDate.toISOString().slice(0, 10);
      const filePath = `${absoluteLogDir}/${process.pid}-${formattedDate}/audit.log`;
      readObjectFromLines(filePath);
      console.log('JSON log file for this process is created');
    }
  }
}
