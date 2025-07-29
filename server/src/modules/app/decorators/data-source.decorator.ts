import { DataSource as DataSourceEntity } from '@entities/data_source.entity';
import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { cloneDeep } from 'lodash';

const DataSource = createParamDecorator((data: unknown, ctx: ExecutionContext): DataSourceEntity => {
  const request = ctx.switchToHttp().getRequest();
  return cloneDeep(request.tj_data_source) as DataSourceEntity;
});

export { DataSourceEntity, DataSource };
