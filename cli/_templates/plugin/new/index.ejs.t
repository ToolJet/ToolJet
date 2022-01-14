---
to: <%= plugins_path %>/packages/<%= name %>/lib/index.ts
---

import { QueryError, QueryResult,  QueryService } from 'common';

export default class <%= Name %> implements QueryService {
  async run(sourceOptions: any, queryOptions: any, dataSourceId: string): Promise<QueryResult> {}
}
