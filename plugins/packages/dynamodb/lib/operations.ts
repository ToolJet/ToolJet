import {
  ListTablesCommand,
  CreateTableCommand,
  DescribeTableCommand,
  DynamoDBClient,
  CreateTableCommandInput,
  DescribeTableCommandInput,
} from '@aws-sdk/client-dynamodb';
import {
  GetCommand,
  PutCommand,
  DeleteCommand,
  UpdateCommand,
  QueryCommand,
  ScanCommand,
  DynamoDBDocumentClient,
  GetCommandInput,
  PutCommandInput,
  DeleteCommandInput,
  UpdateCommandInput,
  QueryCommandInput,
  ScanCommandInput,
} from '@aws-sdk/lib-dynamodb';

export async function listTables(client: DynamoDBClient): Promise<object> {
  const command = new ListTablesCommand({});
  const data = await client.send(command);
  return data.TableNames || [];
}

export async function getItem(client: DynamoDBDocumentClient, table: string, key: object): Promise<object> {
  const params: GetCommandInput = {
    TableName: table,
    Key: key as Record<string, any>,
  };

  const command = new GetCommand(params);
  const data = await client.send(command);
  return data.Item || {};
}

export async function deleteItem(client: DynamoDBDocumentClient, table: string, key: object): Promise<object> {
  const params: DeleteCommandInput = {
    TableName: table,
    Key: key as Record<string, any>,
  };

  const command = new DeleteCommand(params);
  const data = await client.send(command);
  return data;
}

export async function queryTable(client: DynamoDBDocumentClient, queryCondition: object): Promise<object> {
  const command = new QueryCommand(queryCondition as QueryCommandInput);
  const data = await client.send(command);
  return data;
}

export async function scanTable(client: DynamoDBDocumentClient, scanCondition: object): Promise<object> {
  const command = new ScanCommand(scanCondition as ScanCommandInput);
  const data = await client.send(command);
  return data;
}

export async function updateItem(client: DynamoDBDocumentClient, updateCondition: object): Promise<object> {
  const command = new UpdateCommand(updateCondition as UpdateCommandInput);
  const data = await client.send(command);
  return data;
}

export async function describeTable(client: DynamoDBClient, table: string): Promise<object> {
  const params: DescribeTableCommandInput = {
    TableName: table,
  };

  const command = new DescribeTableCommand(params);
  const data = await client.send(command);
  return data;
}

export async function createTable(client: DynamoDBClient, tableParameters: object): Promise<object> {
  const command = new CreateTableCommand(tableParameters as CreateTableCommandInput);
  const data = await client.send(command);
  return data;
}

export async function putItem(client: DynamoDBDocumentClient, newItemDetails: object): Promise<object> {
  const command = new PutCommand(newItemDetails as PutCommandInput);
  const data = await client.send(command);
  return data;
}
