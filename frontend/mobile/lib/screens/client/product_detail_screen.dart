import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

import '../../core/utils/formatters.dart';
import '../../providers/cart_provider.dart';
import '../../providers/catalog_provider.dart';
import '../../widgets/common_widgets.dart';
import '../../widgets/product_card.dart';

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
            appBar: AppBar(),
            body: const EmptyState(
              icon: Icons.error_outline,
              title: 'Article introuvable',
            ),
          );
        }

        final store = context.watch<CatalogProvider>().storeById(product.storeId);

        return Scaffold(
          appBar: AppBar(title: Text(product.name)),
          body: ListView(
            padding: const EdgeInsets.all(16),
            children: [
              AspectRatio(
                aspectRatio: 1.2,
                child: Container(
                  decoration: BoxDecoration(
                    color: const Color(0xFFF3F4F6),
                    borderRadius: BorderRadius.circular(16),
                  ),
                  child: product.imageUrl != null
                      ? Image.network(product.imageUrl!, fit: BoxFit.cover)
                      : const Icon(Icons.image_outlined, size: 64),
                ),
              ),
              const SizedBox(height: 16),
              Text(product.name, style: const TextStyle(fontSize: 22, fontWeight: FontWeight.w800)),
              const SizedBox(height: 8),
              Text(formatPrix(product.displayPrice), style: const TextStyle(fontSize: 20, fontWeight: FontWeight.w800)),
              if (product.description != null) ...[
                const SizedBox(height: 12),
                Text(product.description!),
              ],
              const SizedBox(height: 16),
              if (store != null)
                ListTile(
                  contentPadding: EdgeInsets.zero,
                  leading: const Icon(Icons.store_outlined),
                  title: Text(store.name),
                  subtitle: Text(store.city),
                  trailing: const Icon(Icons.chevron_right),
                  onTap: () => context.push('/client/boutique/${store.id}'),
                ),
              const SizedBox(height: 16),
              Row(
                children: [
                  IconButton(
                    onPressed: _quantity > 1 ? () => setState(() => _quantity--) : null,
                    icon: const Icon(Icons.remove_circle_outline),
                  ),
                  Text('$_quantity', style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
                  IconButton(
                    onPressed: () => setState(() => _quantity++),
                    icon: const Icon(Icons.add_circle_outline),
                  ),
                ],
              ),
            ],
          ),
          bottomNavigationBar: SafeArea(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: ElevatedButton.icon(
                onPressed: product.inStock
                    ? () async {
                        await context.read<CartProvider>().addProduct(product, quantity: _quantity);
                        if (context.mounted) {
                          ScaffoldMessenger.of(context).showSnackBar(
                            const SnackBar(content: Text('Article ajoute au panier')),
                          );
                        }
                      }
                    : null,
                icon: const Icon(Icons.add_shopping_cart_outlined),
                label: Text(product.inStock ? 'Ajouter au panier' : 'Rupture de stock'),
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
          return Scaffold(
            appBar: AppBar(),
            body: const EmptyState(icon: Icons.store_outlined, title: 'Boutique introuvable'),
          );
        }

        final products = catalog.productsForStore(store.id);

        return Scaffold(
          appBar: AppBar(title: Text(store.name)),
          body: ListView(
            padding: const EdgeInsets.all(16),
            children: [
              if (store.coverUrl != null)
                ClipRRect(
                  borderRadius: BorderRadius.circular(16),
                  child: Image.network(store.coverUrl!, height: 180, width: double.infinity, fit: BoxFit.cover),
                ),
              const SizedBox(height: 16),
              Text(store.name, style: const TextStyle(fontSize: 22, fontWeight: FontWeight.w800)),
              if (store.tagline != null) Text(store.tagline!, style: const TextStyle(color: Colors.grey)),
              const SizedBox(height: 8),
              Row(
                children: [
                  const Icon(Icons.location_on_outlined, size: 16),
                  const SizedBox(width: 4),
                  Text('${store.address ?? ''} ${store.city}'.trim()),
                ],
              ),
              if (store.description != null) ...[
                const SizedBox(height: 12),
                Text(store.description!),
              ],
              const SizedBox(height: 20),
              const SectionHeader(title: 'Catalogue'),
              GridView.builder(
                shrinkWrap: true,
                physics: const NeverScrollableScrollPhysics(),
                gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                  crossAxisCount: 2,
                  crossAxisSpacing: 12,
                  mainAxisSpacing: 12,
                  childAspectRatio: 0.62,
                ),
                itemCount: products.length,
                itemBuilder: (context, index) {
                  final product = products[index];
                  return ProductCard(
                    product: product,
                    onAdd: () => context.read<CartProvider>().addProduct(product),
                  );
                },
              ),
            ],
          ),
        );
      },
    );
  }
}
