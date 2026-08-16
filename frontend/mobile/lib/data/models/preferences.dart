import 'package:flutter/material.dart';

class UserPreferences {
  const UserPreferences({
    this.onboardingDone = false,
    this.intention = 'quotidien',
    this.domains = const [],
    this.subcategories = const [],
    this.budget = 'illimite',
    this.city = 'Douala',
    this.radiusKm = 15,
    this.preferredMode = 'peu-importe',
    this.promosOnly = false,
    this.localOnly = true,
    this.themeMode = 'systeme',
    this.textScale = 'normal',
    this.density = 'confortable',
    this.reduceMotion = false,
    this.scannerSound = true,
    this.scannerVibrate = true,
    this.scannerAutoConfirm = false,
  });

  final bool onboardingDone;
  final String intention;
  final List<String> domains;
  final List<String> subcategories;
  final String budget;
  final String city;
  final int radiusKm;
  final String preferredMode;
  final bool promosOnly;
  final bool localOnly;
  final String themeMode;
  final String textScale; // compact | normal | large
  final String density; // compact | confortable
  final bool reduceMotion;
  final bool scannerSound;
  final bool scannerVibrate;
  final bool scannerAutoConfirm;

  double get textScaleFactor => switch (textScale) {
        'compact' => 0.92,
        'large' => 1.12,
        _ => 1.0,
      };

  VisualDensity get visualDensity =>
      density == 'compact' ? VisualDensity.compact : VisualDensity.comfortable;

  UserPreferences copyWith({
    bool? onboardingDone,
    String? intention,
    List<String>? domains,
    List<String>? subcategories,
    String? budget,
    String? city,
    int? radiusKm,
    String? preferredMode,
    bool? promosOnly,
    bool? localOnly,
    String? themeMode,
    String? textScale,
    String? density,
    bool? reduceMotion,
    bool? scannerSound,
    bool? scannerVibrate,
    bool? scannerAutoConfirm,
  }) {
    return UserPreferences(
      onboardingDone: onboardingDone ?? this.onboardingDone,
      intention: intention ?? this.intention,
      domains: domains ?? this.domains,
      subcategories: subcategories ?? this.subcategories,
      budget: budget ?? this.budget,
      city: city ?? this.city,
      radiusKm: radiusKm ?? this.radiusKm,
      preferredMode: preferredMode ?? this.preferredMode,
      promosOnly: promosOnly ?? this.promosOnly,
      localOnly: localOnly ?? this.localOnly,
      themeMode: themeMode ?? this.themeMode,
      textScale: textScale ?? this.textScale,
      density: density ?? this.density,
      reduceMotion: reduceMotion ?? this.reduceMotion,
      scannerSound: scannerSound ?? this.scannerSound,
      scannerVibrate: scannerVibrate ?? this.scannerVibrate,
      scannerAutoConfirm: scannerAutoConfirm ?? this.scannerAutoConfirm,
    );
  }

  factory UserPreferences.fromJson(Map<String, dynamic> json) {
    final legacyDark = json['darkMode'] as bool? ?? false;
    return UserPreferences(
      onboardingDone: json['onboardingDone'] as bool? ?? false,
      intention: json['intention'] as String? ?? 'quotidien',
      domains: (json['domains'] as List?)?.cast<String>() ?? [],
      subcategories: (json['subcategories'] as List?)?.cast<String>() ?? [],
      budget: _migrateBudget(json['budget'] as String?),
      city: json['city'] as String? ?? 'Douala',
      radiusKm: json['radiusKm'] as int? ?? 15,
      preferredMode: json['preferredMode'] as String? ?? 'peu-importe',
      promosOnly: json['promosOnly'] as bool? ?? false,
      localOnly: json['localOnly'] as bool? ?? true,
      themeMode: json['themeMode'] as String? ??
          (legacyDark ? 'sombre' : 'systeme'),
      textScale: json['textScale'] as String? ?? 'normal',
      density: json['density'] as String? ?? 'confortable',
      reduceMotion: json['reduceMotion'] as bool? ?? false,
      scannerSound: json['scannerSound'] as bool? ?? true,
      scannerVibrate: json['scannerVibrate'] as bool? ?? true,
      scannerAutoConfirm: json['scannerAutoConfirm'] as bool? ?? false,
    );
  }

  Map<String, dynamic> toJson() => {
        'onboardingDone': onboardingDone,
        'intention': intention,
        'domains': domains,
        'subcategories': subcategories,
        'budget': budget,
        'city': city,
        'radiusKm': radiusKm,
        'preferredMode': preferredMode,
        'promosOnly': promosOnly,
        'localOnly': localOnly,
        'themeMode': themeMode,
        'textScale': textScale,
        'density': density,
        'reduceMotion': reduceMotion,
        'scannerSound': scannerSound,
        'scannerVibrate': scannerVibrate,
        'scannerAutoConfirm': scannerAutoConfirm,
      };
}

String _migrateBudget(String? value) {
  return switch (value) {
    'economique' => 'petit',
    'modere' => 'moyen',
    'premium' => 'large',
    _ => value ?? 'illimite',
  };
}

int budgetMax(String key) {
  return switch (key) {
    'petit' => 10000,
    'moyen' => 100000,
    'large' => 1000000,
    _ => 999999999,
  };
}

class DomainCategory {
  const DomainCategory({
    required this.id,
    required this.name,
    required this.icon,
    this.subcategories = const [],
  });

  final String id;
  final String name;
  final IconData icon;
  final List<String> subcategories;
}

DomainCategory? domainById(String id) {
  try {
    return domainCategories.firstWhere((d) => d.id == id);
  } catch (_) {
    return null;
  }
}

const intentions = <(String, String, IconData)>[
  ('quotidien', 'Achats du quotidien', Icons.shopping_cart_outlined),
  ('projet', 'Un projet de construction', Icons.construction_outlined),
  ('pro', 'Équiper mon activité', Icons.work_outline),
  ('plaisir', 'Me faire plaisir', Icons.auto_awesome_outlined),
  ('revente', 'Acheter pour revendre', Icons.sync_alt),
];

const budgets = [
  ('petit', 'Moins de 10 000 F'),
  ('moyen', '10 000 – 100 000 F'),
  ('large', '100 000 – 1 M F'),
  ('illimite', 'Aucune limite'),
];

String budgetLabel(String key) {
  for (final item in budgets) {
    if (item.$1 == key) return item.$2;
  }
  return key;
}

const onboardingCities = [
  'Douala',
  'Yaoundé',
  'Bafoussam',
  'Bamenda',
  'Garoua',
  'Kribi',
  'Abidjan',
];

IconData domainIcon(String id) => domainById(id)?.icon ?? Icons.sell_outlined;
const domainCategories = [
  DomainCategory(
    id: 'agro',
    name: 'Agroalimentaire',
    icon: Icons.grass_outlined,
    subcategories: [
      'Fruits & legumes',
      'Cereales & tubercules',
      'Epices & condiments',
      'Cafe & cacao',
      'Viandes & poissons',
      'Produits laitiers',
      'Boissons',
      'Huiles & matieres grasses',
      'Conserves & epicerie',
      'Boulangerie & patisserie',
    ],
  ),
  DomainCategory(
    id: 'animaux',
    name: 'Animaux',
    icon: Icons.pets_outlined,
    subcategories: [
      'Betall',
      'Volaille',
      'Animaux de compagnie',
      'Poissons & aquariophilie',
      'Alimentation animale',
      'Accessoires & cages',
      'Produits veterinaires',
    ],
  ),
  DomainCategory(
    id: 'vehicules',
    name: 'Vehicules',
    icon: Icons.directions_car_outlined,
    subcategories: [
      'Voitures',
      'Motos & scooters',
      'Camions & utilitaires',
      'Tricycles',
      'Velos',
      'Pieces detachees',
      'Pneus & jantes',
      'Accessoires auto',
      'Engins agricoles',
    ],
  ),
  DomainCategory(
    id: 'materiaux',
    name: 'Materiaux techniques',
    icon: Icons.foundation_outlined,
    subcategories: [
      'Plomberie',
      'Maconnerie',
      'Electricite',
      'Menuiserie',
      'Peinture & revetements',
      'Quincaillerie',
      'Carrelage & sanitaire',
      'Toiture & charpente',
      'Outillage',
      'Soudure & metallerie',
    ],
  ),
  DomainCategory(
    id: 'technologie',
    name: 'Technologie',
    icon: Icons.laptop_mac_outlined,
    subcategories: [
      'Ordinateurs',
      'Telephones',
      'Tablettes',
      'Audio & son',
      'Photo & video',
      'Gaming',
      'Composants & reseaux',
      'Objets connectes',
      'Accessoires & cables',
      'Imprimantes',
    ],
  ),
  DomainCategory(
    id: 'bijoux',
    name: 'Bijoux',
    icon: Icons.diamond_outlined,
    subcategories: [
      'Or',
      'Argent',
      'Perles & pierres',
      'Montres',
      'Bijoux fantaisie',
      'Alliances',
      'Bijoux artisanaux',
    ],
  ),
  DomainCategory(
    id: 'style',
    name: 'Style & Mode',
    icon: Icons.checkroom_outlined,
    subcategories: [
      'Pret-a-porter femme',
      'Pret-a-porter homme',
      'Enfant & bebe',
      'Chaussures',
      'Sacs & maroquinerie',
      'Tissus & wax',
      'Sur-mesure',
      'Accessoires de mode',
      'Friperie',
    ],
  ),
  DomainCategory(
    id: 'beaute',
    name: 'Beaute & Soins',
    icon: Icons.spa_outlined,
    subcategories: [
      'Soins du visage',
      'Soins du corps',
      'Cheveux & perruques',
      'Maquillage',
      'Parfums',
      'Ongles',
      'Hygiene',
      'Cosmetique naturelle',
    ],
  ),
  DomainCategory(
    id: 'maison',
    name: 'Maison & Deco',
    icon: Icons.weekend_outlined,
    subcategories: [
      'Mobilier',
      'Decoration',
      'Literie & linge',
      'Cuisine & vaisselle',
      'Electromenager',
      'Luminaires',
      'Rangement',
      'Jardin & exterieur',
    ],
  ),
  DomainCategory(
    id: 'sport',
    name: 'Sport & Loisirs',
    icon: Icons.sports_soccer_outlined,
    subcategories: [
      'Fitness & musculation',
      'Football',
      'Cyclisme',
      'Sports de combat',
      'Randonnee & camping',
      'Vetements de sport',
      'Jeux & puzzles',
      'Piscine',
    ],
  ),
  DomainCategory(
    id: 'sante',
    name: 'Sante & Pharmacie',
    icon: Icons.medication_outlined,
    subcategories: [
      'Parapharmacie',
      'Materiel medical',
      'Complements alimentaires',
      'Optique',
      'Orthopedie',
      'Premiers secours',
      'Hygiene medicale',
    ],
  ),
  DomainCategory(
    id: 'enfance',
    name: 'Enfance & Jouets',
    icon: Icons.toys_outlined,
    subcategories: [
      'Jouets',
      'Puericulture',
      'Poussettes & sieges',
      'Vetements bebe',
      'Fournitures scolaires',
      'Eveil & educatif',
    ],
  ),
  DomainCategory(
    id: 'culture',
    name: 'Culture & Papeterie',
    icon: Icons.menu_book_outlined,
    subcategories: [
      'Livres',
      'Papeterie',
      'Instruments de musique',
      'Oeuvres d\'art',
      'Films & musique',
      'Fournitures de bureau',
    ],
  ),
  DomainCategory(
    id: 'agriculture',
    name: 'Agriculture & Jardinage',
    icon: Icons.eco_outlined,
    subcategories: [
      'Semences',
      'Engrais & traitements',
      'Outils agricoles',
      'Irrigation',
      'Plantes & fleurs',
      'Serres & baches',
      'Materiel d\'elevage',
    ],
  ),
  DomainCategory(
    id: 'energie',
    name: 'Energie & Solaire',
    icon: Icons.wb_sunny_outlined,
    subcategories: [
      'Panneaux solaires',
      'Batteries & onduleurs',
      'Groupes electrogenes',
      'Lampes solaires',
      'Cablage & regulation',
      'Chauffe-eau solaire',
    ],
  ),
  DomainCategory(
    id: 'industrie',
    name: 'Industrie & Pro',
    icon: Icons.factory_outlined,
    subcategories: [
      'Machines & equipements',
      'Emballage',
      'Fournitures pro',
      'Securite & EPI',
      'Nettoyage industriel',
      'Signaletique',
    ],
  ),
  DomainCategory(
    id: 'artisanat',
    name: 'Artisanat & Fait-main',
    icon: Icons.cut_outlined,
    subcategories: [
      'Poterie & ceramique',
      'Vannerie',
      'Sculpture & bois',
      'Tissage',
      'Savonnerie artisanale',
      'Bougies & senteurs',
    ],
  ),
  DomainCategory(
    id: 'services',
    name: 'Services & Locations',
    icon: Icons.handyman_outlined,
    subcategories: [
      'Location de materiel',
      'Reparation & maintenance',
      'Transport & demenagement',
      'Evenementiel',
      'Impression & communication',
      'Installation & pose',
    ],
  ),
];
