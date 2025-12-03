import { readObjectFromLines } from '@modules/log-to-file/constants';
import { Injectable, OnApplicationShutdown } from '@nestjs/common';
import { join } from 'path';
import { homedir } from 'os';
import { ConfigService } from '@nestjs/config';
import { Logger } from 'nestjs-pino';

@Injectable()
export class ShutdownHook implements OnApplicationShutdown {
  constructor(private readonly configService: ConfigService,
    private readonly logger: Logger) {}
  async onApplicationShutdown(signal?: string): Promise<void> {
    const envFilePath = this.configService.get<string>('LOG_FILE_PATH');

    if (envFilePath) {
      this.logger.debug('Creating log json file before shutting down server');
      const absoluteLogDir = join(homedir(), envFilePath, 'tooljet_log');
      const currentDate = new Date();
      const formattedDate = currentDate.toISOString().slice(0, 10);
      const filePath = `${absoluteLogDir}/${process.pid}-${formattedDate}/audit.log`;
      readObjectFromLines(filePath);
      this.logger.debug('JSON log file for this process is created');
    }
  }
}
