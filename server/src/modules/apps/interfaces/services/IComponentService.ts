import { EntityManager } from 'typeorm';
import { Component } from 'src/entities/component.entity';
import { Layout } from 'src/entities/layout.entity';
import { LayoutData } from '@modules/apps/dto/component';

/**
 * Context interfaces for history capture hooks
 */
export interface ComponentCreateContext {
  componentIds: string[];
  pageId: string;
  componentDiff: object;
  pageName: string;
}

export interface ComponentUpdateContext {
  componentIds: string[];
  componentDiff: object;
  oldComponentDtos: any[];
  pageName: string;
  componentNames: string[];
}

export interface ComponentDeleteContext {
  componentIds: string[];
  componentNames: string[];
  pageName: string;
  layoutIds: string[];
}

export interface ComponentLayoutContext {
  componentIds: string[];
  layoutDiff: Record<string, { layouts: LayoutData; component?: { parent: string } }>;
  oldLayoutDtos: any[];
  oldComponents: Component[];
  pageName: string;
  componentNames: string[];
}

export interface IComponentsService {
  findOne(id: string): Promise<Component>;
  create(componentDiff: object, pageId: string, appVersionId: string): Promise<any>;
  update(componentDiff: object, appVersionId: string): Promise<void | { error: { message: string } }>;
  delete(
    componentIds: string[],
    appVersionId: string,
    isComponentCut?: boolean
  ): Promise<void | { error: { message: string } }>;
  componentLayoutChange(
    componenstLayoutDiff: Record<string, { layouts: LayoutData; component?: { parent: string } }>,
    appVersionId: string
  ): Promise<void | { error: { message: string } }>;
  getAllComponents(pageId: string, manager?: EntityManager): Promise<Record<string, any>>;
  transformComponentData(data: object): Component[];
  createComponentWithLayout(
    componentData: Component,
    layoutData: Layout[],
    manager: EntityManager
  ): Record<string, any>;
  resolveGridPositionForComponent(dimension: number, type: string): number;
}
