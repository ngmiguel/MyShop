import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Category } from '../entities/category.entity';
import { CreateCategoryDto, UpdateCategoryDto } from './dto/category.dto';
import { AuthUser } from '../auth/jwt.strategy';
import { assertWriteAccess } from '../auth/write-access.helper';

@Injectable()
export class CategoriesService {
  constructor(
    @InjectRepository(Category)
    private readonly categoriesRepo: Repository<Category>,
  ) {}

  findAll(): Promise<Category[]> {
    return this.categoriesRepo.find({ order: { sortOrder: 'ASC', label: 'ASC' } });
  }

  async findOne(id: string): Promise<Category> {
    const category = await this.categoriesRepo.findOne({ where: { id } });
    if (!category) {
      throw new NotFoundException(`Category ${id} not found`);
    }
    return category;
  }

  async create(dto: CreateCategoryDto, user?: AuthUser): Promise<Category> {
    assertWriteAccess(user);
    const category = this.categoriesRepo.create({
      label: dto.label,
      icon: dto.icon,
      color: dto.color,
      subcategories: dto.subcategories ?? [],
      attributes: dto.attributes ?? [],
      sortOrder: dto.sortOrder ?? 0,
    });
    return this.categoriesRepo.save(category);
  }

  async update(id: string, dto: UpdateCategoryDto, user?: AuthUser): Promise<Category> {
    assertWriteAccess(user);
    const category = await this.findOne(id);
    Object.assign(category, {
      ...dto,
      subcategories: dto.subcategories ?? category.subcategories,
      attributes: dto.attributes ?? category.attributes,
    });
    return this.categoriesRepo.save(category);
  }

  async remove(id: string, user?: AuthUser): Promise<void> {
    assertWriteAccess(user);
    const category = await this.findOne(id);
    await this.categoriesRepo.remove(category);
  }
}
