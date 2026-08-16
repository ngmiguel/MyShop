import 'package:intl/intl.dart';

final _priceFormat = NumberFormat.currency(
  locale: 'fr_FR',
  symbol: 'FCFA',
  decimalDigits: 0,
);

String formatPrix(num value) => _priceFormat.format(value);

/// Format compact type « 8,4 M » / « 420 k » (prototype Boutika).
String formatMontantCourt(num value) {
  final v = value.abs();
  final sign = value < 0 ? '−' : '';
  if (v >= 1000000) {
    final m = v / 1000000;
    final text = m == m.roundToDouble() ? m.toStringAsFixed(0) : m.toStringAsFixed(1).replaceAll('.0', '');
    return '$sign$text M';
  }
  if (v >= 1000) {
    return '$sign${(v / 1000).round()} k';
  }
  return '$sign${v.round()}';
}

String formatDate(DateTime date) {
  return DateFormat('dd/MM/yyyy', 'fr_FR').format(date);
}

String formatHeure(DateTime date) {
  return DateFormat('HH:mm', 'fr_FR').format(date);
}

String formatDateTime(DateTime date) {
  return DateFormat('dd/MM/yyyy HH:mm', 'fr_FR').format(date);
}

String formatCourt(DateTime date) {
  return DateFormat('dd MMM', 'fr_FR').format(date);
}

String statutCommande(String status) {
  switch (status) {
    case 'pending':
      return 'En attente de scan';
    case 'redeemed':
    case 'confirmed':
      return 'Paiement confirmé';
    case 'expired':
      return 'Expiré';
    case 'cancelled':
      return 'Annulé';
    default:
      return status;
  }
}

String modeRetrait(String mode) {
  switch (mode) {
    case 'pickup':
      return 'Retrait en boutique';
    case 'delivery':
      return 'Livraison';
    default:
      return mode;
  }
}
