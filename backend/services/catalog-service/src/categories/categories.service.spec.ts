import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { CategoriesService } from './categories.service';
import { Category } from '../entities/category.entity';

describe('CategoriesService (unit)', () => {
  let service: CategoriesService;
  const repo = { find: jest.fn(), findOne: jest.fn(), create: jest.fn(), save: jest.fn(), remove: jest.fn() };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CategoriesService,
        { provide: getRepositoryToken(Category), useValue: repo },
      ],
    }).compile();
    service = module.get(CategoriesService);
  });

  it('findAll retourne les catégories triées', async () => {
    repo.find.mockResolvedValue([{ id: '1', label: 'Mode', slug: 'mode' }]);
    const list = await service.findAll();
    expect(list).toHaveLength(1);
    expect(repo.find).toHaveBeenCalled();
  });
});
