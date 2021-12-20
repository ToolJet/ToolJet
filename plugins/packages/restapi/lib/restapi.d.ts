import { QueryResult } from 'common/lib/query_result.type';
import { QueryService } from 'common/lib/query_service.interface';
export default class RestapiQueryService implements QueryService {
    headers(sourceOptions: any, queryOptions: any, hasDataSource: boolean): object;
    body(sourceOptions: any, queryOptions: any, hasDataSource: boolean): object;
    searchParams(sourceOptions: any, queryOptions: any, hasDataSource: boolean): object;
    run(sourceOptions: any, queryOptions: any, dataSourceId: string): Promise<QueryResult>;
}
//# sourceMappingURL=restapi.d.ts.map