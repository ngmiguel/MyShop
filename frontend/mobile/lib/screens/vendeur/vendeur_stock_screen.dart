import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../core/theme/app_theme.dart';
import '../../core/utils/formatters.dart';
import '../../data/models/preferences.dart';
import '../../data/models/product.dart';
import '../../providers/auth_provider.dart';
import '../../providers/catalog_provider.dart';
import '../../providers/orders_provider.dart';
import '../../widgets/app_layout.dart';
import '../../widgets/common_widgets.dart';
import '../../widgets/stat_card.dart';

class VendeurStockScreen extends StatefulWidget {
  const VendeurStockScreen({super.key});

  @override
  State<VendeurStockScreen> createState() => _VendeurStockScreenState();
}

class _VendeurStockScreenState extends State<VendeurStockScreen> {
  String _tab = 'stock'; // stock | caisse
  String _query = '';
  final _search = TextEditingController();
  bool _serviceClosed = false;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<CatalogProvider>().loadFeed();
      context.read<OrdersProvider>().loadOrders();
    });
  }

  @override
  void dispose() {
    _search.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();
    final catalog = context.watch<CatalogProvider>();
    final orders = context.watch<OrdersProvider>();
    final storeId = auth.user?.storeId;
    final storeName = catalog.storeById(storeId ?? '')?.name ?? 'Boutique';

    final products = catalog.products
        .where((p) => storeId == null || p.storeId == storeId)
        .where((p) {
          final q = _query.trim().toLowerCase();
          if (q.isEmpty) return true;
          return p.name.toLowerCase().contains(q) ||
              (p.categoryId ?? '').toLowerCase().contains(q);
        })
        .toList()
      ..sort((a, b) => a.stock.compareTo(b.stock));

    final out = products.where((p) => p.stock <= 0).length;
    final low = products.where((p) => p.stock > 0 && p.stock <= 5).length;

    final now = DateTime.now();
    final todayOrders = orders.orders.where((o) {
      if (storeId != null && o.storeId != storeId) return false;
      if (o.status != 'redeemed' && o.status != 'rated' && o.status != 'confirmed') return false;
      final t = o.redeemedAt ?? o.createdAt;
      return t != null && t.year == now.year && t.month == now.month && t.day == now.day;
    }).toList();
    final cashTotal = todayOrders.fold<double>(0, (s, o) => s + o.total);
    final avg = todayOrders.isEmpty ? 0.0 : cashTotal / todayOrders.length;

    final byMethod = <String, double>{};
    for (final o in todayOrders) {
      final key = o.paymentMethod ?? 'cash';
      byMethod[key] = (byMethod[key] ?? 0) + o.total;
    }

    return Scaffold(
      backgroundColor: AppTheme.contentBackground(context),
      appBar: AppBar(
        title: const Text('Stock & caisse'),
        actions: [
          IconButton(
            tooltip: 'Actualiser',
            onPressed: () {
              catalog.loadFeed();
              orders.loadOrders();
            },
            icon: const Icon(Icons.refresh),
          ),
        ],
      ),
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 8, 16, 0),
            child: Row(
              children: [
                Expanded(
                  child: Text(
                    storeName,
                    style: const TextStyle(fontSize: 13, color: AppTheme.ink500, fontWeight: FontWeight.w600),
                  ),
                ),
                AppChip(
                  label: const Text('Stock'),
                  active: _tab == 'stock',
                  bold: true,
                  onTap: () => setState(() => _tab = 'stock'),
                ),
                const SizedBox(width: 8),
                AppChip(
                  label: const Text('Caisse'),
                  active: _tab == 'caisse',
                  bold: true,
                  onTap: () => setState(() => _tab = 'caisse'),
                ),
              ],
            ),
          ),
          Expanded(
            child: _tab == 'stock'
                ? _StockTab(
                    products: products,
                    out: out,
                    low: low,
                    search: _search,
                    onQuery: (v) => setState(() => _query = v),
                    onReport: _reportGap,
                  )
                : _CaisseTab(
                    cashTotal: cashTotal,
                    count: todayOrders.length,
                    average: avg,
                    byMethod: byMethod,
                    closed: _serviceClosed,
                    onClose: () {
                      setState(() => _serviceClosed = true);
                      ScaffoldMessenger.of(context).showSnackBar(
                        SnackBar(
                          content: Text(
                            'Service clôturé · ${formatPrix(cashTotal)} encaissés (${todayOrders.length} retraits)',
                          ),
                        ),
                      );
                    },
                  ),
          ),
        ],
      ),
    );
  }

  void _reportGap(ProductModel p) {
    showModalBottomSheet<void>(
      context: context,
      builder: (ctx) {
        var qty = p.stock;
        return StatefulBuilder(
          builder: (ctx, setModal) => SafeArea(
            child: Padding(
              padding: const EdgeInsets.all(20),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  Text('Signaler un écart', style: Theme.of(ctx).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w800)),
                  const SizedBox(height: 4),
                  Text(p.name, style: const TextStyle(color: AppTheme.ink500)),
                  const SizedBox(height: 16),
                  Row(
                    children: [
                      const Text('Stock constaté', style: TextStyle(fontWeight: FontWeight.w700)),
                      const Spacer(),
                      IconButton(
                        onPressed: () => setModal(() => qty = (qty - 1).clamp(0, 9999)),
                        icon: const Icon(Icons.remove_circle_outline),
                      ),
                      Text('$qty', style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 16)),
                      IconButton(
                        onPressed: () => setModal(() => qty = (qty + 1).clamp(0, 9999)),
                        icon: const Icon(Icons.add_circle_outline),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),
                  FilledButton(
                    onPressed: () {
                      Navigator.pop(ctx);
                      ScaffoldMessenger.of(context).showSnackBar(
                        SnackBar(content: Text('Écart signalé pour « ${p.name} » (stock $qty)')),
                      );
                    },
                    child: const Text('Envoyer le signalement'),
                  ),
                ],
              ),
            ),
          ),
        );
      },
    );
  }
}

class _StockTab extends StatelessWidget {
  const _StockTab({
    required this.products,
    required this.out,
    required this.low,
    required this.search,
    required this.onQuery,
    required this.onReport,
  });

  final List<ProductModel> products;
  final int out;
  final int low;
  final TextEditingController search;
  final ValueChanged<String> onQuery;
  final ValueChanged<ProductModel> onReport;

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.fromLTRB(16, 12, 16, 24),
      children: [
        Row(
          children: [
            Expanded(
              child: StatCard(label: 'Références', value: '${products.length}', icon: Icons.inventory_2_outlined),
            ),
            const SizedBox(width: 8),
            Expanded(
              child: StatCard(
                label: 'Ruptures',
                value: '$out',
                icon: Icons.warning_amber_outlined,
                tone: StatTone.danger,
              ),
            ),
            const SizedBox(width: 8),
            Expanded(
              child: StatCard(
                label: 'Stock faible',
                value: '$low',
                icon: Icons.inventory_outlined,
                tone: StatTone.warning,
              ),
            ),
          ],
        ),
        const SizedBox(height: 12),
        TextField(
          controller: search,
          onChanged: onQuery,
          decoration: const InputDecoration(
            hintText: 'Rechercher un article…',
            prefixIcon: Icon(Icons.search, size: 20),
          ),
        ),
        const SizedBox(height: 12),
        if (products.isEmpty)
          const EmptyState(
            icon: Icons.inventory_2_outlined,
            title: 'Aucun article',
            subtitle: 'Les produits de votre boutique apparaîtront ici.',
          )
        else
          ...products.map((p) {
            final cat = domainById(p.categoryId ?? '')?.name ?? p.categoryId ?? '—';
            final tone = p.stock <= 0
                ? const Color(0xFFE11D48)
                : p.stock <= 5
                    ? const Color(0xFFD97706)
                    : AppTheme.emerald600;
            return Padding(
              padding: const EdgeInsets.only(bottom: 8),
              child: Container(
                decoration: AppTheme.cardDecoration(context),
                child: ListTile(
                  title: Text(p.name, style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 13)),
                  subtitle: Text('$cat · ${formatPrix(p.displayPrice)}', style: const TextStyle(fontSize: 12)),
                  trailing: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                        decoration: BoxDecoration(
                          color: tone.withValues(alpha: 0.12),
                          borderRadius: BorderRadius.circular(999),
                        ),
                        child: Text(
                          '${p.stock}',
                          style: TextStyle(fontWeight: FontWeight.w800, fontSize: 12, color: tone),
                        ),
                      ),
                      IconButton(
                        tooltip: 'Signaler un écart',
                        onPressed: () => onReport(p),
                        icon: const Icon(Icons.report_outlined, size: 20),
                      ),
                    ],
                  ),
                ),
              ),
            );
          }),
      ],
    );
  }
}

class _CaisseTab extends StatelessWidget {
  const _CaisseTab({
    required this.cashTotal,
    required this.count,
    required this.average,
    required this.byMethod,
    required this.closed,
    required this.onClose,
  });

  final double cashTotal;
  final int count;
  final double average;
  final Map<String, double> byMethod;
  final bool closed;
  final VoidCallback onClose;

  String _label(String method) => switch (method) {
        'mobile_money' => 'Mobile Money',
        'card' => 'Carte bancaire',
        'transfer' => 'Virement',
        'cash' => 'Espèces',
        _ => method,
      };

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.fromLTRB(16, 12, 16, 24),
      children: [
        Row(
          children: [
            Expanded(
              child: StatCard(
                label: 'Encaissé aujourd’hui',
                value: formatMontantCourt(cashTotal),
                delta: '$count retraits',
                icon: Icons.payments_outlined,
                tone: StatTone.success,
              ),
            ),
            const SizedBox(width: 8),
            Expanded(
              child: StatCard(
                label: 'Panier moyen',
                value: formatMontantCourt(average),
                icon: Icons.shopping_bag_outlined,
              ),
            ),
          ],
        ),
        const SizedBox(height: 16),
        const SectionHeader(title: 'Répartition par paiement', padding: EdgeInsets.zero),
        const SizedBox(height: 8),
        Container(
          decoration: AppTheme.cardDecoration(context),
          child: byMethod.isEmpty
              ? const Padding(
                  padding: EdgeInsets.all(20),
                  child: Text('Aucun encaissement aujourd’hui.', style: TextStyle(color: AppTheme.ink400)),
                )
              : Column(
                  children: [
                    for (final e in byMethod.entries.toList()..sort((a, b) => b.value.compareTo(a.value))) ...[
                      if (e != byMethod.entries.first) const Divider(height: 1),
                      ListTile(
                        title: Text(_label(e.key), style: const TextStyle(fontWeight: FontWeight.w700)),
                        trailing: Text(formatPrix(e.value), style: const TextStyle(fontWeight: FontWeight.w800)),
                      ),
                    ],
                  ],
                ),
        ),
        const SizedBox(height: 20),
        FilledButton.icon(
          onPressed: closed ? null : onClose,
          icon: Icon(closed ? Icons.lock_outline : Icons.lock_open_outlined),
          label: Text(closed ? 'Service déjà clôturé' : 'Clôturer le service'),
          style: FilledButton.styleFrom(
            backgroundColor: AppTheme.ink900,
            minimumSize: const Size.fromHeight(48),
          ),
        ),
        const SizedBox(height: 8),
        const Text(
          'La clôture archive le total du jour pour le journal de caisse.',
          style: TextStyle(fontSize: 12, color: AppTheme.ink400),
        ),
      ],
    );
  }
}
