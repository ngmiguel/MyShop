import { Store } from '../models';

/** Boutiques démo — alignées sur le prototype Boutika. */
export const DEMO_STORES: Store[] = [
  { id: 'demo-store-1', name: 'Marché Fraîcheur Akwa', city: 'Douala', address: '124 rue Joss, Akwa', isActive: true, productCount: 8, accessCode: 'AKWA-4821' },
  { id: 'demo-store-2', name: 'Digital Corner Bonanjo', city: 'Douala', address: '7 bd de la Liberté', isActive: true, productCount: 6, accessCode: 'BONA-7392' },
  { id: 'demo-store-3', name: 'Atelier Bâtir Deido', city: 'Douala', address: '45 avenue Deido', isActive: true, productCount: 5, accessCode: 'DEID-1056' },
  { id: 'st-4', name: 'Mode & Wax Bastos', city: 'Yaoundé', address: '12 rue Bastos', isActive: true, productCount: 12 },
  { id: 'st-5', name: 'Auto Plus Mvan', city: 'Yaoundé', address: 'Carrefour Mvan', isActive: true, productCount: 4 },
  { id: 'st-6', name: 'Beauty Palace', city: 'Douala', address: 'Bonapriso', isActive: true, productCount: 9 },
  { id: 'st-7', name: 'Sport Arena', city: 'Douala', address: 'Makepe', isActive: true, productCount: 7 },
  { id: 'st-8', name: 'Librairie Centrale', city: 'Yaoundé', address: 'Centre-ville', isActive: true, productCount: 15 },
  { id: 'st-9', name: 'Kids Paradise', city: 'Douala', address: 'Logpom', isActive: true, productCount: 6 },
  { id: 'st-10', name: 'Galerie Artisans', city: 'Bafoussam', address: 'Marché A', isActive: true, productCount: 3 },
  { id: 'st-11', name: 'Énergie Verte CM', city: 'Douala', address: 'PK8', isActive: true, productCount: 5 },
  { id: 'st-12', name: 'Agro Cameroun', city: 'Garoua', address: 'Zone industrielle', isActive: true, productCount: 11 },
];

export interface StoreCoords {
  id: string;
  lat: number;
  lng: number;
}

export const DEMO_STORE_COORDS: Record<string, { lat: number; lng: number }> = {
  'demo-store-1': { lat: 4.0492, lng: 9.7008 },
  'demo-store-2': { lat: 4.0421, lng: 9.6899 },
  'demo-store-3': { lat: 4.0653, lng: 9.7115 },
  'st-4': { lat: 3.8667, lng: 11.5167 },
  'st-5': { lat: 3.848, lng: 11.5021 },
  'st-6': { lat: 4.0123, lng: 9.6544 },
  'st-7': { lat: 4.0789, lng: 9.7234 },
  'st-8': { lat: 3.848, lng: 11.5021 },
  'st-9': { lat: 4.0912, lng: 9.7456 },
  'st-10': { lat: 5.4737, lng: 10.4177 },
  'st-11': { lat: 4.1234, lng: 9.7890 },
  'st-12': { lat: 9.3265, lng: 13.3958 },
};
