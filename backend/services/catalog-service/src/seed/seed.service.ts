import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { Category } from '../entities/category.entity';
import { Product } from '../entities/product.entity';
import { MeilisearchService } from '../search/meilisearch.service';

const DEMO_STORE_IDS = [
  'a1000000-0000-4000-8000-000000000001',
  'a1000000-0000-4000-8000-000000000002',
  'a1000000-0000-4000-8000-000000000003',
];

const CATEGORY_SEED = [
  { label: 'Électronique', icon: 'devices', color: '#3B82F6', sortOrder: 1 },
  { label: 'Mode', icon: 'checkroom', color: '#EC4899', sortOrder: 2 },
  { label: 'Maison', icon: 'home', color: '#10B981', sortOrder: 3 },
  { label: 'Beauté', icon: 'spa', color: '#F59E0B', sortOrder: 4 },
  { label: 'Alimentation', icon: 'restaurant', color: '#EF4444', sortOrder: 5 },
  { label: 'Sport', icon: 'fitness_center', color: '#8B5CF6', sortOrder: 6 },
  { label: 'Jouets', icon: 'toys', color: '#06B6D4', sortOrder: 7 },
  { label: 'Auto', icon: 'directions_car', color: '#64748B', sortOrder: 8 },
  { label: 'Livres', icon: 'menu_book', color: '#78716C', sortOrder: 9 },
  { label: 'Services', icon: 'handyman', color: '#0EA5E9', sortOrder: 10 },
];

const PRODUCT_NAMES = [
  'Smartphone Galaxy A54',
  'Écouteurs Bluetooth Pro',
  'Montre connectée FitTrack',
  'Tablette 10 pouces',
  'Enceinte portable JBL',
  'T-shirt coton bio',
  'Jean slim fit',
  'Robe wax africaine',
  'Baskets running',
  'Sac à main cuir',
  'Set casseroles inox',
  'Aspirateur sans fil',
  'Lampe LED design',
  'Coussin décoratif',
  'Parfum eau de toilette',
  'Crème hydratante visage',
  'Huile capillaire naturelle',
  'Riz parfumé 5kg',
  'Huile de palme 1L',
  'Café moulu premium',
  'Ballon de football',
  'Tapis de yoga',
  'Raquette de tennis',
  'Vélo enfant 16"',
  'Puzzle 1000 pièces',
  'Kit peinture acrylique',
  'Huile moteur 5W30',
  'Dashcam HD',
  'Roman best-seller',
  'Cahier premium A5',
];

@Injectable()
export class SeedService {
  constructor(
    @InjectRepository(Category)
    private readonly categoriesRepo: Repository<Category>,
    @InjectRepository(Product)
    private readonly productsRepo: Repository<Product>,
    private readonly meiliService: MeilisearchService,
  ) {}

  async seed() {
    const existingCount = await this.categoriesRepo.count();
    if (existingCount > 0) {
      return {
        seeded: false,
        message: 'Catalog already contains data — seed skipped',
        categories: existingCount,
        products: await this.productsRepo.count(),
      };
    }

    const categories = await this.categoriesRepo.save(
      CATEGORY_SEED.map((c) =>
        this.categoriesRepo.create({
          ...c,
          subcategories: [{ id: 'default', label: 'Général' }],
          attributes: [],
        }),
      ),
    );

    const products: Product[] = [];
    for (let i = 0; i < 30; i++) {
      const category = categories[i % categories.length];
      const storeId = DEMO_STORE_IDS[i % DEMO_STORE_IDS.length];
      const basePrice = 2500 + (i * 3500) % 500000;

      products.push(
        this.productsRepo.create({
          name: PRODUCT_NAMES[i],
          description: `${PRODUCT_NAMES[i]} — produit démo MyShop, disponible en marketplace.`,
          categoryId: category.id,
          subcategoryId: 'default',
          storeId,
          price: basePrice,
          compareAtPrice: Math.round(basePrice * 1.15),
          cost: Math.round(basePrice * 0.6),
          currency: 'XOF',
          stock: 5 + (i % 20),
          imageUrl: `https://picsum.photos/seed/${uuidv4()}/400/400`,
          gallery: [],
          rating: 3.5 + (i % 15) / 10,
          reviewCount: i * 3,
          variants: [],
          specs: { brand: 'MyShop Demo', warranty: '12 mois' },
          tags: [category.label.toLowerCase(), 'demo', 'myshop'],
          views: i * 10,
          salesCount: i * 2,
          isActive: true,
        }),
      );
    }

    const savedProducts = await this.productsRepo.save(products);
    await this.meiliService.indexProducts(savedProducts);

    return {
      seeded: true,
      message: 'Created 10 categories and 30 products across 3 demo stores',
      categories: categories.length,
      products: savedProducts.length,
      storeIds: DEMO_STORE_IDS,
    };
  }
}
