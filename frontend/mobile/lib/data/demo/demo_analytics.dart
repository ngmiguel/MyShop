import '../models/order.dart';
import '../models/product.dart';
import '../models/store.dart';
import 'demo_orders.dart';

/// Trafic de scans par tranche horaire (prototype Boutika).
const demoHourlyTraffic = [
  {'h': '08h', 'scans': 4},
  {'h': '10h', 'scans': 12},
  {'h': '12h', 'scans': 26},
  {'h': '14h', 'scans': 19},
  {'h': '16h', 'scans': 31},
  {'h': '18h', 'scans': 22},
  {'h': '20h', 'scans': 9},
];

const demoPieColors = [
  ColorValue(0xFF11161B),
  ColorValue(0xFFFB7D11),
  ColorValue(0xFF4D5964),
  ColorValue(0xFFC5A173),
  ColorValue(0xFFA2ABB4),
  ColorValue(0xFF059669),
  ColorValue(0xFF0284C7),
];

/// Wrapper pour éviter d'importer Flutter dans la couche data.
class ColorValue {
  const ColorValue(this.value);
  final int value;
}

/// Hypothèses de calcul profit (réglables côté écran Profit).
class ManagerProfitAssumptions {
  const ManagerProfitAssumptions({
    this.chargesFixesMensuelles = 1850000,
    this.commissionVendeur = 3,
    this.tva = 18,
    this.objectifCaMensuel = 9000000,
  });

  final double chargesFixesMensuelles;
  final int commissionVendeur;
  final int tva;
  final double objectifCaMensuel;

  ManagerProfitAssumptions copyWith({
    double? chargesFixesMensuelles,
    int? commissionVendeur,
    int? tva,
    double? objectifCaMensuel,
  }) {
    return ManagerProfitAssumptions(
      chargesFixesMensuelles: chargesFixesMensuelles ?? this.chargesFixesMensuelles,
      commissionVendeur: commissionVendeur ?? this.commissionVendeur,
      tva: tva ?? this.tva,
      objectifCaMensuel: objectifCaMensuel ?? this.objectifCaMensuel,
    );
  }
}

/// Nombre de mois à afficher selon la période sélectionnée.
int monthsForPeriod(String periode) {
  switch (periode) {
    case '7 jours':
    case '30 jours':
      return 1;
    case '3 mois':
      return 3;
    case '12 mois':
      return 12;
    case '6 mois':
    default:
      return 6;
  }
}

/// Série pour le graphique CA (jours / semaines / mois selon la période).
List<Map<String, dynamic>> chartSeriesForPeriod(String periode) {
  final last = demoMonthlyRevenue.last;
  final monthCa = (last['ca'] as num?)?.toDouble() ?? 7000000;
  final monthCmd = (last['commandes'] as num?)?.toInt() ?? 300;

  if (periode == '7 jours') {
    const labels = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
    final weights = [0.9, 1.05, 0.95, 1.1, 1.25, 1.35, 0.7];
    final dayBudget = monthCa / 30;
    final dayCmd = monthCmd / 30;
    return [
      for (var i = 0; i < labels.length; i++)
        {
          'mois': labels[i],
          'ca': dayBudget * weights[i],
          'couts': dayBudget * weights[i] * 0.65,
          'commandes': (dayCmd * weights[i]).round(),
        },
    ];
  }

  if (periode == '30 jours') {
    return [
      for (var w = 1; w <= 4; w++)
        {
          'mois': 'S$w',
          'ca': monthCa * (0.2 + w * 0.05),
          'couts': monthCa * (0.2 + w * 0.05) * 0.65,
          'commandes': (monthCmd * (0.2 + w * 0.05)).round(),
        },
    ];
  }

  return monthlySeriesForPeriod(periode);
}

List<Map<String, dynamic>> monthlySeriesForPeriod(String periode) {
  final n = monthsForPeriod(periode);
  final source = extendedMonthlyRevenue;
  if (n >= source.length) return List<Map<String, dynamic>>.from(source);
  return source.sublist(source.length - n);
}

/// Série 12 mois (seed 6 mois + extrapolation).
List<Map<String, dynamic>> get extendedMonthlyRevenue {
  const extra = [
    {'mois': 'Aoû', 'ca': 7900000.0, 'couts': 5100000.0, 'commandes': 402},
    {'mois': 'Sep', 'ca': 7600000.0, 'couts': 4950000.0, 'commandes': 388},
    {'mois': 'Oct', 'ca': 8200000.0, 'couts': 5300000.0, 'commandes': 415},
    {'mois': 'Nov', 'ca': 9100000.0, 'couts': 5850000.0, 'commandes': 456},
    {'mois': 'Déc', 'ca': 9800000.0, 'couts': 6200000.0, 'commandes': 490},
    {'mois': 'Jan', 'ca': 8700000.0, 'couts': 5600000.0, 'commandes': 440},
  ];
  return [...demoMonthlyRevenue, ...extra];
}

/// Deltas CA / commandes vs période précédente (calculés, pas hardcodés).
({String caDelta, String cmdDelta}) periodDeltas(String periode) {
  final current = chartSeriesForPeriod(periode);
  final ca = current.fold<double>(0, (s, r) => s + ((r['ca'] as num?)?.toDouble() ?? 0));
  final cmd = current.fold<int>(0, (s, r) => s + ((r['commandes'] as num?)?.toInt() ?? 0));

  double prevCa;
  int prevCmd;

  if (periode == '7 jours' || periode == '30 jours') {
    final factor = periode == '7 jours' ? 0.92 : 0.94;
    prevCa = ca * factor;
    prevCmd = (cmd * factor).round();
  } else if (periode == '3 mois') {
    final all = extendedMonthlyRevenue;
    if (all.length >= 6) {
      final prev = all.sublist(all.length - 6, all.length - 3);
      prevCa = prev.fold<double>(0, (s, r) => s + ((r['ca'] as num?)?.toDouble() ?? 0));
      prevCmd = prev.fold<int>(0, (s, r) => s + ((r['commandes'] as num?)?.toInt() ?? 0));
    } else {
      prevCa = ca * 0.88;
      prevCmd = (cmd * 0.9).round();
    }
  } else {
    final months = monthsForPeriod(periode);
    final all = extendedMonthlyRevenue;
    if (all.length >= months * 2) {
      final prev = all.sublist(all.length - months * 2, all.length - months);
      prevCa = prev.fold<double>(0, (s, r) => s + ((r['ca'] as num?)?.toDouble() ?? 0));
      prevCmd = prev.fold<int>(0, (s, r) => s + ((r['commandes'] as num?)?.toInt() ?? 0));
    } else if (all.length > months) {
      final prev = all.sublist(0, all.length - months);
      prevCa = prev.fold<double>(0, (s, r) => s + ((r['ca'] as num?)?.toDouble() ?? 0));
      prevCmd = prev.fold<int>(0, (s, r) => s + ((r['commandes'] as num?)?.toInt() ?? 0));
      // Normaliser si la fenêtre précédente est plus courte.
      final ratio = months / prev.length;
      prevCa *= ratio;
      prevCmd = (prevCmd * ratio).round();
    } else {
      prevCa = ca * 0.85;
      prevCmd = (cmd * 0.91).round();
    }
  }

  String fmt(double cur, double prev) {
    if (prev <= 0) return '+0 %';
    final pct = ((cur - prev) / prev * 100);
    final sign = pct >= 0 ? '+' : '';
    return '$sign${pct.toStringAsFixed(1).replaceAll('.', ',')} %';
  }

  return (
    caDelta: '${fmt(ca, prevCa)} vs période préc.',
    cmdDelta: fmt(cmd.toDouble(), prevCmd.toDouble()),
  );
}

List<Map<String, Object>> hourlyTrafficForPeriod(String periode) {
  final scale = switch (periode) {
    '7 jours' => 0.35,
    '30 jours' => 0.85,
    '12 mois' => 1.4,
    _ => 1.0,
  };
  return [
    for (final row in demoHourlyTraffic)
      {
        'h': row['h'] as String,
        'scans': ((row['scans'] as int) * scale).round().clamp(1, 999),
      },
  ];
}

/// Ventes estimées d'un article (commandes + seed déterministe).
int estimatedSales(ProductModel product, List<OrderModel> orders) {
  var fromOrders = 0;
  for (final o in orders) {
    if (o.status != 'redeemed' && o.status != 'confirmed') continue;
    for (final item in o.items) {
      if (item.productId == product.id) fromOrders += item.quantity;
    }
  }
  if (fromOrders > 0) return fromOrders;
  final seed = product.id.codeUnits.fold(0, (a, c) => a + c);
  return 8 + (seed % 120);
}

double estimatedUnitCost(ProductModel product) {
  // Marge cible selon univers (aligné ~35 % moyen prototype).
  final ratio = switch (product.categoryId) {
    'technologie' || 'energie' => 0.72,
    'materiaux' || 'vehicules' => 0.78,
    'agro' || 'agriculture' => 0.62,
    'beaute' || 'style' => 0.55,
    _ => 0.65,
  };
  return product.displayPrice * ratio;
}

class StoreCaSlice {
  const StoreCaSlice({
    required this.storeId,
    required this.name,
    required this.ca,
    required this.color,
  });

  final String storeId;
  final String name;
  final double ca;
  final int color;
}

List<StoreCaSlice> caParBoutique({
  required List<StoreModel> stores,
  required List<ProductModel> products,
  required List<OrderModel> orders,
}) {
  return List.generate(stores.length, (i) {
    final store = stores[i];
    final fromOrders = orders
        .where((o) => o.storeId == store.id && (o.status == 'redeemed' || o.status == 'confirmed'))
        .fold<double>(0, (s, o) => s + o.total);
    final arts = products.where((p) => p.storeId == store.id);
    final fromCatalog = arts.fold<double>(
      0,
      (s, p) => s + p.displayPrice * estimatedSales(p, orders),
    );
    final ca = fromOrders > 0 ? fromOrders + fromCatalog * 0.15 : fromCatalog;
    final short = store.name.split(' ').first;
    return StoreCaSlice(
      storeId: store.id,
      name: short,
      ca: ca,
      color: demoPieColors[i % demoPieColors.length].value,
    );
  });
}

class TopSaleRow {
  const TopSaleRow({
    required this.product,
    required this.ventes,
    required this.ca,
  });

  final ProductModel product;
  final int ventes;
  final double ca;
}

List<TopSaleRow> topVentes({
  required List<ProductModel> products,
  required List<OrderModel> orders,
  int limit = 5,
}) {
  final rows = products.map((p) {
    final v = estimatedSales(p, orders);
    return TopSaleRow(product: p, ventes: v, ca: p.displayPrice * v);
  }).toList()
    ..sort((a, b) => b.ventes.compareTo(a.ventes));
  return rows.take(limit).toList();
}

class MarginSummary {
  const MarginSummary({
    required this.ca,
    required this.cout,
    required this.marge,
    required this.tauxMarge,
  });

  final double ca;
  final double cout;
  final double marge;
  final int tauxMarge;
}

MarginSummary margeGlobale({
  required List<ProductModel> products,
  required List<OrderModel> orders,
}) {
  var ca = 0.0;
  var cout = 0.0;
  for (final p in products) {
    final v = estimatedSales(p, orders);
    ca += p.displayPrice * v;
    cout += estimatedUnitCost(p) * v;
  }
  final marge = ca - cout;
  return MarginSummary(
    ca: ca,
    cout: cout,
    marge: marge,
    tauxMarge: ca > 0 ? (marge / ca * 100).round() : 0,
  );
}

class BoutiqueProfitRow {
  const BoutiqueProfitRow({
    required this.storeId,
    required this.nom,
    required this.ca,
    required this.cout,
    required this.marge,
    required this.tauxMarge,
  });

  final String storeId;
  final String nom;
  final double ca;
  final double cout;
  final double marge;
  final int tauxMarge;
}

List<BoutiqueProfitRow> profitParBoutique({
  required List<StoreModel> stores,
  required List<ProductModel> products,
  required List<OrderModel> orders,
}) {
  final rows = stores.map((s) {
    final arts = products.where((p) => p.storeId == s.id).toList();
    final m = margeGlobale(products: arts, orders: orders);
    return BoutiqueProfitRow(
      storeId: s.id,
      nom: s.name,
      ca: m.ca,
      cout: m.cout,
      marge: m.marge,
      tauxMarge: m.tauxMarge,
    );
  }).toList()
    ..sort((a, b) => b.marge.compareTo(a.marge));
  return rows;
}

class ArticleRentableRow {
  const ArticleRentableRow({
    required this.product,
    required this.margeUnitaire,
    required this.margeTotale,
    required this.tauxMarge,
  });

  final ProductModel product;
  final double margeUnitaire;
  final double margeTotale;
  final int tauxMarge;
}

List<ArticleRentableRow> articlesRentables({
  required List<ProductModel> products,
  required List<OrderModel> orders,
  int limit = 6,
}) {
  final rows = products.map((p) {
    final prix = p.displayPrice;
    final cout = estimatedUnitCost(p);
    final mu = prix - cout;
    final v = estimatedSales(p, orders);
    return ArticleRentableRow(
      product: p,
      margeUnitaire: mu,
      margeTotale: mu * v,
      tauxMarge: prix > 0 ? (mu / prix * 100).round() : 0,
    );
  }).toList()
    ..sort((a, b) => b.margeTotale.compareTo(a.margeTotale));
  return rows.take(limit).toList();
}

/// Domaines / catégories pour le bar chart profit.
List<({String id, String nom, double marge, double ca, int taux})> margeParCategorie({
  required List<ProductModel> products,
  required List<OrderModel> orders,
}) {
  final map = <String, ({double ca, double marge})>{};
  for (final p in products) {
    final id = p.categoryId ?? 'autre';
    final v = estimatedSales(p, orders);
    final ca = p.displayPrice * v;
    final marge = (p.displayPrice - estimatedUnitCost(p)) * v;
    final cur = map[id] ?? (ca: 0.0, marge: 0.0);
    map[id] = (ca: cur.ca + ca, marge: cur.marge + marge);
  }
  final labels = {
    'agro': 'Agro',
    'technologie': 'Tech',
    'materiaux': 'Bâtiment',
    'mode': 'Mode',
    'beaute': 'Beauté',
    'auto': 'Auto',
    'sport': 'Sport',
    'livres': 'Livres',
    'enfants': 'Enfants',
    'art': 'Art',
    'energie': 'Énergie',
    'services': 'Services',
    'autre': 'Autres',
  };
  final list = map.entries.map((e) {
    final ca = e.value.ca;
    final marge = e.value.marge;
    return (
      id: e.key,
      nom: labels[e.key] ?? e.key.replaceFirst('cat-', '').replaceFirstMapped(
            RegExp(r'^.'),
            (m) => m.group(0)!.toUpperCase(),
          ),
      marge: marge,
      ca: ca,
      taux: ca > 0 ? (marge / ca * 100).round() : 0,
    );
  }).toList()
    ..sort((a, b) => b.marge.compareTo(a.marge));
  return list;
}
