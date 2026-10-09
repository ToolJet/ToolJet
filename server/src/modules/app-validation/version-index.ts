import { EntityManager } from 'typeorm';
import { AppVersion } from '@entities/app_version.entity';
import { Component } from '@entities/component.entity';
import { DataQuery } from '@entities/data_query.entity';
import { Page } from '@entities/page.entity';

export interface IndexedComponent {
  id: string;
  name: string;
  type: string;
  parent: string | null;
  pageId: string;
}

export interface IndexedPage {
  id: string;
  name?: string;
  handle?: string;
  isPageGroup?: boolean;
  pageGroupId?: string | null;
  disabled?: boolean;
  hidden?: unknown;
}

export interface IndexedQuery {
  id: string;
  name: string;
  dataSourceId?: string;
}

export interface VersionIndexData {
  components?: IndexedComponent[];
  pages?: IndexedPage[];
  queries?: IndexedQuery[];
  homePageId?: string | null;
}

// Ids, names, types and parents of one app version; never full settings.
export class VersionIndex {
  readonly homePageId: string | null;
  private readonly componentsById = new Map<string, IndexedComponent>();
  private readonly componentsByPage = new Map<string, IndexedComponent[]>();
  private readonly pagesById = new Map<string, IndexedPage>();
  private readonly queriesById = new Map<string, IndexedQuery>();
  private readonly queriesByName = new Map<string, IndexedQuery[]>();

  private constructor(data: VersionIndexData) {
    this.homePageId = data.homePageId ?? null;
    for (const component of data.components ?? []) this.addComponent(component);
    for (const page of data.pages ?? []) this.pagesById.set(page.id, page);
    for (const query of data.queries ?? []) {
      this.queriesById.set(query.id, query);
      const sameName = this.queriesByName.get(query.name) ?? [];
      sameName.push(query);
      this.queriesByName.set(query.name, sameName);
    }
  }

  static fromData(data: VersionIndexData): VersionIndex {
    return new VersionIndex(data);
  }

  static async load(manager: EntityManager, appVersionId: string): Promise<VersionIndex> {
    const components: IndexedComponent[] = await manager
      .createQueryBuilder(Component, 'component')
      .innerJoin('component.page', 'page')
      .where('page.appVersionId = :appVersionId', { appVersionId })
      .select('component.id', 'id')
      .addSelect('component.name', 'name')
      .addSelect('component.type', 'type')
      .addSelect('component.parent', 'parent')
      .addSelect('component.pageId', 'pageId')
      .getRawMany();

    const pages: IndexedPage[] = await manager.find(Page, {
      where: { appVersionId },
      select: ['id', 'name', 'handle', 'isPageGroup', 'pageGroupId', 'disabled', 'hidden'],
    });

    const queries: IndexedQuery[] = await manager.find(DataQuery, {
      where: { appVersionId },
      select: ['id', 'name', 'dataSourceId'],
    });

    const version = await manager.findOne(AppVersion, { where: { id: appVersionId }, select: ['id', 'homePageId'] });

    return new VersionIndex({ components, pages, queries, homePageId: version?.homePageId });
  }

  // Adds components created or moved in the same request.
  withComponents(components: IndexedComponent[]): VersionIndex {
    const merged = new Map(this.componentsById);
    for (const component of components) merged.set(component.id, component);
    return new VersionIndex({
      components: [...merged.values()],
      pages: [...this.pagesById.values()],
      queries: [...this.queriesById.values()],
      homePageId: this.homePageId,
    });
  }

  component(id: string): IndexedComponent | undefined {
    return this.componentsById.get(id);
  }

  componentsOnPage(pageId: string): IndexedComponent[] {
    return this.componentsByPage.get(pageId) ?? [];
  }

  isComponentNameTaken(pageId: string, name: string, excludeIds: Iterable<string> = []): boolean {
    const excluded = new Set(excludeIds);
    return this.componentsOnPage(pageId).some((c) => c.name === name && !excluded.has(c.id));
  }

  page(id: string): IndexedPage | undefined {
    return this.pagesById.get(id);
  }

  pages(): IndexedPage[] {
    return [...this.pagesById.values()];
  }

  query(id: string): IndexedQuery | undefined {
    return this.queriesById.get(id);
  }

  queriesNamed(name: string): IndexedQuery[] {
    return this.queriesByName.get(name) ?? [];
  }

  private addComponent(component: IndexedComponent) {
    this.componentsById.set(component.id, component);
    const onPage = this.componentsByPage.get(component.pageId) ?? [];
    onPage.push(component);
    this.componentsByPage.set(component.pageId, onPage);
  }
}
