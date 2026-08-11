import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../core/theme/app_theme.dart';
import '../../core/utils/formatters.dart';
import '../../data/models/order.dart';
import '../../data/services/order_service.dart';
import '../../providers/auth_provider.dart';
import '../../providers/catalog_provider.dart';
import '../../providers/orders_provider.dart';
import '../../widgets/common_widgets.dart';
import '../../widgets/store_card.dart';

class ManagerDashboardScreen extends StatefulWidget {
  const ManagerDashboardScreen({super.key});

  @override
  State<ManagerDashboardScreen> createState() => _ManagerDashboardScreenState();
}

class _ManagerDashboardScreenState extends State<ManagerDashboardScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) async {
      await context.read<CatalogProvider>().loadFeed();
      await context.read<OrdersProvider>().loadOrders();
    });
  }

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();
    final catalog = context.watch<CatalogProvider>();
    final orders = context.watch<OrdersProvider>();

    final redeemed = orders.orders.where((o) => o.status == 'redeemed').toList();
    final ca = redeemed.fold<double>(0, (sum, o) => sum + o.total);
    final pending = orders.pendingOrders.length;
    final lowStock = catalog.products.where((p) => p.stock <= 5).length;

    return Scaffold(
      body: CustomScrollView(
        slivers: [
          SliverAppBar(
            expandedHeight: 160,
            pinned: true,
            backgroundColor: AppTheme.ink900,
            flexibleSpace: FlexibleSpaceBar(
              background: Container(
                color: AppTheme.ink900,
                padding: const EdgeInsets.fromLTRB(16, 56, 16, 16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text(
                      'BUSINESS INTELLIGENCE',
                      style: TextStyle(color: AppTheme.accent400, fontSize: 11, fontWeight: FontWeight.bold),
                    ),
                    Text(
                      auth.user?.displayName ?? 'Pilotage',
                      style: const TextStyle(color: Colors.white, fontSize: 22, fontWeight: FontWeight.w800),
                    ),
                    Text(
                      '${catalog.stores.length} boutiques - panier moyen ${formatPrix(redeemed.isEmpty ? 0 : ca / redeemed.length)}',
                      style: const TextStyle(color: Colors.white70),
                    ),
                  ],
                ),
              ),
            ),
          ),
          SliverPadding(
            padding: const EdgeInsets.all(16),
            sliver: SliverGrid(
              gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                crossAxisCount: 2,
                crossAxisSpacing: 12,
                mainAxisSpacing: 12,
                childAspectRatio: 1.4,
              ),
              delegate: SliverChildListDelegate([
                _KpiCard(icon: Icons.payments_outlined, label: 'CA confirme', value: formatPrix(ca)),
                _KpiCard(icon: Icons.shopping_cart_outlined, label: 'Commandes', value: '${orders.orders.length}'),
                _KpiCard(icon: Icons.pending_actions_outlined, label: 'En attente', value: '$pending'),
                _KpiCard(icon: Icons.warning_amber_outlined, label: 'Stock critique', value: '$lowStock'),
              ]),
            ),
          ),
          const SliverToBoxAdapter(child: SectionHeader(title: 'Top boutiques')),
          SliverList(
            delegate: SliverChildBuilderDelegate(
              (context, index) {
                final store = catalog.stores[index];
                final storeOrders = orders.orders.where((o) => o.storeId == store.id && o.status == 'redeemed');
                final storeCa = storeOrders.fold<double>(0, (s, o) => s + o.total);
                return ListTile(
                  leading: const Icon(Icons.store_outlined),
                  title: Text(store.name),
                  trailing: Text(formatPrix(storeCa)),
                );
              },
              childCount: catalog.stores.length.clamp(0, 5),
            ),
          ),
        ],
      ),
    );
  }
}

class _KpiCard extends StatelessWidget {
  const _KpiCard({required this.icon, required this.label, required this.value});

  final IconData icon;
  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Icon(icon, color: AppTheme.accent500),
            const Spacer(),
            Text(label, style: const TextStyle(color: AppTheme.ink700, fontSize: 12)),
            Text(value, style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 18)),
          ],
        ),
      ),
    );
  }
}

class ManagerStoresScreen extends StatefulWidget {
  const ManagerStoresScreen({super.key});

  @override
  State<ManagerStoresScreen> createState() => _ManagerStoresScreenState();
}

class _ManagerStoresScreenState extends State<ManagerStoresScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<CatalogProvider>().loadFeed();
    });
  }

  @override
  Widget build(BuildContext context) {
    final catalog = context.watch<CatalogProvider>();

    return Scaffold(
      appBar: AppBar(
        title: const Text('Boutiques'),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: () => context.read<CatalogProvider>().loadFeed(),
          ),
        ],
      ),
      body: catalog.loading
          ? const LoadingView()
          : catalog.stores.isEmpty
              ? const EmptyState(icon: Icons.store_outlined, title: 'Aucune boutique')
              : ListView.separated(
                  padding: const EdgeInsets.all(16),
                  itemCount: catalog.stores.length,
                  separatorBuilder: (_, __) => const SizedBox(height: 8),
                  itemBuilder: (context, index) => StoreCard(store: catalog.stores[index]),
                ),
      floatingActionButton: FloatingActionButton(
        onPressed: () {},
        child: const Icon(Icons.add),
      ),
    );
  }
}

class ManagerProfitScreen extends StatelessWidget {
  const ManagerProfitScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final orders = context.watch<OrdersProvider>();
    final redeemed = orders.orders.where((o) => o.status == 'redeemed').toList();
    final total = redeemed.fold<double>(0, (s, o) => s + o.total);

    return Scaffold(
      appBar: AppBar(title: const Text('Profit')),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          Card(
            child: ListTile(
              leading: const Icon(Icons.account_balance_wallet_outlined),
              title: const Text('Chiffre d\'affaires confirme'),
              trailing: Text(formatPrix(total), style: const TextStyle(fontWeight: FontWeight.w800)),
            ),
          ),
          const SizedBox(height: 12),
          const SectionHeader(title: 'Commandes encaissees'),
          ...redeemed.map(
            (order) => Card(
              child: ListTile(
                title: Text(order.reference),
                subtitle: Text(formatDate(order.redeemedAt ?? order.createdAt ?? DateTime.now())),
                trailing: Text(formatPrix(order.total)),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class ManagerTeamScreen extends StatefulWidget {
  const ManagerTeamScreen({super.key});

  @override
  State<ManagerTeamScreen> createState() => _ManagerTeamScreenState();
}

class _ManagerTeamScreenState extends State<ManagerTeamScreen> {
  List<SellerModel> _sellers = [];
  bool _loading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      _sellers = await context.read<SellerApiService>().getSellers();
    } catch (e) {
      _error = e.toString();
    }
    if (mounted) setState(() => _loading = false);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Equipe'),
        actions: [IconButton(icon: const Icon(Icons.refresh), onPressed: _load)],
      ),
      body: _loading
          ? const LoadingView()
          : _error != null
              ? EmptyState(icon: Icons.error_outline, title: 'Erreur', subtitle: _error)
              : _sellers.isEmpty
                  ? const EmptyState(icon: Icons.groups_outlined, title: 'Aucun vendeur')
                  : ListView.separated(
                      padding: const EdgeInsets.all(16),
                      itemCount: _sellers.length,
                      separatorBuilder: (_, __) => const SizedBox(height: 8),
                      itemBuilder: (context, index) {
                        final seller = _sellers[index];
                        return Card(
                          child: ListTile(
                            leading: const Icon(Icons.person_outline),
                            title: Text(seller.displayName),
                            subtitle: Text(seller.status),
                            trailing: seller.status == 'pending'
                                ? IconButton(
                                    icon: const Icon(Icons.check),
                                    onPressed: () async {
                                      await context.read<SellerApiService>().approveSeller(seller.id);
                                      _load();
                                    },
                                  )
                                : null,
                          ),
                        );
                      },
                    ),
    );
  }
}

class ManagerSettingsScreen extends StatelessWidget {
  const ManagerSettingsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();

    return Scaffold(
      appBar: AppBar(title: const Text('Reglages')),
      body: ListView(
        children: [
          if (auth.user != null)
            ListTile(
              leading: CircleAvatar(child: Text(auth.user!.initials)),
              title: Text(auth.user!.displayName),
              subtitle: Text(auth.user!.email),
            ),
          ListTile(
            leading: const Icon(Icons.logout),
            title: const Text('Se deconnecter'),
            onTap: () => auth.logout(),
          ),
        ],
      ),
    );
  }
}
