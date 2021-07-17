import { QueryResult } from "./query_result.type";

export interface QueryService {
    run(sourceOptions: object, queryOptions: object, dataSourceId?: string) : Promise<QueryResult>,
    getConnection?(queryOptions: object) : Promise<object>
}
