import { DataSource as DataSourceEntity } from '@entities/data_source.entity';
import { createParamDecorator, ExecutionContext } from '@nestjs/common';

const DataSource = createParamDecorator((data: unknown, ctx: ExecutionContext): DataSourceEntity => {
  const request = ctx.switchToHttp().getRequest();
  return request.tj_data_source;
});

export { DataSourceEntity, DataSource };
