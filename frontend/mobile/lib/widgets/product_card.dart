import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../core/theme/app_theme.dart';
import '../core/utils/formatters.dart';
import '../data/models/product.dart';

class ProductCard extends StatelessWidget {
  const ProductCard({super.key, required this.product, this.onAdd});

  final ProductModel product;
  final VoidCallback? onAdd;

  @override
  Widget build(BuildContext context) {
    return Card(
      clipBehavior: Clip.antiAlias,
      child: InkWell(
        onTap: () => context.push('/client/produit/${product.id}'),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            AspectRatio(
              aspectRatio: 1.1,
              child: _ProductImage(url: product.imageUrl),
            ),
            Padding(
              padding: const EdgeInsets.all(12),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    product.name,
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(fontWeight: FontWeight.w700),
                  ),
                  const SizedBox(height: 6),
                  Row(
                    children: [
                      Text(
                        formatPrix(product.displayPrice),
                        style: const TextStyle(
                          fontWeight: FontWeight.w800,
                          color: AppTheme.ink900,
                        ),
                      ),
                      if (product.onPromo) ...[
                        const SizedBox(width: 6),
                        Text(
                          formatPrix(product.compareAtPrice!),
                          style: const TextStyle(
                            decoration: TextDecoration.lineThrough,
                            color: AppTheme.ink300,
                            fontSize: 12,
                          ),
                        ),
                      ],
                    ],
                  ),
                  const SizedBox(height: 8),
                  Row(
                    children: [
                      Icon(
                        product.inStock ? Icons.check_circle_outline : Icons.cancel_outlined,
                        size: 14,
                        color: product.inStock ? AppTheme.emerald600 : Colors.red,
                      ),
                      const SizedBox(width: 4),
                      Text(
                        product.inStock ? 'En stock' : 'Rupture',
                        style: TextStyle(
                          fontSize: 11,
                          color: product.inStock ? AppTheme.emerald600 : Colors.red,
                        ),
                      ),
                      const Spacer(),
                      if (onAdd != null && product.inStock)
                        IconButton(
                          visualDensity: VisualDensity.compact,
                          onPressed: onAdd,
                          icon: const Icon(Icons.add_shopping_cart_outlined, size: 20),
                        ),
                    ],
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _ProductImage extends StatelessWidget {
  const _ProductImage({this.url});

  final String? url;

  @override
  Widget build(BuildContext context) {
    if (url == null || url!.isEmpty) {
      return Container(
        color: const Color(0xFFF3F4F6),
        child: const Center(
          child: Icon(Icons.image_outlined, size: 40, color: AppTheme.ink300),
        ),
      );
    }
    return CachedNetworkImage(
      imageUrl: url!,
      fit: BoxFit.cover,
      placeholder: (_, __) => Container(color: const Color(0xFFF3F4F6)),
      errorWidget: (_, __, ___) => Container(
        color: const Color(0xFFF3F4F6),
        child: const Icon(Icons.broken_image_outlined),
      ),
    );
  }
}
