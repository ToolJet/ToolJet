import { Logger, QueryRunner } from 'typeorm';
import { TransactionLogger } from '../service';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class TypeormLoggerService implements Logger {
  constructor(
    private readonly logger: TransactionLogger,
    private readonly configService: ConfigService
  ) {}
  private getLogLevel() {
    return this.configService.get<string>('CUSTOM_QUERY_LOGGING_LEVEL') || 'query';
  }
  logSchemaBuild(message: string, queryRunner?: QueryRunner) {
    this.logger.log(`SCHEMA BUILD: ${message}`);
  }
  logMigration(message: string, queryRunner?: QueryRunner) {
    this.logger.log(`MIGRATION: ${message}`);
  }
  log(level: 'log' | 'info' | 'warn', message: any, queryRunner?: QueryRunner) {
    if (this.getLogLevel() === 'error') {
      return;
    }
    if ((level === 'log' || level === 'info') && this.getLogLevel() !== 'warn') {
      this.logger.log(message);
    } else if (level === 'warn') {
      this.logger.warn(message);
    }
  }
  logQueryError(error: string | Error, query: string, parameters?: any[], queryRunner?: QueryRunner) {
    this.logger.error(`QUERY ERROR: ${error}`, query, '-- PARAMETERS:', parameters);
  }
  logQuery(query: string, parameters?: any[], queryRunner?: QueryRunner) {}

  logQuerySlow(time: number, query: string, parameters?: any[]) {
    if (this.getLogLevel() === 'error') {
      return;
    }
    if (this.getLogLevel() === 'query' || this.getLogLevel() === 'warn') {
      if (time > 30) {
        this.logger.warn(`SLOW QUERY (${time} ms):`, query, '-- PARAMETERS:', parameters);
        return;
      }
      this.logger.log(`QUERY (${time} ms):`, query, '-- PARAMETERS:', parameters);
    }
  }
}
