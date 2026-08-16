import '../models/product.dart';
import '../models/store.dart';
import 'demo_images.dart';

class _ProductSeed {
  const _ProductSeed({
    required this.name,
    required this.categoryId,
    this.subcategoryId,
    required this.price,
    this.compareAtPrice,
    this.storeIndex,
  });

  final String name;
  final String categoryId;
  final String? subcategoryId;
  final double price;
  final double? compareAtPrice;
  final int? storeIndex;
}

/// Catalogue élargi inspiré du prototype Boutika (~90 articles).
const _productSeeds = [
  // Agro — Marché Fraîcheur
  _ProductSeed(name: 'Panier de tomates fraîches (5 kg)', categoryId: 'agro', subcategoryId: 'Fruits & legumes', price: 4500, storeIndex: 0),
  _ProductSeed(name: 'Régime de plantains mûrs', categoryId: 'agro', subcategoryId: 'Fruits & legumes', price: 3200, storeIndex: 0),
  _ProductSeed(name: 'Sac de riz parfumé 25 kg', categoryId: 'agro', subcategoryId: 'Cereales & tubercules', price: 21500, storeIndex: 0),
  _ProductSeed(name: 'Huile de palme rouge 5 L', categoryId: 'agro', subcategoryId: 'Huiles & matieres grasses', price: 6800, storeIndex: 0),
  _ProductSeed(name: 'Farine de manioc 10 kg', categoryId: 'agro', subcategoryId: 'Cereales & tubercules', price: 7400, storeIndex: 0),
  _ProductSeed(name: 'Jus de gingembre artisanal (pack 6)', categoryId: 'agro', subcategoryId: 'Boissons', price: 3900, storeIndex: 0),
  _ProductSeed(name: 'Café Arabica torréfié 500 g', categoryId: 'agro', subcategoryId: 'Cafe & cacao', price: 8900, compareAtPrice: 9900, storeIndex: 0),
  _ProductSeed(name: 'Cacao pur en poudre 250 g', categoryId: 'agro', subcategoryId: 'Cafe & cacao', price: 5400, storeIndex: 0),
  _ProductSeed(name: 'Coffret 6 épices locales', categoryId: 'agro', subcategoryId: 'Epices & condiments', price: 12500, storeIndex: 0),
  _ProductSeed(name: 'Miel d\'acacia 500 g', categoryId: 'agro', subcategoryId: 'Conserves & epicerie', price: 6800, compareAtPrice: 7500, storeIndex: 0),
  _ProductSeed(name: 'Panier de légumes de saison', categoryId: 'agro', subcategoryId: 'Fruits & legumes', price: 9500, storeIndex: 0),
  _ProductSeed(name: 'Jus de bissap artisanal 1 L', categoryId: 'agro', subcategoryId: 'Boissons', price: 3500, storeIndex: 0),

  // Tech — Digital Corner
  _ProductSeed(name: 'Ordinateur portable 15" i5 16 Go', categoryId: 'technologie', subcategoryId: 'Ordinateurs', price: 465000, compareAtPrice: 520000, storeIndex: 1),
  _ProductSeed(name: 'Smartphone Galaxy A54 128 Go', categoryId: 'technologie', subcategoryId: 'Telephones', price: 175000, compareAtPrice: 195000, storeIndex: 1),
  _ProductSeed(name: 'Smartphone reconditionné 64 Go', categoryId: 'technologie', subcategoryId: 'Telephones', price: 89000, storeIndex: 1),
  _ProductSeed(name: 'Casque sans fil réduction de bruit', categoryId: 'technologie', subcategoryId: 'Audio & son', price: 68000, compareAtPrice: 79000, storeIndex: 1),
  _ProductSeed(name: 'Enceinte Bluetooth 40 W', categoryId: 'technologie', subcategoryId: 'Audio & son', price: 42000, storeIndex: 1),
  _ProductSeed(name: 'Disque SSD 1 To NVMe', categoryId: 'technologie', subcategoryId: 'Composants & reseaux', price: 78000, storeIndex: 1),
  _ProductSeed(name: 'Écouteurs intra sans fil', categoryId: 'technologie', subcategoryId: 'Audio & son', price: 29900, storeIndex: 1),
  _ProductSeed(name: 'Chargeur rapide 65 W GaN', categoryId: 'technologie', subcategoryId: 'Accessoires & cables', price: 21500, storeIndex: 1),
  _ProductSeed(name: 'Manette sans fil gaming', categoryId: 'technologie', subcategoryId: 'Gaming', price: 34900, storeIndex: 1),
  _ProductSeed(name: 'Réparation smartphone express', categoryId: 'services', subcategoryId: 'Reparation & maintenance', price: 15000, storeIndex: 1),

  // Matériaux — Atelier Bâtir
  _ProductSeed(name: 'Tube PVC 110 mm (barre 3 m)', categoryId: 'materiaux', subcategoryId: 'Plomberie', price: 8500, storeIndex: 2),
  _ProductSeed(name: 'Sac de ciment 50 kg', categoryId: 'materiaux', subcategoryId: 'Maconnerie', price: 6300, compareAtPrice: 7000, storeIndex: 2),
  _ProductSeed(name: 'Câble électrique 2,5 mm² (100 m)', categoryId: 'materiaux', subcategoryId: 'Electricite', price: 34000, storeIndex: 2),
  _ProductSeed(name: 'Peinture acrylique blanche 20 L', categoryId: 'materiaux', subcategoryId: 'Peinture & revetements', price: 42000, storeIndex: 2),
  _ProductSeed(name: 'Perceuse percussion 800 W', categoryId: 'materiaux', subcategoryId: 'Outillage', price: 38500, storeIndex: 2),
  _ProductSeed(name: 'Kit plomberie PVC complet', categoryId: 'materiaux', subcategoryId: 'Plomberie', price: 45000, storeIndex: 2),
  _ProductSeed(name: 'Clé à molette pro 12"', categoryId: 'materiaux', subcategoryId: 'Outillage', price: 12500, storeIndex: 2),
  _ProductSeed(name: 'Brique creuse 15 — lot de 100', categoryId: 'materiaux', subcategoryId: 'Maconnerie', price: 68000, storeIndex: 2),
  _ProductSeed(name: 'Carrelage grès 60×60 — m²', categoryId: 'materiaux', subcategoryId: 'Carrelage & sanitaire', price: 9800, storeIndex: 2),

  // Style — Mode & Wax
  _ProductSeed(name: 'Chemise en pagne sur mesure', categoryId: 'style', subcategoryId: 'Sur-mesure', price: 28000, storeIndex: 3),
  _ProductSeed(name: 'Robe wax cocktail', categoryId: 'style', subcategoryId: 'Pret-a-porter femme', price: 42000, storeIndex: 3),
  _ProductSeed(name: 'Jean slim stretch', categoryId: 'style', subcategoryId: 'Pret-a-porter homme', price: 18500, storeIndex: 3),
  _ProductSeed(name: 'Chemise wax indigo', categoryId: 'style', subcategoryId: 'Pret-a-porter homme', price: 18500, compareAtPrice: 22000, storeIndex: 3),
  _ProductSeed(name: 'Robe longue Kente', categoryId: 'style', subcategoryId: 'Pret-a-porter femme', price: 32000, storeIndex: 3),
  _ProductSeed(name: 'Coupon wax premium 6 yards', categoryId: 'style', subcategoryId: 'Tissus & wax', price: 14000, storeIndex: 3),
  _ProductSeed(name: 'Tote bag atelier', categoryId: 'style', subcategoryId: 'Sacs & maroquinerie', price: 7000, storeIndex: 3),
  _ProductSeed(name: 'Mocassins cuir véritable', categoryId: 'style', subcategoryId: 'Chaussures', price: 55000, storeIndex: 3),
  _ProductSeed(name: 'Sac à main cuir grainé', categoryId: 'style', subcategoryId: 'Sacs & maroquinerie', price: 47000, storeIndex: 3),
  _ProductSeed(name: 'Coussin bogolan 45×45', categoryId: 'maison', subcategoryId: 'Decoration', price: 9500, storeIndex: 3),

  // Véhicules
  _ProductSeed(name: 'Toyota Corolla 2014 essence', categoryId: 'vehicules', subcategoryId: 'Voitures', price: 6500000, compareAtPrice: 7200000, storeIndex: 4),
  _ProductSeed(name: 'Suzuki Alto 2018', categoryId: 'vehicules', subcategoryId: 'Voitures', price: 4200000, storeIndex: 4),
  _ProductSeed(name: 'Scooter 125 cc neuf', categoryId: 'vehicules', subcategoryId: 'Motos & scooters', price: 895000, storeIndex: 4),
  _ProductSeed(name: 'Moto Sanili 150 cc', categoryId: 'vehicules', subcategoryId: 'Motos & scooters', price: 620000, storeIndex: 4),
  _ProductSeed(name: 'Tricycle utilitaire 200 cc', categoryId: 'vehicules', subcategoryId: 'Tricycles', price: 1450000, storeIndex: 4),
  _ProductSeed(name: 'Batterie 12 V 70 Ah', categoryId: 'vehicules', subcategoryId: 'Pieces detachees', price: 62000, storeIndex: 4),
  _ProductSeed(name: 'Pneu 195/65 R15', categoryId: 'vehicules', subcategoryId: 'Pneus & jantes', price: 42000, storeIndex: 4),

  // Beauté
  _ProductSeed(name: 'Beurre de karité pur 500 g', categoryId: 'beaute', subcategoryId: 'Soins du corps', price: 6500, storeIndex: 5),
  _ProductSeed(name: 'Sérum vitamine C 30 ml', categoryId: 'beaute', subcategoryId: 'Soins du visage', price: 18500, storeIndex: 5),
  _ProductSeed(name: 'Parfum boisé 100 ml', categoryId: 'beaute', subcategoryId: 'Parfums', price: 52000, storeIndex: 5),
  _ProductSeed(name: 'Crème hydratante visage', categoryId: 'beaute', subcategoryId: 'Soins du visage', price: 8500, storeIndex: 5),
  _ProductSeed(name: 'Sérum karité & baobab 50 ml', categoryId: 'beaute', subcategoryId: 'Soins du visage', price: 14500, storeIndex: 5),
  _ProductSeed(name: 'Huile capillaire ricin', categoryId: 'beaute', subcategoryId: 'Cheveux & perruques', price: 8900, storeIndex: 5),
  _ProductSeed(name: 'Savon noir exfoliant 150 g', categoryId: 'beaute', subcategoryId: 'Hygiene', price: 3500, storeIndex: 5),

  // Sport
  _ProductSeed(name: 'Haltères réglables 20 kg', categoryId: 'sport', subcategoryId: 'Fitness & musculation', price: 78000, storeIndex: 6),
  _ProductSeed(name: 'Vélo VTT 21 vitesses', categoryId: 'sport', subcategoryId: 'Cyclisme', price: 145000, storeIndex: 6),
  _ProductSeed(name: 'Ballon de football taille 5', categoryId: 'sport', subcategoryId: 'Football', price: 16500, storeIndex: 6),
  _ProductSeed(name: 'Tapis de yoga antidérapant', categoryId: 'sport', subcategoryId: 'Fitness & musculation', price: 12000, storeIndex: 6),
  _ProductSeed(name: 'Corde à sauter pro', categoryId: 'sport', subcategoryId: 'Fitness & musculation', price: 4500, storeIndex: 6),
  _ProductSeed(name: 'Chaussures running légères', categoryId: 'sport', subcategoryId: 'Running', price: 38500, compareAtPrice: 45000, storeIndex: 6),

  // Culture / livres
  _ProductSeed(name: 'Roman best-seller', categoryId: 'culture', subcategoryId: 'Livres', price: 6500, storeIndex: 7),
  _ProductSeed(name: 'Manuel scolaire mathématiques', categoryId: 'culture', subcategoryId: 'Livres', price: 8500, storeIndex: 7),
  _ProductSeed(name: 'Cahier premium pack 10', categoryId: 'culture', subcategoryId: 'Papeterie', price: 4500, storeIndex: 7),
  _ProductSeed(name: 'Dictionnaire bilingue FR-EN', categoryId: 'culture', subcategoryId: 'Livres', price: 12000, storeIndex: 7),
  _ProductSeed(name: 'Agenda 2026 cuir', categoryId: 'culture', subcategoryId: 'Papeterie', price: 8500, storeIndex: 7),

  // Enfance
  _ProductSeed(name: 'Jeu de construction 500 pcs', categoryId: 'enfance', subcategoryId: 'Eveil & educatif', price: 18000, storeIndex: 8),
  _ProductSeed(name: 'Poupée interactive', categoryId: 'enfance', subcategoryId: 'Jouets', price: 22000, storeIndex: 8),
  _ProductSeed(name: 'Puzzle géant 48 pièces', categoryId: 'enfance', subcategoryId: 'Eveil & educatif', price: 9500, storeIndex: 8),
  _ProductSeed(name: 'Trousse scolaire complète', categoryId: 'enfance', subcategoryId: 'Scolaire', price: 7500, storeIndex: 8),
  _ProductSeed(name: 'Voiture télécommandée', categoryId: 'enfance', subcategoryId: 'Jouets', price: 16500, storeIndex: 8),

  // Artisanat
  _ProductSeed(name: 'Tableau art local', categoryId: 'artisanat', subcategoryId: 'Sculpture & bois', price: 75000, storeIndex: 9),
  _ProductSeed(name: 'Sculpture bois artisanale', categoryId: 'artisanat', subcategoryId: 'Sculpture & bois', price: 95000, storeIndex: 9),
  _ProductSeed(name: 'Masque traditionnel peint', categoryId: 'artisanat', subcategoryId: 'Arts traditionnels', price: 45000, storeIndex: 9),
  _ProductSeed(name: 'Vannerie panier décoratif', categoryId: 'artisanat', subcategoryId: 'Vannerie', price: 18000, storeIndex: 9),
  _ProductSeed(name: 'Fauteuil rotin tressé', categoryId: 'maison', subcategoryId: 'Mobilier', price: 89000, compareAtPrice: 99000, storeIndex: 9),

  // Énergie
  _ProductSeed(name: 'Panneau solaire 300 W', categoryId: 'energie', subcategoryId: 'Panneaux solaires', price: 125000, storeIndex: 10),
  _ProductSeed(name: 'Batterie lithium 200 Ah', categoryId: 'energie', subcategoryId: 'Batteries & onduleurs', price: 285000, storeIndex: 10),
  _ProductSeed(name: 'Kit solaire 1 kW complet', categoryId: 'energie', subcategoryId: 'Panneaux solaires', price: 985000, storeIndex: 10),
  _ProductSeed(name: 'Lampe solaire nomade 300 lm', categoryId: 'energie', subcategoryId: 'Lampes solaires', price: 15900, compareAtPrice: 18900, storeIndex: 10),
  _ProductSeed(name: 'Régulateur MPPT 40 A', categoryId: 'energie', subcategoryId: 'Cablage & regulation', price: 78000, storeIndex: 10),
  _ProductSeed(name: 'Groupe électrogène 3,5 kVA', categoryId: 'energie', subcategoryId: 'Groupes electrophores', price: 465000, storeIndex: 10),

  // Agriculture
  _ProductSeed(name: 'Engrais NPK 50 kg', categoryId: 'agriculture', subcategoryId: 'Engrais & traitements', price: 22000, storeIndex: 11),
  _ProductSeed(name: 'Semences maïs hybrid 25 kg', categoryId: 'agriculture', subcategoryId: 'Semences', price: 18500, storeIndex: 11),
  _ProductSeed(name: 'Pulvérisateur dorsal 16 L', categoryId: 'agriculture', subcategoryId: 'Materiel agricole', price: 28000, storeIndex: 11),
  _ProductSeed(name: 'Brouette renforcée', categoryId: 'agriculture', subcategoryId: 'Materiel agricole', price: 42000, storeIndex: 11),

  // Animaux
  _ProductSeed(name: 'Poulet de chair vivant', categoryId: 'animaux', subcategoryId: 'Volaille', price: 4800, storeIndex: 0),
  _ProductSeed(name: 'Chèvre naine sevrée', categoryId: 'animaux', subcategoryId: 'Betail', price: 68000, storeIndex: 11),
  _ProductSeed(name: 'Aliment volaille croissance 50 kg', categoryId: 'animaux', subcategoryId: 'Alimentation animale', price: 18500, storeIndex: 11),
  _ProductSeed(name: 'Croquettes chien adulte 15 kg', categoryId: 'animaux', subcategoryId: 'Alimentation animale', price: 22000, storeIndex: 0),
  _ProductSeed(name: 'Lot de 10 poussins pondeuse', categoryId: 'animaux', subcategoryId: 'Volaille', price: 28000, storeIndex: 11),

  // Bijoux / maison / services divers
  _ProductSeed(name: 'Alliance or 18 carats', categoryId: 'bijoux', subcategoryId: 'Or', price: 285000, storeIndex: 9),
  _ProductSeed(name: 'Montre automatique acier', categoryId: 'bijoux', subcategoryId: 'Montres', price: 195000, storeIndex: 9),
  _ProductSeed(name: 'Collier perles de rocaille', categoryId: 'bijoux', subcategoryId: 'Perles & pierres', price: 24000, storeIndex: 9),
  _ProductSeed(name: 'Bracelet perles & ébène', categoryId: 'bijoux', subcategoryId: 'Bijoux artisanaux', price: 18500, storeIndex: 9),
  _ProductSeed(name: 'Canapé 3 places tissu', categoryId: 'maison', subcategoryId: 'Mobilier', price: 385000, compareAtPrice: 420000, storeIndex: 3),
  _ProductSeed(name: 'Table à manger 6 couverts', categoryId: 'maison', subcategoryId: 'Mobilier', price: 245000, storeIndex: 3),
  _ProductSeed(name: 'Réfrigérateur combiné 260 L', categoryId: 'maison', subcategoryId: 'Electromenager', price: 385000, storeIndex: 1),
  _ProductSeed(name: 'Set de casseroles inox (5 pièces)', categoryId: 'maison', subcategoryId: 'Cuisine & vaisselle', price: 46000, storeIndex: 5),
  _ProductSeed(name: 'Installation climatisation', categoryId: 'services', subcategoryId: 'Installation & pose', price: 45000, storeIndex: 2),
];

final demoStores = [
  StoreModel(
    id: 'demo-store-1',
    name: 'Marché Fraîcheur Akwa',
    city: 'Douala',
    address: '124 rue Joss, Akwa',
    tagline: 'Produits frais du Littoral',
    shortDescription: 'Épicerie fine et circuit court.',
    description:
        'Fruits, légumes, épices et boissons artisanales. Approvisionnement quotidien auprès des producteurs du Littoral.',
    phone: '+237 6 77 12 44 90',
    email: 'contact@marchefraicheur.cm',
    mainCategory: 'agro',
    categories: const ['Fruits & legumes', 'Cafe & cacao', 'Boissons', 'Epices & condiments'],
    status: 'active',
    delivery: true,
    pickup: true,
    lat: 4.0492,
    lng: 9.7008,
    serviceRadiusKm: 12,
  ),
  StoreModel(
    id: 'demo-store-2',
    name: 'Digital Corner Bonanjo',
    city: 'Douala',
    address: '7 bd de la Liberté',
    tagline: 'Tech & accessoires',
    shortDescription: 'La tech testée avant la vente.',
    description:
        'Ordinateurs, smartphones, audio et accessoires garantis 12 mois. Atelier de réparation express sur place.',
    phone: '+237 6 55 90 12 33',
    email: 'hello@digitalcorner.cm',
    mainCategory: 'technologie',
    categories: const ['Ordinateurs', 'Telephones', 'Audio & son', 'Gaming'],
    status: 'active',
    delivery: true,
    pickup: true,
    lat: 4.0421,
    lng: 9.6899,
    serviceRadiusKm: 20,
  ),
  StoreModel(
    id: 'demo-store-3',
    name: 'Atelier Bâtir Deido',
    city: 'Douala',
    address: '45 avenue Deido',
    tagline: 'Matériaux & outillage',
    shortDescription: 'Chantier prêt en un passage.',
    description: 'Plomberie, maçonnerie, électricité et outillage pro pour particuliers et entreprises.',
    phone: '+237 6 99 45 10 22',
    email: 'devis@atelierbatir.cm',
    mainCategory: 'materiaux',
    categories: const ['Plomberie', 'Maconnerie', 'Electricite', 'Outillage'],
    status: 'active',
    pickup: true,
    lat: 4.0653,
    lng: 9.7115,
    serviceRadiusKm: 15,
  ),
  StoreModel(
    id: 'st-4',
    name: 'Mode & Wax Bastos',
    city: 'Yaoundé',
    address: '12 rue Bastos',
    tagline: 'Wax & prêt-à-porter',
    shortDescription: 'Le wax revisité, tous les jours.',
    description: 'Prêt-à-porter, tissus et confection sur mesure en 48h.',
    phone: '+237 6 72 88 11 05',
    email: 'atelier@modewax.cm',
    mainCategory: 'style',
    categories: const ['Pret-a-porter femme', 'Pret-a-porter homme', 'Tissus & wax', 'Sur-mesure'],
    status: 'active',
    delivery: true,
    pickup: true,
    lat: 3.8667,
    lng: 11.5167,
    serviceRadiusKm: 10,
  ),
  StoreModel(
    id: 'st-5',
    name: 'Auto Plus Mvan',
    city: 'Yaoundé',
    address: 'Carrefour Mvan',
    tagline: 'Véhicules & pièces',
    shortDescription: 'Rouler sûr, payer juste.',
    description: 'Véhicules d’occasion contrôlés, motos neuves et pièces détachées.',
    phone: '+237 6 80 33 70 14',
    email: 'vente@autoplus.cm',
    mainCategory: 'vehicules',
    categories: const ['Voitures', 'Motos & scooters', 'Pieces detachees', 'Pneus & jantes'],
    status: 'active',
    pickup: true,
    lat: 3.848,
    lng: 11.5021,
  ),
  StoreModel(
    id: 'st-6',
    name: 'Beauty Palace',
    city: 'Douala',
    address: 'Bonapriso',
    tagline: 'Beauté & parfums',
    shortDescription: 'Cosmétique naturelle, formulée ici.',
    description: 'Huiles, beurres et sérums à base de karité. Ateliers le samedi.',
    phone: '+237 6 71 04 55 21',
    email: 'soin@beautypalace.cm',
    mainCategory: 'beaute',
    categories: const ['Soins du corps', 'Soins du visage', 'Parfums', 'Hygiene'],
    status: 'active',
    delivery: true,
    pickup: true,
    lat: 4.0123,
    lng: 9.6544,
    serviceRadiusKm: 8,
  ),
  StoreModel(
    id: 'st-7',
    name: 'Sport Arena',
    city: 'Douala',
    address: 'Makepe',
    tagline: 'Équipements sportifs',
    shortDescription: 'Fitness, running et sports collectifs.',
    description: 'Matériel fitness, vélo, football et running pour tous les niveaux.',
    phone: '+237 6 93 21 45 60',
    email: 'hello@sportarena.cm',
    mainCategory: 'sport',
    categories: const ['Fitness & musculation', 'Cyclisme', 'Football', 'Running'],
    status: 'active',
    pickup: true,
    lat: 4.0789,
    lng: 9.7234,
  ),
  StoreModel(
    id: 'st-8',
    name: 'Librairie Centrale',
    city: 'Yaoundé',
    address: 'Centre-ville',
    tagline: 'Livres & papeterie',
    shortDescription: 'Culture et fournitures scolaires.',
    description: 'Romans, manuels scolaires et papeterie premium.',
    phone: '+237 6 22 10 88 41',
    email: 'contact@librairiecentrale.cm',
    mainCategory: 'culture',
    categories: const ['Livres', 'Papeterie'],
    status: 'pause',
    pickup: true,
    lat: 3.848,
    lng: 11.5021,
  ),
  StoreModel(
    id: 'st-9',
    name: 'Kids Paradise',
    city: 'Douala',
    address: 'Logpom',
    tagline: 'Jouets & enfance',
    shortDescription: 'Éveil, jeux et scolaire.',
    description: 'Jouets éducatifs, puzzles et fournitures pour enfants.',
    phone: '+237 6 76 55 09 18',
    email: 'bonjour@kidsparadise.cm',
    mainCategory: 'enfance',
    categories: const ['Jouets', 'Eveil & educatif', 'Scolaire'],
    status: 'active',
    delivery: true,
    pickup: true,
    lat: 4.0912,
    lng: 9.7456,
    serviceRadiusKm: 10,
  ),
  StoreModel(
    id: 'st-10',
    name: 'Galerie Artisans',
    city: 'Bafoussam',
    address: 'Marché A',
    tagline: 'Art & artisanat local',
    shortDescription: 'Créations made in Cameroun.',
    description: 'Sculptures, tableaux, bijoux artisanaux et mobilier en rotin.',
    phone: '+237 6 98 40 12 77',
    email: 'galerie@artisans.cm',
    mainCategory: 'artisanat',
    categories: const ['Sculpture & bois', 'Arts traditionnels', 'Bijoux artisanaux'],
    status: 'brouillon',
    pickup: true,
    lat: 5.4737,
    lng: 10.4177,
  ),
  StoreModel(
    id: 'st-11',
    name: 'Énergie Verte CM',
    city: 'Douala',
    address: 'PK8',
    tagline: 'Solaire & batteries',
    shortDescription: 'Autonomie énergétique accessible.',
    description: 'Kits solaires, batteries lithium et groupes électrogènes.',
    phone: '+237 6 85 70 33 19',
    email: 'info@energieverte.cm',
    mainCategory: 'energie',
    categories: const ['Panneaux solaires', 'Batteries & onduleurs', 'Lampes solaires'],
    status: 'active',
    delivery: true,
    pickup: true,
    lat: 4.1234,
    lng: 9.7890,
    serviceRadiusKm: 25,
  ),
  StoreModel(
    id: 'st-12',
    name: 'Agro Cameroun',
    city: 'Garoua',
    address: 'Zone industrielle',
    tagline: 'Intrants agricoles',
    shortDescription: 'Semences, engrais et matériel.',
    description: 'Tout pour la ferme : semences, engrais, élevage et outillage.',
    phone: '+237 6 90 15 62 40',
    email: 'vente@agrocameroun.cm',
    mainCategory: 'agriculture',
    categories: const ['Semences', 'Engrais & traitements', 'Materiel agricole', 'Alimentation animale'],
    status: 'active',
    pickup: true,
    lat: 9.3265,
    lng: 13.3958,
  ),
].map(enrichStore).toList();

final List<ProductModel> demoProducts = _buildDemoProducts();

List<ProductModel> _buildDemoProducts() {
  return _productSeeds.asMap().entries.map((entry) {
    final index = entry.key;
    final seed = entry.value;
    final store = demoStores[seed.storeIndex ?? index % demoStores.length];
    final id = 'prod-${seed.categoryId}-${index + 1}';
    return enrichProduct(
      ProductModel(
        id: id,
        name: seed.name,
        storeId: store.id,
        price: seed.price,
        compareAtPrice: seed.compareAtPrice,
        stock: 3 + (index % 40),
        categoryId: seed.categoryId,
        subcategoryId: seed.subcategoryId,
        description:
            '${seed.name} — disponible en retrait boutique chez ${store.name}.',
        isActive: true,
      ),
    );
  }).toList();
}

ProductModel? demoProductById(String id) {
  try {
    return demoProducts.firstWhere((p) => p.id == id);
  } catch (_) {
    return null;
  }
}

StoreModel? demoStoreById(String id) {
  try {
    return demoStores.firstWhere((s) => s.id == id);
  } catch (_) {
    return null;
  }
}

List<ProductModel> filterDemoProducts({String? city, String? search, String? storeId}) {
  var stores = demoStores;
  if (city != null && city.isNotEmpty) {
    final filtered = stores.where((s) => s.city == city).toList();
    if (filtered.isNotEmpty) stores = filtered;
  }
  final storeIds = storeId != null ? {storeId} : stores.map((s) => s.id).toSet();
  var products = demoProducts.where((p) => storeIds.contains(p.storeId)).toList();
  if (search != null && search.trim().isNotEmpty) {
    final q = search.trim().toLowerCase();
    products = products.where((p) => p.name.toLowerCase().contains(q)).toList();
  }
  return products;
}

List<StoreModel> filterDemoStores({String? city}) {
  if (city == null || city.isEmpty) return demoStores;
  final filtered = demoStores.where((s) => s.city == city).toList();
  return filtered.isNotEmpty ? filtered : demoStores;
}
