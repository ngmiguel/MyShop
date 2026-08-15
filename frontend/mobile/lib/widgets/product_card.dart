import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../core/theme/app_theme.dart';
import '../core/utils/formatters.dart';
import '../data/models/product.dart';
import '../providers/catalog_provider.dart';
import '../providers/favorites_provider.dart';
import 'common_widgets.dart';
import 'package:provider/provider.dart';

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
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Stack(
            children: [
              AspectRatio(
                aspectRatio: 1,
                child: InkWell(
                  onTap: () => context.push('/client/produit/${product.id}'),
                  child: _ProductImage(url: product.imageUrl, rupture: rupture),
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
                      style: TextStyle(
                        color: Colors.white,
                        fontSize: 10,
                        fontWeight: FontWeight.w800,
                      ),
                    ),
                  ),
                ),
              Positioned(
                right: 8,
                top: 8,
                child: Material(
                  color: Colors.white.withValues(alpha: 0.9),
                  shape: const CircleBorder(),
                  child: InkWell(
                    customBorder: const CircleBorder(),
                    onTap: () => context.read<FavoritesProvider>().toggle(product.id),
                    child: Padding(
                      padding: const EdgeInsets.all(8),
                      child: Icon(
                        isFavorite ? Icons.favorite : Icons.favorite_border,
                        size: 15,
                        color: isFavorite ? AppTheme.accent500 : AppTheme.ink500,
                      ),
                    ),
                  ),
                ),
              ),
            ],
          ),
          Padding(
            padding: const EdgeInsets.all(12),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                if (store != null)
                  Text(
                    store.name,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w600, color: AppTheme.ink400),
                  ),
                InkWell(
                  onTap: () => context.push('/client/produit/${product.id}'),
                  child: Text(
                    product.name,
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w700, height: 1.2),
                  ),
                ),
                const SizedBox(height: 4),
                const StarRating(rating: 4.0, size: 11),
                const SizedBox(height: 8),
                Row(
                  crossAxisAlignment: CrossAxisAlignment.end,
                  children: [
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            formatPrix(product.displayPrice),
                            style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 14),
                          ),
                          if (product.onPromo)
                            Text(
                              formatPrix(product.compareAtPrice!),
                              style: const TextStyle(
                                decoration: TextDecoration.lineThrough,
                                color: AppTheme.ink300,
                                fontSize: 11,
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
                            padding: EdgeInsets.all(8),
                            child: Icon(Icons.add, color: Colors.white, size: 16),
                          ),
                        ),
                      ),
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

class _ProductImage extends StatelessWidget {
  const _ProductImage({this.url, this.rupture = false});

  final String? url;
  final bool rupture;

  @override
  Widget build(BuildContext context) {
    Widget image;
    if (url == null || url!.isEmpty) {
      image = Container(
        color: AppTheme.ink50,
        child: const Center(
          child: Icon(Icons.image_outlined, size: 40, color: AppTheme.ink300),
        ),
      );
    } else {
      image = CachedNetworkImage(
        imageUrl: url!,
        fit: BoxFit.cover,
        placeholder: (_, __) => Container(color: AppTheme.ink50),
        errorWidget: (_, __, ___) => Container(
          color: AppTheme.ink50,
          child: const Icon(Icons.broken_image_outlined, color: AppTheme.ink300),
        ),
      );
    }

    if (!rupture) return image;

    return Stack(
      fit: StackFit.expand,
      children: [
        image,
        Container(
          color: Colors.white.withValues(alpha: 0.75),
          alignment: Alignment.center,
          child: const Text(
            'RUPTURE DE STOCK',
            style: TextStyle(
              fontSize: 11,
              fontWeight: FontWeight.w800,
              letterSpacing: 0.5,
              color: AppTheme.ink600,
            ),
          ),
        ),
      ],
    );
  }
}
