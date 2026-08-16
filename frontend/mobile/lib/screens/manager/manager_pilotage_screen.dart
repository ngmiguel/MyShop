import 'package:cached_network_image/cached_network_image.dart';
import 'package:fl_chart/fl_chart.dart';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

import '../../core/theme/app_theme.dart';
import '../../core/utils/formatters.dart';
import '../../data/demo/demo_accounts.dart';
import '../../data/demo/demo_analytics.dart';
import '../../providers/auth_provider.dart';
import '../../providers/catalog_provider.dart';
import '../../providers/orders_provider.dart';
import '../../widgets/app_layout.dart';
import '../../widgets/common_widgets.dart';
import '../../widgets/stat_card.dart';

class ManagerDashboardScreen extends StatefulWidget {
  const ManagerDashboardScreen({super.key});

  @override
  State<ManagerDashboardScreen> createState() => _ManagerDashboardScreenState();
}

class _ManagerDashboardScreenState extends State<ManagerDashboardScreen> {
  String _periode = '6 mois';

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) async {
      if (!mounted) return;
      await context.read<CatalogProvider>().loadFeed();
      if (!mounted) return;
      await context.read<OrdersProvider>().loadOrders();
    });
  }

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();
    final catalog = context.watch<CatalogProvider>();
    final orders = context.watch<OrdersProvider>();

    final redeemed = orders.orders
        .where((o) => o.status == 'redeemed' || o.status == 'confirmed')
        .toList();
    final caConfirme = redeemed.fold<double>(0, (s, o) => s + o.total);

    final serie = chartSeriesForPeriod(_periode);
    final deltas = periodDeltas(_periode);
    final caSerie = serie.fold<double>(0, (s, r) => s + ((r['ca'] as num?)?.toDouble() ?? 0));
    final cmdSerie = serie.fold<int>(0, (s, r) => s + ((r['commandes'] as num?)?.toInt() ?? 0));
    final caTotal = caSerie + caConfirme;
    final commandes = cmdSerie + orders.orders.length;
    final panierMoyen = commandes > 0 ? (caTotal / commandes).roundToDouble() : 0.0;

    final marge = margeGlobale(products: catalog.products, orders: orders.orders);
    final alertesStock = catalog.products.where((p) => p.stock <= 5).length;
    final enAttente = demoSellers.where((s) => s.isPending).length;
    final vendeursActifs = demoSellers.where((s) => s.isActive).length;
    final alertesTotal = alertesStock + enAttente;
    final hourly = hourlyTrafficForPeriod(_periode);

    final slices = caParBoutique(
      stores: catalog.stores,
      products: catalog.products,
      orders: orders.orders,
    );
    final top = topVentes(products: catalog.products, orders: orders.orders);

    return Scaffold(
      backgroundColor: AppTheme.contentBackground(context),
      body: RefreshIndicator(
        onRefresh: () async {
          final catalog = context.read<CatalogProvider>();
          final orders = context.read<OrdersProvider>();
          await catalog.loadFeed();
          await orders.loadOrders();
        },
        child: CustomScrollView(
          physics: const AlwaysScrollableScrollPhysics(),
          slivers: [
            SliverToBoxAdapter(
              child: HeroHeader(
                padding: const EdgeInsets.fromLTRB(16, 12, 16, 28),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text(
                      'BUSINESS INTELLIGENCE',
                      style: TextStyle(
                        color: AppTheme.accent300,
                        fontSize: 11,
                        fontWeight: FontWeight.w700,
                        letterSpacing: 1.4,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      auth.user?.displayName ?? 'Pilotage',
                      style: const TextStyle(color: Colors.white, fontSize: 22, fontWeight: FontWeight.w800, height: 1.15),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      '${catalog.stores.length} boutiques · $vendeursActifs vendeurs actifs · panier moyen ${formatPrix(panierMoyen)}',
                      style: const TextStyle(color: AppTheme.ink300, fontSize: 13),
                    ),
                    const SizedBox(height: 14),
                    SingleChildScrollView(
                      scrollDirection: Axis.horizontal,
                      child: Row(
                        children: [
                          for (final p in const ['7 jours', '30 jours', '6 mois', '12 mois']) ...[
                            if (p != '7 jours') const SizedBox(width: 8),
                            _PeriodChip(
                              label: p,
                              active: _periode == p,
                              onTap: () => setState(() => _periode = p),
                            ),
                          ],
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ),
            SliverToBoxAdapter(
              child: ContentSheet(
                child: Padding(
                  padding: const EdgeInsets.fromLTRB(16, 8, 16, 32),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      GridView.count(
                        crossAxisCount: 2,
                        shrinkWrap: true,
                        physics: const NeverScrollableScrollPhysics(),
                        crossAxisSpacing: 12,
                        mainAxisSpacing: 12,
                        childAspectRatio: 1.28,
                        children: [
                          StatCard(
                            label: "Chiffre d'affaires",
                            value: '${formatMontantCourt(caTotal)} F',
                            delta: deltas.caDelta,
                            icon: Icons.payments_outlined,
                            tone: StatTone.success,
                          ),
                          StatCard(
                            label: 'Commandes',
                            value: '$commandes',
                            delta: deltas.cmdDelta,
                            icon: Icons.shopping_cart_outlined,
                            tone: StatTone.info,
                          ),
                          StatCard(
                            label: 'Marge brute',
                            value: '${formatMontantCourt(marge.marge)} F',
                            delta: '${marge.tauxMarge} % du CA',
                            icon: Icons.storefront_outlined,
                            tone: StatTone.success,
                            onTap: () => context.go('/manager/profit'),
                          ),
                          StatCard(
                            label: 'Alertes',
                            value: '$alertesTotal',
                            delta: alertesTotal > 0 ? 'Action requise' : 'Tout est stable',
                            icon: Icons.warning_amber_outlined,
                            tone: alertesTotal > 0 ? StatTone.warning : StatTone.neutral,
                            onTap: () => context.push('/manager/monitoring'),
                          ),
                        ],
                      ),
                      const SizedBox(height: 20),
                      _ChartCard(
                        title: "Évolution du chiffre d'affaires",
                        action: Text(_periode, style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w600, color: AppTheme.ink400)),
                        child: SizedBox(
                          height: 200,
                          child: _CaAreaChart(serie: serie),
                        ),
                      ),
                      const SizedBox(height: 16),
                      _ChartCard(
                        title: 'Répartition par boutique',
                        child: slices.isEmpty
                            ? const Padding(
                                padding: EdgeInsets.all(24),
                                child: Text('Aucune boutique', textAlign: TextAlign.center),
                              )
                            : _StorePieSection(
                                slices: slices.take(6).toList(),
                                onSliceTap: (id) => context.push('/manager/boutiques/$id'),
                              ),
                      ),
                      const SizedBox(height: 16),
                      _ChartCard(
                        title: 'Scans par tranche horaire',
                        action: Text(_periode, style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w600, color: AppTheme.ink400)),
                        child: SizedBox(
                          height: 168,
                          child: _ScansBarChart(data: hourly),
                        ),
                      ),
                      const SizedBox(height: 20),
                      SectionHeader(
                        title: 'Meilleures ventes',
                        padding: EdgeInsets.zero,
                        action: TextButton(
                          onPressed: () => context.go('/manager/boutiques'),
                          child: const Text('Boutiques'),
                        ),
                      ),
                      const SizedBox(height: 8),
                      Container(
                        decoration: AppTheme.cardDecoration(context),
                        child: Column(
                          children: [
                            for (var i = 0; i < top.length; i++) ...[
                              if (i > 0) const Divider(height: 1, indent: 56),
                              _TopSaleTile(rank: i + 1, row: top[i]),
                            ],
                          ],
                        ),
                      ),
                      const SizedBox(height: 20),
                      SectionHeader(
                        title: 'Actions requises',
                        padding: EdgeInsets.zero,
                        action: alertesTotal > 0
                            ? Container(
                                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                                decoration: BoxDecoration(
                                  color: const Color(0xFFFFFBEB),
                                  borderRadius: BorderRadius.circular(999),
                                ),
                                child: Text(
                                  '$alertesTotal',
                                  style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w800, color: Color(0xFFD97706)),
                                ),
                              )
                            : null,
                      ),
                      const SizedBox(height: 8),
                      if (enAttente > 0)
                        _ActionTile(
                          icon: Icons.groups_outlined,
                          iconBg: const Color(0xFFFFFBEB),
                          iconColor: const Color(0xFFB45309),
                          label: '$enAttente vendeur(s) en attente de validation',
                          onTap: () => context.go('/manager/equipe'),
                        ),
                      if (alertesStock > 0) ...[
                        if (enAttente > 0) const SizedBox(height: 8),
                        _ActionTile(
                          icon: Icons.inventory_2_outlined,
                          iconBg: const Color(0xFFFEF2F2),
                          iconColor: const Color(0xFFDC2626),
                          label: '$alertesStock article(s) en stock critique',
                          onTap: () => context.push('/manager/monitoring'),
                        ),
                      ],
                      if (orders.pendingOrders.isNotEmpty) ...[
                        if (enAttente > 0 || alertesStock > 0) const SizedBox(height: 8),
                        _ActionTile(
                          icon: Icons.qr_code_scanner_outlined,
                          iconBg: const Color(0xFFF0F9FF),
                          iconColor: const Color(0xFF0284C7),
                          label: '${orders.pendingOrders.length} code(s) en attente de scan',
                          onTap: () => context.go('/manager/boutiques'),
                        ),
                      ],
                      if (enAttente == 0 && alertesStock == 0 && orders.pendingOrders.isEmpty)
                        Container(
                          padding: const EdgeInsets.all(16),
                          decoration: AppTheme.cardDecoration(context),
                          child: const Row(
                            children: [
                              Icon(Icons.check_circle_outline, color: AppTheme.emerald600),
                              SizedBox(width: 12),
                              Expanded(
                                child: Text(
                                  'Aucune action urgente — activité nominale.',
                                  style: TextStyle(fontWeight: FontWeight.w600, color: AppTheme.ink700),
                                ),
                              ),
                            ],
                          ),
                        ),
                      const SizedBox(height: 20),
                      SectionHeader(title: 'Raccourcis', padding: EdgeInsets.zero),
                      const SizedBox(height: 8),
                      Wrap(
                        spacing: 8,
                        runSpacing: 8,
                        children: [
                          _QuickChip(icon: Icons.account_balance_wallet_outlined, label: 'Profit', onTap: () => context.go('/manager/profit')),
                          _QuickChip(icon: Icons.analytics_outlined, label: 'Analyses', onTap: () => context.push('/manager/analytics')),
                          _QuickChip(icon: Icons.psychology_outlined, label: 'Modèles', onTap: () => context.push('/manager/models')),
                          _QuickChip(icon: Icons.store_outlined, label: 'Boutiques', onTap: () => context.go('/manager/boutiques')),
                          _QuickChip(icon: Icons.groups_outlined, label: 'Équipe', onTap: () => context.go('/manager/equipe')),
                          _QuickChip(icon: Icons.monitor_heart_outlined, label: 'Monitoring', onTap: () => context.push('/manager/monitoring')),
                        ],
                      ),
                      const SizedBox(height: 20),
                      FilledButton.icon(
                        onPressed: () => context.go('/manager/profit'),
                        icon: const Icon(Icons.account_balance_wallet_outlined),
                        label: const Text('Analyser le profit et la rentabilité'),
                        style: FilledButton.styleFrom(
                          minimumSize: const Size.fromHeight(52),
                          backgroundColor: AppTheme.accent500,
                        ),
                      ),
                      const SizedBox(height: 10),
                      OutlinedButton.icon(
                        onPressed: () => context.push('/manager/boutiques/nouvelle'),
                        icon: const Icon(Icons.add_business_outlined),
                        label: const Text('Créer une nouvelle boutique'),
                        style: OutlinedButton.styleFrom(minimumSize: const Size.fromHeight(52)),
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _PeriodChip extends StatelessWidget {
  const _PeriodChip({required this.label, required this.active, required this.onTap});

  final String label;
  final bool active;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: active ? AppTheme.accent500 : AppTheme.ink800,
      borderRadius: BorderRadius.circular(999),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(999),
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
          child: Text(
            label,
            style: TextStyle(
              fontSize: 12,
              fontWeight: FontWeight.w800,
              color: active ? Colors.white : AppTheme.ink300,
            ),
          ),
        ),
      ),
    );
  }
}

class _ChartCard extends StatelessWidget {
  const _ChartCard({required this.title, required this.child, this.action});

  final String title;
  final Widget child;
  final Widget? action;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.fromLTRB(14, 14, 14, 12),
      decoration: AppTheme.cardDecoration(context),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Row(
            children: [
              Expanded(
                child: Text(title, style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w800)),
              ),
              if (action != null) action!,
            ],
          ),
          const SizedBox(height: 12),
          child,
        ],
      ),
    );
  }
}

class _CaAreaChart extends StatelessWidget {
  const _CaAreaChart({required this.serie});

  final List<Map<String, dynamic>> serie;

  @override
  Widget build(BuildContext context) {
    if (serie.isEmpty) return const SizedBox.shrink();
    final maxRaw = serie
        .map((r) => (r['ca'] as num?)?.toDouble() ?? 0)
        .fold<double>(0, (a, b) => a > b ? a : b);
    final divisor = maxRaw >= 1000000
        ? 1000000.0
        : maxRaw >= 1000
            ? 1000.0
            : 1.0;
    final unit = divisor == 1000000
        ? 'M'
        : divisor == 1000
            ? 'k'
            : '';
    final spots = <FlSpot>[
      for (var i = 0; i < serie.length; i++)
        FlSpot(i.toDouble(), ((serie[i]['ca'] as num?)?.toDouble() ?? 0) / divisor),
    ];
    final maxY = spots.map((s) => s.y).fold<double>(0, (a, b) => a > b ? a : b) * 1.15;

    return LineChart(
      LineChartData(
        minX: 0,
        maxX: (serie.length - 1).toDouble(),
        minY: 0,
        maxY: maxY == 0 ? 1 : maxY,
        gridData: FlGridData(
          show: true,
          drawVerticalLine: false,
          horizontalInterval: maxY > 0 ? maxY / 4 : 1,
          getDrawingHorizontalLine: (_) => FlLine(color: AppTheme.ink100, strokeWidth: 1, dashArray: [4, 4]),
        ),
        borderData: FlBorderData(show: false),
        titlesData: FlTitlesData(
          topTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
          rightTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
          leftTitles: AxisTitles(
            sideTitles: SideTitles(
              showTitles: true,
              reservedSize: 36,
              getTitlesWidget: (v, _) => Text(
                '${v.toStringAsFixed(v < 10 && unit == 'M' ? 1 : 0)}$unit',
                style: const TextStyle(fontSize: 10, color: AppTheme.ink300),
              ),
            ),
          ),
          bottomTitles: AxisTitles(
            sideTitles: SideTitles(
              showTitles: true,
              interval: 1,
              getTitlesWidget: (v, _) {
                final i = v.round();
                if (i < 0 || i >= serie.length) return const SizedBox.shrink();
                return Padding(
                  padding: const EdgeInsets.only(top: 6),
                  child: Text('${serie[i]['mois']}', style: const TextStyle(fontSize: 11, color: AppTheme.ink400)),
                );
              },
            ),
          ),
        ),
        lineTouchData: LineTouchData(
          touchTooltipData: LineTouchTooltipData(
            getTooltipItems: (touched) => touched.map((t) {
              final i = t.x.round().clamp(0, serie.length - 1);
              final ca = (serie[i]['ca'] as num?)?.toDouble() ?? 0;
              return LineTooltipItem(
                '${serie[i]['mois']}\n${formatPrix(ca)}',
                const TextStyle(color: Colors.white, fontWeight: FontWeight.w700, fontSize: 12),
              );
            }).toList(),
          ),
        ),
        lineBarsData: [
          LineChartBarData(
            spots: spots,
            isCurved: true,
            color: AppTheme.accent500,
            barWidth: 2.5,
            dotData: const FlDotData(show: false),
            belowBarData: BarAreaData(
              show: true,
              gradient: LinearGradient(
                begin: Alignment.topCenter,
                end: Alignment.bottomCenter,
                colors: [
                  AppTheme.accent500.withValues(alpha: 0.28),
                  AppTheme.accent500.withValues(alpha: 0),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _StorePieSection extends StatelessWidget {
  const _StorePieSection({required this.slices, this.onSliceTap});

  final List<StoreCaSlice> slices;
  final ValueChanged<String>? onSliceTap;

  @override
  Widget build(BuildContext context) {
    final total = slices.fold<double>(0, (s, e) => s + e.ca);
    return Row(
      children: [
        SizedBox(
          width: 140,
          height: 140,
          child: PieChart(
            PieChartData(
              sectionsSpace: 2,
              centerSpaceRadius: 38,
              pieTouchData: PieTouchData(
                touchCallback: (event, response) {
                  if (!event.isInterestedForInteractions || response?.touchedSection == null) return;
                  final i = response!.touchedSection!.touchedSectionIndex;
                  if (i >= 0 && i < slices.length && onSliceTap != null) {
                    onSliceTap!(slices[i].storeId);
                  }
                },
              ),
              sections: [
                for (final s in slices)
                  PieChartSectionData(
                    value: s.ca <= 0 ? 1 : s.ca,
                    color: Color(s.color),
                    radius: 28,
                    showTitle: false,
                  ),
              ],
            ),
          ),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: Column(
            children: [
              for (final s in slices)
                InkWell(
                  onTap: onSliceTap == null ? null : () => onSliceTap!(s.storeId),
                  child: Padding(
                    padding: const EdgeInsets.symmetric(vertical: 3),
                    child: Row(
                      children: [
                        Container(
                          width: 10,
                          height: 10,
                          decoration: BoxDecoration(color: Color(s.color), shape: BoxShape.circle),
                        ),
                        const SizedBox(width: 8),
                        Expanded(
                          child: Text(
                            s.name,
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                            style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: AppTheme.ink700),
                          ),
                        ),
                        Text(
                          '${formatMontantCourt(s.ca)} F',
                          style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w800),
                        ),
                      ],
                    ),
                  ),
                ),
              if (total > 0)
                Padding(
                  padding: const EdgeInsets.only(top: 6),
                  child: Align(
                    alignment: Alignment.centerLeft,
                    child: Text(
                      'Total ${formatMontantCourt(total)} F',
                      style: const TextStyle(fontSize: 11, color: AppTheme.ink400, fontWeight: FontWeight.w600),
                    ),
                  ),
                ),
            ],
          ),
        ),
      ],
    );
  }
}

class _ScansBarChart extends StatelessWidget {
  const _ScansBarChart({required this.data});

  final List<Map<String, Object>> data;

  @override
  Widget build(BuildContext context) {
    final maxY = data.map((e) => (e['scans'] as int).toDouble()).fold<double>(0, (a, b) => a > b ? a : b) * 1.2;

    return BarChart(
      BarChartData(
        maxY: maxY == 0 ? 10 : maxY,
        gridData: FlGridData(
          show: true,
          drawVerticalLine: false,
          getDrawingHorizontalLine: (_) => FlLine(color: AppTheme.ink100, strokeWidth: 1, dashArray: [4, 4]),
        ),
        borderData: FlBorderData(show: false),
        titlesData: FlTitlesData(
          topTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
          rightTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
          leftTitles: AxisTitles(
            sideTitles: SideTitles(
              showTitles: true,
              reservedSize: 28,
              getTitlesWidget: (v, _) => Text(
                v.toInt().toString(),
                style: const TextStyle(fontSize: 10, color: AppTheme.ink300),
              ),
            ),
          ),
          bottomTitles: AxisTitles(
            sideTitles: SideTitles(
              showTitles: true,
              getTitlesWidget: (v, _) {
                final i = v.toInt();
                if (i < 0 || i >= data.length) return const SizedBox.shrink();
                return Padding(
                  padding: const EdgeInsets.only(top: 6),
                  child: Text('${data[i]['h']}', style: const TextStyle(fontSize: 11, color: AppTheme.ink400)),
                );
              },
            ),
          ),
        ),
        barGroups: [
          for (var i = 0; i < data.length; i++)
            BarChartGroupData(
              x: i,
              barRods: [
                BarChartRodData(
                  toY: (data[i]['scans'] as int).toDouble(),
                  width: 16,
                  borderRadius: const BorderRadius.vertical(top: Radius.circular(6)),
                  color: AppTheme.ink900,
                ),
              ],
            ),
        ],
        barTouchData: BarTouchData(
          touchTooltipData: BarTouchTooltipData(
            getTooltipItem: (group, _, rod, __) {
              final h = data[group.x]['h'];
              return BarTooltipItem(
                '$h\n${rod.toY.toInt()} scans',
                const TextStyle(color: Colors.white, fontWeight: FontWeight.w700, fontSize: 12),
              );
            },
          ),
        ),
      ),
    );
  }
}

class _TopSaleTile extends StatelessWidget {
  const _TopSaleTile({required this.rank, required this.row});

  final int rank;
  final TopSaleRow row;

  @override
  Widget build(BuildContext context) {
    final url = row.product.imageUrl;
    return ListTile(
      contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
      leading: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          SizedBox(
            width: 18,
            child: Text('$rank', style: const TextStyle(fontWeight: FontWeight.w800, color: AppTheme.ink300)),
          ),
          const SizedBox(width: 6),
          ClipRRect(
            borderRadius: BorderRadius.circular(8),
            child: SizedBox(
              width: 36,
              height: 36,
              child: url != null && url.isNotEmpty
                  ? CachedNetworkImage(imageUrl: url, fit: BoxFit.cover)
                  : Container(color: AppTheme.ink50, child: const Icon(Icons.image_outlined, size: 18)),
            ),
          ),
        ],
      ),
      title: Text(row.product.name, maxLines: 1, overflow: TextOverflow.ellipsis, style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w700)),
      subtitle: Text('${row.ventes} ventes', style: const TextStyle(fontSize: 11, color: AppTheme.ink400)),
      trailing: Text(
        '${formatMontantCourt(row.ca)} F',
        style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w800),
      ),
    );
  }
}

class _ActionTile extends StatelessWidget {
  const _ActionTile({
    required this.icon,
    required this.iconBg,
    required this.iconColor,
    required this.label,
    required this.onTap,
  });

  final IconData icon;
  final Color iconBg;
  final Color iconColor;
  final String label;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Theme.of(context).cardColor,
      borderRadius: BorderRadius.circular(16),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(16),
        child: Container(
          padding: const EdgeInsets.all(14),
          decoration: AppTheme.cardDecoration(context),
          child: Row(
            children: [
              Container(
                width: 36,
                height: 36,
                decoration: BoxDecoration(color: iconBg, borderRadius: BorderRadius.circular(10)),
                child: Icon(icon, size: 18, color: iconColor),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Text(label, style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: AppTheme.ink700)),
              ),
              const Icon(Icons.chevron_right, size: 18, color: AppTheme.ink300),
            ],
          ),
        ),
      ),
    );
  }
}

class _QuickChip extends StatelessWidget {
  const _QuickChip({required this.icon, required this.label, required this.onTap});

  final IconData icon;
  final String label;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return ActionChip(
      avatar: Icon(icon, size: 16, color: AppTheme.ink600),
      label: Text(label, style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 12)),
      onPressed: onTap,
      backgroundColor: Theme.of(context).cardColor,
      side: const BorderSide(color: AppTheme.ink100),
    );
  }
}
