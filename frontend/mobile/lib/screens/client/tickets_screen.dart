import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

import '../../core/theme/app_theme.dart';
import '../../core/utils/formatters.dart';
import '../../data/models/order.dart';
import '../../providers/auth_provider.dart';
import '../../providers/catalog_provider.dart';
import '../../providers/orders_provider.dart';
import '../../widgets/common_widgets.dart';
import '../../widgets/stat_card.dart';
import '../../widgets/top_bar.dart';

class TicketsScreen extends StatefulWidget {
  const TicketsScreen({super.key});

  @override
  State<TicketsScreen> createState() => _TicketsScreenState();
}

class _TicketsScreenState extends State<TicketsScreen> {
  final _searchController = TextEditingController();
  String? _expandedId;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<OrdersProvider>().loadOrders();
    });
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  List<OrderModel> _confirmed(OrdersProvider orders) {
    return orders.orders.where((o) => o.status == 'redeemed' || o.status == 'confirmed').toList()
      ..sort((a, b) => (b.redeemedAt ?? b.createdAt ?? DateTime.now())
          .compareTo(a.redeemedAt ?? a.createdAt ?? DateTime.now()));
  }

  @override
  Widget build(BuildContext context) {
    final orders = context.watch<OrdersProvider>();
    final catalog = context.watch<CatalogProvider>();
    final auth = context.watch<AuthProvider>();
    final query = _searchController.text.trim().toLowerCase();
    final confirmed = _confirmed(orders);
    final filtered = query.isEmpty
        ? confirmed
        : confirmed.where((o) {
            final store = catalog.storeById(o.storeId);
            return o.reference.toLowerCase().contains(query) ||
                (store?.name.toLowerCase().contains(query) ?? false) ||
                o.items.any((i) => i.name.toLowerCase().contains(query));
          }).toList();
    final totalDepense = confirmed.fold<double>(0, (s, o) => s + o.total);
    final totalEconomie = confirmed.fold<double>(0, (s, o) => s + o.discount);

    return Scaffold(
      backgroundColor: AppTheme.contentBackground(context),
      appBar: TopBar(
        title: 'Tickets de caisse',
        subtitle: '${confirmed.length} reçu${confirmed.length > 1 ? 's' : ''} conservé${confirmed.length > 1 ? 's' : ''}',
        action: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            IconButton(
              tooltip: 'Exporter JSON',
              onPressed: confirmed.isEmpty
                  ? null
                  : () async {
                      final payload = confirmed
                          .map((o) => {
                                'id': o.id,
                                'reference': o.reference,
                                'storeId': o.storeId,
                                'total': o.total,
                                'discount': o.discount,
                                'status': o.status,
                                'createdAt': o.createdAt?.toIso8601String(),
                                'redeemedAt': o.redeemedAt?.toIso8601String(),
                                'items': o.items
                                    .map((i) => {
                                          'name': i.name,
                                          'qty': i.quantity,
                                          'price': i.price,
                                        })
                                    .toList(),
                              })
                          .toList();
                      await Clipboard.setData(
                        ClipboardData(text: const JsonEncoder.withIndent('  ').convert(payload)),
                      );
                      if (context.mounted) {
                        ScaffoldMessenger.of(context).showSnackBar(
                          SnackBar(content: Text('${payload.length} ticket(s) exportés (JSON)')),
                        );
                      }
                    },
              icon: const Icon(Icons.download_outlined),
            ),
            Container(
          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
          decoration: BoxDecoration(
            color: auth.isAuthenticated ? AppTheme.emerald600.withValues(alpha: 0.12) : AppTheme.ink100,
            borderRadius: BorderRadius.circular(999),
          ),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(
                auth.isAuthenticated ? Icons.cloud_done_outlined : Icons.cloud_off_outlined,
                size: 11,
                color: auth.isAuthenticated ? AppTheme.emerald600 : AppTheme.ink500,
              ),
              const SizedBox(width: 4),
              Text(
                auth.isAuthenticated ? 'Sync' : 'Local',
                style: TextStyle(
                  fontSize: 11,
                  fontWeight: FontWeight.w700,
                  color: auth.isAuthenticated ? AppTheme.emerald600 : AppTheme.ink500,
                ),
              ),
            ],
          ),
        ),
          ],
        ),
      ),
      body: orders.loading
          ? const LoadingView(message: 'Chargement des tickets…')
          : ListView(
              padding: const EdgeInsets.all(16),
              children: [
                if (!auth.isAuthenticated)
                  Container(
                    margin: const EdgeInsets.only(bottom: 16),
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: AppTheme.ink900,
                      borderRadius: BorderRadius.circular(16),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text(
                          'Vos reçus ne sont conservés que sur cet appareil.',
                          style: TextStyle(color: Colors.white, fontWeight: FontWeight.w700, fontSize: 13),
                        ),
                        const SizedBox(height: 4),
                        const Text(
                          'Connectez votre compte Gmail pour les sauvegarder, les retrouver ailleurs et les recevoir automatiquement par e-mail.',
                          style: TextStyle(color: AppTheme.ink300, fontSize: 12, height: 1.45),
                        ),
                        const SizedBox(height: 12),
                        FilledButton(
                          onPressed: () => context.push('/client/compte'),
                          style: FilledButton.styleFrom(
                            backgroundColor: AppTheme.ink900,
                            foregroundColor: Colors.white,
                            side: const BorderSide(color: AppTheme.ink700),
                          ),
                          child: const Text('Connecter mon compte Google'),
                        ),
                      ],
                    ),
                  ),
                GridView.count(
                  crossAxisCount: 2,
                  shrinkWrap: true,
                  physics: const NeverScrollableScrollPhysics(),
                  crossAxisSpacing: 12,
                  mainAxisSpacing: 12,
                  childAspectRatio: 1.45,
                  children: [
                    StatCard(label: 'Total dépensé', value: formatPrix(totalDepense), icon: Icons.payments_outlined, tone: StatTone.info),
                    StatCard(label: 'Économies cumulées', value: formatPrix(totalEconomie), icon: Icons.savings_outlined, tone: StatTone.success),
                  ],
                ),
                const SizedBox(height: 16),
                TextField(
                  controller: _searchController,
                  onChanged: (_) => setState(() {}),
                  decoration: InputDecoration(
                    hintText: 'Rechercher un reçu, une boutique, un article',
                    prefixIcon: const Icon(Icons.search, size: 18),
                    filled: true,
                    fillColor: Colors.white,
                    border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide.none),
                  ),
                ),
                const SizedBox(height: 16),
                if (filtered.isEmpty)
                  EmptyState(
                    icon: Icons.receipt_long_outlined,
                    title: 'Aucun ticket de caisse',
                    subtitle: 'Dès qu\'un vendeur scanne l\'un de vos codes QR, le reçu détaillé apparaît ici.',
                    action: OutlinedButton(
                      onPressed: () => context.go('/client'),
                      child: const Text('Explorer le catalogue'),
                    ),
                  )
                else
                  ...filtered.map((order) {
                    final store = catalog.storeById(order.storeId);
                    final expanded = _expandedId == order.id;
                    final date = order.redeemedAt ?? order.createdAt ?? DateTime.now();
                    return Container(
                      margin: const EdgeInsets.only(bottom: 10),
                      decoration: AppTheme.cardDecoration(context),
                      clipBehavior: Clip.antiAlias,
                      child: Column(
                        children: [
                          InkWell(
                            onTap: () => setState(() => _expandedId = expanded ? null : order.id),
                            child: Padding(
                              padding: const EdgeInsets.all(14),
                              child: Row(
                                children: [
                                  Container(
                                    width: 44,
                                    height: 44,
                                    decoration: BoxDecoration(
                                      color: AppTheme.ink100,
                                      borderRadius: BorderRadius.circular(12),
                                    ),
                                    child: const Icon(Icons.receipt_long_outlined, size: 19, color: AppTheme.ink600),
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
                                          '${formatDate(date)} · ${formatHeure(date)} · ${order.items.length} article${order.items.length > 1 ? 's' : ''}',
                                          style: const TextStyle(fontSize: 11, color: AppTheme.ink400),
                                        ),
                                      ],
                                    ),
                                  ),
                                  Column(
                                    crossAxisAlignment: CrossAxisAlignment.end,
                                    children: [
                                      Text(formatPrix(order.total), style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 14)),
                                      if (order.discount > 0)
                                        Text(
                                          '−${formatPrix(order.discount)}',
                                          style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w700, color: AppTheme.emerald600),
                                        ),
                                    ],
                                  ),
                                ],
                              ),
                            ),
                          ),
                          if (expanded) ...[
                            const Divider(height: 1),
                            Padding(
                              padding: const EdgeInsets.all(14),
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    order.reference,
                                    style: const TextStyle(fontFamily: 'monospace', fontSize: 11, fontWeight: FontWeight.w700, color: AppTheme.ink500),
                                  ),
                                  const SizedBox(height: 8),
                                  ...order.items.map(
                                    (item) => Padding(
                                      padding: const EdgeInsets.symmetric(vertical: 2),
                                      child: Row(
                                        children: [
                                          Expanded(
                                            child: Text(
                                              '${item.quantity} × ${item.name}',
                                              style: const TextStyle(fontSize: 12, color: AppTheme.ink600),
                                            ),
                                          ),
                                          Text(formatPrix(item.lineTotal), style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600)),
                                        ],
                                      ),
                                    ),
                                  ),
                                  const Divider(height: 16),
                                  _TicketLine(label: 'Sous-total', value: formatPrix(order.subtotal)),
                                  _TicketLine(
                                    label: 'Livraison',
                                    value: order.fulfillmentMode == 'delivery' ? formatPrix(order.total - order.subtotal) : 'Gratuit',
                                  ),
                                  _TicketLine(label: 'Total payé', value: formatPrix(order.total), bold: true),
                                  const SizedBox(height: 8),
                                  Text(
                                    '${order.paymentMethod ?? '—'} · ${modeRetrait(order.fulfillmentMode)}',
                                    style: const TextStyle(fontSize: 11, color: AppTheme.ink400),
                                  ),
                                  const SizedBox(height: 12),
                                  Row(
                                    children: [
                                      OutlinedButton.icon(
                                        onPressed: () {
                                          ScaffoldMessenger.of(context).showSnackBar(
                                            SnackBar(
                                              content: Text(
                                                auth.isAuthenticated
                                                    ? 'Reçu envoyé à ${auth.user!.email}'
                                                    : 'Connectez un compte Google pour recevoir vos reçus par e-mail.',
                                              ),
                                            ),
                                          );
                                        },
                                        icon: const Icon(Icons.mail_outline, size: 14),
                                        label: const Text('Envoyer par e-mail'),
                                      ),
                                      const SizedBox(width: 8),
                                      TextButton.icon(
                                        onPressed: () {
                                          ScaffoldMessenger.of(context).showSnackBar(
                                            const SnackBar(content: Text('Reçu PDF téléchargé.')),
                                          );
                                        },
                                        icon: const Icon(Icons.download_outlined, size: 14),
                                        label: const Text('PDF'),
                                      ),
                                    ],
                                  ),
                                ],
                              ),
                            ),
                          ],
                        ],
                      ),
                    );
                  }),
              ],
            ),
    );
  }
}

class _TicketLine extends StatelessWidget {
  const _TicketLine({required this.label, required this.value, this.bold = false});

  final String label;
  final String value;
  final bool bold;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 2),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label, style: TextStyle(fontSize: bold ? 13 : 12, color: bold ? AppTheme.ink900 : AppTheme.ink500, fontWeight: bold ? FontWeight.w800 : FontWeight.normal)),
          Text(value, style: TextStyle(fontSize: bold ? 13 : 12, fontWeight: bold ? FontWeight.w800 : FontWeight.w600, color: AppTheme.ink800)),
        ],
      ),
    );
  }
}
