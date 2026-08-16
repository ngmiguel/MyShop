import '../../core/utils/qr_util.dart';
import '../models/order.dart';
import 'demo_catalog.dart';

const _clientNames = [
  'Clarisse Ateba',
  'Junior Mbappe',
  'Sandrine Eyenga',
  'Paul Nkodo',
  'Lydie Ngo',
  'Armand Fochive',
  'Awa Koné',
  'Ibrahim Touré',
];

const _methods = ['Mobile Money', 'Espèces', 'Carte bancaire', 'Virement'];

List<CartItemModel> _itemsForStore(String storeId, int seed) {
  final pool = demoProducts.where((p) => p.storeId == storeId).toList();
  final source = pool.isNotEmpty
      ? pool
      : demoProducts.where((p) => p.id.hashCode % 3 == seed % 3).take(3).toList();
  if (source.isEmpty) return const [];

  final count = 1 + (seed % 3);
  return List.generate(count, (i) {
    final p = source[(seed + i * 7) % source.length];
    final qty = 1 + ((seed + i) % 2);
    return CartItemModel(
      productId: p.id,
      storeId: p.storeId,
      name: p.name,
      price: p.displayPrice,
      quantity: qty,
      imageUrl: p.imageUrl,
    );
  });
}

OrderModel _makeOrder({
  required String id,
  required String storeId,
  required String status,
  required int minutesAgo,
  String? userId,
  String? reference,
  double discountRatio = 0,
}) {
  final seed = id.codeUnits.fold(0, (a, c) => a + c);
  final items = _itemsForStore(storeId, seed);
  final subtotal = items.fold<double>(0, (s, i) => s + i.lineTotal);
  final discount = discountRatio > 0 ? (subtotal * discountRatio).roundToDouble() : 0.0;
  final tax = 0.0;
  final total = subtotal - discount + tax;
  final createdAt = DateTime.now().subtract(Duration(minutes: minutesAgo));
  final expiresAt = status == 'expired'
      ? DateTime.now().subtract(const Duration(hours: 1))
      : createdAt.add(const Duration(hours: 24));
  final ref = reference ?? generatePaymentCode();
  final isDone = status == 'redeemed' || status == 'confirmed';

  final draft = OrderModel(
    id: id,
    reference: ref,
    userId: userId,
    storeId: storeId,
    items: items,
    subtotal: subtotal,
    tax: tax,
    discount: discount,
    total: total,
    status: status,
    fulfillmentMode: seed % 4 == 0 ? 'delivery' : 'pickup',
    contactName: _clientNames[seed % _clientNames.length],
    contactPhone: '+237 6${70000000 + (seed * 1337) % 29999999}',
    paymentMethod: _methods[seed % _methods.length],
    expiresAt: expiresAt,
    redeemedAt: isDone ? createdAt.add(const Duration(minutes: 45)) : null,
    createdAt: createdAt,
  );

  return draft.copyWith(qrPayload: encodeQrPayload(draft));
}

/// Commandes démo pour codes QR, tickets, file vendeur et KPIs.
List<OrderModel> buildDemoOrders({String? clientUserId}) {
  final orders = <OrderModel>[
    // File vendeur — boutique 1 (Marché Fraîcheur)
    _makeOrder(id: 'demo-ord-p1', storeId: 'demo-store-1', status: 'pending', minutesAgo: 12, userId: clientUserId),
    _makeOrder(id: 'demo-ord-p2', storeId: 'demo-store-1', status: 'pending', minutesAgo: 38, userId: clientUserId, discountRatio: 0.05),
    _makeOrder(id: 'demo-ord-p3', storeId: 'demo-store-1', status: 'pending', minutesAgo: 95),
    // File vendeur — boutique 2 (Digital Corner)
    _makeOrder(id: 'demo-ord-p4', storeId: 'demo-store-2', status: 'pending', minutesAgo: 22, userId: clientUserId),
    _makeOrder(id: 'demo-ord-p5', storeId: 'demo-store-2', status: 'pending', minutesAgo: 67),
    // Tickets confirmés (client)
    _makeOrder(
      id: 'demo-ord-c1',
      storeId: 'demo-store-1',
      status: 'redeemed',
      minutesAgo: 60 * 24 * 3,
      userId: clientUserId,
      reference: 'PAY-4KQ2-8ZLM',
      discountRatio: 0.08,
    ),
    _makeOrder(
      id: 'demo-ord-c2',
      storeId: 'demo-store-3',
      status: 'redeemed',
      minutesAgo: 60 * 24 * 12,
      userId: clientUserId,
      reference: 'PAY-9WD1-3TRB',
      discountRatio: 0.05,
    ),
    _makeOrder(id: 'demo-ord-c3', storeId: 'st-4', status: 'redeemed', minutesAgo: 60 * 24 * 18, userId: clientUserId),
    _makeOrder(id: 'demo-ord-c4', storeId: 'st-6', status: 'redeemed', minutesAgo: 60 * 24 * 28, userId: clientUserId, discountRatio: 0.1),
    _makeOrder(id: 'demo-ord-c5', storeId: 'demo-store-2', status: 'redeemed', minutesAgo: 60 * 24 * 45, userId: clientUserId),
    // Historique vendeur / manager
    _makeOrder(id: 'demo-ord-h1', storeId: 'demo-store-1', status: 'redeemed', minutesAgo: 60 * 6),
    _makeOrder(id: 'demo-ord-h2', storeId: 'demo-store-1', status: 'redeemed', minutesAgo: 60 * 30),
    _makeOrder(id: 'demo-ord-h3', storeId: 'demo-store-2', status: 'redeemed', minutesAgo: 60 * 18),
    _makeOrder(id: 'demo-ord-h4', storeId: 'st-5', status: 'redeemed', minutesAgo: 60 * 50),
    _makeOrder(id: 'demo-ord-h5', storeId: 'st-7', status: 'redeemed', minutesAgo: 60 * 72),
    _makeOrder(id: 'demo-ord-x1', storeId: 'demo-store-1', status: 'expired', minutesAgo: 60 * 40),
    _makeOrder(id: 'demo-ord-a1', storeId: 'demo-store-2', status: 'cancelled', minutesAgo: 60 * 8),
  ];

  orders.sort((a, b) => (b.createdAt ?? DateTime(0)).compareTo(a.createdAt ?? DateTime(0)));
  return orders;
}

/// Série mensuelle pour l’écran Profit vendeur (prototype Boutika).
const demoMonthlyRevenue = [
  {'mois': 'Fév', 'ca': 4200000.0, 'couts': 2860000.0, 'commandes': 210},
  {'mois': 'Mar', 'ca': 5100000.0, 'couts': 3420000.0, 'commandes': 264},
  {'mois': 'Avr', 'ca': 4800000.0, 'couts': 3310000.0, 'commandes': 249},
  {'mois': 'Mai', 'ca': 6300000.0, 'couts': 4180000.0, 'commandes': 318},
  {'mois': 'Juin', 'ca': 7150000.0, 'couts': 4640000.0, 'commandes': 366},
  {'mois': 'Juil', 'ca': 8420000.0, 'couts': 5390000.0, 'commandes': 431},
];
