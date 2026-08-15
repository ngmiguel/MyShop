export interface DemoSellerProfile {
  id: string;
  userId?: string;
  storeId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  position: string;
  shift: string;
  status: 'active' | 'pending' | 'suspended';
  rating: number;
  ratingCount: number;
  avgHandoverMinutes: number;
  monthlyTarget: number;
  joinedAt: string;
  idType: string;
  idNumber: string;
}

const PROFILE_KEY = 'boutika_seller_profiles';

function loadProfilePatch(id: string): Partial<DemoSellerProfile> {
  try {
    const raw = localStorage.getItem(PROFILE_KEY);
    if (!raw) return {};
    const map = JSON.parse(raw) as Record<string, Partial<DemoSellerProfile>>;
    return map[id] ?? {};
  } catch {
    return {};
  }
}

export function saveSellerProfile(id: string, patch: Partial<DemoSellerProfile>): DemoSellerProfile | undefined {
  const base = DEMO_SELLERS.find((s) => s.id === id);
  if (!base) return undefined;
  try {
    const raw = localStorage.getItem(PROFILE_KEY);
    const map = raw ? JSON.parse(raw) as Record<string, Partial<DemoSellerProfile>> : {};
    map[id] = { ...(map[id] ?? {}), ...patch };
    localStorage.setItem(PROFILE_KEY, JSON.stringify(map));
  } catch { /* ignore */ }
  return { ...base, ...loadProfilePatch(id) };
}

function withPatch(seller: DemoSellerProfile): DemoSellerProfile {
  return { ...seller, ...loadProfilePatch(seller.id) };
}

export const DEMO_SELLERS: DemoSellerProfile[] = [
  {
    id: 'demo-seller-1',
    userId: 'demo-seller-1',
    storeId: 'demo-store-1',
    firstName: 'Kofi',
    lastName: 'Mensah',
    email: 'kofi.vendeur@myshop.app',
    phone: '+237 690000001',
    position: 'Responsable retrait',
    shift: 'Journée (08h–18h)',
    status: 'active',
    rating: 4.8,
    ratingCount: 56,
    avgHandoverMinutes: 4.2,
    monthlyTarget: 85,
    joinedAt: new Date(Date.now() - 400 * 86400000).toISOString(),
    idType: "Carte nationale d'identité",
    idNumber: 'CM482917365',
  },
  {
    id: 'sl-demo-store-1-1',
    storeId: 'demo-store-1',
    firstName: 'Grâce',
    lastName: 'Nkolo',
    email: 'grace.nkolo@boutika.cm',
    phone: '+237 690000002',
    position: 'Caissier',
    shift: 'Matin (07h–14h)',
    status: 'active',
    rating: 4.5,
    ratingCount: 31,
    avgHandoverMinutes: 5.1,
    monthlyTarget: 70,
    joinedAt: new Date(Date.now() - 280 * 86400000).toISOString(),
    idType: 'Passeport',
    idNumber: 'CM591283746',
  },
  {
    id: 'sl-demo-store-1-2',
    storeId: 'demo-store-1',
    firstName: 'Samuel',
    lastName: 'Bayiha',
    email: 'samuel.bayiha@boutika.cm',
    phone: '+237 690000003',
    position: 'Vendeur comptoir',
    shift: 'Après-midi (13h–20h)',
    status: 'active',
    rating: 4.3,
    ratingCount: 22,
    avgHandoverMinutes: 6.0,
    monthlyTarget: 65,
    joinedAt: new Date(Date.now() - 120 * 86400000).toISOString(),
    idType: "Carte nationale d'identité",
    idNumber: 'CM673829104',
  },
  {
    id: 'demo-seller-2',
    userId: 'demo-seller-2',
    storeId: 'demo-store-2',
    firstName: 'Aïcha',
    lastName: 'Traoré',
    email: 'aicha.vendeur@myshop.app',
    phone: '+237 690000004',
    position: 'Chef de rayon',
    shift: 'Journée (08h–18h)',
    status: 'active',
    rating: 4.6,
    ratingCount: 38,
    avgHandoverMinutes: 3.8,
    monthlyTarget: 75,
    joinedAt: new Date(Date.now() - 350 * 86400000).toISOString(),
    idType: "Carte nationale d'identité",
    idNumber: 'CM384729561',
  },
  {
    id: 'sl-demo-store-2-1',
    storeId: 'demo-store-2',
    firstName: 'Didier',
    lastName: 'Fotso',
    email: 'didier.fotso@boutika.cm',
    phone: '+237 690000005',
    position: 'Conseiller technique',
    shift: 'Week-end',
    status: 'active',
    rating: 4.2,
    ratingCount: 18,
    avgHandoverMinutes: 5.5,
    monthlyTarget: 60,
    joinedAt: new Date(Date.now() - 200 * 86400000).toISOString(),
    idType: 'Permis de conduire',
    idNumber: 'CM928374651',
  },
];

export const DEMO_SELLER_NAMES: Record<string, string> = Object.fromEntries(
  DEMO_SELLERS.map((s) => [s.id, `${s.firstName} ${s.lastName}`]),
);

export function sellerDisplayName(sellerId?: string): string {
  if (!sellerId) return '—';
  return DEMO_SELLER_NAMES[sellerId] ?? 'Vendeur';
}

export function getSellerByUserId(userId: string): DemoSellerProfile | undefined {
  const seller = DEMO_SELLERS.find((s) => s.userId === userId || s.id === userId);
  return seller ? withPatch(seller) : undefined;
}

export function getSellerById(id: string): DemoSellerProfile | undefined {
  const seller = DEMO_SELLERS.find((s) => s.id === id);
  return seller ? withPatch(seller) : undefined;
}

export function getStoreTeam(storeId: string): DemoSellerProfile[] {
  return DEMO_SELLERS.filter((s) => s.storeId === storeId && s.status === 'active').map(withPatch);
}
