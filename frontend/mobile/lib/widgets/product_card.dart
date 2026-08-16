import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

import '../core/theme/app_theme.dart';
import '../core/utils/formatters.dart';
import '../data/demo/demo_images.dart';
import '../data/models/product.dart';
import '../providers/catalog_provider.dart';
import '../providers/favorites_provider.dart';
import 'common_widgets.dart';

/// Ratio hauteur/largeur des cellules grille produit (Explorer, favoris…).
const productGridAspectRatio = 0.68;

class ProductCard extends StatelessWidget {
  const ProductCard({super.key, required this.product, this.onAdd});

  final ProductModel product;
  final VoidCallback? onAdd;

  @override
  Widget build(BuildContext context) {
    final store = context.watch<CatalogProvider>().storeById(product.storeId);
    final favorites = context.watch<FavoritesProvider>();
    final isFavorite = favorites.isFavorite(product.id);
    final rupture = !product.inStock;

    return Container(
      decoration: AppTheme.cardDecoration(context),
      clipBehavior: Clip.antiAlias,
      child: LayoutBuilder(
        builder: (context, constraints) {
          final imageSize = constraints.maxWidth;
          return Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              SizedBox(
                height: imageSize,
                width: double.infinity,
                child: Stack(
                  fit: StackFit.expand,
                  children: [
                    InkWell(
                      onTap: () => context.push('/client/produit/${product.id}'),
                      child: _ProductImage(
                        productId: product.id,
                        categoryId: product.categoryId,
                        url: product.imageUrl,
                        rupture: rupture,
                      ),
                    ),
                    if (product.onPromo)
                      Positioned(
                        left: 8,
                        top: 8,
                        child: Container(
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                          decoration: BoxDecoration(
                            color: AppTheme.accent500,
                            borderRadius: BorderRadius.circular(999),
                          ),
                          child: const Text(
                            'PROMO',
                            style: TextStyle(color: Colors.white, fontSize: 10, fontWeight: FontWeight.w800),
                          ),
                        ),
                      ),
                    Positioned(
                      right: 6,
                      top: 6,
                      child: Material(
                        color: Colors.white.withValues(alpha: 0.92),
                        shape: const CircleBorder(),
                        child: InkWell(
                          customBorder: const CircleBorder(),
                          onTap: () => context.read<FavoritesProvider>().toggle(product.id),
                          child: Padding(
                            padding: const EdgeInsets.all(6),
                            child: Icon(
                              isFavorite ? Icons.favorite : Icons.favorite_border,
                              size: 14,
                              color: isFavorite ? AppTheme.accent500 : AppTheme.ink500,
                            ),
                          ),
                        ),
                      ),
                    ),
                  ],
                ),
              ),
              Expanded(
                child: Padding(
                  padding: const EdgeInsets.fromLTRB(10, 8, 10, 10),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      if (store != null)
                        Text(
                          store.name,
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: const TextStyle(fontSize: 10, fontWeight: FontWeight.w600, color: AppTheme.ink400),
                        ),
                      Expanded(
                        child: InkWell(
                          onTap: () => context.push('/client/produit/${product.id}'),
                          child: Text(
                            product.name,
                            maxLines: 2,
                            overflow: TextOverflow.ellipsis,
                            style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w700, height: 1.15),
                          ),
                        ),
                      ),
                      Row(
                        crossAxisAlignment: CrossAxisAlignment.end,
                        children: [
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                Text(
                                  formatPrix(product.displayPrice),
                                  maxLines: 1,
                                  overflow: TextOverflow.ellipsis,
                                  style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 13),
                                ),
                                if (product.onPromo)
                                  Text(
                                    formatPrix(product.compareAtPrice!),
                                    maxLines: 1,
                                    overflow: TextOverflow.ellipsis,
                                    style: const TextStyle(
                                      decoration: TextDecoration.lineThrough,
                                      color: AppTheme.ink300,
                                      fontSize: 10,
                                    ),
                                  ),
                              ],
                            ),
                          ),
                          if (onAdd != null && product.inStock)
                            Material(
                              color: AppTheme.ink900,
                              shape: const CircleBorder(),
                              child: InkWell(
                                customBorder: const CircleBorder(),
                                onTap: onAdd,
                                child: const Padding(
                                  padding: EdgeInsets.all(6),
                                  child: Icon(Icons.add, color: Colors.white, size: 15),
                                ),
                              ),
                            ),
                        ],
                      ),
                    ],
                  ),
                ),
              ),
            ],
          );
        },
      ),
    );
  }
}

class _ProductImage extends StatelessWidget {
  const _ProductImage({
    required this.productId,
    this.categoryId,
    this.url,
    this.rupture = false,
  });

  final String productId;
  final String? categoryId;
  final String? url;
  final bool rupture;

  @override
  Widget build(BuildContext context) {
    final resolvedUrl = (url != null && url!.isNotEmpty)
        ? url!
        : productImageUrl(productId: productId, categoryId: categoryId);

    final image = CachedNetworkImage(
      imageUrl: resolvedUrl,
      fit: BoxFit.cover,
      width: double.infinity,
      height: double.infinity,
      placeholder: (_, __) => Container(color: AppTheme.ink50),
      errorWidget: (_, __, ___) => Container(
        color: AppTheme.ink50,
        alignment: Alignment.center,
        child: const Icon(Icons.image_outlined, color: AppTheme.ink300, size: 28),
      ),
    );

    if (!rupture) return image;

    return Stack(
      fit: StackFit.expand,
      children: [
        image,
        Container(
          color: Colors.white.withValues(alpha: 0.75),
          alignment: Alignment.center,
          child: const Text(
            'RUPTURE',
            style: TextStyle(fontSize: 10, fontWeight: FontWeight.w800, letterSpacing: 0.4, color: AppTheme.ink600),
          ),
        ),
      ],
    );
  }
}
