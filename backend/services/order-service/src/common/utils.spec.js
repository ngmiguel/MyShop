"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var utils_1 = require("./utils");
describe('order utils (unit)', function () {
    it('generateReference respecte le format PAY-XXXX-XXXX', function () {
        var ref = (0, utils_1.generateReference)();
        expect(ref).toMatch(/^PAY-[A-Z0-9]{4}-[A-Z0-9]{4}$/);
    });
    it('buildQrPayload sérialise le payload JSON', function () {
        var payload = { reference: 'PAY-AAAA-BBBB', storeId: 's1', total: 1000, items: [] };
        expect(JSON.parse((0, utils_1.buildQrPayload)(payload))).toEqual(payload);
    });
});
