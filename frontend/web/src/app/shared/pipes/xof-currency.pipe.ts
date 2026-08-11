import { CurrencyPipe } from '@angular/common';
import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'xofCurrency', standalone: true })
export class XofCurrencyPipe implements PipeTransform {
  private readonly currencyPipe = new CurrencyPipe('fr-FR');

  transform(value: number | null | undefined, currency = 'XOF'): string | null {
    return this.currencyPipe.transform(value, currency, 'symbol-narrow', '1.0-0');
  }
}
