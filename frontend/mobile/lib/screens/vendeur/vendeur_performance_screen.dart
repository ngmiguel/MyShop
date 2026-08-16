import 'package:fl_chart/fl_chart.dart';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../core/theme/app_theme.dart';
import '../../core/utils/formatters.dart';
import '../../data/demo/demo_accounts.dart';
import '../../data/models/order.dart';
import '../../providers/auth_provider.dart';
import '../../providers/orders_provider.dart';
import '../../widgets/common_widgets.dart';
import '../../widgets/stat_card.dart';

class VendeurPerformanceScreen extends StatefulWidget {
  const VendeurPerformanceScreen({super.key});

  @override
  State<VendeurPerformanceScreen> createState() => _VendeurPerformanceScreenState();
}

class _VendeurPerformanceScreenState extends State<VendeurPerformanceScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<OrdersProvider>().loadOrders();
    });
  }

  List<OrderModel> _storeRedeemed(OrdersProvider orders, String? storeId) {
    return orders.orders
        .where(
          (o) =>
              (storeId == null || o.storeId == storeId) &&
              (o.status == 'redeemed' || o.status == 'rated' || o.status == 'confirmed'),
        )
        .toList();
  }

  bool _sameDay(DateTime a, DateTime b) =>
      a.year == b.year && a.month == b.month && a.day == b.day;

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();
    final orders = context.watch<OrdersProvider>();
    final storeId = auth.user?.storeId;
    final redeemed = _storeRedeemed(orders, storeId);
    final now = DateTime.now();

    final today = redeemed.where((o) {
      final t = o.redeemedAt ?? o.createdAt;
      return t != null && _sameDay(t, now);
    }).toList();

    final weekStart = now.subtract(Duration(days: now.weekday - 1));
    final week = redeemed.where((o) {
      final t = o.redeemedAt ?? o.createdAt;
      return t != null && !t.isBefore(DateTime(weekStart.year, weekStart.month, weekStart.day));
    }).toList();

    final prevWeekStart = weekStart.subtract(const Duration(days: 7));
    final prevWeek = redeemed.where((o) {
      final t = o.redeemedAt ?? o.createdAt;
      if (t == null) return false;
      return !t.isBefore(prevWeekStart) && t.isBefore(weekStart);
    }).toList();

    final month = redeemed.where((o) {
      final t = o.redeemedAt ?? o.createdAt;
      return t != null && t.year == now.year && t.month == now.month;
    }).toList();

    final dayCa = today.fold<double>(0, (s, o) => s + o.total);
    final monthCa = month.fold<double>(0, (s, o) => s + o.total);
    final avgBasket = month.isEmpty ? 0.0 : monthCa / month.length;
    final weekGrowth = prevWeek.isEmpty
        ? 0.0
        : ((week.length - prevWeek.length) / prevWeek.length) * 100;

    final demo = findDemoSeller(
      storeId: storeId ?? '',
      email: auth.user?.email ?? '',
    );
    final rating = demo?.note ?? 4.5;
    final avis = demo?.avis ?? 12;
    final target = 80;
    final progress = (month.length / target * 100).clamp(0, 100).toDouble();
    final handover = 6 + (auth.user?.email.hashCode.abs() ?? 0) % 5;

    final series = _last30DaysSeries(redeemed);
    final team = demoSellers.where((s) => s.storeId == storeId && s.isActive).toList()
      ..sort((a, b) => b.caGenere.compareTo(a.caGenere));

    return Scaffold(
      backgroundColor: AppTheme.contentBackground(context),
      appBar: AppBar(title: const Text('Ma performance')),
      body: RefreshIndicator(
        onRefresh: () => orders.loadOrders(),
        child: ListView(
          padding: const EdgeInsets.fromLTRB(16, 8, 16, 32),
          children: [
            Text(
              'Vos ventes validées, votre rapidité de remise et vos notes clients.',
              style: TextStyle(color: AppTheme.ink500, fontSize: 13),
            ),
            const SizedBox(height: 14),
            GridView.count(
              crossAxisCount: 2,
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              crossAxisSpacing: 10,
              mainAxisSpacing: 10,
              childAspectRatio: 1.35,
              children: [
                StatCard(
                  label: 'Ventes du jour',
                  value: '${today.length}',
                  delta: formatMontantCourt(dayCa),
                  icon: Icons.trending_up,
                  tone: StatTone.success,
                ),
                StatCard(
                  label: 'Ventes 7 jours',
                  value: '${week.length}',
                  delta: '${weekGrowth >= 0 ? '+' : ''}${weekGrowth.toStringAsFixed(0)} % vs sem. préc.',
                  icon: Icons.date_range_outlined,
                  tone: StatTone.info,
                ),
                StatCard(
                  label: 'Panier moyen',
                  value: formatMontantCourt(avgBasket),
                  delta: '30 derniers jours',
                  icon: Icons.shopping_bag_outlined,
                ),
                StatCard(
                  label: 'Temps de remise',
                  value: '$handover min',
                  delta: 'du scan à la remise',
                  icon: Icons.schedule_outlined,
                  tone: StatTone.warning,
                ),
              ],
            ),
            const SizedBox(height: 16),
            const SectionHeader(title: 'CA généré (30 jours)', padding: EdgeInsets.zero),
            const SizedBox(height: 8),
            Container(
              height: 200,
              padding: const EdgeInsets.fromLTRB(8, 16, 12, 8),
              decoration: AppTheme.cardDecoration(context),
              child: series.every((e) => e == 0)
                  ? const Center(child: Text('Pas encore assez de données', style: TextStyle(color: AppTheme.ink400)))
                  : LineChart(
                      LineChartData(
                        gridData: FlGridData(
                          show: true,
                          drawVerticalLine: false,
                          getDrawingHorizontalLine: (_) => FlLine(color: AppTheme.ink100, strokeWidth: 1),
                        ),
                        titlesData: FlTitlesData(
                          topTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
                          rightTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
                          leftTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
                          bottomTitles: AxisTitles(
                            sideTitles: SideTitles(
                              showTitles: true,
                              interval: 7,
                              getTitlesWidget: (v, _) {
                                final i = v.toInt();
                                if (i < 0 || i >= 30) return const SizedBox.shrink();
                                final d = now.subtract(Duration(days: 29 - i));
                                return Text('${d.day}', style: const TextStyle(fontSize: 10, color: AppTheme.ink400));
                              },
                            ),
                          ),
                        ),
                        borderData: FlBorderData(show: false),
                        lineBarsData: [
                          LineChartBarData(
                            spots: [
                              for (var i = 0; i < series.length; i++) FlSpot(i.toDouble(), series[i]),
                            ],
                            isCurved: true,
                            color: AppTheme.accent500,
                            barWidth: 3,
                            dotData: const FlDotData(show: false),
                            belowBarData: BarAreaData(
                              show: true,
                              color: AppTheme.accent500.withValues(alpha: 0.12),
                            ),
                          ),
                        ],
                      ),
                    ),
            ),
            const SizedBox(height: 16),
            Container(
              padding: const EdgeInsets.all(16),
              decoration: AppTheme.cardDecoration(context),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text('Objectif mensuel', style: TextStyle(fontWeight: FontWeight.w800, fontSize: 15)),
                  const SizedBox(height: 8),
                  Row(
                    children: [
                      const Icon(Icons.flag_outlined, size: 18, color: AppTheme.accent600),
                      const SizedBox(width: 8),
                      Text('${month.length} / $target ventes', style: const TextStyle(fontWeight: FontWeight.w700)),
                    ],
                  ),
                  const SizedBox(height: 10),
                  ClipRRect(
                    borderRadius: BorderRadius.circular(999),
                    child: LinearProgressIndicator(
                      value: progress / 100,
                      minHeight: 8,
                      backgroundColor: AppTheme.ink100,
                      color: AppTheme.accent500,
                    ),
                  ),
                  const SizedBox(height: 6),
                  Text('${progress.round()} % de l’objectif atteint', style: const TextStyle(fontSize: 12, color: AppTheme.ink400)),
                  const Divider(height: 24),
                  const Text('Note moyenne reçue', style: TextStyle(fontSize: 12, color: AppTheme.ink400, fontWeight: FontWeight.w600)),
                  const SizedBox(height: 6),
                  Row(
                    children: [
                      StarRating(rating: rating, size: 16),
                      const SizedBox(width: 8),
                      Text('${rating.toStringAsFixed(1)} ($avis avis)', style: const TextStyle(fontWeight: FontWeight.w700)),
                    ],
                  ),
                ],
              ),
            ),
            const SizedBox(height: 16),
            const SectionHeader(title: 'Classement de la boutique', padding: EdgeInsets.zero),
            const SizedBox(height: 8),
            if (team.isEmpty)
              const EmptyState(
                icon: Icons.groups_outlined,
                title: 'Pas encore de classement',
                subtitle: 'Les vendeurs actifs de votre boutique apparaîtront ici.',
              )
            else
              Container(
                decoration: AppTheme.cardDecoration(context),
                child: Column(
                  children: [
                    for (var i = 0; i < team.length; i++) ...[
                      if (i > 0) const Divider(height: 1),
                      ListTile(
                        leading: CircleAvatar(
                          backgroundColor: i == 0 ? const Color(0xFFF59E0B) : AppTheme.ink900,
                          child: Text(
                            i == 0 ? '1' : team[i].initials,
                            style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w800, fontSize: 12),
                          ),
                        ),
                        title: Row(
                          children: [
                            Flexible(
                              child: Text(team[i].displayName, style: const TextStyle(fontWeight: FontWeight.w700)),
                            ),
                            if (team[i].email.toLowerCase() == (auth.user?.email ?? '').toLowerCase()) ...[
                              const SizedBox(width: 6),
                              Container(
                                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                                decoration: BoxDecoration(
                                  color: AppTheme.accent500.withValues(alpha: 0.12),
                                  borderRadius: BorderRadius.circular(999),
                                ),
                                child: const Text('Vous', style: TextStyle(fontSize: 10, fontWeight: FontWeight.w800, color: AppTheme.accent600)),
                              ),
                            ],
                          ],
                        ),
                        subtitle: Text(team[i].poste, style: const TextStyle(fontSize: 12, color: AppTheme.ink400)),
                        trailing: Text(formatMontantCourt(team[i].caGenere), style: const TextStyle(fontWeight: FontWeight.w800)),
                      ),
                    ],
                  ],
                ),
              ),
            const SizedBox(height: 16),
            const SectionHeader(title: 'Derniers avis clients', padding: EdgeInsets.zero),
            const SizedBox(height: 8),
            ..._demoReviews(rating).map(
              (r) => Padding(
                padding: const EdgeInsets.only(bottom: 8),
                child: Container(
                  padding: const EdgeInsets.all(14),
                  decoration: AppTheme.cardDecoration(context),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          StarRating(rating: r.$1.toDouble(), size: 13),
                          const Spacer(),
                          Text(r.$3, style: const TextStyle(fontSize: 11, color: AppTheme.ink400)),
                        ],
                      ),
                      const SizedBox(height: 6),
                      Text(r.$2, style: const TextStyle(fontSize: 13, height: 1.35)),
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

  List<double> _last30DaysSeries(List<OrderModel> redeemed) {
    final now = DateTime.now();
    return [
      for (var i = 0; i < 30; i++)
        redeemed
            .where((o) {
              final t = o.redeemedAt ?? o.createdAt;
              if (t == null) return false;
              final day = DateTime(now.year, now.month, now.day).subtract(Duration(days: 29 - i));
              return _sameDay(t, day);
            })
            .fold<double>(0, (s, o) => s + o.total),
    ];
  }

  List<(int, String, String)> _demoReviews(double rating) {
    final base = rating.round().clamp(3, 5);
    return [
      (base, 'Accueil rapide et code scanné sans attendre.', 'Il y a 2 j'),
      ((base - 1).clamp(3, 5), 'Bonne explication sur le produit, merci.', 'Il y a 5 j'),
      (base, 'Retrait fluide, vendeur très pro.', 'Il y a 1 sem.'),
    ];
  }
}
