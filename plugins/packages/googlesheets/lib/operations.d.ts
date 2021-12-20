export declare function batchUpdateToSheet(spreadSheetId: string, requestBody: any, filterData: any, filterOperator: string, authHeader: any): Promise<unknown>;
export declare function readDataFromSheet(spreadSheetId: string, sheet: string, range: string, authHeader: any): Promise<any[]>;
export declare function readData(spreadSheetId: string, spreadsheetRange: string, sheet: string, authHeader: any): Promise<any[]>;
export declare function appendData(spreadSheetId: string, sheet: string, rows: any[], authHeader: any): Promise<any>;
export declare function deleteData(spreadSheetId: string, sheet: string, rowIndex: string, authHeader: any): Promise<any>;
//# sourceMappingURL=operations.d.ts.map