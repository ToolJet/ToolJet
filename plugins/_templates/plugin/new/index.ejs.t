---
to: <%= plugins_path %>/packages/<%= name %>/lib/index.ts
---

import { QueryError, QueryResult,  QueryService } from 'common';
import { SourceOptions, QueryOptions } from './types'

export default class <%= Name %> implements QueryService {
  async run(sourceOptions: SourceOptions, queryOptions: QueryOptions, dataSourceId: string): Promise<QueryResult> {}
}
