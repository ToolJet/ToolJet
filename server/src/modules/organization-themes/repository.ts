import { Injectable } from '@nestjs/common';
import { Repository, DataSource } from 'typeorm';
import { OrganizationThemes } from '@entities/organization_themes.entity';

@Injectable()
export class OrganizationThemesRepository extends Repository<OrganizationThemes> {
  constructor(private readonly dataSource: DataSource) {
    super(OrganizationThemes, dataSource.createEntityManager());
  }

  async findByOrganizationId(organizationId: string): Promise<OrganizationThemes[]> {
    return this.find({
      where: { organizationId },
      order: { updatedAt: 'DESC' },
    });
  }

  async findOneTheme(id: string, organizationId: string): Promise<OrganizationThemes | undefined> {
    return this.findOne({ where: { id, organizationId } });
  }

  async findDefaultTheme(organizationId: string): Promise<OrganizationThemes | null> {
    return this.findOne({
      where: { isDefault: true, organizationId },
    });
  }

  async findBasicTheme(organizationId: string): Promise<OrganizationThemes | null> {
    return this.findOne({
      where: { isBasic: true, organizationId },
    });
  }

  async findThemeById(id: string, organizationId: string): Promise<OrganizationThemes | null> {
    return this.findOne({
      where: { id, organizationId },
    });
  }
}
