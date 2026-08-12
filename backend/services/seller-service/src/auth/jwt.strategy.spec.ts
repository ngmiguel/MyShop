import { UnauthorizedException } from '@nestjs/common';
import { JwtStrategy } from './jwt.strategy';

describe('JwtStrategy (unit)', () => {
  const strategy = new JwtStrategy();

  it('validate accepte un payload valide', () => {
    const payload = { sub: 'id-1', email: 'v@test.com', role: 'vendeur' as const };
    expect(strategy.validate(payload)).toEqual(payload);
  });

  it('validate rejette un payload incomplet', () => {
    expect(() => strategy.validate({ sub: '', email: 'x', role: 'vendeur' as const }))
      .toThrow(UnauthorizedException);
  });
});
