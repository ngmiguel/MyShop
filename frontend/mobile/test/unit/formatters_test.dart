import 'package:flutter_test/flutter_test.dart';
import 'package:myshop_mobile/core/utils/formatters.dart';

void main() {
  group('formatters (unit)', () {
    test('formatPrix affiche FCFA', () {
      expect(formatPrix(12500), contains('12'));
    });

    test('statutCommande traduit pending', () {
      expect(statutCommande('pending'), 'En attente');
    });

    test('modeRetrait traduit pickup', () {
      expect(modeRetrait('pickup'), 'Retrait en boutique');
    });
  });
}
