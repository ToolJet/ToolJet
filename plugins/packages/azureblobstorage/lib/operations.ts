export async function listContainers(client: any): Promise<string[]> {
  const options = {
    includeDeleted: false,
    includeMetadata: true,
    includeSystem: true,
    prefix: '',
  };
  const containers: string[] = [];
  for await (const containerItem of client.listContainers(options)) {
    containers.push(containerItem.name);
  }
  return containers;
}
