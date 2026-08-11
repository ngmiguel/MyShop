import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { MeiliSearch, Index } from 'meilisearch';
import { Product } from '../entities/product.entity';

export const PRODUCTS_INDEX = 'products';

@Injectable()
export class MeilisearchService implements OnModuleInit {
  private readonly logger = new Logger(MeilisearchService.name);
  private client: MeiliSearch;
  private index: Index;

  async onModuleInit() {
    const host = process.env.MEILI_HOST || 'http://localhost:7700';
    const apiKey = process.env.MEILI_MASTER_KEY || '';

    this.client = new MeiliSearch({ host, apiKey });
    this.index = this.client.index(PRODUCTS_INDEX);

    try {
      await this.index.updateFilterableAttributes([
        'storeId',
        'categoryId',
        'price',
        'stock',
        'isActive',
      ]);
      await this.index.updateSearchableAttributes([
        'name',
        'description',
        'tags',
      ]);
      await this.index.updateSortableAttributes(['price', 'rating', 'createdAt']);
      this.logger.log('Meilisearch products index configured');
    } catch (error) {
      this.logger.warn(`Meilisearch init warning: ${(error as Error).message}`);
    }
  }

  toDocument(product: Product) {
    return {
      id: product.id,
      name: product.name,
      description: product.description || '',
      categoryId: product.categoryId,
      subcategoryId: product.subcategoryId,
      storeId: product.storeId,
      price: Number(product.price),
      compareAtPrice: product.compareAtPrice ? Number(product.compareAtPrice) : null,
      currency: product.currency,
      stock: product.stock,
      imageUrl: product.imageUrl,
      tags: product.tags || [],
      rating: Number(product.rating),
      isActive: product.isActive,
      createdAt: product.createdAt?.toISOString(),
    };
  }

  async indexProduct(product: Product): Promise<void> {
    try {
      await this.index.addDocuments([this.toDocument(product)]);
    } catch (error) {
      this.logger.error(`Failed to index product ${product.id}: ${(error as Error).message}`);
    }
  }

  async indexProducts(products: Product[]): Promise<void> {
    if (!products.length) return;
    try {
      await this.index.addDocuments(products.map((p) => this.toDocument(p)));
    } catch (error) {
      this.logger.error(`Failed to bulk index products: ${(error as Error).message}`);
    }
  }

  async removeProduct(id: string): Promise<void> {
    try {
      await this.index.deleteDocument(id);
    } catch (error) {
      this.logger.error(`Failed to remove product ${id} from index: ${(error as Error).message}`);
    }
  }

  async search(
    query: string,
    filters: {
      storeId?: string;
      categoryId?: string;
      minPrice?: number;
      maxPrice?: number;
      inStock?: boolean;
      limit?: number;
      offset?: number;
    },
  ): Promise<{ ids: string[]; total: number }> {
    const filterParts: string[] = ['isActive = true'];

    if (filters.storeId) {
      filterParts.push(`storeId = "${filters.storeId}"`);
    }
    if (filters.categoryId) {
      filterParts.push(`categoryId = "${filters.categoryId}"`);
    }
    if (filters.minPrice !== undefined) {
      filterParts.push(`price >= ${filters.minPrice}`);
    }
    if (filters.maxPrice !== undefined) {
      filterParts.push(`price <= ${filters.maxPrice}`);
    }
    if (filters.inStock) {
      filterParts.push('stock > 0');
    }

    try {
      const result = await this.index.search(query, {
        filter: filterParts.join(' AND '),
        limit: filters.limit ?? 50,
        offset: filters.offset ?? 0,
      });

      return {
        ids: result.hits.map((hit) => hit.id as string),
        total: result.estimatedTotalHits ?? result.hits.length,
      };
    } catch (error) {
      this.logger.error(`Meilisearch search failed: ${(error as Error).message}`);
      return { ids: [], total: 0 };
    }
  }
}
