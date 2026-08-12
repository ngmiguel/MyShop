import { generateReference, buildQrPayload } from './utils';

describe('order utils (unit)', () => {
  it('generateReference respecte le format PAY-XXXX-XXXX', () => {
    const ref = generateReference();
    expect(ref).toMatch(/^PAY-[A-Z0-9]{4}-[A-Z0-9]{4}$/);
  });

  it('buildQrPayload sérialise le payload JSON', () => {
    const payload = { reference: 'PAY-AAAA-BBBB', storeId: 's1', total: 1000, items: [] };
    expect(JSON.parse(buildQrPayload(payload))).toEqual(payload);
  });
});
