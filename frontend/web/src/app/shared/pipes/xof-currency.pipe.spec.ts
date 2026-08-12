import { registerLocaleData } from '@angular/common';
import localeFr from '@angular/common/locales/fr';
import { XofCurrencyPipe } from './xof-currency.pipe';

registerLocaleData(localeFr);

describe('XofCurrencyPipe (unit)', () => {
  const pipe = new XofCurrencyPipe();

  it('formate un montant XOF', () => {
    const result = pipe.transform(15000);
    expect(result).toBeTruthy();
    expect(result).toContain('15');
  });

  it('gère null', () => {
    expect(pipe.transform(null)).toBeNull();
  });
});
