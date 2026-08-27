// eslint-disable-next-line @typescript-eslint/ban-types
 export type SourceOptions = {};
 export type QueryOptions = {
   operation: string;
    from?: string;
    to?: string;
    body?: string;
    answerUrl?: string;
    answerMethod?: 'GET' | 'POST';
 };