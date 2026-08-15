import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

import '../../core/theme/app_theme.dart';
import '../../core/utils/formatters.dart';
import '../../providers/cart_provider.dart';
import '../../providers/catalog_provider.dart';
import '../../providers/favorites_provider.dart';
import '../../widgets/common_widgets.dart';
import '../../widgets/product_card.dart';
import '../../widgets/top_bar.dart';

class ProductDetailScreen extends StatefulWidget {
  const ProductDetailScreen({super.key, required this.productId});

  final String productId;

  @override
  State<ProductDetailScreen> createState() => _ProductDetailScreenState();
}

class _ProductDetailScreenState extends State<ProductDetailScreen> {
  int _quantity = 1;

  @override
  Widget build(BuildContext context) {
    return FutureBuilder(
      future: context.read<CatalogProvider>().getProduct(widget.productId),
      builder: (context, snapshot) {
        if (snapshot.connectionState != ConnectionState.done) {
          return const Scaffold(body: LoadingView());
        }
        final product = snapshot.data;
        if (product == null) {
          return Scaffold(
            appBar: const TopBar(title: 'Article'),
            body: const EmptyState(icon: Icons.error_outline, title: 'Article introuvable'),
          );
        }

        final store = context.watch<CatalogProvider>().storeById(product.storeId);
        final favorites = context.watch<FavoritesProvider>();
        final isFavorite = favorites.isFavorite(product.id);
        final similar = context.watch<CatalogProvider>().products.where((p) => p.storeId == product.storeId && p.id != product.id).take(4).toList();

        return Scaffold(
          backgroundColor: AppTheme.contentBackground(context),
          appBar: TopBar(title: product.name),
          body: ListView(
            padding: const EdgeInsets.fromLTRB(16, 0, 16, 120),
            children: [
              Stack(
                children: [
                  ClipRRect(
                    borderRadius: BorderRadius.circular(16),
                    child: AspectRatio(
                      aspectRatio: 1,
                      child: product.imageUrl != null
                          ? CachedNetworkImage(imageUrl: product.imageUrl!, fit: BoxFit.cover)
                          : Container(color: AppTheme.ink50, child: const Icon(Icons.image_outlined, size: 64)),
                    ),
                  ),
                  Positioned(
                    right: 12,
                    top: 12,
                    child: Material(
                      color: Colors.white.withValues(alpha: 0.9),
                      shape: const CircleBorder(),
                      child: IconButton(
                        icon: Icon(isFavorite ? Icons.favorite : Icons.favorite_border, color: isFavorite ? AppTheme.accent500 : AppTheme.ink500),
                        onPressed: () => favorites.toggle(product.id),
                      ),
                    ),
                  ),
                  if (product.onPromo)
                    Positioned(
                      left: 12,
                      top: 12,
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                        decoration: BoxDecoration(color: AppTheme.accent500, borderRadius: BorderRadius.circular(999)),
                        child: const Text('PROMO', style: TextStyle(color: Colors.white, fontSize: 10, fontWeight: FontWeight.w800)),
                      ),
                    ),
                ],
              ),
              const SizedBox(height: 16),
              Row(
                children: [
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                    decoration: BoxDecoration(
                      color: product.inStock ? const Color(0xFFECFDF5) : const Color(0xFFFEF2F2),
                      borderRadius: BorderRadius.circular(6),
                    ),
                    child: Text(
                      product.inStock ? 'En stock' : 'Rupture',
                      style: TextStyle(fontSize: 11, fontWeight: FontWeight.w700, color: product.inStock ? AppTheme.emerald600 : Colors.red),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 8),
              Text(product.name, style: const TextStyle(fontSize: 22, fontWeight: FontWeight.w800)),
              const SizedBox(height: 4),
              const StarRating(rating: 4.0),
              const SizedBox(height: 12),
              Text(formatPrix(product.displayPrice), style: const TextStyle(fontSize: 24, fontWeight: FontWeight.w800)),
              if (product.onPromo)
                Text(formatPrix(product.compareAtPrice!), style: const TextStyle(decoration: TextDecoration.lineThrough, color: AppTheme.ink300)),
              if (product.description != null) ...[
                const SizedBox(height: 16),
                Text(product.description!, style: const TextStyle(height: 1.5)),
              ],
              const SizedBox(height: 16),
              if (store != null)
                Container(
                  decoration: AppTheme.cardDecoration(context),
                  child: ListTile(
                    leading: const Icon(Icons.store_outlined),
                    title: Text(store.name, style: const TextStyle(fontWeight: FontWeight.w700)),
                    subtitle: Text(store.city),
                    trailing: const Icon(Icons.chevron_right),
                    onTap: () => context.push('/client/boutique/${store.id}'),
                  ),
                ),
              if (similar.isNotEmpty) ...[
                const SectionHeader(title: 'Articles similaires'),
                GridView.builder(
                  shrinkWrap: true,
                  physics: const NeverScrollableScrollPhysics(),
                  gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(crossAxisCount: 2, crossAxisSpacing: 12, mainAxisSpacing: 12, childAspectRatio: 0.58),
                  itemCount: similar.length,
                  itemBuilder: (context, index) => ProductCard(product: similar[index]),
                ),
              ],
            ],
          ),
          bottomNavigationBar: Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: Theme.of(context).cardColor,
              border: Border(top: BorderSide(color: Theme.of(context).dividerColor)),
            ),
            child: SafeArea(
              top: false,
              child: Row(
                children: [
                  IconButton(onPressed: _quantity > 1 ? () => setState(() => _quantity--) : null, icon: const Icon(Icons.remove_circle_outline)),
                  Text('$_quantity', style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 16)),
                  IconButton(onPressed: product.inStock && _quantity < product.stock ? () => setState(() => _quantity++) : null, icon: const Icon(Icons.add_circle_outline)),
                  const SizedBox(width: 8),
                  Expanded(
                    child: ElevatedButton(
                      onPressed: product.inStock
                          ? () async {
                              await context.read<CartProvider>().addProduct(product, quantity: _quantity);
                              if (context.mounted) {
                                ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Article ajoute au panier')));
                              }
                            }
                          : null,
                      child: const Text('Ajouter'),
                    ),
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: FilledButton(
                      onPressed: product.inStock
                          ? () async {
                              await context.read<CartProvider>().addProduct(product, quantity: _quantity);
                              if (context.mounted) context.push('/client/panier');
                            }
                          : null,
                      child: const Text('Acheter'),
                    ),
                  ),
                ],
              ),
            ),
          ),
        );
      },
    );
  }
}

class StoreDetailScreen extends StatefulWidget {
  const StoreDetailScreen({super.key, required this.storeId});

  final String storeId;

  @override
  State<StoreDetailScreen> createState() => _StoreDetailScreenState();
}

class _StoreDetailScreenState extends State<StoreDetailScreen> {
  @override
  Widget build(BuildContext context) {
    final catalog = context.watch<CatalogProvider>();

    return FutureBuilder(
      future: catalog.getStore(widget.storeId),
      builder: (context, snapshot) {
        if (snapshot.connectionState != ConnectionState.done) {
          return const Scaffold(body: LoadingView());
        }
        final store = snapshot.data;
        if (store == null) {
          return Scaffold(appBar: const TopBar(title: 'Boutique'), body: const EmptyState(icon: Icons.store_outlined, title: 'Boutique introuvable'));
        }

        final products = catalog.productsForStore(store.id);

        return Scaffold(
          backgroundColor: AppTheme.contentBackground(context),
          body: CustomScrollView(
            slivers: [
              SliverToBoxAdapter(
                child: Stack(
                  children: [
                    SizedBox(
                      height: 180,
                      width: double.infinity,
                      child: store.coverUrl != null
                          ? CachedNetworkImage(imageUrl: store.coverUrl!, fit: BoxFit.cover)
                          : Container(color: AppTheme.ink800),
                    ),
                    Positioned(
                      left: 0,
                      right: 0,
                      bottom: 0,
                      child: Container(
                        padding: const EdgeInsets.all(16),
                        decoration: BoxDecoration(
                          gradient: LinearGradient(
                            begin: Alignment.bottomCenter,
                            end: Alignment.topCenter,
                            colors: [AppTheme.ink900.withValues(alpha: 0.85), Colors.transparent],
                          ),
                        ),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(store.name, style: const TextStyle(color: Colors.white, fontSize: 22, fontWeight: FontWeight.w800)),
                            if (store.tagline != null) Text(store.tagline!, style: const TextStyle(color: Colors.white70)),
                          ],
                        ),
                      ),
                    ),
                    SafeArea(
                      child: IconButton(
                        icon: const Icon(Icons.arrow_back, color: Colors.white),
                        onPressed: () => context.pop(),
                      ),
                    ),
                  ],
                ),
              ),
              SliverToBoxAdapter(
                child: Padding(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Container(
                        decoration: AppTheme.cardDecoration(context),
                        padding: const EdgeInsets.all(16),
                        child: Column(
                          children: [
                            if (store.address != null) ListTile(dense: true, leading: const Icon(Icons.location_on_outlined), title: Text(store.address!)),
                            ListTile(dense: true, leading: const Icon(Icons.location_city_outlined), title: Text(store.city)),
                            if (store.phone != null) ListTile(dense: true, leading: const Icon(Icons.phone_outlined), title: Text(store.phone!)),
                            Row(
                              children: [
                                if (store.pickup) const Chip(label: Text('Retrait'), visualDensity: VisualDensity.compact),
                                if (store.delivery) const Chip(label: Text('Livraison'), visualDensity: VisualDensity.compact),
                              ],
                            ),
                          ],
                        ),
                      ),
                      if (store.description != null) ...[
                        const SizedBox(height: 12),
                        Text(store.description!),
                      ],
                      const SectionHeader(title: 'Catalogue'),
                    ],
                  ),
                ),
              ),
              SliverPadding(
                padding: const EdgeInsets.symmetric(horizontal: 16),
                sliver: SliverGrid(
                  gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(crossAxisCount: 2, crossAxisSpacing: 12, mainAxisSpacing: 12, childAspectRatio: 0.58),
                  delegate: SliverChildBuilderDelegate(
                    (context, index) => ProductCard(
                      product: products[index],
                      onAdd: () => context.read<CartProvider>().addProduct(products[index]),
                    ),
                    childCount: products.length,
                  ),
                ),
              ),
              const SliverToBoxAdapter(child: SizedBox(height: 24)),
            ],
          ),
        );
      },
    );
  }
}
