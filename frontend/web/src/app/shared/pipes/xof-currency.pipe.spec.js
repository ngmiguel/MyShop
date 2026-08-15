"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var common_1 = require("@angular/common");
var fr_1 = require("@angular/common/locales/fr");
var xof_currency_pipe_1 = require("./xof-currency.pipe");
(0, common_1.registerLocaleData)(fr_1.default);
describe('XofCurrencyPipe (unit)', function () {
    var pipe = new xof_currency_pipe_1.XofCurrencyPipe();
    it('formate un montant XOF', function () {
        var result = pipe.transform(15000);
        expect(result).toBeTruthy();
        expect(result).toContain('15');
    });
    it('gère null', function () {
        expect(pipe.transform(null)).toBeNull();
    });
});
