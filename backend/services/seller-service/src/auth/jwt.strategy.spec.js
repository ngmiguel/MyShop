"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var common_1 = require("@nestjs/common");
var jwt_strategy_1 = require("./jwt.strategy");
describe('JwtStrategy (unit)', function () {
    var strategy = new jwt_strategy_1.JwtStrategy();
    it('validate accepte un payload valide', function () {
        var payload = { sub: 'id-1', email: 'v@test.com', role: 'vendeur' };
        expect(strategy.validate(payload)).toEqual(payload);
    });
    it('validate rejette un payload incomplet', function () {
        expect(function () { return strategy.validate({ sub: '', email: 'x', role: 'vendeur' }); })
            .toThrow(common_1.UnauthorizedException);
    });
});
