import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';

@Injectable()
export class GetConnection {
  constructor(private _dataSource?: DataSource) {}

  get dataSource() {
    return this._dataSource;
  }
}
