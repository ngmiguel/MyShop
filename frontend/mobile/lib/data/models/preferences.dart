import 'package:flutter/material.dart';

class UserPreferences {
  const UserPreferences({
    this.onboardingDone = false,
    this.intention = 'quotidien',
    this.domains = const [],
    this.subcategories = const [],
    this.budget = 'illimite',
    this.city = 'Abidjan',
    this.radiusKm = 15,
    this.preferredMode = 'peu-importe',
    this.promosOnly = false,
    this.localOnly = true,
    this.darkMode = false,
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
  final bool darkMode;

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
    bool? darkMode,
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
      darkMode: darkMode ?? this.darkMode,
    );
  }

  factory UserPreferences.fromJson(Map<String, dynamic> json) {
    return UserPreferences(
      onboardingDone: json['onboardingDone'] as bool? ?? false,
      intention: json['intention'] as String? ?? 'quotidien',
      domains: (json['domains'] as List?)?.cast<String>() ?? [],
      subcategories: (json['subcategories'] as List?)?.cast<String>() ?? [],
      budget: json['budget'] as String? ?? 'illimite',
      city: json['city'] as String? ?? 'Abidjan',
      radiusKm: json['radiusKm'] as int? ?? 15,
      preferredMode: json['preferredMode'] as String? ?? 'peu-importe',
      promosOnly: json['promosOnly'] as bool? ?? false,
      localOnly: json['localOnly'] as bool? ?? true,
      darkMode: json['darkMode'] as bool? ?? false,
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
        'darkMode': darkMode,
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

const intentions = [
  ('quotidien', 'Courses du quotidien', Icons.shopping_basket_outlined),
  ('occasion', 'Achat ponctuel', Icons.card_giftcard_outlined),
  ('pro', 'Usage professionnel', Icons.work_outline),
  ('decouverte', 'Decouvrir de nouvelles boutiques', Icons.explore_outlined),
];

const budgets = [
  ('economique', 'Economique - moins de 10 000 FCFA'),
  ('modere', 'Modere - 10 000 a 50 000 FCFA'),
  ('premium', 'Premium - 50 000 a 200 000 FCFA'),
  ('illimite', 'Sans limite'),
];

const domainCategories = [
  DomainCategory(
    id: 'agro',
    name: 'Agroalimentaire',
    icon: Icons.grass_outlined,
    subcategories: ['Fruits', 'Legumes', 'Epicerie'],
  ),
  DomainCategory(
    id: 'technologie',
    name: 'Technologie',
    icon: Icons.devices_outlined,
    subcategories: ['Telephones', 'Accessoires', 'Informatique'],
  ),
  DomainCategory(
    id: 'style',
    name: 'Style',
    icon: Icons.checkroom_outlined,
    subcategories: ['Vetements', 'Chaussures', 'Accessoires mode'],
  ),
  DomainCategory(
    id: 'beaute',
    name: 'Beaute',
    icon: Icons.spa_outlined,
    subcategories: ['Soins', 'Maquillage', 'Cheveux'],
  ),
  DomainCategory(
    id: 'materiaux',
    name: 'Materiaux',
    icon: Icons.construction_outlined,
    subcategories: ['Maconnerie', 'Plomberie', 'Electricite'],
  ),
  DomainCategory(
    id: 'vehicules',
    name: 'Vehicules',
    icon: Icons.directions_car_outlined,
    subcategories: ['Pieces auto', 'Moto', 'Accessoires'],
  ),
  DomainCategory(
    id: 'maison',
    name: 'Maison',
    icon: Icons.home_outlined,
    subcategories: ['Mobilier', 'Decoration', 'Electromenager'],
  ),
  DomainCategory(
    id: 'sport',
    name: 'Sport',
    icon: Icons.fitness_center_outlined,
    subcategories: ['Equipement', 'Textile sport', 'Nutrition'],
  ),
  DomainCategory(
    id: 'animaux',
    name: 'Animaux',
    icon: Icons.pets_outlined,
    subcategories: ['Alimentation', 'Accessoires', 'Soins'],
  ),
];
