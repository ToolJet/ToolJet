import { QueryResult } from "./query_result.type";

export interface QueryService {
    run(sourceOptions: object, queryOptions: object): Promise<QueryResult>
}
