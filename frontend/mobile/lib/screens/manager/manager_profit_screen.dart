import 'package:cached_network_image/cached_network_image.dart';
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
import '../../providers/profit_settings_provider.dart';
import '../../widgets/app_layout.dart';
import '../../widgets/common_widgets.dart';
import '../../widgets/stat_card.dart';

class ManagerProfitScreen extends StatefulWidget {
  const ManagerProfitScreen({super.key});

  @override
  State<ManagerProfitScreen> createState() => _ManagerProfitScreenState();
}

class _ManagerProfitScreenState extends State<ManagerProfitScreen> {
  String _periode = '6 mois';
  String _storeSort = 'marge'; // marge | ca | taux
  bool _showAllStores = false;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<CatalogProvider>().loadFeed();
      context.read<OrdersProvider>().loadOrders();
    });
  }

  double get _scale {
    switch (_periode) {
      case '30 jours':
        return 1 / 6;
      case '3 mois':
        return 0.5;
      case '12 mois':
        return 2.0;
      case '6 mois':
      default:
        return 1.0;
    }
  }

  int get _mois => monthsForPeriod(_periode == '30 jours' ? '30 jours' : _periode);

  @override
  Widget build(BuildContext context) {
    final catalog = context.watch<CatalogProvider>();
    final orders = context.watch<OrdersProvider>();
    final assumptions = context.watch<ProfitSettingsProvider>().assumptions;

    final raw = margeGlobale(products: catalog.products, orders: orders.orders);
    final global = MarginSummary(
      ca: raw.ca * _scale,
      cout: raw.cout * _scale,
      marge: raw.marge * _scale,
      tauxMarge: raw.tauxMarge,
    );

    var parBoutique = profitParBoutique(
      stores: catalog.stores,
      products: catalog.products,
      orders: orders.orders,
    ).map((b) {
      return BoutiqueProfitRow(
        storeId: b.storeId,
        nom: b.nom,
        ca: b.ca * _scale,
        cout: b.cout * _scale,
        marge: b.marge * _scale,
        tauxMarge: b.tauxMarge,
      );
    }).toList();

    switch (_storeSort) {
      case 'ca':
        parBoutique = [...parBoutique]..sort((a, b) => b.ca.compareTo(a.ca));
      case 'taux':
        parBoutique = [...parBoutique]..sort((a, b) => b.tauxMarge.compareTo(a.tauxMarge));
      default:
        parBoutique = [...parBoutique]..sort((a, b) => b.marge.compareTo(a.marge));
    }

    final rentables = articlesRentables(products: catalog.products, orders: orders.orders);
    final parDomaine = margeParCategorie(products: catalog.products, orders: orders.orders)
        .map((d) => (id: d.id, nom: d.nom, marge: d.marge * _scale, ca: d.ca * _scale, taux: d.taux))
        .toList();

    final actifs = demoSellers.where((s) => s.isActive).toList();
    final vendeurRows = [
      for (final s in actifs) (s, s.caGenere * _scale),
    ]..sort((a, b) => b.$2.compareTo(a.$2));
    final commissionsFromSellers =
        vendeurRows.fold<double>(0, (sum, row) => sum + row.$2 * assumptions.commissionVendeur / 100);
    final commissions = commissionsFromSellers > 0
        ? commissionsFromSellers.roundToDouble()
        : (global.ca * assumptions.commissionVendeur / 100).roundToDouble();
    final charges = assumptions.chargesFixesMensuelles * _mois;
    final taxes = (global.marge * assumptions.tva / 100).roundToDouble();
    final resultatNet = global.marge - commissions - charges - taxes;
    final tauxNet = global.ca > 0 ? (resultatNet / global.ca * 100).round() : 0;

    final serie = chartSeriesForPeriod(_periode);
    final deltas = periodDeltas(_periode);
    final caSerie = serie.fold<double>(0, (s, r) => s + ((r['ca'] as num?)?.toDouble() ?? 0));
    final objectifPeriode = assumptions.objectifCaMensuel * _mois;
    final atteinte = objectifPeriode > 0 ? (global.ca / objectifPeriode * 100).clamp(0, 200) : 0.0;

    final storesShown = _showAllStores ? parBoutique : parBoutique.take(6).toList();

    return Scaffold(
      backgroundColor: AppTheme.contentBackground(context),
      body: RefreshIndicator(
        onRefresh: () async {
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
                    Row(
                      children: [
                        const Expanded(
                          child: Text(
                            'PROFIT & RENTABILITÉ',
                            style: TextStyle(
                              color: AppTheme.accent300,
                              fontSize: 11,
                              fontWeight: FontWeight.w700,
                              letterSpacing: 1.4,
                            ),
                          ),
                        ),
                        IconButton(
                          tooltip: 'Copier le résumé',
                          onPressed: () => _copierResume(
                            resultatNet: resultatNet,
                            global: global,
                            tauxNet: tauxNet,
                          ),
                          icon: const Icon(Icons.copy_outlined, color: AppTheme.ink300, size: 20),
                        ),
                      ],
                    ),
                    Text(
                      formatPrix(resultatNet),
                      style: const TextStyle(color: Colors.white, fontSize: 22, fontWeight: FontWeight.w800),
                    ),
                    Text(
                      'Résultat net estimé · marge brute ${global.tauxMarge} % · net $tauxNet %',
                      style: const TextStyle(color: AppTheme.ink300, fontSize: 13),
                    ),
                    const SizedBox(height: 14),
                    SingleChildScrollView(
                      scrollDirection: Axis.horizontal,
                      child: Row(
                        children: [
                          for (final p in const ['30 jours', '3 mois', '6 mois', '12 mois']) ...[
                            if (p != '30 jours') const SizedBox(width: 8),
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
                        childAspectRatio: 1.22,
                        children: [
                          StatCard(
                            label: "Chiffre d'affaires",
                            value: '${formatMontantCourt(global.ca)} F',
                            delta: deltas.caDelta,
                            icon: Icons.payments_outlined,
                            tone: StatTone.info,
                          ),
                          StatCard(
                            label: 'Coût des marchandises',
                            value: '${formatMontantCourt(global.cout)} F',
                            delta: '${global.ca > 0 ? (global.cout / global.ca * 100).round() : 0} % du CA',
                            icon: Icons.receipt_long_outlined,
                            tone: StatTone.warning,
                          ),
                          StatCard(
                            label: 'Marge brute',
                            value: '${formatMontantCourt(global.marge)} F',
                            delta: '${global.tauxMarge} % du CA',
                            icon: Icons.trending_up,
                            tone: StatTone.success,
                          ),
                          StatCard(
                            label: 'Résultat net',
                            value: '${formatMontantCourt(resultatNet)} F',
                            delta: '$tauxNet % du CA',
                            icon: Icons.account_balance_wallet_outlined,
                            tone: resultatNet >= 0 ? StatTone.success : StatTone.danger,
                          ),
                        ],
                      ),
                      const SizedBox(height: 16),
                      _CardBlock(
                        title: 'Objectif de CA ($_periode)',
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
                              children: [
                                Expanded(
                                  child: Text(
                                    '${formatMontantCourt(global.ca)} / ${formatMontantCourt(objectifPeriode)} F',
                                    style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 13),
                                  ),
                                ),
                                Text(
                                  '${atteinte.round()} %',
                                  style: TextStyle(
                                    fontWeight: FontWeight.w800,
                                    color: atteinte >= 100 ? AppTheme.emerald600 : AppTheme.accent600,
                                  ),
                                ),
                              ],
                            ),
                            const SizedBox(height: 8),
                            ClipRRect(
                              borderRadius: BorderRadius.circular(999),
                              child: LinearProgressIndicator(
                                value: (atteinte / 100).clamp(0.0, 1.0),
                                minHeight: 10,
                                backgroundColor: AppTheme.ink100,
                                color: atteinte >= 100 ? AppTheme.emerald600 : AppTheme.accent500,
                              ),
                            ),
                            const SizedBox(height: 6),
                            Text(
                              atteinte >= 100
                                  ? 'Objectif atteint — +${formatMontantCourt(global.ca - objectifPeriode)} F'
                                  : 'Reste ${formatMontantCourt(objectifPeriode - global.ca)} F pour l’objectif',
                              style: const TextStyle(fontSize: 11, color: AppTheme.ink400),
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(height: 14),
                      _CardBlock(
                        title: "Du chiffre d'affaires au résultat",
                        child: Column(
                          children: [
                            _CompteLigne(label: "Chiffre d'affaires", valeur: global.ca),
                            _CompteLigne(label: 'Coût des marchandises vendues', valeur: -global.cout),
                            _CompteLigne(label: 'Marge brute', valeur: global.marge, fort: true),
                            _CompteLigne(
                              label: 'Commissions vendeurs (${assumptions.commissionVendeur} %)',
                              valeur: -commissions,
                            ),
                            _CompteLigne(label: 'Charges fixes ($_mois mois)', valeur: -charges),
                            _CompteLigne(label: 'Impôts & TVA (${assumptions.tva} %)', valeur: -taxes),
                            _CompteLigne(label: 'Résultat net', valeur: resultatNet, fort: true),
                            const SizedBox(height: 12),
                            _WaterfallBar(
                              items: [
                                (label: 'CA', value: global.ca, color: const Color(0xFF0284C7)),
                                (label: 'Coûts', value: global.cout, color: const Color(0xFFD97706)),
                                (label: 'Marge', value: global.marge, color: AppTheme.emerald600),
                                (label: 'Net', value: resultatNet.abs(), color: resultatNet >= 0 ? AppTheme.ink900 : const Color(0xFFDC2626)),
                              ],
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(height: 14),
                      _CardBlock(
                        title: 'Marge et résultat',
                        action: Text(_periode, style: const TextStyle(fontSize: 11, color: AppTheme.ink400, fontWeight: FontWeight.w600)),
                        child: Column(
                          children: [
                            SizedBox(
                              height: 200,
                              child: _ProfitLineChart(
                                serie: serie,
                                charges: assumptions.chargesFixesMensuelles *
                                    (_periode == '30 jours' ? 1 : monthsForPeriod(_periode)) /
                                    (serie.isEmpty ? 1 : serie.length),
                              ),
                            ),
                            const SizedBox(height: 8),
                            const Row(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                _LegendDot(color: AppTheme.accent500, label: 'Marge brute'),
                                SizedBox(width: 16),
                                _LegendDot(color: AppTheme.ink900, label: 'Résultat net'),
                              ],
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(height: 14),
                      _CardBlock(
                        title: 'CA vs coûts (série)',
                        child: SizedBox(
                          height: 180,
                          child: _CaCoutsBarChart(serie: serie),
                        ),
                      ),
                      const SizedBox(height: 14),
                      _CardBlock(
                        title: 'Marge par univers de vente',
                        child: Column(
                          children: [
                            SizedBox(height: 180, child: _DomaineBarChart(rows: parDomaine.take(6).toList())),
                            const SizedBox(height: 8),
                            for (final d in parDomaine)
                              Padding(
                                padding: const EdgeInsets.symmetric(vertical: 4),
                                child: Row(
                                  children: [
                                    Icon(domainIcon(d.id), size: 16, color: AppTheme.ink500),
                                    const SizedBox(width: 8),
                                    Expanded(
                                      child: Text(
                                        d.nom,
                                        style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: AppTheme.ink700),
                                      ),
                                    ),
                                    Text('${formatMontantCourt(d.marge)} F', style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w800)),
                                    const SizedBox(width: 8),
                                    _PctBadge(d.taux),
                                  ],
                                ),
                              ),
                          ],
                        ),
                      ),
                      const SizedBox(height: 16),
                      SectionHeader(
                        title: 'Rentabilité par boutique',
                        padding: EdgeInsets.zero,
                        action: PopupMenuButton<String>(
                          initialValue: _storeSort,
                          onSelected: (v) => setState(() => _storeSort = v),
                          itemBuilder: (_) => const [
                            PopupMenuItem(value: 'marge', child: Text('Trier par marge')),
                            PopupMenuItem(value: 'ca', child: Text('Trier par CA')),
                            PopupMenuItem(value: 'taux', child: Text('Trier par taux')),
                          ],
                          child: const Padding(
                            padding: EdgeInsets.all(8),
                            child: Icon(Icons.sort, size: 18, color: AppTheme.ink500),
                          ),
                        ),
                      ),
                      const SizedBox(height: 8),
                      for (final b in storesShown)
                        _BoutiqueProfitTile(row: b),
                      if (parBoutique.length > 6)
                        TextButton(
                          onPressed: () => setState(() => _showAllStores = !_showAllStores),
                          child: Text(_showAllStores ? 'Voir moins' : 'Voir les ${parBoutique.length} boutiques'),
                        ),
                      const SizedBox(height: 8),
                      const SectionHeader(title: 'Articles les plus rentables', padding: EdgeInsets.zero),
                      const SizedBox(height: 8),
                      Container(
                        decoration: AppTheme.cardDecoration(context),
                        child: Column(
                          children: [
                            for (var i = 0; i < rentables.length; i++) ...[
                              if (i > 0) const Divider(height: 1, indent: 56),
                              ListTile(
                                contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 2),
                                onTap: () => context.push('/client/produit/${rentables[i].product.id}'),
                                leading: Row(
                                  mainAxisSize: MainAxisSize.min,
                                  children: [
                                    SizedBox(
                                      width: 18,
                                      child: Text('${i + 1}', style: const TextStyle(fontWeight: FontWeight.w800, color: AppTheme.ink300)),
                                    ),
                                    const SizedBox(width: 6),
                                    ClipRRect(
                                      borderRadius: BorderRadius.circular(8),
                                      child: SizedBox(
                                        width: 36,
                                        height: 36,
                                        child: rentables[i].product.imageUrl != null
                                            ? CachedNetworkImage(imageUrl: rentables[i].product.imageUrl!, fit: BoxFit.cover)
                                            : Container(color: AppTheme.ink50, child: const Icon(Icons.image_outlined, size: 16)),
                                      ),
                                    ),
                                  ],
                                ),
                                title: Text(
                                  rentables[i].product.name,
                                  maxLines: 1,
                                  overflow: TextOverflow.ellipsis,
                                  style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w700),
                                ),
                                subtitle: Text(
                                  '${rentables[i].product.subcategoryId ?? rentables[i].product.categoryId ?? 'Article'} · marge ${formatPrix(rentables[i].margeUnitaire)}/u · ${rentables[i].tauxMarge} %',
                                  style: const TextStyle(fontSize: 11, color: AppTheme.ink400),
                                ),
                                trailing: Text(
                                  '${formatMontantCourt(rentables[i].margeTotale * _scale)} F',
                                  style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 13),
                                ),
                              ),
                            ],
                          ],
                        ),
                      ),
                      const SizedBox(height: 16),
                      const SectionHeader(title: 'Commissions vendeurs', padding: EdgeInsets.zero),
                      const SizedBox(height: 8),
                      Container(
                        decoration: AppTheme.cardDecoration(context),
                        child: Column(
                          children: [
                            for (var i = 0; i < vendeurRows.take(6).length; i++) ...[
                              if (i > 0) const Divider(height: 1),
                              Builder(
                                builder: (_) {
                                  final row = vendeurRows[i];
                                  final ca = row.$2;
                                  final commission = ca * assumptions.commissionVendeur / 100;
                                  final storeName = catalog.storeById(row.$1.storeId)?.name ?? row.$1.storeId;
                                  return ListTile(
                                    leading: CircleAvatar(
                                      backgroundColor: AppTheme.ink900,
                                      child: Text(row.$1.initials, style: const TextStyle(color: Colors.white, fontSize: 11, fontWeight: FontWeight.w800)),
                                    ),
                                    title: Text('${row.$1.firstName} ${row.$1.lastName}', style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 13)),
                                    subtitle: Text('$storeName · CA ${formatMontantCourt(ca)} F', style: const TextStyle(fontSize: 11, color: AppTheme.ink400)),
                                    trailing: Text(
                                      formatPrix(commission),
                                      style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 13, color: AppTheme.accent600),
                                    ),
                                  );
                                },
                              ),
                            ],
                            Padding(
                              padding: const EdgeInsets.all(12),
                              child: Row(
                                children: [
                                  const Expanded(child: Text('Total commissions', style: TextStyle(fontWeight: FontWeight.w700))),
                                  Text(formatPrix(commissions), style: const TextStyle(fontWeight: FontWeight.w800)),
                                ],
                              ),
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(height: 16),
                      SettingsSection(
                        title: 'Hypothèses de calcul',
                        children: [
                          SettingsTile(
                            icon: Icons.apartment_outlined,
                            title: 'Charges fixes mensuelles',
                            subtitle: '${formatMontantCourt(assumptions.chargesFixesMensuelles)} F',
                            onTap: () => _pickCharges(),
                          ),
                          SettingsTile(
                            icon: Icons.percent,
                            title: 'Commission vendeurs',
                            subtitle: '${assumptions.commissionVendeur} %',
                            onTap: () => _pickCommission(),
                          ),
                          SettingsTile(
                            icon: Icons.receipt_long_outlined,
                            title: 'TVA / impôts',
                            subtitle: '${assumptions.tva} %',
                            onTap: () => _pickTva(),
                          ),
                          SettingsTile(
                            icon: Icons.flag_outlined,
                            title: 'Objectif de CA mensuel',
                            subtitle: '${formatMontantCourt(assumptions.objectifCaMensuel)} F',
                            showDivider: false,
                            onTap: () => _pickObjectif(),
                          ),
                        ],
                      ),
                      const SizedBox(height: 4),
                      const Padding(
                        padding: EdgeInsets.symmetric(horizontal: 16),
                        child: Text(
                          'Ces paramètres alimentent le compte de résultat ci-dessus.',
                          style: TextStyle(fontSize: 11, color: AppTheme.ink400),
                        ),
                      ),
                      const SizedBox(height: 12),
                      Wrap(
                        spacing: 8,
                        runSpacing: 8,
                        children: [
                          Chip(
                            avatar: const Icon(Icons.groups_outlined, size: 16),
                            label: Text('${actifs.length} vendeurs commissionnés'),
                          ),
                          Chip(
                            avatar: const Icon(Icons.receipt_outlined, size: 16),
                            label: Text('TVA ${assumptions.tva} %'),
                          ),
                          Chip(
                            avatar: const Icon(Icons.store_outlined, size: 16),
                            label: Text('${catalog.stores.length} boutiques'),
                          ),
                          Chip(
                            avatar: const Icon(Icons.show_chart, size: 16),
                            label: Text('Série ${formatMontantCourt(caSerie)} F'),
                          ),
                        ],
                      ),
                      const SizedBox(height: 12),
                      OutlinedButton.icon(
                        onPressed: () => context.go('/manager'),
                        icon: const Icon(Icons.bar_chart_outlined),
                        label: const Text('Retour au pilotage'),
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

  Future<void> _copierResume({
    required double resultatNet,
    required MarginSummary global,
    required int tauxNet,
  }) async {
    final text = '''
Profit Boutika ($_periode)
Résultat net : ${formatPrix(resultatNet)} ($tauxNet % du CA)
CA : ${formatPrix(global.ca)}
Marge brute : ${formatPrix(global.marge)} (${global.tauxMarge} %)
Charges fixes : ${formatPrix(context.read<ProfitSettingsProvider>().chargesFixesMensuelles * _mois)}
Commission : ${context.read<ProfitSettingsProvider>().commissionVendeur} % · TVA : ${context.read<ProfitSettingsProvider>().tva} %
''';
    await Clipboard.setData(ClipboardData(text: text.trim()));
    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Résumé copié')));
    }
  }

  Future<void> _pickCharges() async {
    const options = [850000.0, 1200000.0, 1850000.0, 2500000.0];
    final v = await _sheet<double>([
      for (final o in options) (o, '${formatMontantCourt(o)} F / mois'),
    ]);
    if (!mounted || v == null) return;
    await context.read<ProfitSettingsProvider>().setCharges(v);
  }

  Future<void> _pickCommission() async {
    const options = [1, 3, 5, 8];
    final v = await _sheet<int>([for (final o in options) (o, '$o %')]);
    if (!mounted || v == null) return;
    await context.read<ProfitSettingsProvider>().setCommission(v);
  }

  Future<void> _pickTva() async {
    const options = [0, 5, 18, 20];
    final v = await _sheet<int>([for (final o in options) (o, '$o %')]);
    if (!mounted || v == null) return;
    await context.read<ProfitSettingsProvider>().setTva(v);
  }

  Future<void> _pickObjectif() async {
    const options = [6000000.0, 9000000.0, 12000000.0, 18000000.0];
    final v = await _sheet<double>([
      for (final o in options) (o, '${formatMontantCourt(o)} F / mois'),
    ]);
    if (!mounted || v == null) return;
    await context.read<ProfitSettingsProvider>().setObjectif(v);
  }

  Future<T?> _sheet<T>(List<(T, String)> options) {
    return showModalBottomSheet<T>(
      context: context,
      builder: (ctx) => SafeArea(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            for (final o in options)
              ListTile(title: Text(o.$2), onTap: () => Navigator.pop(ctx, o.$1)),
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
            style: TextStyle(fontSize: 12, fontWeight: FontWeight.w800, color: active ? Colors.white : AppTheme.ink300),
          ),
        ),
      ),
    );
  }
}

class _CardBlock extends StatelessWidget {
  const _CardBlock({required this.title, required this.child, this.action});
  final String title;
  final Widget child;
  final Widget? action;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: AppTheme.cardDecoration(context),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Row(
            children: [
              Expanded(child: Text(title, style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 14))),
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

class _CompteLigne extends StatelessWidget {
  const _CompteLigne({required this.label, required this.valeur, this.fort = false});
  final String label;
  final double valeur;
  final bool fort;

  @override
  Widget build(BuildContext context) {
    final negatif = valeur < 0;
    return Padding(
      padding: EdgeInsets.only(top: fort ? 8 : 4),
      child: DecoratedBox(
        decoration: fort ? const BoxDecoration(border: Border(top: BorderSide(color: AppTheme.ink100))) : const BoxDecoration(),
        child: Padding(
          padding: EdgeInsets.only(top: fort ? 8 : 0),
          child: Row(
            children: [
              Expanded(
                child: Text(
                  label,
                  style: TextStyle(
                    fontSize: 13,
                    fontWeight: fort ? FontWeight.w800 : FontWeight.w500,
                    color: fort ? AppTheme.ink900 : AppTheme.ink500,
                  ),
                ),
              ),
              Text(
                '${negatif ? '−' : ''}${formatPrix(valeur.abs())}',
                style: TextStyle(
                  fontSize: 13,
                  fontWeight: FontWeight.w800,
                  color: fort ? AppTheme.ink900 : (negatif ? const Color(0xFFDC2626) : AppTheme.ink700),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _PctBadge extends StatelessWidget {
  const _PctBadge(this.pct);
  final int pct;

  @override
  Widget build(BuildContext context) {
    final color = pct >= 35
        ? AppTheme.emerald600
        : pct >= 22
            ? const Color(0xFFD97706)
            : const Color(0xFFDC2626);
    final bg = pct >= 35
        ? const Color(0xFFECFDF5)
        : pct >= 22
            ? const Color(0xFFFFFBEB)
            : const Color(0xFFFEF2F2);
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
      decoration: BoxDecoration(color: bg, borderRadius: BorderRadius.circular(6)),
      child: Text('$pct %', style: TextStyle(fontSize: 10, fontWeight: FontWeight.w800, color: color)),
    );
  }
}

class _LegendDot extends StatelessWidget {
  const _LegendDot({required this.color, required this.label});
  final Color color;
  final String label;

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Container(width: 10, height: 10, decoration: BoxDecoration(color: color, borderRadius: BorderRadius.circular(2))),
        const SizedBox(width: 6),
        Text(label, style: const TextStyle(fontSize: 11, color: AppTheme.ink500, fontWeight: FontWeight.w600)),
      ],
    );
  }
}

class _WaterfallBar extends StatelessWidget {
  const _WaterfallBar({required this.items});
  final List<({String label, double value, Color color})> items;

  @override
  Widget build(BuildContext context) {
    final maxV = items.map((e) => e.value).fold<double>(0, (a, b) => a > b ? a : b);
    if (maxV <= 0) return const SizedBox.shrink();
    return Column(
      children: [
        for (final item in items)
          Padding(
            padding: const EdgeInsets.only(bottom: 6),
            child: Row(
              children: [
                SizedBox(width: 52, child: Text(item.label, style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w600, color: AppTheme.ink500))),
                Expanded(
                  child: ClipRRect(
                    borderRadius: BorderRadius.circular(6),
                    child: LinearProgressIndicator(
                      value: (item.value / maxV).clamp(0.0, 1.0),
                      minHeight: 12,
                      backgroundColor: AppTheme.ink50,
                      color: item.color,
                    ),
                  ),
                ),
                const SizedBox(width: 8),
                SizedBox(
                  width: 56,
                  child: Text(
                    formatMontantCourt(item.value),
                    textAlign: TextAlign.right,
                    style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w800),
                  ),
                ),
              ],
            ),
          ),
      ],
    );
  }
}

class _BoutiqueProfitTile extends StatelessWidget {
  const _BoutiqueProfitTile({required this.row});
  final BoutiqueProfitRow row;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Theme.of(context).cardColor,
      borderRadius: BorderRadius.circular(16),
      child: InkWell(
        onTap: () => context.push('/manager/boutiques/${row.storeId}'),
        borderRadius: BorderRadius.circular(16),
        child: Container(
          margin: const EdgeInsets.only(bottom: 8),
          padding: const EdgeInsets.all(14),
          decoration: AppTheme.cardDecoration(context),
          child: Row(
            children: [
              Container(
                width: 36,
                height: 36,
                decoration: BoxDecoration(color: AppTheme.ink50, borderRadius: BorderRadius.circular(10)),
                child: const Icon(Icons.store_outlined, size: 18, color: AppTheme.ink600),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(row.nom, maxLines: 1, overflow: TextOverflow.ellipsis, style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 13)),
                    Text(
                      'CA ${formatMontantCourt(row.ca)} F · coûts ${formatMontantCourt(row.cout)} F',
                      style: const TextStyle(fontSize: 11, color: AppTheme.ink400),
                    ),
                  ],
                ),
              ),
              Column(
                crossAxisAlignment: CrossAxisAlignment.end,
                children: [
                  Text('${formatMontantCourt(row.marge)} F', style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 13)),
                  _PctBadge(row.tauxMarge),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _ProfitLineChart extends StatelessWidget {
  const _ProfitLineChart({required this.serie, required this.charges});
  final List<Map<String, dynamic>> serie;
  final double charges;

  @override
  Widget build(BuildContext context) {
    if (serie.isEmpty) return const SizedBox.shrink();

    final pointCharge = charges / (serie.isEmpty ? 1 : serie.length);

    final margeSpots = <FlSpot>[];
    final netSpots = <FlSpot>[];
    for (var i = 0; i < serie.length; i++) {
      final ca = (serie[i]['ca'] as num?)?.toDouble() ?? 0;
      final couts = (serie[i]['couts'] as num?)?.toDouble() ?? ca * 0.65;
      final marge = ca - couts;
      final net = marge - pointCharge;
      margeSpots.add(FlSpot(i.toDouble(), marge / 1000000));
      netSpots.add(FlSpot(i.toDouble(), net / 1000000));
    }

    final allY = [...margeSpots, ...netSpots].map((s) => s.y);
    final maxY = allY.fold<double>(0, (a, b) => a > b ? a : b) * 1.15;
    final minY = allY.fold<double>(0, (a, b) => a < b ? a : b);
    final floor = minY < 0 ? minY * 1.15 : 0.0;

    return LineChart(
      LineChartData(
        minX: 0,
        maxX: (serie.length - 1).toDouble(),
        minY: floor,
        maxY: maxY == 0 ? 1 : maxY,
        gridData: FlGridData(
          show: true,
          drawVerticalLine: false,
          getDrawingHorizontalLine: (_) => FlLine(color: AppTheme.ink100, strokeWidth: 1, dashArray: [4, 4]),
        ),
        borderData: FlBorderData(show: false),
        lineTouchData: LineTouchData(
          touchTooltipData: LineTouchTooltipData(
            getTooltipItems: (touched) => touched.map((t) {
              final i = t.x.round().clamp(0, serie.length - 1);
              final name = t.barIndex == 0 ? 'Marge' : 'Net';
              return LineTooltipItem(
                '${serie[i]['mois']}\n$name ${formatPrix(t.y * 1000000)}',
                const TextStyle(color: Colors.white, fontWeight: FontWeight.w700, fontSize: 11),
              );
            }).toList(),
          ),
        ),
        titlesData: FlTitlesData(
          topTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
          rightTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
          leftTitles: AxisTitles(
            sideTitles: SideTitles(
              showTitles: true,
              reservedSize: 34,
              getTitlesWidget: (v, _) => Text(
                '${v.toStringAsFixed(1)}M',
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
        lineBarsData: [
          LineChartBarData(
            spots: margeSpots,
            isCurved: true,
            color: AppTheme.accent500,
            barWidth: 2.5,
            dotData: const FlDotData(show: false),
          ),
          LineChartBarData(
            spots: netSpots,
            isCurved: true,
            color: AppTheme.ink900,
            barWidth: 2,
            dotData: const FlDotData(show: false),
          ),
        ],
      ),
    );
  }
}

class _CaCoutsBarChart extends StatelessWidget {
  const _CaCoutsBarChart({required this.serie});
  final List<Map<String, dynamic>> serie;

  @override
  Widget build(BuildContext context) {
    if (serie.isEmpty) return const SizedBox.shrink();
    final maxY = serie
            .map((r) => (r['ca'] as num?)?.toDouble() ?? 0)
            .fold<double>(0, (a, b) => a > b ? a : b) /
        1000000 *
        1.2;

    return BarChart(
      BarChartData(
        maxY: maxY == 0 ? 1 : maxY,
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
              reservedSize: 34,
              getTitlesWidget: (v, _) => Text('${v.toStringAsFixed(1)}M', style: const TextStyle(fontSize: 10, color: AppTheme.ink300)),
            ),
          ),
          bottomTitles: AxisTitles(
            sideTitles: SideTitles(
              showTitles: true,
              getTitlesWidget: (v, _) {
                final i = v.toInt();
                if (i < 0 || i >= serie.length) return const SizedBox.shrink();
                return Padding(
                  padding: const EdgeInsets.only(top: 6),
                  child: Text('${serie[i]['mois']}', style: const TextStyle(fontSize: 10, color: AppTheme.ink400)),
                );
              },
            ),
          ),
        ),
        barGroups: [
          for (var i = 0; i < serie.length; i++)
            BarChartGroupData(
              x: i,
              barsSpace: 2,
              barRods: [
                BarChartRodData(
                  toY: ((serie[i]['ca'] as num?)?.toDouble() ?? 0) / 1000000,
                  width: 8,
                  color: AppTheme.accent500,
                  borderRadius: const BorderRadius.vertical(top: Radius.circular(4)),
                ),
                BarChartRodData(
                  toY: ((serie[i]['couts'] as num?)?.toDouble() ?? 0) / 1000000,
                  width: 8,
                  color: AppTheme.ink900,
                  borderRadius: const BorderRadius.vertical(top: Radius.circular(4)),
                ),
              ],
            ),
        ],
      ),
    );
  }
}

class _DomaineBarChart extends StatelessWidget {
  const _DomaineBarChart({required this.rows});
  final List<({String id, String nom, double marge, double ca, int taux})> rows;

  @override
  Widget build(BuildContext context) {
    if (rows.isEmpty) return const Center(child: Text('Aucune donnée'));
    final maxY = rows.map((r) => r.marge).fold<double>(0, (a, b) => a > b ? a : b) / 1000000 * 1.2;

    return BarChart(
      BarChartData(
        maxY: maxY == 0 ? 1 : maxY,
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
              reservedSize: 34,
              getTitlesWidget: (v, _) => Text('${v.toStringAsFixed(1)}M', style: const TextStyle(fontSize: 10, color: AppTheme.ink300)),
            ),
          ),
          bottomTitles: AxisTitles(
            sideTitles: SideTitles(
              showTitles: true,
              getTitlesWidget: (v, _) {
                final i = v.toInt();
                if (i < 0 || i >= rows.length) return const SizedBox.shrink();
                return Padding(
                  padding: const EdgeInsets.only(top: 6),
                  child: Text(rows[i].nom, style: const TextStyle(fontSize: 10, color: AppTheme.ink400)),
                );
              },
            ),
          ),
        ),
        barGroups: [
          for (var i = 0; i < rows.length; i++)
            BarChartGroupData(
              x: i,
              barRods: [
                BarChartRodData(
                  toY: rows[i].marge / 1000000,
                  width: 18,
                  borderRadius: const BorderRadius.vertical(top: Radius.circular(6)),
                  color: AppTheme.ink900,
                ),
              ],
            ),
        ],
      ),
    );
  }
}
