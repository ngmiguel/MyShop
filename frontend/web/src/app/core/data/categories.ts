export interface CategoryDef {
  id: string;
  label: string;
  color: string;
  subcategories: Array<{ id: string; label: string }>;
}

export const CATEGORIES: CategoryDef[] = [
  { id: 'agro', label: 'Agroalimentaire', color: '#16a34a', subcategories: [
    { id: 'agro-frais', label: 'Produits frais' }, { id: 'agro-epicerie', label: 'Épicerie' },
    { id: 'agro-boissons', label: 'Boissons' }, { id: 'agro-cereales', label: 'Céréales & farines' },
  ]},
  { id: 'animaux', label: 'Animaux', color: '#a16207', subcategories: [
    { id: 'animaux-vivants', label: 'Animaux vivants' }, { id: 'animaux-alimentation', label: 'Alimentation' },
  ]},
  { id: 'vehicules', label: 'Véhicules', color: '#1d4ed8', subcategories: [
    { id: 'veh-voitures', label: 'Voitures' }, { id: 'veh-motos', label: 'Motos' },
  ]},
  { id: 'materiaux', label: 'Matériaux techniques', color: '#ea580c', subcategories: [
    { id: 'mat-plomberie', label: 'Plomberie' }, { id: 'mat-electricite', label: 'Électricité' },
  ]},
  { id: 'tech', label: 'Technologies', color: '#0891b2', subcategories: [
    { id: 'tech-telephones', label: 'Téléphones' }, { id: 'tech-ordinateurs', label: 'Ordinateurs' },
  ]},
  { id: 'bijoux', label: 'Bijoux', color: '#c026d3', subcategories: [
    { id: 'bij-montres', label: 'Montres' }, { id: 'bij-or', label: 'Or' },
  ]},
  { id: 'style', label: 'Style & Mode', color: '#db2777', subcategories: [
    { id: 'style-vetements', label: 'Vêtements' }, { id: 'style-chaussures', label: 'Chaussures' },
  ]},
  { id: 'maison', label: 'Maison & Mobilier', color: '#7c3aed', subcategories: [
    { id: 'maison-meubles', label: 'Meubles' }, { id: 'maison-deco', label: 'Décoration' },
  ]},
  { id: 'beaute', label: 'Beauté & Santé', color: '#e11d48', subcategories: [
    { id: 'beaute-soins', label: 'Soins de la peau' }, { id: 'beaute-parfums', label: 'Parfums' },
  ]},
  { id: 'sport', label: 'Sport & Loisirs', color: '#0d9488', subcategories: [
    { id: 'sport-fitness', label: 'Fitness' }, { id: 'sport-plein-air', label: 'Plein air' },
  ]},
  { id: 'livres', label: 'Livres & Papeterie', color: '#475569', subcategories: [
    { id: 'livres-scolaire', label: 'Scolaire' }, { id: 'livres-romans', label: 'Romans' },
  ]},
  { id: 'jouets', label: 'Jouets & Enfance', color: '#f59e0b', subcategories: [
    { id: 'jouets-jeux', label: 'Jeux' }, { id: 'jouets-eveil', label: 'Éveil' },
  ]},
  { id: 'art', label: 'Art & Artisanat', color: '#9333ea', subcategories: [
    { id: 'art-tableaux', label: 'Tableaux' }, { id: 'art-vannerie', label: 'Vannerie' },
  ]},
  { id: 'energie', label: 'Énergie', color: '#eab308', subcategories: [
    { id: 'energie-solaire', label: 'Solaire' }, { id: 'energie-batteries', label: 'Batteries' },
  ]},
  { id: 'agriculture', label: 'Agriculture & Élevage', color: '#65a30d', subcategories: [
    { id: 'agri-semences', label: 'Semences' }, { id: 'agri-engrais', label: 'Engrais' },
  ]},
  { id: 'services', label: 'Services', color: '#334155', subcategories: [
    { id: 'serv-reparation', label: 'Réparation' }, { id: 'serv-transport', label: 'Transport' },
  ]},
];

export const CITIES = [
  { name: 'Douala', lat: 4.0511, lng: 9.7679 },
  { name: 'Yaoundé', lat: 3.848, lng: 11.5021 },
  { name: 'Bafoussam', lat: 5.4781, lng: 10.4176 },
  { name: 'Bamenda', lat: 5.9631, lng: 10.1591 },
  { name: 'Garoua', lat: 9.3017, lng: 13.3921 },
  { name: 'Kribi', lat: 2.9391, lng: 9.9098 },
];

export function categoryLabel(id: string): string {
  return CATEGORIES.find((c) => c.id === id)?.label ?? id;
}

export function subcategoryLabel(id?: string): string {
  if (!id) return '—';
  for (const c of CATEGORIES) {
    const sub = c.subcategories.find((s) => s.id === id);
    if (sub) return sub.label;
  }
  return id;
}
