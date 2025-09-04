export const workflowsText = {
  runjs: "runjs1",
  postgresql: "postgresql1",
  restapi: "restapi1",
  harperdb: "harperdb1",
  runjsInputField: "runjs-input-field",
  pgsqlQueryInputField: "query-input-field",
  harperdbInputField: "sql-query-input-field",
  restapiUrlInputField: "url-input-field",
  workflowNameInputField: "workflow-name-input",
  exportWFOption: "export-workflow",
  jsonKey: "key",
  jsonValue: "your value",
  workflowRunLogText: "A few seconds ago",
  responseNodeKey: "data",
  responseNodeLabel: "Response",
  responseNodeName: "response1",
  runjsNode: "Run JavaScript code",
  runjsCode: "return startTrigger.params",
  runjsResponse: "return runjs1.data",
  runjsExpectedValue: "your value",

  postgresQuery: `SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_type = 'BASE TABLE';`,
  postgresResponse: "return postgresql1.data",
  postgresExpectedValue: "employees",

  restApiUrl: "http://9.234.17.31:8000/delay/10s",
  restApiResponse: "return restapi1.data",
  restApiExpectedValue: "<!DOCTYPE html>",

  harperDbQuery: "SELECT * FROM tooljet_harper.tooljet_table;",
  harperDbMode: /sql/i,
  harperDbResponse: "return harperdb1.data",
  harperDbExpectedValue: "Test Record 3",
  harperDbPlugin: "HarperDB",
 
  runjsCodeForWebhooks: 'return "Verifying webhooks response"',
  runjsExpectedValueForWebhooks: "Verifying webhooks response",
  expectedStatus: 201,
  exportFixture: "cypress/fixtures/exportedApp.json",
};