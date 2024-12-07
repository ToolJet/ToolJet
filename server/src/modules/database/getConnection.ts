import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { setConnectionInstance } from '@helpers/database.helper';

@Injectable()
export class GetConnection {
  constructor(private readonly _dataSource: DataSource) {
    setConnectionInstance(this.dataSource);
  }

  private get dataSource() {
    return this._dataSource;
  }
}
