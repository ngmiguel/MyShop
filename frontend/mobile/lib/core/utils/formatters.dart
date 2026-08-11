import 'package:intl/intl.dart';

final _priceFormat = NumberFormat.currency(
  locale: 'fr_FR',
  symbol: 'FCFA',
  decimalDigits: 0,
);

String formatPrix(num value) => _priceFormat.format(value);

String formatDate(DateTime date) {
  return DateFormat('dd/MM/yyyy HH:mm', 'fr_FR').format(date);
}

String formatCourt(DateTime date) {
  return DateFormat('dd MMM', 'fr_FR').format(date);
}

String statutCommande(String status) {
  switch (status) {
    case 'pending':
      return 'En attente';
    case 'redeemed':
      return 'Encaisse';
    case 'expired':
      return 'Expire';
    case 'cancelled':
      return 'Annule';
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
