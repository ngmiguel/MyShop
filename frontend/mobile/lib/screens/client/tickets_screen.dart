import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../core/theme/app_theme.dart';
import '../../core/utils/formatters.dart';
import '../../providers/catalog_provider.dart';
import '../../providers/orders_provider.dart';
import '../../widgets/app_layout.dart';
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

  @override
  Widget build(BuildContext context) {
    final orders = context.watch<OrdersProvider>();
    final catalog = context.watch<CatalogProvider>();
    final query = _searchController.text.trim().toLowerCase();
    final confirmed = orders.orders.where((o) => o.status == 'redeemed' || o.status == 'confirmed').toList();
    final filtered = query.isEmpty
        ? confirmed
        : confirmed.where((o) {
            final store = catalog.storeById(o.storeId);
            return o.reference.toLowerCase().contains(query) ||
                (store?.name.toLowerCase().contains(query) ?? false);
          }).toList();
    final total = confirmed.fold<double>(0, (s, o) => s + o.total);

    return Scaffold(
      backgroundColor: AppTheme.contentBackground(context),
      appBar: const TopBar(title: 'Tickets de caisse', subtitle: 'Historique confirme'),
      body: orders.loading
          ? const LoadingView()
          : ListView(
              padding: const EdgeInsets.all(16),
              children: [
                GridView.count(
                  crossAxisCount: 2,
                  shrinkWrap: true,
                  physics: const NeverScrollableScrollPhysics(),
                  crossAxisSpacing: 12,
                  mainAxisSpacing: 12,
                  childAspectRatio: 1.5,
                  children: [
                    StatCard(label: 'Tickets', value: '${confirmed.length}', icon: Icons.receipt_outlined),
                    StatCard(label: 'Total depense', value: formatPrix(total), icon: Icons.payments_outlined),
                  ],
                ),
                const SizedBox(height: 16),
                TextField(
                  controller: _searchController,
                  decoration: const InputDecoration(
                    hintText: 'Rechercher un ticket...',
                    prefixIcon: Icon(Icons.search),
                  ),
                  onChanged: (_) => setState(() {}),
                ),
                const SizedBox(height: 16),
                if (filtered.isEmpty)
                  const EmptyState(
                    icon: Icons.receipt_long_outlined,
                    title: 'Aucun ticket',
                    subtitle: 'Vos tickets confirmes apparaitront ici.',
                  )
                else
                  ...filtered.map((order) {
                    final store = catalog.storeById(order.storeId);
                    final expanded = _expandedId == order.id;
                    return Container(
                      margin: const EdgeInsets.only(bottom: 8),
                      decoration: AppTheme.cardDecoration(context),
                      child: Column(
                        children: [
                          ListTile(
                            leading: const Icon(Icons.receipt_outlined),
                            title: Text(order.reference, style: const TextStyle(fontWeight: FontWeight.w800)),
                            subtitle: Text('${store?.name ?? 'Boutique'} - ${formatDate(order.redeemedAt ?? order.createdAt ?? DateTime.now())}'),
                            trailing: Text(formatPrix(order.total), style: const TextStyle(fontWeight: FontWeight.w800)),
                            onTap: () => setState(() => _expandedId = expanded ? null : order.id),
                          ),
                          if (expanded)
                            Padding(
                              padding: const EdgeInsets.fromLTRB(16, 0, 16, 16),
                              child: Column(
                                children: order.items
                                    .map(
                                      (item) => Row(
                                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                        children: [
                                          Expanded(child: Text('${item.quantity} x ${item.name}')),
                                          Text(formatPrix(item.lineTotal)),
                                        ],
                                      ),
                                    )
                                    .toList(),
                              ),
                            ),
                        ],
                      ),
                    );
                  }),
              ],
            ),
    );
  }
}
