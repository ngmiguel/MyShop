"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var access_code_util_1 = require("./access-code.util");
describe('access-code.util (unit)', function () {
    it('generateAccessCode produit une chaîne de longueur demandée', function () {
        var code = (0, access_code_util_1.generateAccessCode)(9);
        expect(code).toHaveLength(9);
        expect(code).toMatch(/^[A-Z0-9]+$/);
    });
    it('computeAccessCodeExpiry ajoute le nombre de jours', function () {
        var before = Date.now();
        var expiry = (0, access_code_util_1.computeAccessCodeExpiry)(7);
        var diffDays = (expiry.getTime() - before) / (1000 * 60 * 60 * 24);
        expect(diffDays).toBeGreaterThan(6.9);
        expect(diffDays).toBeLessThan(7.1);
    });
    it('formatAccessCodeWithPrefix inclut le préfixe normalisé', function () {
        var code = (0, access_code_util_1.formatAccessCodeWithPrefix)('Sankofa', 9);
        expect(code.startsWith('SANKO-')).toBe(true);
    });
});
