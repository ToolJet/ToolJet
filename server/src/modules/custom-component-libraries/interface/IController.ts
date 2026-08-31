export interface ICustomComponentLibrariesController {
  create(user: any, body: { name: string }): Promise<{ id: string; name: string }>;
  get(user: any, id: string): Promise<any>;
  list(user: any): Promise<any>;
  deleteLibrary(user: any, id: string): Promise<void>;
}
