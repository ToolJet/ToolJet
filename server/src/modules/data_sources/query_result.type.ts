export type QueryResult = {
    status: 'ok' | 'failed',
    errorMessage?: string,
    data: Array<object> | object
}
