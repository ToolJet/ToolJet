export const workflowsText = {
  runjs: "runjs1",
  workflowNode: "workflows1",
  postgresqlNodeName: "postgresql1",
  restapiNodeName: "restapi1",
  harperdbNodeName: "harperdb1",
  runjsInputField: "runjs-input-field",
  pgsqlQueryInputField: "query-input-field",
  harperdbInputField: "sql-query-input-field",
  restapiUrlInputField: "url-input-field",
  workflowNameInputField: "workflow-name-input",
  exportWFOption: "export-workflow",
  jsonKeyPlaceholder: "key",
  jsonValuePlaceholder: "your value",
  workflowRunhelperText: "A few seconds ago",
  responseNodeKey: "data",
  responseNodeLabel: "Response",
  responseNodeName: "response1",
  runjsNodeLabel: "Run JavaScript code",
  workflowNodeLabel: "Run Workflow",
  runjsNodeCode: "return startTrigger.params",
  responseNodeQuery: "return runjs1.data",
  runjsNodeQueryForLargedataSet:
    "const bigArray = new Array(30000).fill(null).map((_, i) => 'test' + (i + 1)); const result = new Object(); result.data = bigArray; return result;",

  responseNodeExpectedValueTextForLargeDataset: "test1",
  workflowResponseNodeQuery: "return workflows1.data",
  responseNodeExpectedValueText: "your value",
  longStringJsonText:
    "ToolJet is an AI-native open-source low-code platform for building and deploying internal tools and business applications with minimal effort",
  postgresNodeQuery: `SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_type = 'BASE TABLE';`,
  postgresResponseNodeQuery: "return postgresql1.data",
  postgresExpectedValue: "server_side_pagination",

  restApiUrl: "http://9.234.17.31:8000/delay/10s",
  restApiResponseNodeQuery: "return restapi1.data",
  restApiExpectedValue: "<!DOCTYPE html>",

  harperDbNodeQuery: "SELECT * FROM tooljet_harper.tooljet_table;",
  harperDbNode: /sql/i,
  harperDbResponseNodeQuery: "return harperdb1.data",
  harperDbExpectedValue: "Test Record 3",
  harperDbPluginName: "HarperDB",

  runjsCodeForWebhooks: 'return "Verifying webhooks response"',
  runjsExpectedValueForWebhooks: "Verifying webhooks response",
  expectedStatusCodeText: 200,
  exportFixturePath: "cypress/fixtures/exportedApp.json",
  workflowLabel: "Workflow",
};
