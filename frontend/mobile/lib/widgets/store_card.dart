import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../core/theme/app_theme.dart';
import '../data/models/store.dart';

class StoreCard extends StatelessWidget {
  const StoreCard({super.key, required this.store});

  final StoreModel store;

  @override
  Widget build(BuildContext context) {
    return Card(
      clipBehavior: Clip.antiAlias,
      child: InkWell(
        onTap: () => context.push('/client/boutique/${store.id}'),
        child: Row(
          children: [
            SizedBox(
              width: 88,
              height: 88,
              child: store.coverUrl != null
                  ? CachedNetworkImage(
                      imageUrl: store.coverUrl!,
                      fit: BoxFit.cover,
                      errorWidget: (_, __, ___) => _placeholder(),
                    )
                  : _placeholder(),
            ),
            Expanded(
              child: Padding(
                padding: const EdgeInsets.all(12),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      store.name,
                      style: const TextStyle(fontWeight: FontWeight.w800),
                    ),
                    if (store.tagline != null) ...[
                      const SizedBox(height: 4),
                      Text(
                        store.tagline!,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: const TextStyle(color: AppTheme.ink700, fontSize: 12),
                      ),
                    ],
                    const SizedBox(height: 6),
                    Row(
                      children: [
                        const Icon(Icons.location_on_outlined, size: 14, color: AppTheme.ink300),
                        const SizedBox(width: 4),
                        Text(store.city, style: const TextStyle(fontSize: 12)),
                        const Spacer(),
                        if (store.pickup)
                          const Icon(Icons.storefront_outlined, size: 16, color: AppTheme.ink300),
                        if (store.delivery) ...[
                          const SizedBox(width: 6),
                          const Icon(Icons.local_shipping_outlined, size: 16, color: AppTheme.ink300),
                        ],
                      ],
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _placeholder() {
    return Container(
      color: const Color(0xFFF3F4F6),
      child: const Icon(Icons.store_outlined, color: AppTheme.ink300),
    );
  }
}
