import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

import '../../core/theme/app_theme.dart';
import '../../core/utils/formatters.dart';
import '../../providers/cart_provider.dart';
import '../../providers/catalog_provider.dart';
import '../../widgets/app_layout.dart';
import '../../widgets/common_widgets.dart';

class CartScreen extends StatefulWidget {
  const CartScreen({super.key});

  @override
  State<CartScreen> createState() => _CartScreenState();
}

class _CartScreenState extends State<CartScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<CartProvider>().loadCart();
    });
  }

  @override
  Widget build(BuildContext context) {
    final cartProvider = context.watch<CartProvider>();
    final catalog = context.watch<CatalogProvider>();
    final cart = cartProvider.cart;

    final grouped = <String, List<dynamic>>{};
    for (final item in cart.items) {
      grouped.putIfAbsent(item.storeId, () => []).add(item);
    }

    return Scaffold(
      backgroundColor: AppTheme.contentBackground(context),
      body: Column(
        children: [
          HeroHeader(
            padding: const EdgeInsets.fromLTRB(16, 16, 16, 24),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'MON PANIER',
                  style: TextStyle(fontSize: 11, fontWeight: FontWeight.w700, letterSpacing: 1, color: AppTheme.accent300),
                ),
                const SizedBox(height: 4),
                Text(
                  '${cart.items.length} article${cart.items.length > 1 ? 's' : ''}',
                  style: const TextStyle(fontSize: 22, fontWeight: FontWeight.w800),
                ),
              ],
            ),
          ),
          Expanded(
            child: ContentSheet(
              child: cartProvider.loading
                  ? const LoadingView()
                  : cart.items.isEmpty
                      ? EmptyState(
                          icon: Icons.shopping_bag_outlined,
                          title: 'Votre panier est vide',
                          subtitle: 'Explorez le catalogue pour ajouter des articles.',
                          action: ElevatedButton(
                            onPressed: () => context.go('/client'),
                            child: const Text('Explorer'),
                          ),
                        )
                      : ListView(
                          padding: const EdgeInsets.fromLTRB(16, 16, 16, 120),
                          children: grouped.entries.map((entry) {
                            final store = catalog.storeById(entry.key);
                            return Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Padding(
                                  padding: const EdgeInsets.only(bottom: 8, top: 8),
                                  child: Row(
                                    children: [
                                      const Icon(Icons.store_outlined, size: 16, color: AppTheme.ink500),
                                      const SizedBox(width: 6),
                                      Text(
                                        store?.name ?? 'Boutique',
                                        style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 14),
                                      ),
                                    ],
                                  ),
                                ),
                                ...entry.value.map((item) {
                                  return Container(
                                    margin: const EdgeInsets.only(bottom: 8),
                                    decoration: AppTheme.cardDecoration(context),
                                    child: Padding(
                                      padding: const EdgeInsets.all(12),
                                      child: Row(
                                        children: [
                                          Expanded(
                                            child: Column(
                                              crossAxisAlignment: CrossAxisAlignment.start,
                                              children: [
                                                Text(item.name, style: const TextStyle(fontWeight: FontWeight.w700)),
                                                const SizedBox(height: 4),
                                                Text(formatPrix(item.price)),
                                              ],
                                            ),
                                          ),
                                          Row(
                                            children: [
                                              IconButton(
                                                visualDensity: VisualDensity.compact,
                                                icon: const Icon(Icons.remove_circle_outline),
                                                onPressed: () => cartProvider.updateQuantity(
                                                  item.productId,
                                                  item.quantity - 1,
                                                ),
                                              ),
                                              Text('${item.quantity}', style: const TextStyle(fontWeight: FontWeight.w700)),
                                              IconButton(
                                                visualDensity: VisualDensity.compact,
                                                icon: const Icon(Icons.add_circle_outline),
                                                onPressed: () => cartProvider.updateQuantity(
                                                  item.productId,
                                                  item.quantity + 1,
                                                ),
                                              ),
                                            ],
                                          ),
                                        ],
                                      ),
                                    ),
                                  );
                                }),
                              ],
                            );
                          }).toList(),
                        ),
            ),
          ),
        ],
      ),
      bottomNavigationBar: cart.items.isEmpty
          ? null
          : Container(
              padding: const EdgeInsets.fromLTRB(16, 12, 16, 12),
              decoration: BoxDecoration(
                color: Theme.of(context).cardColor,
                border: Border(top: BorderSide(color: Theme.of(context).dividerColor)),
              ),
              child: SafeArea(
                top: false,
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Text('Total', style: TextStyle(fontWeight: FontWeight.w700)),
                        Text(
                          formatPrix(cart.subtotal),
                          style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 18),
                        ),
                      ],
                    ),
                    const SizedBox(height: 12),
                    FilledButton(
                      onPressed: () => context.push('/client/checkout'),
                      child: const Text('Passer au paiement'),
                    ),
                  ],
                ),
              ),
            ),
    );
  }
}
