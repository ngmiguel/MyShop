import {
  generateAccessCode,
  computeAccessCodeExpiry,
  formatAccessCodeWithPrefix,
} from './access-code.util';

describe('access-code.util (unit)', () => {
  it('generateAccessCode produit une chaîne de longueur demandée', () => {
    const code = generateAccessCode(9);
    expect(code).toHaveLength(9);
    expect(code).toMatch(/^[A-Z0-9]+$/);
  });

  it('computeAccessCodeExpiry ajoute le nombre de jours', () => {
    const before = Date.now();
    const expiry = computeAccessCodeExpiry(7);
    const diffDays = (expiry.getTime() - before) / (1000 * 60 * 60 * 24);
    expect(diffDays).toBeGreaterThan(6.9);
    expect(diffDays).toBeLessThan(7.1);
  });

  it('formatAccessCodeWithPrefix inclut le préfixe normalisé', () => {
    const code = formatAccessCodeWithPrefix('Sankofa', 9);
    expect(code.startsWith('SANKO-')).toBe(true);
  });
});
