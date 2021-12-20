import { QueryResult } from 'common/lib/query_result.type';
import { QueryService } from 'common/lib/query_service.interface';
export default class StripeQueryService implements QueryService {
    authHeader(token: string): object;
    run(sourceOptions: any, queryOptions: any, dataSourceId: string): Promise<QueryResult>;
}
//# sourceMappingURL=stripe.d.ts.map