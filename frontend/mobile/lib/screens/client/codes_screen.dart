import 'dart:async';
import 'dart:convert';

import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import 'package:qr_flutter/qr_flutter.dart';

import '../../core/theme/app_theme.dart';
import '../../core/utils/client_economics.dart';
import '../../core/utils/formatters.dart';
import '../../core/utils/qr_util.dart';
import '../../data/models/order.dart';
import '../../data/models/preferences.dart';
import '../../providers/auth_provider.dart';
import '../../providers/cart_provider.dart';
import '../../providers/catalog_provider.dart';
import '../../providers/favorites_provider.dart';
import '../../providers/orders_provider.dart';
import '../../providers/preferences_provider.dart';
import '../../widgets/app_layout.dart';
import '../../widgets/common_widgets.dart';
import '../../widgets/google_sign_in_sheet.dart';
import '../../widgets/stat_card.dart';
import '../../widgets/top_bar.dart';

class MyCodesScreen extends StatefulWidget {
  const MyCodesScreen({super.key});

  @override
  State<MyCodesScreen> createState() => _MyCodesScreenState();
}

class _MyCodesScreenState extends State<MyCodesScreen> {
  String _filter = 'all';

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
    final catalog = context.watch<CatalogProvider>();
    final list = _filtered(orders);
    final pendingCount = orders.pendingCount;

    return Scaffold(
      backgroundColor: AppTheme.contentBackground(context),
      appBar: TopBar(
        title: 'Mes codes de paiement',
        subtitle: '$pendingCount en attente de scan',
        showBack: false,
      ),
      body: Column(
        children: [
          SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            padding: const EdgeInsets.fromLTRB(16, 12, 16, 0),
            child: Row(
              children: [
                AppChip(active: _filter == 'all', onTap: () => setState(() => _filter = 'all'), label: const Text('Tous')),
                const SizedBox(width: 8),
                AppChip(active: _filter == 'pending', onTap: () => setState(() => _filter = 'pending'), label: const Text('À scanner')),
                const SizedBox(width: 8),
                AppChip(active: _filter == 'redeemed', onTap: () => setState(() => _filter = 'redeemed'), label: const Text('Payés')),
                const SizedBox(width: 8),
                AppChip(active: _filter == 'cancelled', onTap: () => setState(() => _filter = 'cancelled'), label: const Text('Annulés')),
              ],
            ),
          ),
          Expanded(
            child: orders.loading && list.isEmpty
                ? const LoadingView(message: 'Chargement des codes…')
                : list.isEmpty
                    ? EmptyState(
                        icon: Icons.qr_code_2_outlined,
                        title: 'Aucun code ici',
                        subtitle:
                            'Finalisez une commande : un code QR par boutique sera généré et conservé dans cette section.',
                        action: FilledButton(
                          onPressed: () => context.go('/client'),
                          child: const Text('Explorer les articles'),
                        ),
                      )
                    : RefreshIndicator(
                        onRefresh: () => orders.loadOrders(),
                        child: ListView.separated(
                          padding: const EdgeInsets.all(16),
                          itemCount: list.length,
                          separatorBuilder: (_, __) => const SizedBox(height: 10),
                          itemBuilder: (context, index) {
                            final order = list[index];
                            final store = catalog.storeById(order.storeId);
                            return Material(
                              color: Colors.white,
                              borderRadius: BorderRadius.circular(16),
                              child: InkWell(
                                onTap: () => context.push('/client/codes/${order.id}'),
                                borderRadius: BorderRadius.circular(16),
                                child: Container(
                                  decoration: AppTheme.cardDecoration(context),
                                  padding: const EdgeInsets.all(14),
                                  child: Row(
                                    children: [
                                      Container(
                                        width: 48,
                                        height: 48,
                                        decoration: BoxDecoration(
                                          color: AppTheme.ink900,
                                          borderRadius: BorderRadius.circular(12),
                                        ),
                                        child: const Icon(Icons.qr_code_2, color: Colors.white, size: 22),
                                      ),
                                      const SizedBox(width: 12),
                                      Expanded(
                                        child: Column(
                                          crossAxisAlignment: CrossAxisAlignment.start,
                                          children: [
                                            Text(
                                              store?.name ?? 'Boutique',
                                              maxLines: 1,
                                              overflow: TextOverflow.ellipsis,
                                              style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 14),
                                            ),
                                            Text(
                                              order.reference,
                                              maxLines: 1,
                                              overflow: TextOverflow.ellipsis,
                                              style: const TextStyle(fontFamily: 'monospace', fontSize: 11, color: AppTheme.ink400),
                                            ),
                                            Text(
                                              '${order.items.length} article${order.items.length > 1 ? 's' : ''} · ${formatHeure(order.createdAt ?? DateTime.now())}',
                                              style: const TextStyle(fontSize: 11, color: AppTheme.ink400),
                                            ),
                                          ],
                                        ),
                                      ),
                                      Column(
                                        crossAxisAlignment: CrossAxisAlignment.end,
                                        children: [
                                          Text(formatPrix(order.total), style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 14)),
                                          const SizedBox(height: 4),
                                          _StatusBadge(status: order.status),
                                        ],
                                      ),
                                    ],
                                  ),
                                ),
                              ),
                            );
                          },
                        ),
                      ),
          ),
        ],
      ),
    );
  }
}

class _StatusBadge extends StatelessWidget {
  const _StatusBadge({required this.status});

  final String status;

  @override
  Widget build(BuildContext context) {
    final (bg, fg, label) = switch (status) {
      'pending' => (const Color(0xFFFFFBEB), const Color(0xFFD97706), 'En attente de scan'),
      'redeemed' || 'confirmed' => (const Color(0xFFECFDF5), AppTheme.emerald600, 'Paiement confirmé'),
      'cancelled' => (const Color(0xFFFEF2F2), const Color(0xFFDC2626), 'Annulé'),
      'expired' => (AppTheme.ink100, AppTheme.ink500, 'Expiré'),
      _ => (AppTheme.ink100, AppTheme.ink500, status),
    };

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
      decoration: BoxDecoration(color: bg, borderRadius: BorderRadius.circular(999)),
      child: Text(label, style: TextStyle(fontSize: 10, fontWeight: FontWeight.w800, color: fg)),
    );
  }
}

class CodeDetailScreen extends StatefulWidget {
  const CodeDetailScreen({super.key, required this.orderId});

  final String orderId;

  @override
  State<CodeDetailScreen> createState() => _CodeDetailScreenState();
}

class _CodeDetailScreenState extends State<CodeDetailScreen> {
  Timer? _timer;
  String _remaining = '';

  @override
  void dispose() {
    _timer?.cancel();
    super.dispose();
  }

  void _startTimer(OrderModel order) {
    _timer?.cancel();
    void tick() {
      final diff = order.expiresAt.difference(DateTime.now());
      if (!mounted) return;
      setState(() {
        if (diff.isNegative) {
          _remaining = 'Expiré';
        } else {
          final m = diff.inMinutes;
          final s = diff.inSeconds % 60;
          _remaining = '${m}m ${s.toString().padLeft(2, '0')}s';
        }
      });
    }

    tick();
    _timer = Timer.periodic(const Duration(seconds: 1), (_) => tick());
  }

  String _qrData(OrderModel order, String? storeName) {
    if (order.qrPayload != null && order.qrPayload!.isNotEmpty) return order.qrPayload!;
    return encodeQrPayload(order, storeName: storeName);
  }

  @override
  Widget build(BuildContext context) {
    final order = context.watch<OrdersProvider>().orderById(widget.orderId);

    if (order == null) {
      WidgetsBinding.instance.addPostFrameCallback((_) {
        if (mounted) context.go('/client/codes');
      });
      return const Scaffold(body: Center(child: CircularProgressIndicator()));
    }

    if (_timer == null) _startTimer(order);

    final store = context.watch<CatalogProvider>().storeById(order.storeId);
    final pending = order.isPending && _remaining != 'Expiré';

    return Scaffold(
      backgroundColor: AppTheme.contentBackground(context),
      appBar: TopBar(title: 'Code de paiement', subtitle: store?.name),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          Container(
            decoration: AppTheme.cardDecoration(context),
            padding: const EdgeInsets.all(20),
            child: Column(
              children: [
                _StatusBadge(status: order.status),
                const SizedBox(height: 12),
                Opacity(
                  opacity: pending ? 1 : 0.3,
                  child: ColorFiltered(
                    colorFilter: pending ? const ColorFilter.mode(Colors.transparent, BlendMode.multiply) : const ColorFilter.matrix(<double>[
                      0.2126, 0.7152, 0.0722, 0, 0,
                      0.2126, 0.7152, 0.0722, 0, 0,
                      0.2126, 0.7152, 0.0722, 0, 0,
                      0, 0, 0, 1, 0,
                    ]),
                    child: Container(
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        border: Border.all(color: AppTheme.ink100),
                        borderRadius: BorderRadius.circular(16),
                      ),
                      child: QrImageView(data: _qrData(order, store?.name), version: QrVersions.auto, size: 196),
                    ),
                  ),
                ),
                if (order.isPending && _remaining != 'Expiré')
                  Padding(
                    padding: const EdgeInsets.only(top: 8),
                    child: Text('Expire dans $_remaining', style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w700, color: Color(0xFFD97706))),
                  ),
                const SizedBox(height: 12),
                Text(
                  order.reference,
                  style: const TextStyle(fontFamily: 'monospace', fontSize: 18, fontWeight: FontWeight.w800, letterSpacing: 2),
                ),
                TextButton.icon(
                  onPressed: () {
                    Clipboard.setData(ClipboardData(text: order.reference));
                    ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Code copié')));
                  },
                  icon: const Icon(Icons.copy, size: 12, color: AppTheme.accent600),
                  label: const Text('Copier le code', style: TextStyle(fontSize: 11, fontWeight: FontWeight.w800, color: AppTheme.accent600)),
                ),
                Text(formatPrix(order.total), style: const TextStyle(fontSize: 24, fontWeight: FontWeight.w800)),
                Text(
                  '${order.paymentMethod ?? '—'} · ${modeRetrait(order.fulfillmentMode)}',
                  style: const TextStyle(fontSize: 12, color: AppTheme.ink400),
                ),
              ],
            ),
          ),
          const SizedBox(height: 12),
          Container(
            padding: const EdgeInsets.all(14),
            decoration: BoxDecoration(color: AppTheme.sand100, borderRadius: BorderRadius.circular(16)),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Icon(Icons.info_outline, size: 16, color: AppTheme.accent600),
                const SizedBox(width: 10),
                Expanded(
                  child: Text.rich(
                    TextSpan(
                      style: const TextStyle(fontSize: 12, height: 1.5, color: AppTheme.ink600),
                      children: [
                        const TextSpan(text: 'Présentez ce code au vendeur de '),
                        TextSpan(text: store?.name ?? 'cette boutique', style: const TextStyle(fontWeight: FontWeight.w800)),
                        const TextSpan(text: '. Dès qu\'il le scanne, le paiement est confirmé et le code disparaît de sa file d\'attente.'),
                      ],
                    ),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 12),
          _DetailCard(
            title: 'Détail de la commande',
            children: [
              ...order.items.map(
                (item) => _DetailRow(label: '${item.quantity} × ${item.name}', value: formatPrix(item.lineTotal)),
              ),
              const Divider(height: 16),
              _DetailRow(label: 'Sous-total', value: formatPrix(order.subtotal)),
              if (order.discount > 0)
                _DetailRow(label: 'Économies promotions', value: '−${formatPrix(order.discount)}', valueColor: AppTheme.emerald600),
              _DetailRow(
                label: 'Livraison',
                value: order.fulfillmentMode == 'delivery' ? formatPrix(order.total - order.subtotal - order.tax) : 'Gratuit',
              ),
              _DetailRow(label: 'Total', value: formatPrix(order.total), bold: true),
            ],
          ),
          const SizedBox(height: 12),
          _DetailCard(
            title: 'Informations',
            children: [
              _DetailRow(label: 'Client', value: '${order.contactName ?? '—'} · ${order.contactPhone ?? '—'}'),
              _DetailRow(
                label: 'Émis le',
                value: '${formatDate(order.createdAt ?? DateTime.now())} à ${formatHeure(order.createdAt ?? DateTime.now())}',
              ),
              _DetailRow(label: 'Expire à', value: formatHeure(order.expiresAt)),
              if (order.redeemedAt != null)
                _DetailRow(label: 'Confirmé le', value: formatHeure(order.redeemedAt!)),
            ],
          ),
          if (pending) ...[
            const SizedBox(height: 12),
            OutlinedButton(
              onPressed: () async {
                await context.read<OrdersProvider>().cancelOrder(order.id);
                if (context.mounted) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(content: Text('Code annulé, il ne peut plus être scanné.')),
                  );
                  context.go('/client/codes');
                }
              },
              style: OutlinedButton.styleFrom(foregroundColor: Colors.red, minimumSize: const Size.fromHeight(48)),
              child: const Text('Annuler ce code'),
            ),
          ],
        ],
      ),
    );
  }
}

class _DetailCard extends StatelessWidget {
  const _DetailCard({required this.title, required this.children});

  final String title;
  final List<Widget> children;

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: AppTheme.cardDecoration(context),
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(title, style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 14)),
          const SizedBox(height: 8),
          ...children,
        ],
      ),
    );
  }
}

class _DetailRow extends StatelessWidget {
  const _DetailRow({required this.label, required this.value, this.bold = false, this.valueColor});

  final String label;
  final String value;
  final bool bold;
  final Color? valueColor;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 3),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Expanded(child: Text(label, style: TextStyle(fontSize: 13, color: AppTheme.ink600))),
          const SizedBox(width: 12),
          Text(
            value,
            textAlign: TextAlign.right,
            style: TextStyle(
              fontSize: bold ? 14 : 13,
              fontWeight: bold ? FontWeight.w800 : FontWeight.w600,
              color: valueColor ?? AppTheme.ink800,
            ),
          ),
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
    final economiePotentielle = promosSuivies.fold<double>(
      0,
      (t, p) => t + ((p.compareAtPrice ?? p.price) - p.price),
    );
    final confirmed = orders.orders.where((o) => o.status == 'redeemed' || o.status == 'confirmed').toList();

    return Scaffold(
      backgroundColor: AppTheme.contentBackground(context),
      appBar: const TopBar(title: 'Mes gains', subtitle: 'Économies, fidélité et bons plans', showBack: false),
      body: orders.loading && orders.orders.isEmpty
          ? const LoadingView()
          : ListView(
              padding: const EdgeInsets.all(16),
              children: [
                Container(
                  decoration: BoxDecoration(color: AppTheme.ink900, borderRadius: BorderRadius.circular(24)),
                  padding: const EdgeInsets.all(20),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Row(
                        children: [
                          Icon(Icons.savings_outlined, size: 13, color: AppTheme.accent300),
                          SizedBox(width: 6),
                          Text(
                            'ÉCONOMIES RÉALISÉES',
                            style: TextStyle(fontSize: 11, fontWeight: FontWeight.w700, letterSpacing: 1.2, color: AppTheme.accent300),
                          ),
                        ],
                      ),
                      const SizedBox(height: 8),
                      Text(formatPrix(bilan.economies), style: const TextStyle(color: Colors.white, fontSize: 30, fontWeight: FontWeight.w800)),
                      Text(
                        'sur ${formatPrix(bilan.depense)} dépensés · ${bilan.commandes} commande${bilan.commandes > 1 ? 's' : ''} confirmée${bilan.commandes > 1 ? 's' : ''}',
                        style: const TextStyle(color: AppTheme.ink300, fontSize: 13),
                      ),
                      const SizedBox(height: 16),
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          const Text('Prochain palier fidélité', style: TextStyle(color: AppTheme.ink300, fontSize: 11, fontWeight: FontWeight.w700)),
                          Text(formatPrix(palier), style: const TextStyle(color: AppTheme.ink300, fontSize: 11, fontWeight: FontWeight.w700)),
                        ],
                      ),
                      const SizedBox(height: 6),
                      ClipRRect(
                        borderRadius: BorderRadius.circular(999),
                        child: LinearProgressIndicator(value: progression / 100, minHeight: 8, backgroundColor: AppTheme.ink700, color: AppTheme.accent500),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 16),
                GridView.count(
                  crossAxisCount: 2,
                  shrinkWrap: true,
                  physics: const NeverScrollableScrollPhysics(),
                  crossAxisSpacing: 10,
                  mainAxisSpacing: 10,
                  childAspectRatio: 1.15,
                  children: [
                    StatCard(label: 'Points fidélité', value: '${bilan.points}', icon: Icons.monetization_on_outlined, tone: StatTone.warning),
                    StatCard(label: 'Panier moyen', value: formatPrix(bilan.panierMoyen), icon: Icons.local_offer_outlined),
                    StatCard(label: 'En attente de scan', value: formatPrix(bilan.aVenir), icon: Icons.arrow_downward, tone: StatTone.info),
                    StatCard(label: 'Économies à venir', value: formatPrix(bilan.economiesAVenir), icon: Icons.trending_down, tone: StatTone.success),
                  ],
                ),
                const SectionHeader(title: 'Récompenses disponibles'),
                ...[
                  (20, 'Bon de 1 000 F', '20 points — valable sur toute boutique'),
                  (60, 'Livraison offerte', '60 points — une commande livrée'),
                  (150, 'Remise 10 %', '150 points — plafonnée à 15 000 F'),
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
                          color: dispo ? const Color(0xFFECFDF5) : AppTheme.ink100,
                          borderRadius: BorderRadius.circular(10),
                        ),
                        child: Icon(Icons.card_giftcard_outlined, color: dispo ? AppTheme.emerald600 : AppTheme.ink400),
                      ),
                      title: Text(r.$2, maxLines: 1, overflow: TextOverflow.ellipsis, style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 13)),
                      subtitle: Text(r.$3, maxLines: 2, overflow: TextOverflow.ellipsis, style: const TextStyle(fontSize: 11)),
                      trailing: ConstrainedBox(
                        constraints: const BoxConstraints(maxWidth: 72),
                        child: Text(
                          dispo ? 'Disponible' : '${r.$1 - bilan.points} pts',
                          textAlign: TextAlign.right,
                          maxLines: 2,
                          overflow: TextOverflow.ellipsis,
                          style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w800, color: AppTheme.ink500),
                        ),
                      ),
                    ),
                  );
                }),
                const SectionHeader(title: 'Promotions dans mes favoris'),
                if (promosSuivies.isEmpty)
                  Container(
                    padding: const EdgeInsets.all(20),
                    decoration: BoxDecoration(
                      border: Border.all(color: AppTheme.ink200, style: BorderStyle.solid),
                      borderRadius: BorderRadius.circular(16),
                    ),
                    child: const Text(
                      'Ajoutez des articles en favoris : vous serez alerté dès qu\'ils passent en promotion.',
                      textAlign: TextAlign.center,
                      style: TextStyle(fontSize: 13, color: AppTheme.ink400),
                    ),
                  )
                else ...[
                  Container(
                    decoration: AppTheme.cardDecoration(context),
                    clipBehavior: Clip.antiAlias,
                    child: Column(
                      children: [
                        for (var i = 0; i < promosSuivies.length; i++) ...[
                          if (i > 0) const Divider(height: 1),
                          ListTile(
                            leading: ClipRRect(
                              borderRadius: BorderRadius.circular(8),
                              child: SizedBox(
                                width: 40,
                                height: 40,
                                child: promosSuivies[i].imageUrl != null
                                    ? CachedNetworkImage(imageUrl: promosSuivies[i].imageUrl!, fit: BoxFit.cover)
                                    : Container(color: AppTheme.ink100),
                              ),
                            ),
                            title: Text(promosSuivies[i].name, maxLines: 1, overflow: TextOverflow.ellipsis, style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 13)),
                            subtitle: Text(catalog.storeById(promosSuivies[i].storeId)?.name ?? '', maxLines: 1, overflow: TextOverflow.ellipsis, style: const TextStyle(fontSize: 11)),
                            trailing: Text(
                              '−${formatPrix((promosSuivies[i].compareAtPrice ?? promosSuivies[i].price) - promosSuivies[i].price)}',
                              style: const TextStyle(fontWeight: FontWeight.w800, color: AppTheme.emerald600),
                            ),
                            onTap: () => context.push('/client/produit/${promosSuivies[i].id}'),
                          ),
                        ],
                      ],
                    ),
                  ),
                  Padding(
                    padding: const EdgeInsets.only(top: 8),
                    child: Text('Économie potentielle : ${formatPrix(economiePotentielle)}', style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 12, color: AppTheme.ink500)),
                  ),
                ],
                SectionHeader(
                  title: 'Historique des économies',
                  action: TextButton(
                    onPressed: () => context.push('/client/tickets'),
                    child: const Text('Voir les tickets', style: TextStyle(fontSize: 11, fontWeight: FontWeight.w800, color: AppTheme.accent600)),
                  ),
                ),
                if (confirmed.isEmpty)
                  EmptyState(
                    icon: Icons.savings_outlined,
                    title: 'Aucun achat confirmé',
                    subtitle: 'Vos économies apparaîtront ici dès qu\'un vendeur aura scanné l\'un de vos codes.',
                    action: OutlinedButton(onPressed: () => context.go('/client'), child: const Text('Explorer le catalogue')),
                  )
                else
                  Container(
                    decoration: AppTheme.cardDecoration(context),
                    clipBehavior: Clip.antiAlias,
                    child: Column(
                      children: [
                        for (var i = 0; i < confirmed.length; i++) ...[
                          if (i > 0) const Divider(height: 1),
                          ListTile(
                            title: Text(
                              catalog.storeById(confirmed[i].storeId)?.name ?? 'Boutique',
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                              style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 13),
                            ),
                            subtitle: Text(
                              '${formatDate(confirmed[i].redeemedAt ?? confirmed[i].createdAt ?? DateTime.now())} · ${confirmed[i].items.length} article${confirmed[i].items.length > 1 ? 's' : ''}',
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                              style: const TextStyle(fontSize: 11),
                            ),
                            trailing: ConstrainedBox(
                              constraints: const BoxConstraints(maxWidth: 100),
                              child: Column(
                                mainAxisAlignment: MainAxisAlignment.center,
                                crossAxisAlignment: CrossAxisAlignment.end,
                                children: [
                                  FittedBox(
                                    fit: BoxFit.scaleDown,
                                    child: Text(formatPrix(confirmed[i].total), style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 13)),
                                  ),
                                  if (confirmed[i].discount > 0)
                                    FittedBox(
                                      fit: BoxFit.scaleDown,
                                      child: Text('−${formatPrix(confirmed[i].discount)}', style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w700, color: AppTheme.emerald600)),
                                    ),
                                ],
                              ),
                            ),
                          ),
                        ],
                      ],
                    ),
                  ),
              ],
            ),
    );
  }
}

class ClientSettingsScreen extends StatefulWidget {
  const ClientSettingsScreen({super.key});

  @override
  State<ClientSettingsScreen> createState() => _ClientSettingsScreenState();
}

class _ClientSettingsScreenState extends State<ClientSettingsScreen> {
  String _langue = 'Français';
  String _devise = 'FCFA';
  String _qrExpiry = '30 min';
  bool _notifPush = true;
  bool _notifEmail = true;
  bool _notifSms = false;
  bool _geoloc = true;
  bool _biometrie = false;
  bool _partageStats = true;

  Future<void> _openGoogleSheet() async {
    await GoogleSignInSheet.show(context);
  }

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();
    final prefsProvider = context.watch<PreferencesProvider>();
    final prefs = prefsProvider.preferences;
    final favorites = context.watch<FavoritesProvider>();
    final orders = context.watch<OrdersProvider>();
    final tickets = orders.orders.where((o) => o.status == 'redeemed' || o.status == 'confirmed').length;

    return Scaffold(
      backgroundColor: AppTheme.contentBackground(context),
      appBar: const TopBar(title: 'Paramètres', subtitle: 'Espace client', showBack: false),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          if (auth.isGoogleClient && auth.user != null)
            Material(
              color: Colors.white,
              borderRadius: BorderRadius.circular(16),
              child: InkWell(
                onTap: () => context.push('/client/compte'),
                borderRadius: BorderRadius.circular(16),
                child: Container(
                  decoration: AppTheme.cardDecoration(context),
                  padding: const EdgeInsets.all(16),
                  child: Row(
                    children: [
                      CircleAvatar(
                        backgroundColor: AppTheme.ink900,
                        child: Text(auth.user!.initials, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w800)),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(auth.user!.displayName, style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 14)),
                            Text(auth.user!.email, style: const TextStyle(fontSize: 11, color: AppTheme.ink400)),
                            const Text('Synchronisé', style: TextStyle(fontSize: 11, fontWeight: FontWeight.w700, color: AppTheme.emerald600)),
                          ],
                        ),
                      ),
                      const Icon(Icons.cloud_done_outlined, color: AppTheme.emerald600),
                    ],
                  ),
                ),
              ),
            )
          else
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(color: AppTheme.ink900, borderRadius: BorderRadius.circular(16)),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Container(
                        width: 44,
                        height: 44,
                        decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(12)),
                        alignment: Alignment.center,
                        child: const GoogleLogo(size: 20),
                      ),
                      const SizedBox(width: 12),
                      const Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text('Mode invité', style: TextStyle(color: Colors.white, fontWeight: FontWeight.w800, fontSize: 14)),
                            Text('Vos tickets et préférences restent sur cet appareil', style: TextStyle(color: AppTheme.ink300, fontSize: 11)),
                          ],
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),
                  SizedBox(
                    width: double.infinity,
                    child: FilledButton.icon(
                      onPressed: _openGoogleSheet,
                      style: FilledButton.styleFrom(
                        backgroundColor: Colors.white,
                        foregroundColor: AppTheme.ink900,
                        minimumSize: const Size.fromHeight(44),
                      ),
                      icon: const GoogleLogo(size: 16),
                      label: const Text('Se connecter avec Google', style: TextStyle(fontWeight: FontWeight.w800, fontSize: 13)),
                    ),
                  ),
                  const SizedBox(height: 8),
                  OutlinedButton.icon(
                    onPressed: () => context.go('/auth'),
                    style: OutlinedButton.styleFrom(
                      foregroundColor: AppTheme.ink200,
                      side: const BorderSide(color: AppTheme.ink700),
                      minimumSize: const Size.fromHeight(44),
                    ),
                    icon: const Icon(Icons.login, size: 14),
                    label: const Text('Je suis vendeur ou manageur', style: TextStyle(fontWeight: FontWeight.w700, fontSize: 12)),
                  ),
                ],
              ),
            ),
          SettingsSection(
            title: 'Compte & sauvegarde',
            children: [
              SettingsTile(
                icon: Icons.cloud_outlined,
                title: 'Compte Google',
                subtitle: auth.isGoogleClient ? (auth.user?.email ?? 'Connecté') : 'Non connecté',
                onTap: () => context.push('/client/compte'),
              ),
              SettingsTile(icon: Icons.receipt_long_outlined, title: 'Tickets de caisse', subtitle: '$tickets', onTap: () => context.push('/client/tickets')),
              if (auth.isGoogleClient)
                SettingsTile(
                  icon: Icons.sync,
                  title: 'Synchroniser maintenant',
                  subtitle: '—',
                  onTap: () => ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('3 élément(s) synchronisé(s)'))),
                ),
            ],
          ),
          SettingsSection(
            title: 'Préférences',
            children: [
              _SettingsDropdown(label: 'Langue', value: _langue, options: const ['Français', 'English', 'Español'], onChanged: (v) => setState(() => _langue = v)),
              _SettingsDropdown(label: 'Devise d\'affichage', value: _devise, options: const ['FCFA', 'EUR', 'USD'], onChanged: (v) => setState(() => _devise = v)),
              Padding(
                padding: const EdgeInsets.all(16),
                child: ThemeSelector(value: prefs.themeMode, onChanged: (mode) => prefsProvider.update(prefs.copyWith(themeMode: mode))),
              ),
              _SettingsDropdown(
                label: 'Taille du texte',
                value: switch (prefs.textScale) {
                  'compact' => 'Compact',
                  'large' => 'Grand',
                  _ => 'Normal',
                },
                options: const ['Compact', 'Normal', 'Grand'],
                onChanged: (v) => prefsProvider.update(prefs.copyWith(
                  textScale: switch (v) {
                    'Compact' => 'compact',
                    'Grand' => 'large',
                    _ => 'normal',
                  },
                )),
              ),
              _SettingsDropdown(
                label: 'Densité',
                value: prefs.density == 'compact' ? 'Compacte' : 'Confortable',
                options: const ['Compacte', 'Confortable'],
                onChanged: (v) => prefsProvider.update(prefs.copyWith(
                  density: v == 'Compacte' ? 'compact' : 'confortable',
                )),
              ),
              SwitchListTile(
                title: const Text('Réduire les animations', style: TextStyle(fontWeight: FontWeight.w700, fontSize: 14)),
                subtitle: const Text('Interface plus calme', style: TextStyle(fontSize: 12)),
                value: prefs.reduceMotion,
                onChanged: (v) => prefsProvider.update(prefs.copyWith(reduceMotion: v)),
              ),
            ],
          ),
          SettingsSection(
            title: 'Mon flux',
            children: [
              SettingsTile(icon: Icons.auto_awesome_outlined, title: 'Mes préférences d\'affichage', subtitle: '${prefs.domains.length} univers', onTap: () => context.push('/client/preferences')),
              SettingsTile(icon: Icons.grid_view_outlined, title: 'Mes rayons suivis', subtitle: '${prefs.subcategories.length}', onTap: () => context.push('/client/preferences')),
              SettingsTile(icon: Icons.favorite_border, title: 'Mes favoris', subtitle: '${favorites.count}', onTap: () => context.push('/client/favoris')),
              SettingsTile(icon: Icons.savings_outlined, title: 'Mes gains & économies', onTap: () => context.go('/client/gains')),
              SettingsTile(
                icon: Icons.refresh,
                title: 'Refaire le questionnaire d\'accueil',
                onTap: () async {
                  await prefsProvider.update(prefs.copyWith(onboardingDone: false));
                  if (context.mounted) context.go('/onboarding');
                },
                showDivider: false,
              ),
            ],
          ),
          SettingsSection(
            title: 'Notifications',
            children: [
              SwitchListTile(title: const Text('Notifications push', style: TextStyle(fontWeight: FontWeight.w700, fontSize: 14)), subtitle: const Text('Confirmation de scan, promotions des boutiques suivies', style: TextStyle(fontSize: 12)), value: _notifPush, onChanged: (v) => setState(() => _notifPush = v)),
              const Divider(height: 1, indent: 16),
              SwitchListTile(title: const Text('E-mails', style: TextStyle(fontWeight: FontWeight.w700, fontSize: 14)), subtitle: const Text('Reçus de commande et récapitulatifs', style: TextStyle(fontSize: 12)), value: _notifEmail, onChanged: (v) => setState(() => _notifEmail = v)),
              const Divider(height: 1, indent: 16),
              SwitchListTile(title: const Text('SMS', style: TextStyle(fontWeight: FontWeight.w700, fontSize: 14)), subtitle: const Text('Alerte quand un code QR arrive à expiration', style: TextStyle(fontSize: 12)), value: _notifSms, onChanged: (v) => setState(() => _notifSms = v)),
            ],
          ),
          SettingsSection(
            title: 'Paiement & codes QR',
            children: [
              _SettingsDropdown(label: 'Durée de validité du QR', value: _qrExpiry, options: const ['15 min', '30 min', '60 min', '120 min'], onChanged: (v) => setState(() => _qrExpiry = v)),
              SettingsTile(icon: Icons.description_outlined, title: 'Codes enregistrés', subtitle: '${orders.orders.length}'),
              SettingsTile(icon: Icons.notifications_outlined, title: 'Articles en favoris', subtitle: '${favorites.count}', showDivider: false),
            ],
          ),
          SettingsSection(
            title: 'Confidentialité & sécurité',
            children: [
              SwitchListTile(title: const Text('Géolocalisation', style: TextStyle(fontWeight: FontWeight.w700, fontSize: 14)), subtitle: const Text('Classer les boutiques par distance', style: TextStyle(fontSize: 12)), value: _geoloc, onChanged: (v) => setState(() => _geoloc = v)),
              const Divider(height: 1, indent: 16),
              SwitchListTile(title: const Text('Déverrouillage biométrique', style: TextStyle(fontWeight: FontWeight.w700, fontSize: 14)), subtitle: const Text('Empreinte requise pour afficher un code QR', style: TextStyle(fontSize: 12)), value: _biometrie, onChanged: (v) => setState(() => _biometrie = v)),
              const Divider(height: 1, indent: 16),
              SwitchListTile(title: const Text('Partage de statistiques anonymes', style: TextStyle(fontWeight: FontWeight.w700, fontSize: 14)), subtitle: const Text('Aide les boutiques à améliorer leur catalogue', style: TextStyle(fontSize: 12)), value: _partageStats, onChanged: (v) => setState(() => _partageStats = v)),
              SettingsTile(icon: Icons.shield_outlined, title: 'Politique de confidentialité', onTap: () => ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Document disponible dans la version publiée.'))), showDivider: false),
            ],
          ),
          SettingsSection(
            title: 'Données',
            children: [
              SettingsTile(
                icon: Icons.download_outlined,
                title: 'Exporter mes tickets (JSON)',
                onTap: () async {
                  final list = orders.orders
                      .where((o) => o.status == 'redeemed' || o.status == 'confirmed' || o.status == 'rated')
                      .map((o) => {
                            'id': o.id,
                            'reference': o.reference,
                            'storeId': o.storeId,
                            'total': o.total,
                            'status': o.status,
                            'createdAt': o.createdAt?.toIso8601String(),
                          })
                      .toList();
                  await Clipboard.setData(ClipboardData(text: const JsonEncoder.withIndent('  ').convert(list)));
                  if (context.mounted) {
                    ScaffoldMessenger.of(context).showSnackBar(
                      SnackBar(content: Text('${list.length} ticket(s) copiés (JSON)')),
                    );
                  }
                },
              ),
              SettingsTile(
                icon: Icons.delete_outline,
                title: 'Vider le panier',
                onTap: () async {
                  await context.read<CartProvider>().clear();
                  if (context.mounted) {
                    ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Panier vidé.')));
                  }
                },
              ),
              SettingsTile(
                icon: Icons.restart_alt,
                title: 'Réinitialiser l\'application',
                onTap: () async {
                  final ok = await showDialog<bool>(
                    context: context,
                    builder: (ctx) => AlertDialog(
                      title: const Text('Réinitialiser ?'),
                      content: const Text('Efface préférences locales, favoris et session démo. Les commandes déjà en mémoire seront rechargées.'),
                      actions: [
                        TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Annuler')),
                        FilledButton(onPressed: () => Navigator.pop(ctx, true), child: const Text('Réinitialiser')),
                      ],
                    ),
                  );
                  if (ok != true || !mounted) return;
                  final cart = context.read<CartProvider>();
                  await prefsProvider.update(const UserPreferences());
                  await favorites.clear();
                  await cart.clear();
                  await orders.loadOrders();
                  if (!mounted) return;
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(content: Text('Application réinitialisée')),
                  );
                  context.go('/onboarding');
                },
                showDivider: false,
              ),
            ],
          ),
          SettingsSection(
            title: 'Aide',
            children: [
              SettingsTile(icon: Icons.help_outline, title: 'Centre d\'aide', onTap: () => ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Assistance disponible 7j/7 de 8h à 20h.')))),
              SettingsTile(icon: Icons.support_agent_outlined, title: 'Contacter le support', onTap: () => ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('support@boutik.app')))),
              const SettingsTile(icon: Icons.location_on_outlined, title: 'Zone de service', subtitle: 'Douala'),
              const SettingsTile(icon: Icons.fingerprint_outlined, title: 'Version', subtitle: '1.4.0 (build 218)', showDivider: false),
            ],
          ),
        ],
      ),
    );
  }
}

class _SettingsDropdown extends StatelessWidget {
  const _SettingsDropdown({required this.label, required this.value, required this.options, required this.onChanged});

  final String label;
  final String value;
  final List<String> options;
  final ValueChanged<String> onChanged;

  @override
  Widget build(BuildContext context) {
    return ListTile(
      title: Text(label, style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 14)),
      trailing: DropdownButton<String>(
        value: value,
        underline: const SizedBox.shrink(),
        items: options.map((o) => DropdownMenuItem(value: o, child: Text(o))).toList(),
        onChanged: (v) {
          if (v != null) onChanged(v);
        },
      ),
    );
  }
}
