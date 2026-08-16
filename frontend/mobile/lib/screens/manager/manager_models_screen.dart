import 'package:fl_chart/fl_chart.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';

import '../../core/theme/app_theme.dart';
import '../../core/utils/formatters.dart';
import '../../data/demo/demo_accounts.dart';
import '../../data/demo/demo_analytics.dart';
import '../../providers/catalog_provider.dart';
import '../../providers/orders_provider.dart';
import '../../widgets/common_widgets.dart';
import '../../widgets/stat_card.dart';
import '../../widgets/top_bar.dart';

class ManagerModelsScreen extends StatefulWidget {
  const ManagerModelsScreen({super.key});

  @override
  State<ManagerModelsScreen> createState() => _ManagerModelsScreenState();
}

class _ManagerModelsScreenState extends State<ManagerModelsScreen> {
  DateTime _lastCalc = DateTime.now();
  int _seed = 0;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<CatalogProvider>().loadFeed();
      context.read<OrdersProvider>().loadOrders();
    });
  }

  void _recalculate() {
    setState(() {
      _lastCalc = DateTime.now();
      _seed++;
    });
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('Modèles recalculés sur l’historique local')),
    );
  }

  @override
  Widget build(BuildContext context) {
    final catalog = context.watch<CatalogProvider>();
    final orders = context.watch<OrdersProvider>();
    final serie = chartSeriesForPeriod('6 mois');
    final forecast = [
      ...serie.map((r) => (r['mois'] as String, (r['ca'] as num).toDouble())),
      ('N+1', ((serie.last['ca'] as num).toDouble()) * (1.04 + (_seed % 3) * 0.01)),
      ('N+2', ((serie.last['ca'] as num).toDouble()) * (1.07 + (_seed % 2) * 0.015)),
    ];

    final stockRisk = catalog.products.where((p) => p.stock <= 8).toList()
      ..sort((a, b) => a.stock.compareTo(b.stock));

    final attrition = demoSellers.where((s) => s.isActive || s.isSuspended).map((s) {
      final risk = s.isSuspended
          ? 82
          : s.scansConfirmes < 40
              ? 65
              : s.note < 4
                  ? 48
                  : 18 + (s.email.hashCode.abs() % 20);
      return (s, risk);
    }).toList()
      ..sort((a, b) => b.$2.compareTo(a.$2));

    final models = [
      ('Prévision CA', 86 + (_seed % 5), Icons.show_chart, 'forecast'),
      ('Anomalies', 78 + (_seed % 4), Icons.warning_amber_outlined, 'anomaly'),
      ('Rupture stock', 91 + (_seed % 3), Icons.inventory_2_outlined, 'stock'),
      ('RFM clients', 74 + (_seed % 6), Icons.groups_outlined, 'rfm'),
      ('Attrition vendeur', 69 + (_seed % 5), Icons.person_off_outlined, 'attrition'),
      ('Reco impact', 72 + (_seed % 4), Icons.auto_awesome, 'reco'),
    ];

    final marge = margeGlobale(products: catalog.products, orders: orders.orders);

    return Scaffold(
      backgroundColor: AppTheme.contentBackground(context),
      appBar: TopBar(
        title: 'Modèles prédictifs',
        subtitle: 'Mis à jour ${formatDate(_lastCalc)}',
        action: IconButton(icon: const Icon(Icons.refresh), onPressed: _recalculate),
      ),
      body: ListView(
        padding: const EdgeInsets.fromLTRB(16, 8, 16, 32),
        children: [
          Text(
            'Calculés côté application sur l’historique de ${catalog.stores.length} boutiques.',
            style: const TextStyle(fontSize: 13, color: AppTheme.ink500),
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              Expanded(
                child: OutlinedButton.icon(
                  onPressed: _recalculate,
                  icon: const Icon(Icons.refresh, size: 18),
                  label: const Text('Recalculer'),
                ),
              ),
              const SizedBox(width: 8),
              Expanded(
                child: OutlinedButton.icon(
                  onPressed: () async {
                    final text = models.map((m) => '${m.$1};${m.$2}%').join('\n');
                    await Clipboard.setData(ClipboardData(text: 'modele;confiance\n$text'));
                    if (context.mounted) {
                      ScaffoldMessenger.of(context).showSnackBar(
                        const SnackBar(content: Text('Rapport modèles copié')),
                      );
                    }
                  },
                  icon: const Icon(Icons.download_outlined, size: 18),
                  label: const Text('Exporter'),
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: [
              for (final m in models)
                SizedBox(
                  width: (MediaQuery.sizeOf(context).width - 48) / 2,
                  child: Container(
                    padding: const EdgeInsets.all(14),
                    decoration: AppTheme.cardDecoration(context),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Icon(m.$3, size: 20, color: AppTheme.accent600),
                        const SizedBox(height: 8),
                        Text(m.$1, style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 12)),
                        const SizedBox(height: 6),
                        Text('${m.$2} %', style: TextStyle(
                          fontWeight: FontWeight.w800,
                          fontSize: 18,
                          color: m.$2 >= 80 ? AppTheme.emerald600 : const Color(0xFFD97706),
                        )),
                        Text('confiance', style: TextStyle(fontSize: 11, color: AppTheme.ink400)),
                      ],
                    ),
                  ),
                ),
            ],
          ),
          const SizedBox(height: 16),
          const SectionHeader(title: 'Prévision CA (N+2)', padding: EdgeInsets.zero),
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
                      interval: 2,
                      getTitlesWidget: (v, _) {
                        final i = v.toInt();
                        if (i < 0 || i >= forecast.length) return const SizedBox.shrink();
                        return Text(forecast[i].$1, style: const TextStyle(fontSize: 9, color: AppTheme.ink400));
                      },
                    ),
                  ),
                ),
                borderData: FlBorderData(show: false),
                lineBarsData: [
                  LineChartBarData(
                    spots: [
                      for (var i = 0; i < forecast.length; i++)
                        FlSpot(i.toDouble(), forecast[i].$2 / 1000000),
                    ],
                    isCurved: true,
                    color: AppTheme.accent500,
                    barWidth: 3,
                    dotData: const FlDotData(show: true),
                    belowBarData: BarAreaData(show: true, color: AppTheme.accent500.withValues(alpha: 0.1)),
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 16),
          Row(
            children: [
              Expanded(
                child: StatCard(
                  label: 'CA projeté N+1',
                  value: '${formatMontantCourt(forecast[forecast.length - 2].$2)} F',
                  icon: Icons.trending_up,
                  tone: StatTone.success,
                ),
              ),
              const SizedBox(width: 8),
              Expanded(
                child: StatCard(
                  label: 'Marge actuelle',
                  value: '${marge.tauxMarge} %',
                  icon: Icons.percent,
                  tone: StatTone.info,
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          const SectionHeader(title: 'Risque de rupture', padding: EdgeInsets.zero),
          const SizedBox(height: 8),
          if (stockRisk.isEmpty)
            const EmptyState(icon: Icons.inventory_2_outlined, title: 'Stock sain', subtitle: 'Aucune référence à risque immédiat.')
          else
            ...stockRisk.take(6).map((p) {
              final days = p.stock <= 0 ? 0 : (p.stock / (1 + p.id.hashCode.abs() % 4)).round();
              return Container(
                margin: const EdgeInsets.only(bottom: 8),
                decoration: AppTheme.cardDecoration(context),
                child: ListTile(
                  title: Text(p.name, maxLines: 1, overflow: TextOverflow.ellipsis, style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 13)),
                  subtitle: Text('Stock ${p.stock} · ~$days j restants'),
                  trailing: Text(
                    p.stock <= 0 ? 'Rupture' : 'Risque',
                    style: TextStyle(
                      fontWeight: FontWeight.w800,
                      fontSize: 12,
                      color: p.stock <= 0 ? const Color(0xFFDC2626) : const Color(0xFFD97706),
                    ),
                  ),
                ),
              );
            }),
          const SizedBox(height: 8),
          const SectionHeader(title: 'Attrition vendeurs', padding: EdgeInsets.zero),
          const SizedBox(height: 8),
          ...attrition.take(5).map((row) {
            final s = row.$1;
            final risk = row.$2;
            return Container(
              margin: const EdgeInsets.only(bottom: 8),
              decoration: AppTheme.cardDecoration(context),
              child: ListTile(
                leading: CircleAvatar(
                  backgroundColor: AppTheme.ink900,
                  child: Text(s.initials, style: const TextStyle(color: Colors.white, fontSize: 11, fontWeight: FontWeight.w800)),
                ),
                title: Text(s.displayName, style: const TextStyle(fontWeight: FontWeight.w700)),
                subtitle: Text('${s.poste} · ${s.scansConfirmes} scans'),
                trailing: Text(
                  '$risk %',
                  style: TextStyle(
                    fontWeight: FontWeight.w800,
                    color: risk >= 60 ? const Color(0xFFDC2626) : risk >= 40 ? const Color(0xFFD97706) : AppTheme.emerald600,
                  ),
                ),
              ),
            );
          }),
        ],
      ),
    );
  }
}
