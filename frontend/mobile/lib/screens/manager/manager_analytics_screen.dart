import 'package:fl_chart/fl_chart.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

import '../../core/theme/app_theme.dart';
import '../../core/utils/formatters.dart';
import '../../data/demo/demo_accounts.dart';
import '../../data/demo/demo_analytics.dart';
import '../../data/models/preferences.dart';
import '../../providers/catalog_provider.dart';
import '../../providers/orders_provider.dart';
import '../../widgets/app_layout.dart';
import '../../widgets/common_widgets.dart';
import '../../widgets/stat_card.dart';
import '../../widgets/top_bar.dart';

class ManagerAnalyticsScreen extends StatefulWidget {
  const ManagerAnalyticsScreen({super.key});

  @override
  State<ManagerAnalyticsScreen> createState() => _ManagerAnalyticsScreenState();
}

class _ManagerAnalyticsScreenState extends State<ManagerAnalyticsScreen> {
  String _periode = '30 jours';
  String? _storeFilter;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<CatalogProvider>().loadFeed();
      context.read<OrdersProvider>().loadOrders();
    });
  }

  @override
  Widget build(BuildContext context) {
    final catalog = context.watch<CatalogProvider>();
    final orders = context.watch<OrdersProvider>();
    final scale = switch (_periode) {
      '7 jours' => 1 / 30,
      '30 jours' => 1 / 6,
      '3 mois' => 0.5,
      '12 mois' => 2.0,
      _ => 1.0,
    };

    final products = _storeFilter == null
        ? catalog.products
        : catalog.products.where((p) => p.storeId == _storeFilter).toList();
    final scopedOrders = _storeFilter == null
        ? orders.orders
        : orders.orders.where((o) => o.storeId == _storeFilter).toList();

    final marge = margeGlobale(products: products, orders: scopedOrders);
    final ca = marge.ca * scale;
    final margeVal = marge.marge * scale;
    final redeemed = scopedOrders.where((o) => o.status == 'redeemed' || o.status == 'rated' || o.status == 'confirmed');
    final tx = (redeemed.length * scale).round().clamp(1, 99999);
    final serie = chartSeriesForPeriod(_periode == '7 jours' ? '7 jours' : _periode);
    final deltas = periodDeltas(_periode == '7 jours' ? '7 jours' : _periode);
    final top = articlesRentables(products: products, orders: scopedOrders, limit: 8);
    final domains = margeParCategorie(products: products, orders: scopedOrders);
    final boutiques = profitParBoutique(stores: catalog.stores, products: products, orders: scopedOrders)
      ..sort((a, b) => b.ca.compareTo(a.ca));

    // RFM simplifié (segments démo)
    final rfm = [
      ('Champions', (tx * 0.18).round(), AppTheme.emerald600),
      ('Fidèles', (tx * 0.28).round(), const Color(0xFF0284C7)),
      ('À risque', (tx * 0.22).round(), const Color(0xFFD97706)),
      ('Dormants', (tx * 0.32).round(), AppTheme.ink400),
    ];

    final anomalies = [
      if (alertStock(products) > 0) 'Stock critique sur ${alertStock(products)} références',
      if (deltas.caDelta.startsWith('-')) 'CA en baisse vs période précédente (${deltas.caDelta})',
      if (demoSellers.where((s) => s.isPending).isNotEmpty)
        '${demoSellers.where((s) => s.isPending).length} vendeur(s) en attente de validation',
    ];

    return Scaffold(
      backgroundColor: AppTheme.contentBackground(context),
      appBar: TopBar(
        title: 'Analyses',
        subtitle: '$tx transactions · marge ${marge.tauxMarge} %',
        action: IconButton(
          tooltip: 'Exporter CSV',
          icon: const Icon(Icons.download_outlined),
          onPressed: () => _exportCsv(ca: ca, marge: margeVal, tx: tx, top: top),
        ),
      ),
      body: ListView(
        padding: const EdgeInsets.fromLTRB(16, 8, 16, 32),
        children: [
          SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            child: Row(
              children: [
                for (final p in const ['7 jours', '30 jours', '3 mois', '6 mois', '12 mois']) ...[
                  AppChip(
                    label: Text(p),
                    active: _periode == p,
                    bold: true,
                    onTap: () => setState(() => _periode = p),
                  ),
                  const SizedBox(width: 8),
                ],
              ],
            ),
          ),
          const SizedBox(height: 8),
          SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            child: Row(
              children: [
                AppChip(
                  label: const Text('Toutes boutiques'),
                  active: _storeFilter == null,
                  onTap: () => setState(() => _storeFilter = null),
                ),
                const SizedBox(width: 8),
                for (final s in catalog.stores.take(8)) ...[
                  AppChip(
                    label: Text(s.name.split(' ').first),
                    active: _storeFilter == s.id,
                    onTap: () => setState(() => _storeFilter = s.id),
                  ),
                  const SizedBox(width: 8),
                ],
              ],
            ),
          ),
          const SizedBox(height: 14),
          GridView.count(
            crossAxisCount: 2,
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            crossAxisSpacing: 10,
            mainAxisSpacing: 10,
            childAspectRatio: 1.3,
            children: [
              StatCard(
                label: "Chiffre d'affaires",
                value: '${formatMontantCourt(ca)} F',
                delta: deltas.caDelta,
                icon: Icons.trending_up,
                tone: StatTone.info,
              ),
              StatCard(
                label: 'Marge brute',
                value: '${formatMontantCourt(margeVal)} F',
                delta: '${marge.tauxMarge} % du CA',
                icon: Icons.account_balance_wallet_outlined,
                tone: StatTone.success,
              ),
              StatCard(
                label: 'Transactions',
                value: '$tx',
                delta: deltas.cmdDelta,
                icon: Icons.receipt_long_outlined,
              ),
              StatCard(
                label: 'Panier moyen',
                value: formatMontantCourt(tx > 0 ? ca / tx : 0),
                icon: Icons.shopping_bag_outlined,
                tone: StatTone.warning,
              ),
            ],
          ),
          const SizedBox(height: 16),
          const SectionHeader(title: 'Évolution du CA', padding: EdgeInsets.zero),
          const SizedBox(height: 8),
          Container(
            height: 200,
            padding: const EdgeInsets.fromLTRB(8, 16, 12, 8),
            decoration: AppTheme.cardDecoration(context),
            child: LineChart(
              LineChartData(
                gridData: FlGridData(
                  show: true,
                  drawVerticalLine: false,
                  getDrawingHorizontalLine: (_) => const FlLine(color: AppTheme.ink100, strokeWidth: 1),
                ),
                titlesData: FlTitlesData(
                  topTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
                  rightTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
                  leftTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
                  bottomTitles: AxisTitles(
                    sideTitles: SideTitles(
                      showTitles: true,
                      interval: (serie.length / 4).clamp(1, 10).toDouble(),
                      getTitlesWidget: (v, _) {
                        final i = v.toInt();
                        if (i < 0 || i >= serie.length) return const SizedBox.shrink();
                        return Text('${serie[i]['mois']}', style: const TextStyle(fontSize: 10, color: AppTheme.ink400));
                      },
                    ),
                  ),
                ),
                borderData: FlBorderData(show: false),
                lineBarsData: [
                  LineChartBarData(
                    spots: [
                      for (var i = 0; i < serie.length; i++)
                        FlSpot(i.toDouble(), ((serie[i]['ca'] as num?)?.toDouble() ?? 0) / 1000000),
                    ],
                    isCurved: true,
                    color: AppTheme.accent500,
                    barWidth: 3,
                    dotData: const FlDotData(show: false),
                    belowBarData: BarAreaData(show: true, color: AppTheme.accent500.withValues(alpha: 0.12)),
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 4),
          const Text('En millions FCFA', style: TextStyle(fontSize: 11, color: AppTheme.ink400)),
          const SizedBox(height: 16),
          const SectionHeader(title: 'Analyse ABC (marge)', padding: EdgeInsets.zero),
          const SizedBox(height: 8),
          ...top.take(5).map((r) {
            final letter = r.tauxMarge >= 40 ? 'A' : r.tauxMarge >= 25 ? 'B' : 'C';
            return Container(
              margin: const EdgeInsets.only(bottom: 8),
              decoration: AppTheme.cardDecoration(context),
              child: ListTile(
                leading: CircleAvatar(
                  backgroundColor: letter == 'A'
                      ? AppTheme.emerald600
                      : letter == 'B'
                          ? const Color(0xFFD97706)
                          : AppTheme.ink400,
                  child: Text(letter, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w800)),
                ),
                title: Text(r.product.name, maxLines: 1, overflow: TextOverflow.ellipsis, style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 13)),
                subtitle: Text('${r.tauxMarge} % marge unitaire'),
                trailing: Text('${formatMontantCourt(r.margeTotale * scale)} F', style: const TextStyle(fontWeight: FontWeight.w800)),
              ),
            );
          }),
          const SizedBox(height: 8),
          const SectionHeader(title: 'Segments RFM', padding: EdgeInsets.zero),
          const SizedBox(height: 8),
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: [
              for (final s in rfm)
                Container(
                  width: (MediaQuery.sizeOf(context).width - 48) / 2,
                  padding: const EdgeInsets.all(14),
                  decoration: AppTheme.cardDecoration(context),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(s.$1, style: TextStyle(fontSize: 12, fontWeight: FontWeight.w700, color: s.$3)),
                      const SizedBox(height: 4),
                      Text('${s.$2}', style: const TextStyle(fontSize: 20, fontWeight: FontWeight.w800)),
                      const Text('clients', style: TextStyle(fontSize: 11, color: AppTheme.ink400)),
                    ],
                  ),
                ),
            ],
          ),
          const SizedBox(height: 16),
          const SectionHeader(title: 'Top boutiques', padding: EdgeInsets.zero),
          const SizedBox(height: 8),
          ...boutiques.take(5).map(
            (b) => Container(
              margin: const EdgeInsets.only(bottom: 8),
              decoration: AppTheme.cardDecoration(context),
              child: ListTile(
                title: Text(b.nom, style: const TextStyle(fontWeight: FontWeight.w700)),
                subtitle: Text('Marge ${b.tauxMarge} %'),
                trailing: Text('${formatMontantCourt(b.ca * scale)} F', style: const TextStyle(fontWeight: FontWeight.w800)),
              ),
            ),
          ),
          const SizedBox(height: 8),
          const SectionHeader(title: 'Par univers', padding: EdgeInsets.zero),
          const SizedBox(height: 8),
          ...domains.take(6).map((d) {
            final name = domainById(d.id)?.name ?? d.nom;
            return Padding(
              padding: const EdgeInsets.only(bottom: 8),
              child: Row(
                children: [
                  Expanded(child: Text(name, style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 13))),
                  Text('${formatMontantCourt(d.marge * scale)} F', style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 13)),
                ],
              ),
            );
          }),
          if (anomalies.isNotEmpty) ...[
            const SizedBox(height: 12),
            const SectionHeader(title: 'Anomalies détectées', padding: EdgeInsets.zero),
            const SizedBox(height: 8),
            ...anomalies.map(
              (a) => Container(
                margin: const EdgeInsets.only(bottom: 8),
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: const Color(0xFFFFFBEB),
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: const Color(0xFFFDE68A)),
                ),
                child: Row(
                  children: [
                    const Icon(Icons.warning_amber_outlined, color: Color(0xFFD97706), size: 18),
                    const SizedBox(width: 10),
                    Expanded(child: Text(a, style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600))),
                  ],
                ),
              ),
            ),
          ],
          const SizedBox(height: 12),
          OutlinedButton.icon(
            onPressed: () => context.push('/manager/models'),
            icon: const Icon(Icons.psychology_outlined),
            label: const Text('Voir les modèles prédictifs'),
          ),
        ],
      ),
    );
  }

  int alertStock(List products) => products.where((p) => p.stock <= 5).length;

  Future<void> _exportCsv({
    required double ca,
    required double marge,
    required int tx,
    required List<ArticleRentableRow> top,
  }) async {
    final buf = StringBuffer('metric,value\n');
    buf.writeln('periode,$_periode');
    buf.writeln('ca,$ca');
    buf.writeln('marge,$marge');
    buf.writeln('transactions,$tx');
    for (final r in top.take(5)) {
      buf.writeln('top_product,"${r.product.name}",${r.margeTotale}');
    }
    await Clipboard.setData(ClipboardData(text: buf.toString()));
    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('CSV copié dans le presse-papiers')));
    }
  }
}
