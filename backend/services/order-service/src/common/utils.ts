import { QrPayload } from './interfaces';

export function generateReference(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const segment = () =>
    Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  return `PAY-${segment()}-${segment()}`;
}

export function buildQrPayload(payload: QrPayload): string {
  return JSON.stringify(payload);
}
