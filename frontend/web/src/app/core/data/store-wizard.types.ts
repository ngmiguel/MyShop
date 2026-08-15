import { PaymentMethod } from '../models';

export interface OpeningHours {
  day: string;
  open: string;
  close: string;
  closed: boolean;
}

export interface StoreDraft {
  name: string;
  legalName: string;
  tagline: string;
  shortDescription: string;
  description: string;
  foundedYear: number;
  legalStatus: string;
  registrationNumber: string;
  categories: string[];
  mainCategory: string;
  subcategories: string[];
  address: string;
  city: string;
  region: string;
  country: string;
  landmark: string;
  lat: number;
  lng: number;
  serviceRadiusKm: number;
  hours: OpeningHours[];
  phone: string;
  email: string;
  paymentMethods: PaymentMethod[];
  taxRate: number;
  delivery: boolean;
  pickup: boolean;
  capacity: number;
  photos: string[];
  coverIndex: number;
  accessCode: string;
  accessCodeDays: number;
  maxSellers: number;
  autoApproveSellers: boolean;
}

export const WIZARD_DAYS = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];

export function emptyStoreDraft(accessCode: string): StoreDraft {
  return {
    name: '',
    legalName: '',
    tagline: '',
    shortDescription: '',
    description: '',
    foundedYear: new Date().getFullYear(),
    legalStatus: 'SARL',
    registrationNumber: '',
    categories: [],
    mainCategory: '',
    subcategories: [],
    address: '',
    city: 'Douala',
    region: 'Littoral',
    country: 'Cameroun',
    landmark: '',
    lat: 4.0511,
    lng: 9.7679,
    serviceRadiusKm: 10,
    hours: WIZARD_DAYS.map((day) => ({
      day,
      open: '08:00',
      close: '18:00',
      closed: day === 'Dimanche',
    })),
    phone: '',
    email: '',
    paymentMethods: ['mobile_money', 'cash'],
    taxRate: 19.25,
    delivery: false,
    pickup: true,
    capacity: 50,
    photos: [],
    coverIndex: 0,
    accessCode,
    accessCodeDays: 90,
    maxSellers: 6,
    autoApproveSellers: false,
  };
}

export function generateStoreCode(length = 9): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < length; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code.length >= 5 ? `${code.slice(0, 4)}-${code.slice(4)}` : code;
}

const DRAFT_KEY = 'boutika_store_draft';

export function loadStoreDraft(fallback: StoreDraft): StoreDraft {
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    if (!raw) return fallback;
    return { ...fallback, ...JSON.parse(raw) as StoreDraft };
  } catch {
    return fallback;
  }
}

export function saveStoreDraft(draft: StoreDraft): void {
  localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
}

export function clearStoreDraft(): void {
  localStorage.removeItem(DRAFT_KEY);
}
