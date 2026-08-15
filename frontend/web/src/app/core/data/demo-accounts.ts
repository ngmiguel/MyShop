export interface DemoAccount {
  role: 'client' | 'vendeur' | 'manager';
  label: string;
  description: string;
  email?: string;
  password?: string;
  icon: string;
  tone: 'emerald' | 'amber' | 'indigo';
}

export const DEMO_ACCOUNTS: DemoAccount[] = [
  {
    role: 'client',
    label: 'Client',
    description: 'Catalogue public sans connexion',
    icon: 'shopping_bag',
    tone: 'emerald',
  },
  {
    role: 'vendeur',
    label: 'Kofi Mensah',
    description: 'Vendeur · Scanner & retraits',
    email: 'kofi.vendeur@myshop.app',
    password: 'Vendeur2026!',
    icon: 'qr_code_scanner',
    tone: 'amber',
  },
  {
    role: 'vendeur',
    label: 'Aïcha Traoré',
    description: 'Vendeuse · Boutique démo',
    email: 'aicha.vendeur@myshop.app',
    password: 'Vendeur2026!',
    icon: 'qr_code_scanner',
    tone: 'amber',
  },
  {
    role: 'manager',
    label: 'Manager',
    description: 'Console · Boutiques & analytics',
    email: 'manager@myshop.app',
    password: 'Manager2026!',
    icon: 'dashboard',
    tone: 'indigo',
  },
];

export const MANAGER_DEMO = DEMO_ACCOUNTS.find((a) => a.role === 'manager')!;
export const SELLER_DEMOS = DEMO_ACCOUNTS.filter((a) => a.role === 'vendeur' && a.email);
