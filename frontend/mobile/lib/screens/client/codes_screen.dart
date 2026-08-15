import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import 'package:qr_flutter/qr_flutter.dart';

import '../../core/theme/app_theme.dart';
import '../../core/utils/formatters.dart';
import '../../data/models/order.dart';
import '../../providers/auth_provider.dart';
import '../../providers/catalog_provider.dart';
import '../../providers/orders_provider.dart';
import '../../core/utils/client_economics.dart';
import '../../providers/favorites_provider.dart';
import '../../providers/preferences_provider.dart';
import '../../widgets/app_layout.dart';
import '../../widgets/common_widgets.dart';
import '../../widgets/stat_card.dart';

class MyCodesScreen extends StatefulWidget {
  const MyCodesScreen({super.key});

  @override
  State<MyCodesScreen> createState() => _MyCodesScreenState();
}

class _MyCodesScreenState extends State<MyCodesScreen> {
  String _filter = 'pending';

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<OrdersProvider>().loadOrders();
    });
  }

  List<OrderModel> _filtered(OrdersProvider orders) {
    return switch (_filter) {
      'pending' => orders.pendingOrders,
      'redeemed' => orders.orders.where((o) => o.status == 'redeemed' || o.status == 'confirmed').toList(),
      'cancelled' => orders.orders.where((o) => o.status == 'cancelled').toList(),
      _ => orders.orders,
    };
  }

  @override
  Widget build(BuildContext context) {
    final orders = context.watch<OrdersProvider>();
    final list = _filtered(orders);

    return Scaffold(
      backgroundColor: AppTheme.contentBackground(context),
      body: Column(
        children: [
          HeroHeader(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'MES CODES',
                  style: TextStyle(fontSize: 11, fontWeight: FontWeight.w700, letterSpacing: 1, color: AppTheme.accent300),
                ),
                Text(
                  '${orders.pendingCount} en attente de scan',
                  style: const TextStyle(fontSize: 22, fontWeight: FontWeight.w800),
                ),
              ],
            ),
          ),
          Expanded(
            child: ContentSheet(
              child: Column(
                children: [
                  const SizedBox(height: 16),
                  SingleChildScrollView(
                    scrollDirection: Axis.horizontal,
                    padding: const EdgeInsets.symmetric(horizontal: 16),
                    child: Row(
                      children: [
                        AppChip(
                          active: _filter == 'all',
                          onTap: () => setState(() => _filter = 'all'),
                          label: const Text('Tous'),
                        ),
                        const SizedBox(width: 8),
                        AppChip(
                          active: _filter == 'pending',
                          onTap: () => setState(() => _filter = 'pending'),
                          label: const Text('A scanner'),
                        ),
                        const SizedBox(width: 8),
                        AppChip(
                          active: _filter == 'redeemed',
                          onTap: () => setState(() => _filter = 'redeemed'),
                          label: const Text('Payes'),
                        ),
                        const SizedBox(width: 8),
                        AppChip(
                          active: _filter == 'cancelled',
                          onTap: () => setState(() => _filter = 'cancelled'),
                          label: const Text('Annules'),
                        ),
                      ],
                    ),
                  ),
                  Expanded(
                    child: orders.loading
                        ? const LoadingView()
                        : list.isEmpty
                            ? const EmptyState(
                                icon: Icons.qr_code_2_outlined,
                                title: 'Aucun code',
                                subtitle: 'Vos codes QR apparaitront ici apres un paiement.',
                              )
                            : RefreshIndicator(
                                onRefresh: () => orders.loadOrders(),
                                child: ListView.separated(
                                  padding: const EdgeInsets.all(16),
                                  itemCount: list.length,
                                  separatorBuilder: (_, __) => const SizedBox(height: 12),
                                  itemBuilder: (context, index) => _OrderTile(order: list[index]),
                                ),
                              ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _OrderTile extends StatelessWidget {
  const _OrderTile({required this.order});

  final OrderModel order;

  @override
  Widget build(BuildContext context) {
    final store = context.watch<CatalogProvider>().storeById(order.storeId);

    return Container(
      decoration: AppTheme.cardDecoration(context),
      child: ListTile(
        leading: Container(
          width: 40,
          height: 40,
          decoration: BoxDecoration(
            color: AppTheme.ink50,
            borderRadius: BorderRadius.circular(10),
          ),
          child: const Icon(Icons.qr_code_2_outlined, size: 20),
        ),
        title: Text(order.reference, style: const TextStyle(fontWeight: FontWeight.w800, letterSpacing: 0.5)),
        subtitle: Text('${store?.name ?? 'Boutique'} - ${statutCommande(order.status)}'),
        trailing: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          crossAxisAlignment: CrossAxisAlignment.end,
          children: [
            Text(formatPrix(order.total), style: const TextStyle(fontWeight: FontWeight.w800)),
            const Icon(Icons.chevron_right, size: 16),
          ],
        ),
        onTap: order.status == 'pending' ? () => context.push('/client/codes/${order.id}') : null,
      ),
    );
  }
}

class CodeDetailScreen extends StatelessWidget {
  const CodeDetailScreen({super.key, required this.orderId});

  final String orderId;

  String _qrData(OrderModel order) {
    if (order.qrPayload != null && order.qrPayload!.isNotEmpty) {
      return order.qrPayload!;
    }
    return jsonEncode({
      'reference': order.reference,
      'storeId': order.storeId,
      'total': order.total,
    });
  }

  @override
  Widget build(BuildContext context) {
    final order = context.watch<OrdersProvider>().orderById(orderId);

    if (order == null) {
      return Scaffold(
        appBar: AppBar(),
        body: const EmptyState(icon: Icons.qr_code_2_outlined, title: 'Code introuvable'),
      );
    }

    final store = context.watch<CatalogProvider>().storeById(order.storeId);

    return Scaffold(
      appBar: AppBar(title: const Text('Code de paiement')),
      body: ListView(
        padding: const EdgeInsets.all(24),
        children: [
          Center(
            child: Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: Colors.grey.shade200),
              ),
              child: QrImageView(
                data: _qrData(order),
                version: QrVersions.auto,
                size: 220,
              ),
            ),
          ),
          const SizedBox(height: 16),
          Text(
            order.reference,
            textAlign: TextAlign.center,
            style: const TextStyle(fontSize: 20, fontWeight: FontWeight.w800, letterSpacing: 1.2),
          ),
          const SizedBox(height: 8),
          Text(
            formatPrix(order.total),
            textAlign: TextAlign.center,
            style: const TextStyle(fontSize: 28, fontWeight: FontWeight.w900, color: AppTheme.accent500),
          ),
          const SizedBox(height: 16),
          Card(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(store?.name ?? 'Boutique', style: const TextStyle(fontWeight: FontWeight.w800)),
                  const SizedBox(height: 8),
                  Text('Statut: ${statutCommande(order.status)}'),
                  Text('Mode: ${modeRetrait(order.fulfillmentMode)}'),
                  Text('Expire: ${formatDate(order.expiresAt)}'),
                  const Divider(),
                  ...order.items.map(
                    (item) => Padding(
                      padding: const EdgeInsets.symmetric(vertical: 4),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Expanded(child: Text('${item.quantity} x ${item.name}')),
                          Text(formatPrix(item.lineTotal)),
                        ],
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
          if (order.isPending) ...[
            const SizedBox(height: 16),
            OutlinedButton.icon(
              onPressed: () async {
                await context.read<OrdersProvider>().cancelOrder(order.id);
                if (context.mounted) context.pop();
              },
              icon: const Icon(Icons.cancel_outlined),
              label: const Text('Annuler la commande'),
            ),
          ],
        ],
      ),
    );
  }
}

class GainsScreen extends StatefulWidget {
  const GainsScreen({super.key});

  @override
  State<GainsScreen> createState() => _GainsScreenState();
}

class _GainsScreenState extends State<GainsScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<OrdersProvider>().loadOrders();
    });
  }

  @override
  Widget build(BuildContext context) {
    final orders = context.watch<OrdersProvider>();
    final catalog = context.watch<CatalogProvider>();
    final favorites = context.watch<FavoritesProvider>();
    final bilan = computeClientEconomics(orders.orders);
    const paliers = [5000.0, 25000.0, 100000.0];
    final palier = paliers.firstWhere((p) => bilan.economies < p, orElse: () => paliers.last);
    final progression = (bilan.economies / palier * 100).clamp(0, 100).round();
    final promosSuivies = catalog.products.where((p) => favorites.isFavorite(p.id) && p.onPromo).toList();

    return Scaffold(
      backgroundColor: AppTheme.contentBackground(context),
      body: orders.loading
          ? const LoadingView()
          : ListView(
              padding: const EdgeInsets.all(16),
              children: [
                Container(
                  decoration: BoxDecoration(
                    color: AppTheme.ink900,
                    borderRadius: BorderRadius.circular(20),
                  ),
                  padding: const EdgeInsets.all(20),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Row(
                        children: [
                          Icon(Icons.savings_outlined, size: 14, color: AppTheme.accent300),
                          SizedBox(width: 6),
                          Text(
                            'ECONOMIES REALISEES',
                            style: TextStyle(fontSize: 11, fontWeight: FontWeight.w700, letterSpacing: 1, color: AppTheme.accent300),
                          ),
                        ],
                      ),
                      const SizedBox(height: 8),
                      Text(formatPrix(bilan.economies), style: const TextStyle(color: Colors.white, fontSize: 30, fontWeight: FontWeight.w800)),
                      Text(
                        'sur ${formatPrix(bilan.depense)} depenses - ${bilan.commandes} commande(s)',
                        style: const TextStyle(color: AppTheme.ink300, fontSize: 13),
                      ),
                      const SizedBox(height: 16),
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          const Text('Prochain palier', style: TextStyle(color: AppTheme.ink300, fontSize: 11, fontWeight: FontWeight.w700)),
                          Text(formatPrix(palier), style: const TextStyle(color: AppTheme.ink300, fontSize: 11, fontWeight: FontWeight.w700)),
                        ],
                      ),
                      const SizedBox(height: 6),
                      ClipRRect(
                        borderRadius: BorderRadius.circular(999),
                        child: LinearProgressIndicator(
                          value: progression / 100,
                          minHeight: 8,
                          backgroundColor: AppTheme.ink700,
                          color: AppTheme.accent500,
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 16),
                GridView.count(
                  crossAxisCount: 2,
                  shrinkWrap: true,
                  physics: const NeverScrollableScrollPhysics(),
                  crossAxisSpacing: 12,
                  mainAxisSpacing: 12,
                  childAspectRatio: 1.4,
                  children: [
                    StatCard(label: 'Points fidelite', value: '${bilan.points}', icon: Icons.monetization_on_outlined, tone: StatTone.warning),
                    StatCard(label: 'Panier moyen', value: formatPrix(bilan.panierMoyen), icon: Icons.local_offer_outlined),
                    StatCard(label: 'En attente scan', value: formatPrix(bilan.aVenir), icon: Icons.arrow_downward, tone: StatTone.info),
                    StatCard(label: 'Economies a venir', value: formatPrix(bilan.economiesAVenir), icon: Icons.trending_down, tone: StatTone.success),
                  ],
                ),
                const SectionHeader(title: 'Recompenses disponibles'),
                ...[
                  (20, 'Bon de 1 000 F', '20 points'),
                  (60, 'Livraison offerte', '60 points'),
                  (150, 'Remise 10 %', '150 points'),
                ].map((r) {
                  final dispo = bilan.points >= r.$1;
                  return Container(
                    margin: const EdgeInsets.only(bottom: 8),
                    decoration: AppTheme.cardDecoration(context),
                    child: ListTile(
                      leading: Container(
                        width: 40,
                        height: 40,
                        decoration: BoxDecoration(
                          color: dispo ? const Color(0xFFECFDF5) : AppTheme.ink50,
                          borderRadius: BorderRadius.circular(10),
                        ),
                        child: Icon(Icons.card_giftcard_outlined, color: dispo ? AppTheme.emerald600 : AppTheme.ink400),
                      ),
                      title: Text(r.$2, style: const TextStyle(fontWeight: FontWeight.w700)),
                      subtitle: Text(r.$3),
                      trailing: Icon(
                        dispo ? Icons.check_circle_outline : Icons.lock_outline,
                        color: dispo ? AppTheme.emerald600 : AppTheme.ink300,
                      ),
                    ),
                  );
                }),
                if (promosSuivies.isNotEmpty) ...[
                  const SectionHeader(title: 'Promos sur vos favoris'),
                  ...promosSuivies.take(5).map(
                    (p) => ListTile(
                      title: Text(p.name),
                      trailing: Text(formatPrix(p.displayPrice), style: const TextStyle(fontWeight: FontWeight.w800)),
                    ),
                  ),
                ],
                TextButton.icon(
                  onPressed: () => context.push('/client/tickets'),
                  icon: const Icon(Icons.receipt_long_outlined),
                  label: const Text('Voir l\'historique des tickets'),
                ),
              ],
            ),
    );
  }
}

class ClientSettingsScreen extends StatelessWidget {
  const ClientSettingsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();
    final prefsProvider = context.watch<PreferencesProvider>();
    final prefs = prefsProvider.preferences;

    return Scaffold(
      backgroundColor: AppTheme.contentBackground(context),
      body: Column(
        children: [
          HeroHeader(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'REGLAGES',
                  style: TextStyle(fontSize: 11, fontWeight: FontWeight.w700, letterSpacing: 1, color: AppTheme.accent300),
                ),
                const SizedBox(height: 4),
                Text(
                  auth.user?.displayName ?? 'Mon espace',
                  style: const TextStyle(fontSize: 22, fontWeight: FontWeight.w800),
                ),
              ],
            ),
          ),
          Expanded(
            child: ContentSheet(
              child: ListView(
                children: [
                  if (auth.user != null)
                    Padding(
                      padding: const EdgeInsets.fromLTRB(16, 16, 16, 0),
                      child: InkWell(
                        onTap: () => context.push('/client/compte'),
                        child: Container(
                          decoration: AppTheme.cardDecoration(context),
                          child: ListTile(
                            leading: CircleAvatar(
                              backgroundColor: AppTheme.accent500.withValues(alpha: 0.15),
                              child: Text(auth.user!.initials, style: const TextStyle(fontWeight: FontWeight.w800)),
                            ),
                            title: Text(auth.user!.displayName, style: const TextStyle(fontWeight: FontWeight.w700)),
                            subtitle: Text(auth.user!.email),
                            trailing: const Icon(Icons.cloud_done_outlined, color: AppTheme.emerald600),
                          ),
                        ),
                      ),
                    )
                  else
                    Padding(
                      padding: const EdgeInsets.fromLTRB(16, 16, 16, 0),
                      child: Container(
                        decoration: BoxDecoration(color: AppTheme.ink900, borderRadius: BorderRadius.circular(16)),
                        padding: const EdgeInsets.all(16),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Text('Mode invite', style: TextStyle(color: Colors.white, fontWeight: FontWeight.w800)),
                            const Text('Connectez-vous pour synchroniser vos donnees', style: TextStyle(color: AppTheme.ink300, fontSize: 12)),
                            const SizedBox(height: 12),
                            FilledButton(onPressed: () => context.go('/auth'), child: const Text('Se connecter')),
                          ],
                        ),
                      ),
                    ),
                  SettingsSection(
                    title: 'Compte & sauvegarde',
                    children: [
                      SettingsTile(icon: Icons.person_outline, title: 'Mon compte', onTap: () => context.push('/client/compte')),
                      SettingsTile(icon: Icons.receipt_long_outlined, title: 'Tickets de caisse', onTap: () => context.push('/client/tickets')),
                      SettingsTile(icon: Icons.favorite_border, title: 'Mes favoris', onTap: () => context.push('/client/favoris'), showDivider: false),
                    ],
                  ),
                  SettingsSection(
                    title: 'Preferences',
                    children: [
                      SettingsTile(icon: Icons.auto_awesome_outlined, title: 'Mon flux personnalise', onTap: () => context.push('/client/preferences')),
                      SettingsTile(icon: Icons.tune, title: 'Relancer l\'onboarding', onTap: () => context.go('/onboarding'), showDivider: false),
                    ],
                  ),
                  SettingsSection(
                    title: 'Apparence',
                    children: [
                      Padding(
                        padding: const EdgeInsets.all(16),
                        child: ThemeSelector(
                          value: prefs.themeMode,
                          onChanged: (mode) => prefsProvider.update(prefs.copyWith(themeMode: mode)),
                        ),
                      ),
                    ],
                  ),
                  SettingsSection(
                    title: 'Session',
                    children: [
                      SettingsTile(icon: Icons.login_outlined, title: 'Espace vendeur / manager', onTap: () => context.go('/auth')),
                      if (auth.isAuthenticated)
                        SettingsTile(
                          icon: Icons.logout,
                          title: 'Se deconnecter',
                          onTap: () async {
                            await auth.logout();
                            if (context.mounted) context.go('/client');
                          },
                          showDivider: false,
                        ),
                    ],
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}
