"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteData = exports.appendData = exports.readData = exports.readDataFromSheet = exports.batchUpdateToSheet = void 0;
const got_1 = __importDefault(require("got"));
function makeRequestToReadValues(spreadSheetId, sheet, range, authHeader) {
    return __awaiter(this, void 0, void 0, function* () {
        const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadSheetId}/values/${sheet || ''}!${range}`;
        return yield got_1.default.get(url, { headers: authHeader }).json();
    });
}
function makeRequestToAppendValues(spreadSheetId, sheet, requestBody, authHeader) {
    return __awaiter(this, void 0, void 0, function* () {
        const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadSheetId}/values/${sheet || ''}!A:Z:append?valueInputOption=USER_ENTERED`;
        return yield got_1.default.post(url, { headers: authHeader, json: requestBody }).json();
    });
}
function makeRequestToDeleteRows(spreadSheetId, requestBody, authHeader) {
    return __awaiter(this, void 0, void 0, function* () {
        const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadSheetId}:batchUpdate`;
        return yield got_1.default.post(url, { headers: authHeader, json: requestBody }).json();
    });
}
//*BatchUpdate Cell values
function makeRequestToBatchUpdateValues(spreadSheetId, requestBody, authHeader) {
    return __awaiter(this, void 0, void 0, function* () {
        const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadSheetId}/values:batchUpdate`;
        return yield got_1.default.post(url, { headers: authHeader, json: requestBody }).json();
    });
}
function makeRequestToLookUpCellValues(spreadSheetId, range, authHeader) {
    return __awaiter(this, void 0, void 0, function* () {
        const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadSheetId}/values/${range}?majorDimension=COLUMNS`;
        return yield got_1.default.get(url, { headers: authHeader }).json();
    });
}
function batchUpdateToSheet(spreadSheetId, requestBody, filterData, filterOperator, authHeader) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!filterOperator) {
            return new Error('filterOperator is required');
        }
        const lookUpData = yield lookUpSheetData(spreadSheetId, authHeader);
        const updateBody = (requestBody, filterCondition, filterOperator, data) => {
            const rowsIndexes = getRowsIndex(filterCondition, filterOperator, data);
            const colIndexes = getInputKeys(requestBody, data);
            const updateCellIndexes = [];
            colIndexes.map((col) => {
                rowsIndexes.map((rowIndex) => updateCellIndexes.push(Object.assign(Object.assign({}, col), { cellIndex: `${col.colIndex}${rowIndex}` })));
            });
            const body = [];
            Object.entries(requestBody).map((item) => {
                updateCellIndexes.map((cell) => {
                    if (item[0] === cell.col) {
                        body.push({ cellValue: item[1], cellIndex: cell.cellIndex });
                    }
                });
            });
            const _data = body.map((data) => {
                return {
                    majorDimension: 'ROWS',
                    range: data.cellIndex,
                    values: [[data.cellValue]],
                };
            });
            return _data;
        };
        const reqBody = {
            data: updateBody(requestBody, filterData, filterOperator, lookUpData),
            valueInputOption: 'USER_ENTERED',
            includeValuesInResponse: true,
        };
        if (!reqBody.data)
            return new Error('No data to update');
        const response = yield makeRequestToBatchUpdateValues(spreadSheetId, reqBody, authHeader);
        return response;
    });
}
exports.batchUpdateToSheet = batchUpdateToSheet;
function readDataFromSheet(spreadSheetId, sheet, range, authHeader) {
    return __awaiter(this, void 0, void 0, function* () {
        const data = yield makeRequestToReadValues(spreadSheetId, sheet, range, authHeader);
        let headers = [];
        let values = [];
        const result = [];
        const dataValues = data['values'];
        if (dataValues) {
            headers = dataValues[0];
            values = dataValues.length > 1 ? dataValues.slice(1, dataValues.length) : [];
            for (const value of values) {
                const row = {};
                for (const [index, header] of headers.entries()) {
                    row[header] = value[index];
                }
                result.push(row);
            }
        }
        return result;
    });
}
exports.readDataFromSheet = readDataFromSheet;
function appendDataToSheet(spreadSheetId, sheet, rows, authHeader) {
    return __awaiter(this, void 0, void 0, function* () {
        const parsedRows = JSON.parse(rows);
        const sheetData = yield makeRequestToReadValues(spreadSheetId, sheet, 'A1:Z1', authHeader);
        const fullSheetHeaders = sheetData['values'][0];
        const rowsToAppend = parsedRows.map((row) => {
            const headersForAppendingRow = Object.keys(row);
            const rowData = [];
            headersForAppendingRow.forEach((appendDataHeader) => {
                const indexToInsert = fullSheetHeaders.indexOf(appendDataHeader);
                if (indexToInsert >= 0) {
                    rowData[indexToInsert] = row[appendDataHeader];
                }
            });
            return rowData;
        });
        const requestBody = { values: rowsToAppend };
        const response = yield makeRequestToAppendValues(spreadSheetId, sheet, requestBody, authHeader);
        return response;
    });
}
function deleteDataFromSheet(spreadSheetId, sheet, rowIndex, authHeader) {
    return __awaiter(this, void 0, void 0, function* () {
        const requestBody = {
            requests: [
                {
                    deleteDimension: {
                        range: {
                            sheetId: sheet,
                            dimension: 'ROWS',
                            startIndex: rowIndex - 1,
                            endIndex: rowIndex,
                        },
                    },
                },
            ],
        };
        const response = yield makeRequestToDeleteRows(spreadSheetId, requestBody, authHeader);
        return response;
    });
}
function readData(spreadSheetId, spreadsheetRange, sheet, authHeader) {
    return __awaiter(this, void 0, void 0, function* () {
        return yield readDataFromSheet(spreadSheetId, sheet, spreadsheetRange, authHeader);
    });
}
exports.readData = readData;
function appendData(spreadSheetId, sheet, rows, authHeader) {
    return __awaiter(this, void 0, void 0, function* () {
        return yield appendDataToSheet(spreadSheetId, sheet, rows, authHeader);
    });
}
exports.appendData = appendData;
function deleteData(spreadSheetId, sheet, rowIndex, authHeader) {
    return __awaiter(this, void 0, void 0, function* () {
        return yield deleteDataFromSheet(spreadSheetId, sheet, rowIndex, authHeader);
    });
}
exports.deleteData = deleteData;
function lookUpSheetData(spreadSheetId, authHeader) {
    return __awaiter(this, void 0, void 0, function* () {
        const responseLookUpCellValues = yield makeRequestToLookUpCellValues(spreadSheetId, 'A1:Z500', authHeader);
        const data = yield responseLookUpCellValues['values'];
        return data;
    });
}
//* utils
const getInputKeys = (inputBody, data) => {
    const keys = Object.keys(inputBody);
    const arr = [];
    keys.map((key) => data.filter((val, index) => {
        if (val[0] === key) {
            const kIndex = `${String.fromCharCode(65 + index)}`;
            arr.push({ col: val[0], colIndex: kIndex });
        }
    }));
    return arr;
};
const getRowsIndex = (inputFilter, filterOperator, response) => {
    const filterWithOperator = (type, array, value) => {
        switch (type) {
            case '===':
                return array === value;
            default:
                return false;
        }
    };
    const columnValues = response.filter((column) => column[0] === inputFilter.key).flat();
    if (columnValues.length === 0) {
        return -1;
    }
    const rowIndex = [];
    columnValues.forEach((col, index) => {
        const inputValue = typeof inputFilter.value !== 'string' ? JSON.stringify(inputFilter.value) : inputFilter.value;
        const isEqual = filterWithOperator(filterOperator, col, inputValue);
        if (isEqual) {
            rowIndex.push(index + 1);
        }
    });
    if (rowIndex.length === 0) {
        return -1;
    }
    return rowIndex;
};
//# sourceMappingURL=operations.js.map