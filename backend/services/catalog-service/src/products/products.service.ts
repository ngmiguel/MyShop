import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository, SelectQueryBuilder } from 'typeorm';
import { Product } from '../entities/product.entity';
import {
  CreateProductDto,
  ProductQueryDto,
  UpdateProductDto,
} from './dto/product.dto';
import { MeilisearchService } from '../search/meilisearch.service';
import { AuthUser } from '../auth/jwt.strategy';
import { assertWriteAccess } from '../auth/write-access.helper';

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private readonly productsRepo: Repository<Product>,
    private readonly meiliService: MeilisearchService,
  ) {}

  private applyFilters(
    qb: SelectQueryBuilder<Product>,
    query: ProductQueryDto,
    ids?: string[],
  ): SelectQueryBuilder<Product> {
    if (ids !== undefined) {
      if (ids.length === 0) {
        qb.andWhere('1 = 0');
        return qb;
      }
      qb.andWhere('product.id IN (:...ids)', { ids });
    }

    if (query.storeId) {
      qb.andWhere('product.store_id = :storeId', { storeId: query.storeId });
    }
    if (query.categoryId) {
      qb.andWhere('product.category_id = :categoryId', { categoryId: query.categoryId });
    }
    if (query.minPrice !== undefined) {
      qb.andWhere('product.price >= :minPrice', { minPrice: query.minPrice });
    }
    if (query.maxPrice !== undefined) {
      qb.andWhere('product.price <= :maxPrice', { maxPrice: query.maxPrice });
    }
    if (query.inStock) {
      qb.andWhere('product.stock > 0');
    }

    qb.andWhere('product.is_active = true');
    return qb;
  }

  async findAll(query: ProductQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const offset = (page - 1) * limit;

    let searchIds: string[] | undefined;
    let searchTotal: number | undefined;

    if (query.search?.trim()) {
      const searchResult = await this.meiliService.search(query.search.trim(), {
        storeId: query.storeId,
        categoryId: query.categoryId,
        minPrice: query.minPrice,
        maxPrice: query.maxPrice,
        inStock: query.inStock,
        limit: 1000,
        offset: 0,
      });
      searchIds = searchResult.ids;
      searchTotal = searchResult.total;
    }

    const qb = this.productsRepo
      .createQueryBuilder('product')
      .leftJoinAndSelect('product.category', 'category');

    this.applyFilters(qb, query, searchIds);

    if (searchIds !== undefined) {
      qb.orderBy(
        `CASE product.id ${searchIds.map((id, i) => `WHEN '${id}' THEN ${i}`).join(' ')} ELSE ${searchIds.length} END`,
      );
    } else {
      qb.orderBy('product.created_at', 'DESC');
    }

    const [data, total] = await qb.skip(offset).take(limit).getManyAndCount();

    return {
      data,
      meta: {
        total: searchTotal ?? total,
        page,
        limit,
        totalPages: Math.ceil((searchTotal ?? total) / limit),
      },
    };
  }

  async findOne(id: string): Promise<Product> {
    const product = await this.productsRepo.findOne({
      where: { id },
      relations: ['category'],
    });
    if (!product) {
      throw new NotFoundException(`Product ${id} not found`);
    }
    return product;
  }

  async create(dto: CreateProductDto, user?: AuthUser): Promise<Product> {
    assertWriteAccess(user, dto.storeId);

    const product = this.productsRepo.create({
      name: dto.name,
      description: dto.description,
      categoryId: dto.categoryId,
      subcategoryId: dto.subcategoryId,
      storeId: dto.storeId,
      price: dto.price,
      compareAtPrice: dto.compareAtPrice,
      cost: dto.cost ?? 0,
      currency: dto.currency ?? 'XOF',
      stock: dto.stock ?? 0,
      imageUrl: dto.imageUrl,
      gallery: dto.gallery ?? [],
      variants: dto.variants ?? [],
      specs: dto.specs ?? {},
      tags: dto.tags ?? [],
      isActive: dto.isActive ?? true,
    });

    const saved = await this.productsRepo.save(product);
    await this.meiliService.indexProduct(saved);
    return this.findOne(saved.id);
  }

  async update(id: string, dto: UpdateProductDto, user?: AuthUser): Promise<Product> {
    const product = await this.findOne(id);
    assertWriteAccess(user, dto.storeId ?? product.storeId);

    Object.assign(product, {
      ...dto,
      gallery: dto.gallery ?? product.gallery,
      variants: dto.variants ?? product.variants,
      specs: dto.specs ?? product.specs,
      tags: dto.tags ?? product.tags,
    });

    const saved = await this.productsRepo.save(product);
    await this.meiliService.indexProduct(saved);
    return this.findOne(saved.id);
  }

  async remove(id: string, user?: AuthUser): Promise<void> {
    const product = await this.findOne(id);
    assertWriteAccess(user, product.storeId);
    await this.productsRepo.remove(product);
    await this.meiliService.removeProduct(id);
  }

  async findByIds(ids: string[]): Promise<Product[]> {
    if (!ids.length) return [];
    return this.productsRepo.find({
      where: { id: In(ids) },
      relations: ['category'],
    });
  }
}
