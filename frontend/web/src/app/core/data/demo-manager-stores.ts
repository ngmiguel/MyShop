import { PaymentMethod } from '../models';
import { DEMO_STORE_COORDS, DEMO_STORES } from './demo-stores';
import { OpeningHours } from './store-wizard.types';

export type StoreStatus = 'active' | 'draft' | 'paused' | 'suspended';

export interface ManagerStore {
  id: string;
  name: string;
  legalName?: string;
  tagline?: string;
  shortDescription?: string;
  description?: string;
  city: string;
  region: string;
  country: string;
  address?: string;
  landmark?: string;
  categories: string[];
  mainCategory?: string;
  subcategories?: string[];
  status: StoreStatus;
  rating: number;
  reviewCount: number;
  maxSellers: number;
  accessCode: string;
  accessCodeExpiry: string;
  autoApproveSellers: boolean;
  lat: number;
  lng: number;
  serviceRadiusKm: number;
  productCount: number;
  phone: string;
  email: string;
  taxRate: number;
  paymentMethods: PaymentMethod[];
  delivery: boolean;
  pickup: boolean;
  capacity: number;
  foundedYear: number;
  legalStatus: string;
  registrationNumber: string;
  hours: OpeningHours[];
  photos?: string[];
  coverIndex?: number;
  createdAt: string;
}

const REGIONS: Record<string, string> = {
  Douala: 'Littoral',
  Yaoundé: 'Centre',
  Bafoussam: 'Ouest',
  Garoua: 'Nord',
};

const STORE_CATEGORIES: Record<string, string[]> = {
  'demo-store-1': ['agro', 'agriculture', 'animaux'],
  'demo-store-2': ['tech', 'services'],
  'demo-store-3': ['materiaux', 'maison'],
  'st-4': ['style', 'bijoux'],
  'st-5': ['vehicules', 'services'],
  'st-6': ['beaute', 'style'],
  'st-7': ['sport', 'jouets'],
  'st-8': ['livres', 'art'],
  'st-9': ['jouets', 'style'],
  'st-10': ['art', 'services'],
  'st-11': ['energie', 'tech'],
  'st-12': ['agriculture', 'agro'],
};

const STATUSES: StoreStatus[] = ['active', 'active', 'active', 'active', 'paused', 'active', 'active', 'draft', 'active', 'active', 'active', 'suspended'];

const DEFAULT_HOURS: OpeningHours[] = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'].map((day) => ({
  day,
  open: '08:00',
  close: day === 'Samedi' ? '19:00' : '18:00',
  closed: day === 'Dimanche',
}));

function buildManagerStore(store: (typeof DEMO_STORES)[0], i: number): ManagerStore {
  const coords = DEMO_STORE_COORDS[store.id] ?? { lat: 4.05, lng: 9.7 };
  const cats = STORE_CATEGORIES[store.id] ?? ['services'];
  return {
    id: store.id,
    name: store.name,
    legalName: `${store.name} SARL`,
    tagline: 'Votre boutique de proximité',
    shortDescription: store.description ?? `Boutique ${store.name} à ${store.city ?? 'Douala'}.`,
    description: store.description,
    city: store.city ?? 'Douala',
    region: REGIONS[store.city ?? 'Douala'] ?? 'Centre',
    country: 'Cameroun',
    address: store.address,
    landmark: 'Centre-ville',
    categories: cats,
    mainCategory: cats[0],
    subcategories: [],
    status: STATUSES[i] ?? 'active',
    rating: Math.round((4 + (i % 5) * 0.12) * 10) / 10,
    reviewCount: 40 + i * 17,
    maxSellers: 6,
    accessCode: store.accessCode ?? `SHOP-${1000 + i * 137}`,
    accessCodeExpiry: new Date(Date.now() + 90 * 86400000).toISOString(),
    autoApproveSellers: i % 4 === 0,
    lat: coords.lat,
    lng: coords.lng,
    serviceRadiusKm: 8 + (i % 4) * 3,
    productCount: store.productCount ?? 0,
    phone: `+237 6${String(70 + i).padStart(2, '0')} ${String(100000 + i * 3457).slice(0, 6)}`,
    email: `contact@${store.id}.boutika.cm`,
    taxRate: 19.25,
    paymentMethods: i % 3 === 0 ? ['mobile_money', 'cash'] : ['mobile_money', 'card', 'cash', 'transfer'],
    delivery: i % 2 === 0,
    pickup: true,
    capacity: 40 + i * 6,
    foundedYear: 2018 + (i % 6),
    legalStatus: 'SARL',
    registrationNumber: `RC/DLA/${2018 + (i % 6)}/B/${1000 + i * 37}`,
    hours: DEFAULT_HOURS,
    createdAt: new Date(2023, i % 12, 3 + (i % 20)).toISOString(),
  };
}

export const DEMO_MANAGER_STORES: ManagerStore[] = DEMO_STORES.map(buildManagerStore);

export function managerStoreById(id: string, list = DEMO_MANAGER_STORES): ManagerStore | undefined {
  return list.find((s) => s.id === id);
}
