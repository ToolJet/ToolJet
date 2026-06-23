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

  private isDev() {
    return this.configService.get<string>('NODE_ENV') === 'development';
  }

  private getLogLevel() {
    const explicit = this.configService.get<string>('CUSTOM_QUERY_LOGGING_LEVEL');
    if (explicit) return explicit;
    if (this.isDev()) return 'query';
    // ORM_LOGGING=all → all queries; error → errors only; default: slow queries + errors
    const ormLogging = this.configService.get<string>('ORM_LOGGING');
    if (ormLogging === 'all') return 'query';
    if (ormLogging === 'error') return 'error';
    return 'warn';
  }

  private sanitizeQuery(query: string): string {
    if (this.isDev()) return query;
    const max = parseInt(this.configService.get<string>('QUERY_LOG_MAX_LENGTH') || '300', 10);
    return query.length > max ? `${query.slice(0, max)}...` : query;
  }

  private sanitizeParams(params?: any[]): string {
    if (!params || params.length === 0) return '';
    // ponytail: never log actual param values in non-dev — tokens leak through here
    if (this.isDev()) return ` -- PARAMETERS: ${JSON.stringify(params)}`;
    return ` -- PARAMETERS: [${params.length} value(s)]`;
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
    this.logger.error(`QUERY ERROR: ${error} ${this.sanitizeQuery(query)}${this.sanitizeParams(parameters)}`);
  }
  logQuery(query: string, parameters?: any[], queryRunner?: QueryRunner) {}

  logQuerySlow(time: number, query: string, parameters?: any[]) {
    if (this.getLogLevel() === 'error') {
      return;
    }
    if (this.getLogLevel() === 'query' || this.getLogLevel() === 'warn') {
      const q = `${this.sanitizeQuery(query)}${this.sanitizeParams(parameters)}`;
      if (time > 30) {
        this.logger.warn(`SLOW QUERY (${time} ms): ${q}`);
        return;
      }
      this.logger.log(`QUERY (${time} ms): ${q}`);
    }
  }
}
