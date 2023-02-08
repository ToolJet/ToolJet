import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from '../../src/app.module';
import { OrganizationsModule } from '../../src/modules/organizations/organizations.module';
import { OrganizationsService } from '../../src/services/organizations.service';

describe('OrganizationsService', () => {
  let service: OrganizationsService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [OrganizationsModule, AppModule],
      providers: [],
    }).compile();

    service = module.get<OrganizationsService>(OrganizationsService);
  });

  describe('getUniqOrgName', () => {
    it('should generate uniq org name everytime', async () => {
      const uniqOrgName = await service.getUniqOrgName();
      expect(uniqOrgName).toMatch(/Untitled workspace \d+/);

      const anotherUniqOrgName = await service.getUniqOrgName();
      expect(anotherUniqOrgName).toMatch(/Untitled workspace \d+/);

      expect(uniqOrgName).not.toBe(anotherUniqOrgName);
    });
  });
});
