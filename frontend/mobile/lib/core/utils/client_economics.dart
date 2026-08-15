import '../../data/models/order.dart';

class ClientEconomics {
  const ClientEconomics({
    required this.economies,
    required this.depense,
    required this.commandes,
    required this.points,
    required this.panierMoyen,
    required this.aVenir,
    required this.economiesAVenir,
  });

  final double economies;
  final double depense;
  final int commandes;
  final int points;
  final double panierMoyen;
  final double aVenir;
  final double economiesAVenir;
}

ClientEconomics computeClientEconomics(List<OrderModel> orders) {
  final confirmed = orders.where((o) => o.status == 'redeemed' || o.status == 'confirmed').toList();
  final pending = orders.where((o) => o.status == 'pending').toList();

  final depense = confirmed.fold<double>(0, (s, o) => s + o.total);
  final aVenir = pending.fold<double>(0, (s, o) => s + o.total);

  // Estimation des économies promo (~8 % du total confirmé)
  final economies = depense * 0.08;
  final economiesAVenir = aVenir * 0.05;
  final points = (depense / 1000).floor();
  final panierMoyen = confirmed.isEmpty ? 0.0 : depense / confirmed.length;

  return ClientEconomics(
    economies: economies,
    depense: depense,
    commandes: confirmed.length,
    points: points,
    panierMoyen: panierMoyen,
    aVenir: aVenir,
    economiesAVenir: economiesAVenir,
  );
}
