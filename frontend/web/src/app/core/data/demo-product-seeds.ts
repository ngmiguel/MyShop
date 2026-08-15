import { Product } from '../models';
import { DEMO_STORES } from './demo-stores';

interface ProductSeed {
  name: string;
  categoryId: string;
  subcategoryId?: string;
  price: number;
  compareAtPrice?: number;
  storeIndex?: number;
}

/** Graines produits inspirées du prototype Boutika. */
export const PRODUCT_SEEDS: ProductSeed[] = [
  { name: 'Panier de tomates fraîches (5 kg)', categoryId: 'agro', subcategoryId: 'agro-frais', price: 4500 },
  { name: 'Régime de plantains mûrs', categoryId: 'agro', subcategoryId: 'agro-frais', price: 3200 },
  { name: 'Sac de riz parfumé 25 kg', categoryId: 'agro', subcategoryId: 'agro-epicerie', price: 21500 },
  { name: 'Huile de palme rouge 5 L', categoryId: 'agro', subcategoryId: 'agro-epicerie', price: 6800 },
  { name: 'Farine de manioc 10 kg', categoryId: 'agro', subcategoryId: 'agro-cereales', price: 7400 },
  { name: 'Jus de gingembre artisanal (pack 6)', categoryId: 'agro', subcategoryId: 'agro-boissons', price: 3900 },
  { name: 'Poulet de chair vivant', categoryId: 'animaux', subcategoryId: 'animaux-vivants', price: 4800 },
  { name: 'Chèvre naine sevrée', categoryId: 'animaux', subcategoryId: 'animaux-vivants', price: 68000 },
  { name: 'Aliment volaille croissance 50 kg', categoryId: 'animaux', subcategoryId: 'animaux-alimentation', price: 18500 },
  { name: 'Croquettes chien adulte 15 kg', categoryId: 'animaux', subcategoryId: 'animaux-alimentation', price: 22000 },
  { name: 'Toyota Corolla 2014 essence', categoryId: 'vehicules', subcategoryId: 'veh-voitures', price: 6500000, compareAtPrice: 7200000, storeIndex: 4 },
  { name: 'Suzuki Alto 2018', categoryId: 'vehicules', subcategoryId: 'veh-voitures', price: 4200000, storeIndex: 4 },
  { name: 'Moto Sanili 150 cc', categoryId: 'vehicules', subcategoryId: 'veh-motos', price: 620000 },
  { name: 'Tricycle utilitaire 200 cc', categoryId: 'vehicules', subcategoryId: 'veh-motos', price: 1450000 },
  { name: 'Batterie 12 V 70 Ah', categoryId: 'vehicules', subcategoryId: 'veh-pieces', price: 62000 },
  { name: 'Tube PVC 110 mm (barre 3 m)', categoryId: 'materiaux', subcategoryId: 'mat-plomberie', price: 8500 },
  { name: 'Sac de ciment 50 kg', categoryId: 'materiaux', subcategoryId: 'mat-maconnerie', price: 6300 },
  { name: 'Câble électrique 2,5 mm² (100 m)', categoryId: 'materiaux', subcategoryId: 'mat-electricite', price: 34000 },
  { name: 'Peinture acrylique blanche 20 L', categoryId: 'materiaux', subcategoryId: 'mat-peinture', price: 42000 },
  { name: 'Perceuse percussion 800 W', categoryId: 'materiaux', subcategoryId: 'mat-outillage', price: 38500 },
  { name: 'Ordinateur portable 15" i5 16 Go', categoryId: 'tech', subcategoryId: 'tech-ordinateurs', price: 465000, compareAtPrice: 520000, storeIndex: 1 },
  { name: 'Smartphone Galaxy A54 128 Go', categoryId: 'tech', subcategoryId: 'tech-telephones', price: 175000, compareAtPrice: 195000, storeIndex: 1 },
  { name: 'Smartphone reconditionné 64 Go', categoryId: 'tech', subcategoryId: 'tech-telephones', price: 89000, storeIndex: 1 },
  { name: 'Casque sans fil réduction de bruit', categoryId: 'tech', subcategoryId: 'tech-audio', price: 68000 },
  { name: 'Enceinte Bluetooth 40 W', categoryId: 'tech', subcategoryId: 'tech-audio', price: 42000 },
  { name: 'Disque SSD 1 To NVMe', categoryId: 'tech', subcategoryId: 'tech-composants', price: 78000 },
  { name: 'Alliance or 18 carats', categoryId: 'bijoux', subcategoryId: 'bij-or', price: 285000 },
  { name: 'Montre automatique acier', categoryId: 'bijoux', subcategoryId: 'bij-montres', price: 195000 },
  { name: 'Collier perles de rocaille', categoryId: 'bijoux', subcategoryId: 'bij-perles', price: 24000 },
  { name: 'Chemise en pagne sur mesure', categoryId: 'style', subcategoryId: 'style-vetements', price: 28000, storeIndex: 3 },
  { name: 'Robe wax cocktail', categoryId: 'style', subcategoryId: 'style-vetements', price: 42000, storeIndex: 3 },
  { name: 'Jean slim stretch', categoryId: 'style', subcategoryId: 'style-vetements', price: 18500, storeIndex: 3 },
  { name: 'Mocassins cuir véritable', categoryId: 'style', subcategoryId: 'style-chaussures', price: 55000 },
  { name: 'Sac à main cuir grainé', categoryId: 'style', subcategoryId: 'style-accessoires', price: 47000 },
  { name: 'Canapé 3 places tissu', categoryId: 'maison', subcategoryId: 'maison-meubles', price: 385000, compareAtPrice: 420000 },
  { name: 'Table à manger 6 couverts', categoryId: 'maison', subcategoryId: 'maison-meubles', price: 245000 },
  { name: 'Réfrigérateur combiné 260 L', categoryId: 'maison', subcategoryId: 'maison-electromenager', price: 385000 },
  { name: 'Set de casseroles inox (5 pièces)', categoryId: 'maison', subcategoryId: 'maison-cuisine', price: 46000 },
  { name: 'Beurre de karité pur 500 g', categoryId: 'beaute', subcategoryId: 'beaute-soins', price: 6500, storeIndex: 5 },
  { name: 'Sérum vitamine C 30 ml', categoryId: 'beaute', subcategoryId: 'beaute-soins', price: 18500, storeIndex: 5 },
  { name: 'Parfum boisé 100 ml', categoryId: 'beaute', subcategoryId: 'beaute-parfums', price: 52000, storeIndex: 5 },
  { name: 'Crème hydratante visage', categoryId: 'beaute', subcategoryId: 'beaute-soins', price: 8500, storeIndex: 5 },
  { name: 'Haltères réglables 20 kg', categoryId: 'sport', subcategoryId: 'sport-fitness', price: 78000, storeIndex: 6 },
  { name: 'Vélo VTT 21 vitesses', categoryId: 'sport', subcategoryId: 'sport-plein-air', price: 145000, storeIndex: 6 },
  { name: 'Ballon de football taille 5', categoryId: 'sport', subcategoryId: 'sport-collectif', price: 16500, storeIndex: 6 },
  { name: 'Roman best-seller', categoryId: 'livres', price: 6500, storeIndex: 7 },
  { name: 'Manuel scolaire mathématiques', categoryId: 'livres', price: 8500, storeIndex: 7 },
  { name: 'Cahier premium pack 10', categoryId: 'livres', price: 4500, storeIndex: 7 },
  { name: 'Jeu de construction 500 pcs', categoryId: 'jouets', price: 18000, storeIndex: 8 },
  { name: 'Poupée interactive', categoryId: 'jouets', price: 22000, storeIndex: 8 },
  { name: 'Tableau art local', categoryId: 'art', price: 75000, storeIndex: 9 },
  { name: 'Sculpture bois artisanale', categoryId: 'art', price: 95000, storeIndex: 9 },
  { name: 'Panneau solaire 300 W', categoryId: 'energie', price: 125000, storeIndex: 10 },
  { name: 'Batterie lithium 200 Ah', categoryId: 'energie', price: 285000, storeIndex: 10 },
  { name: 'Engrais NPK 50 kg', categoryId: 'agriculture', price: 22000, storeIndex: 11 },
  { name: 'Semences maïs hybrid 25 kg', categoryId: 'agriculture', price: 18500, storeIndex: 11 },
  { name: 'Installation climatisation', categoryId: 'services', price: 45000 },
  { name: 'Réparation smartphone express', categoryId: 'services', price: 15000, storeIndex: 1 },
];

export function buildProductsFromSeeds(enrich: (p: Product) => Product): Product[] {
  return PRODUCT_SEEDS.map((seed, index) => {
    const store = DEMO_STORES[seed.storeIndex ?? index % DEMO_STORES.length];
    const id = `prod-${seed.categoryId}-${index + 1}`;
    const product: Product = {
      id,
      name: seed.name,
      categoryId: seed.categoryId,
      subcategoryId: seed.subcategoryId,
      storeId: store.id,
      storeName: store.name,
      price: seed.price,
      compareAtPrice: seed.compareAtPrice,
      currency: 'XOF',
      stock: 3 + (index % 20),
      isActive: true,
      description: `${seed.name} — disponible en retrait boutique.`,
    };
    return enrich(product);
  });
}
