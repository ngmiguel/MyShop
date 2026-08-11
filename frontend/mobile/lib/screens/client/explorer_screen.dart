import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

import '../../core/theme/app_theme.dart';
import '../../providers/cart_provider.dart';
import '../../providers/catalog_provider.dart';
import '../../providers/preferences_provider.dart';
import '../../widgets/common_widgets.dart';
import '../../widgets/product_card.dart';
import '../../widgets/store_card.dart';

class ExplorerScreen extends StatefulWidget {
  const ExplorerScreen({super.key});

  @override
  State<ExplorerScreen> createState() => _ExplorerScreenState();
}

class _ExplorerScreenState extends State<ExplorerScreen> {
  final _searchController = TextEditingController();

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) => _load());
  }

  Future<void> _load() async {
    final prefs = context.read<PreferencesProvider>().preferences;
    await context.read<CatalogProvider>().loadFeed(city: prefs.city);
    await context.read<CartProvider>().loadCart();
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final catalog = context.watch<CatalogProvider>();
    final prefs = context.watch<PreferencesProvider>().preferences;

    return RefreshIndicator(
      onRefresh: _load,
      child: CustomScrollView(
        slivers: [
          SliverAppBar(
            floating: true,
            title: const Text('Explorer'),
            actions: [
              IconButton(
                icon: const Icon(Icons.login_outlined),
                onPressed: () => context.go('/auth'),
              ),
            ],
            bottom: PreferredSize(
              preferredSize: const Size.fromHeight(72),
              child: Padding(
                padding: const EdgeInsets.fromLTRB(16, 0, 16, 12),
                child: SearchBar(
                  controller: _searchController,
                  hintText: 'Rechercher un article ou une boutique...',
                  leading: const Icon(Icons.search),
                  trailing: [
                    IconButton(
                      icon: const Icon(Icons.tune),
                      onPressed: () {},
                    ),
                  ],
                  onSubmitted: (q) {
                    catalog.loadFeed(city: prefs.city, search: q);
                  },
                ),
              ),
            ),
          ),
          if (catalog.loading)
            const SliverFillRemaining(child: LoadingView(message: 'Chargement du catalogue...'))
          else if (catalog.error != null)
            SliverFillRemaining(
              child: EmptyState(
                icon: Icons.cloud_off_outlined,
                title: 'Impossible de charger le catalogue',
                subtitle: catalog.error,
                action: ElevatedButton(onPressed: _load, child: const Text('Reessayer')),
              ),
            )
          else ...[
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: 16),
                child: Row(
                  children: [
                    const Icon(Icons.location_on_outlined, size: 16, color: AppTheme.ink700),
                    const SizedBox(width: 4),
                    Text('${prefs.city} - ${prefs.radiusKm} km'),
                    const Spacer(),
                    const Icon(Icons.auto_awesome_outlined, size: 16, color: AppTheme.accent500),
                    const SizedBox(width: 4),
                    const Text('Pour vous'),
                  ],
                ),
              ),
            ),
            if (catalog.stores.isNotEmpty) ...[
              const SliverToBoxAdapter(child: SectionHeader(title: 'Boutiques')),
              SliverList(
                delegate: SliverChildBuilderDelegate(
                  (context, index) => Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
                    child: StoreCard(store: catalog.stores[index]),
                  ),
                  childCount: catalog.stores.length.clamp(0, 5),
                ),
              ),
            ],
            const SliverToBoxAdapter(child: SectionHeader(title: 'Articles')),
            SliverPadding(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              sliver: SliverGrid(
                gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                  crossAxisCount: 2,
                  crossAxisSpacing: 12,
                  mainAxisSpacing: 12,
                  childAspectRatio: 0.62,
                ),
                delegate: SliverChildBuilderDelegate(
                  (context, index) {
                    final product = catalog.products[index];
                    return ProductCard(
                      product: product,
                      onAdd: () => context.read<CartProvider>().addProduct(product),
                    );
                  },
                  childCount: catalog.products.length,
                ),
              ),
            ),
            const SliverToBoxAdapter(child: SizedBox(height: 24)),
          ],
        ],
      ),
    );
  }
}
