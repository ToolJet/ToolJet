import { QueryResult } from 'common/lib/query_result.type';
import { QueryService } from 'common/lib/query_service.interface';
export default class GraphqlQueryService implements QueryService {
    run(sourceOptions: any, queryOptions: any, dataSourceId: string): Promise<QueryResult>;
}
//# sourceMappingURL=graphql.d.ts.map