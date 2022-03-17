'use strict';
const { makeRequestBodyToBatchUpdate } = require('../lib/operations');

describe('googlesheets', () => {
  it('should generate the request body for update operation', () => {
    const requestBody = {
      caseOne: { Gender: 'Female' },
      caseTwo: { extra: '0 points' },
      caseThree: { Gender: 'Female', extra: '0 points' },
    };
    const filterCondition = { key: 'Student Name', value: 'Anna' };
    const filterOperator = '===';
    const data = [
      ['ID', '1', '2'],
      ['Student Name', 'John', 'Anna'],
      ['Major', 'Science', 'English'],
      [],
      ['Gender', 'Male', 'Female'],
      [],
      [],
      [],
      [],
      [],
      [],
      [],
      [],
      [],
      [],
      [],
      [],
      [],
      [],
      [],
      [],
      [],
      [],
      [],
      [],
      [],
      [],
      ['extra', 'extra-update', '0 points'],
    ];

    const queryOptionsOne = { requestBody: requestBody.caseOne, filterCondition, filterOperator, data };
    const queryOptionsTwo = { requestBody: requestBody.caseTwo, filterCondition, filterOperator, data };
    const queryOptionsThree = { requestBody: requestBody.caseThree, filterCondition, filterOperator, data };

    const expectedBodyForCaseOne = makeRequestBodyToBatchUpdate(
      queryOptionsOne.requestBody,
      queryOptionsOne.filterCondition,
      queryOptionsOne.filterOperator,
      queryOptionsOne.data
    );
    const expectedBodyForCaseTwo = makeRequestBodyToBatchUpdate(
      queryOptionsTwo.requestBody,
      queryOptionsOne.filterCondition,
      queryOptionsOne.filterOperator,
      queryOptionsOne.data
    );
    const expectedBodyForCaseThree = makeRequestBodyToBatchUpdate(
      queryOptionsThree.requestBody,
      queryOptionsOne.filterCondition,
      queryOptionsOne.filterOperator,
      queryOptionsOne.data
    );

    expect(expectedBodyForCaseOne).toEqual([{ cellValue: 'Female', cellIndex: 'E3' }]);
    expect(expectedBodyForCaseTwo).toEqual([{ cellValue: '0 points', cellIndex: 'AB3' }]);
    expect(expectedBodyForCaseThree).toEqual([
      { cellValue: 'Female', cellIndex: 'E3' },
      { cellValue: '0 points', cellIndex: 'AB3' },
    ]);
  });
});
