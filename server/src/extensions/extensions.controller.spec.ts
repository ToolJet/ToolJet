import { Test, TestingModule } from '@nestjs/testing';
import { ExtensionsController } from './extensions.controller';
import { ExtensionsService } from './extensions.service';

describe('ExtensionsController', () => {
  let controller: ExtensionsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ExtensionsController],
      providers: [ExtensionsService],
    }).compile();

    controller = module.get<ExtensionsController>(ExtensionsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
