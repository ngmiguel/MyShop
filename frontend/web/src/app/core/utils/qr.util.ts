import { Order } from '../models';

export interface QrPayload {
  v: 1;
  ref: string;
  store: string;
  total: number;
  currency: string;
  items: number;
  issued: string;
  expires: string;
}

export function makeReference(): string {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let body = '';
  for (let i = 0; i < 6; i++) body += alphabet[Math.floor(Math.random() * alphabet.length)];
  return `BK-${body}`;
}

export function buildQrPayload(order: Order): QrPayload {
  return {
    v: 1,
    ref: order.reference ?? order.pickupCode,
    store: order.storeId,
    total: order.total,
    currency: order.currency ?? 'XOF',
    items: order.items.reduce((a, i) => a + i.quantity, 0),
    issued: order.createdAt,
    expires: order.expiresAt ?? order.createdAt,
  };
}

export function encodeQr(order: Order): string {
  return JSON.stringify(buildQrPayload(order));
}

export function readReference(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  try {
    const parsed = JSON.parse(trimmed) as Partial<QrPayload>;
    if (parsed?.ref) return parsed.ref.toUpperCase();
  } catch {
    /* référence brute */
  }
  return trimmed.toUpperCase();
}

export type ScanOutcome =
  | { status: 'valid'; order: Order }
  | { status: 'unknown' }
  | { status: 'expired'; order: Order }
  | { status: 'already'; order: Order }
  | { status: 'other_store'; order: Order };

export function evaluateScan(raw: string, orders: Order[], storeId?: string): ScanOutcome {
  const ref = readReference(raw);
  if (!ref) return { status: 'unknown' };
  const order = orders.find(
    (o) => (o.reference ?? o.pickupCode).toUpperCase() === ref,
  );
  if (!order) return { status: 'unknown' };
  if (storeId && order.storeId !== storeId) return { status: 'other_store', order };
  if (order.status === 'redeemed' || order.status === 'rated') return { status: 'already', order };
  if (order.status === 'expired' || order.status === 'cancelled') return { status: 'expired', order };
  const expires = order.expiresAt ? new Date(order.expiresAt).getTime() : Infinity;
  if (expires < Date.now()) return { status: 'expired', order };
  return { status: 'valid', order };
}

export function countdown(expiresAt: string): { label: string; expired: boolean } {
  const diff = new Date(expiresAt).getTime() - Date.now();
  if (diff <= 0) return { label: '0:00:00', expired: true };
  const h = Math.floor(diff / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  const s = Math.floor((diff % 60000) / 1000);
  return {
    label: `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`,
    expired: false,
  };
}
