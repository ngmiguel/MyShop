import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

import '../../core/theme/app_theme.dart';
import '../../data/demo/demo_images.dart';
import '../../core/utils/formatters.dart';
import '../../data/models/product.dart';
import '../../providers/cart_provider.dart';
import '../../providers/catalog_provider.dart';
import '../../widgets/common_widgets.dart';
import '../../widgets/top_bar.dart';

class CartScreen extends StatefulWidget {
  const CartScreen({super.key});

  @override
  State<CartScreen> createState() => _CartScreenState();
}

class _CartScreenState extends State<CartScreen> {
  static const _tvaRate = 18.0;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<CartProvider>().loadCart();
    });
  }

  double _economies(CatalogProvider catalog, CartProvider cart) {
    var savings = 0.0;
    for (final item in cart.cart.items) {
      final product = catalog.productById(item.productId);
      if (product != null && product.onPromo && product.compareAtPrice != null) {
        savings += (product.compareAtPrice! - product.price) * item.quantity;
      }
    }
    return savings;
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

    final economies = _economies(catalog, cartProvider);
    final tva = (cart.subtotal * _tvaRate / 100).round();

    if (cartProvider.loading) {
      return const Scaffold(
        backgroundColor: Colors.white,
        body: LoadingView(message: 'Chargement du panier…'),
      );
    }

    if (cart.items.isEmpty) {
      return Scaffold(
        backgroundColor: Colors.white,
        appBar: const TopBar(title: 'Mon panier', showBack: false),
        body: EmptyState(
          icon: Icons.shopping_bag_outlined,
          title: 'Votre panier est vide',
          subtitle:
              'Ajoutez des articles de plusieurs boutiques : un code QR sera généré par boutique au paiement.',
          action: FilledButton(
            onPressed: () => context.go('/client'),
            child: const Text('Découvrir les articles'),
          ),
        ),
      );
    }

    return Scaffold(
      backgroundColor: AppTheme.contentBackground(context),
      appBar: TopBar(
        title: 'Mon panier',
        subtitle: '${grouped.length} boutique${grouped.length > 1 ? 's' : ''}',
        showBack: false,
        action: TextButton.icon(
          onPressed: () async {
            await cartProvider.clear();
            if (mounted) {
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(content: Text('Panier vidé.')),
              );
            }
          },
          icon: const Icon(Icons.delete_outline, size: 14, color: Colors.red),
          label: const Text('Vider', style: TextStyle(color: Colors.red, fontWeight: FontWeight.w800, fontSize: 12)),
        ),
      ),
      body: ListView(
        padding: const EdgeInsets.fromLTRB(16, 0, 16, 120),
        children: [
          ...grouped.entries.map((entry) {
            final store = catalog.storeById(entry.key);
            final sousTotal = entry.value.fold<double>(0, (t, item) => t + item.lineTotal);
            return Container(
              margin: const EdgeInsets.only(bottom: 16),
              decoration: AppTheme.cardDecoration(context),
              clipBehavior: Clip.antiAlias,
              child: Column(
                children: [
                  Material(
                    color: AppTheme.ink50.withValues(alpha: 0.6),
                    child: InkWell(
                      onTap: () => context.push('/client/boutique/${entry.key}'),
                      child: Padding(
                        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
                        child: Row(
                          children: [
                            const Icon(Icons.store_outlined, size: 14, color: AppTheme.ink400),
                            const SizedBox(width: 8),
                            Expanded(
                              child: Text(
                                store?.name ?? 'Boutique',
                                style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 13, color: AppTheme.ink800),
                              ),
                            ),
                            Text(
                              formatPrix(sousTotal),
                              style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 11, color: AppTheme.ink400),
                            ),
                          ],
                        ),
                      ),
                    ),
                  ),
                  const Divider(height: 1),
                  ...entry.value.map((item) => _CartLine(
                        item: item,
                        product: catalog.productById(item.productId),
                        onDecrease: () => cartProvider.updateQuantity(item.productId, item.quantity - 1),
                        onIncrease: () => cartProvider.updateQuantity(item.productId, item.quantity + 1),
                      )),
                ],
              ),
            );
          }),
          Container(
            decoration: AppTheme.cardDecoration(context),
            padding: const EdgeInsets.all(16),
            child: Column(
              children: [
                _SummaryLine(label: 'Sous-total', value: formatPrix(cart.subtotal)),
                if (economies > 0)
                  _SummaryLine(
                    label: 'Économies promotions',
                    value: '−${formatPrix(economies)}',
                    valueColor: AppTheme.emerald600,
                    labelColor: AppTheme.emerald600,
                  ),
                _SummaryLine(label: 'TVA incluse (${_tvaRate.round()}%)', value: formatPrix(tva)),
                const _SummaryLine(label: 'Frais de livraison', value: 'Calculés à l\'étape suivante'),
                const Divider(height: 20),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    const Text('Total estimé', style: TextStyle(fontWeight: FontWeight.w800, fontSize: 14)),
                    Text(formatPrix(cart.subtotal), style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 18)),
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
      bottomNavigationBar: Container(
        decoration: BoxDecoration(
          color: Colors.white,
          border: Border(top: BorderSide(color: AppTheme.ink100)),
        ),
        padding: const EdgeInsets.fromLTRB(12, 12, 12, 12),
        child: SafeArea(
          top: false,
          child: FilledButton(
            onPressed: () => context.push('/client/checkout'),
            style: FilledButton.styleFrom(
              backgroundColor: AppTheme.ink900,
              foregroundColor: Colors.white,
              minimumSize: const Size.fromHeight(48),
            ),
            child: Text('Passer au paiement · ${formatPrix(cart.subtotal)}', style: const TextStyle(fontWeight: FontWeight.w800)),
          ),
        ),
      ),
    );
  }
}

class _CartLine extends StatelessWidget {
  const _CartLine({
    required this.item,
    required this.product,
    required this.onDecrease,
    required this.onIncrease,
  });

  final dynamic item;
  final ProductModel? product;
  final VoidCallback onDecrease;
  final VoidCallback onIncrease;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.all(12),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          ClipRRect(
            borderRadius: BorderRadius.circular(12),
            child: SizedBox(
              width: 64,
              height: 64,
              child: item.imageUrl != null && item.imageUrl!.isNotEmpty
                  ? CachedNetworkImage(
                      imageUrl: item.imageUrl!,
                      fit: BoxFit.cover,
                      width: double.infinity,
                      height: double.infinity,
                      errorWidget: (_, __, ___) => Container(
                        color: AppTheme.ink50,
                        child: const Icon(Icons.image_outlined, color: AppTheme.ink300),
                      ),
                    )
                  : CachedNetworkImage(
                      imageUrl: productImageUrl(productId: item.productId, categoryId: product?.categoryId),
                      fit: BoxFit.cover,
                      width: double.infinity,
                      height: double.infinity,
                      errorWidget: (_, __, ___) => Container(
                        color: AppTheme.ink50,
                        child: const Icon(Icons.image_outlined, color: AppTheme.ink300),
                      ),
                    ),
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(item.name, maxLines: 2, overflow: TextOverflow.ellipsis, style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 13)),
                const SizedBox(height: 2),
                Text('${formatPrix(item.price)} / unité', style: const TextStyle(fontSize: 11, color: AppTheme.ink400)),
                const SizedBox(height: 8),
                Row(
                  children: [
                    Container(
                      decoration: BoxDecoration(
                        border: Border.all(color: AppTheme.ink200),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Row(
                        children: [
                          _QtyButton(icon: Icons.remove, onTap: onDecrease),
                          SizedBox(
                            width: 24,
                            child: Text(
                              '${item.quantity}',
                              textAlign: TextAlign.center,
                              style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 12),
                            ),
                          ),
                          _QtyButton(icon: Icons.add, onTap: onIncrease),
                        ],
                      ),
                    ),
                    const Spacer(),
                    Text(formatPrix(item.lineTotal), style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 14)),
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _QtyButton extends StatelessWidget {
  const _QtyButton({required this.icon, required this.onTap});

  final IconData icon;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      child: SizedBox(
        width: 28,
        height: 28,
        child: Icon(icon, size: 13, color: AppTheme.ink600),
      ),
    );
  }
}

class _SummaryLine extends StatelessWidget {
  const _SummaryLine({
    required this.label,
    required this.value,
    this.labelColor,
    this.valueColor,
  });

  final String label;
  final String value;
  final Color? labelColor;
  final Color? valueColor;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 3),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label, style: TextStyle(fontSize: 13, color: labelColor ?? AppTheme.ink500)),
          Text(value, style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: valueColor ?? AppTheme.ink700)),
        ],
      ),
    );
  }
}
