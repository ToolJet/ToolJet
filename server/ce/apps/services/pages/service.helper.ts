import { CreatePageDto } from '@dto/pages.dto';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Page } from 'src/entities/page.entity';
import { dbTransactionForAppVersionAssociationsUpdate } from 'src/helpers/database.helper';
import { EntityManager, Repository } from 'typeorm';

@Injectable()
export class PageHelperService {
	constructor(
		@InjectRepository(Page)
		private pageRepository: Repository<Page>
	) { }

	private sanitizePage(page: Page): Page {
		return page;
	}

	public async fetchPages(appVersionId: string): Promise<Page[]> {
		const allPages = await this.pageRepository.find({
			where: {
				appVersionId
			},
			order: {
				index: 'ASC',
			},
		});
		return allPages.map((page) => this.sanitizePage(page));
	}

	public async reorderPages(udpateObject, appVersionId: string): Promise<void> {
		await dbTransactionForAppVersionAssociationsUpdate(async (manager: EntityManager) => {
			const updateArr = [];
			const diff = udpateObject.diff;
			Object.keys(diff).forEach((pageId) => {
				const index = diff[pageId].index;
				updateArr.push(manager.update(Page, pageId, { index }));
			});
			await Promise.all(updateArr);
		}, appVersionId);
	}

	public async rearrangePagesOrderPostDeletion(pageDeleted: Page, manager: EntityManager): Promise<void> {
		const appVersionId = pageDeleted.appVersionId;
		await dbTransactionForAppVersionAssociationsUpdate(async (manager: EntityManager) => {
			const pages = await this.pageRepository.find({
				where: {
					appVersionId: pageDeleted.appVersionId
				},
				order: {
					index: 'ASC',
				},
			});
			const updateArr = [];
			pages.forEach((page, index) => {
				updateArr.push(
					manager.update(Page, page.id, {
						index,
					})
				);
			});
			await Promise.all(updateArr);
		}, appVersionId);
	}

	public async deletePageGroup(page: Page, appVersionId: string, deleteAssociatedPages: boolean): Promise<void> { }

	public async preparePageObject(dto: CreatePageDto, appVersionId: string): Promise<Page> {
		const page = new Page();
		page.id = dto.id;
		page.name = dto.name;
		page.handle = dto.handle;
		page.appVersionId = appVersionId;
		page.autoComputeLayout = true;
		page.index = dto.index;
		return page;
	}
}
