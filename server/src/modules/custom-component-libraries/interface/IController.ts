export interface ICustomComponentLibrariesController {
  create(user: any, body: { name: string }): Promise<{ id: string; name: string }>;
  findOrCreateLibrary(user: any, body: { correlationId: string; name: string }): Promise<any>;
  get(user: any, id: string): Promise<any>;
  list(user: any): Promise<any>;
  deleteLibrary(user: any, id: string): Promise<void>;
}
