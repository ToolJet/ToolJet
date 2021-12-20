import { ConnectionTestResult } from 'common/lib/connection_test_result.type';
import { QueryResult } from 'common/lib/query_result.type';
import { QueryService } from 'common/lib/query_service.interface';
export default class FirestoreQueryService implements QueryService {
    run(sourceOptions: any, queryOptions: any): Promise<QueryResult>;
    testConnection(sourceOptions: object): Promise<ConnectionTestResult>;
    getConnection(sourceOptions: any): Promise<any>;
}
//# sourceMappingURL=firestore.d.ts.map