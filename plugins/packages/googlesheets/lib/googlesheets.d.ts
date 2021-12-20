import { QueryResult } from 'common/lib/query_result.type';
import { QueryService } from 'common/lib/query_service.interface';
export default class GooglesheetsQueryService implements QueryService {
    authUrl(): string;
    accessDetailsFrom(authCode: string): Promise<object>;
    authHeader(token: string): object;
    run(sourceOptions: any, queryOptions: any, dataSourceId: string): Promise<QueryResult>;
}
//# sourceMappingURL=googlesheets.d.ts.map