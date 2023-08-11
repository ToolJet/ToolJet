import { Injectable } from '@nestjs/common';
import { EntityManager, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';

import { Page } from 'src/entities/page.entity';
import { ComponentsService } from './components.service';

@Injectable()
export class PageService {
  constructor(
    private readonly manager: EntityManager,
    @InjectRepository(Page)
    private readonly pageRepository: Repository<Page>,

    private componentsService: ComponentsService
  ) {}

  async findPagesForVersion(appVersionId: string): Promise<Page[]> {
    const allPages = await this.pageRepository.find({ appVersionId });

    const pagesWithComponents = await Promise.all(
      allPages.map(async (page) => {
        const components = await this.componentsService.getAllComponents(page.id);
        delete page.appVersionId;
        return { ...page, components };
      })
    );

    return pagesWithComponents;
  }

  async findOne(id: string): Promise<Page> {
    return this.pageRepository.findOne(id);
  }
}
