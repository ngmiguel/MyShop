import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../core/theme/app_theme.dart';
import '../data/models/store.dart';

class StoreCard extends StatelessWidget {
  const StoreCard({
    super.key,
    required this.store,
    this.compact = false,
    this.productCount,
  });

  final StoreModel store;
  final bool compact;
  final int? productCount;

  @override
  Widget build(BuildContext context) {
    if (compact) {
      return _CompactStoreCard(store: store, productCount: productCount);
    }

    return Container(
      decoration: AppTheme.cardDecoration(context),
      clipBehavior: Clip.antiAlias,
      child: InkWell(
        onTap: () => context.push('/client/boutique/${store.id}'),
        child: Row(
          children: [
            SizedBox(
              width: 88,
              height: 88,
              child: _cover(),
            ),
            Expanded(
              child: Padding(
                padding: const EdgeInsets.all(12),
                child: _info(context),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _cover() {
    if (store.coverUrl != null) {
      return CachedNetworkImage(
        imageUrl: store.coverUrl!,
        fit: BoxFit.cover,
        errorWidget: (_, __, ___) => _placeholder(),
      );
    }
    return _placeholder();
  }

  Widget _placeholder() {
    return Container(
      color: AppTheme.ink50,
      child: const Icon(Icons.store_outlined, color: AppTheme.ink300),
    );
  }

  Widget _info(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(store.name, style: const TextStyle(fontWeight: FontWeight.w800)),
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
            if (store.pickup) const Icon(Icons.storefront_outlined, size: 16, color: AppTheme.ink300),
            if (store.delivery) ...[
              const SizedBox(width: 6),
              const Icon(Icons.local_shipping_outlined, size: 16, color: AppTheme.ink300),
            ],
          ],
        ),
      ],
    );
  }
}

class _CompactStoreCard extends StatelessWidget {
  const _CompactStoreCard({required this.store, this.productCount});

  final StoreModel store;
  final int? productCount;

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: 230,
      child: Container(
        decoration: AppTheme.cardDecoration(context),
        clipBehavior: Clip.antiAlias,
        child: InkWell(
          onTap: () => context.push('/client/boutique/${store.id}'),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              AspectRatio(
                aspectRatio: 16 / 10,
                child: store.coverUrl != null
                    ? CachedNetworkImage(
                        imageUrl: store.coverUrl!,
                        fit: BoxFit.cover,
                        errorWidget: (_, __, ___) => _placeholder(),
                      )
                    : _placeholder(),
              ),
              Padding(
                padding: const EdgeInsets.all(12),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      store.name,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 14),
                    ),
                    if (store.tagline != null) ...[
                      const SizedBox(height: 2),
                      Text(
                        store.tagline!,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: const TextStyle(fontSize: 11, color: AppTheme.ink400),
                      ),
                    ],
                    const SizedBox(height: 8),
                    Row(
                      children: [
                        const Icon(Icons.location_on_outlined, size: 13, color: AppTheme.ink400),
                        const SizedBox(width: 4),
                        Expanded(
                          child: Text(
                            store.city,
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                            style: const TextStyle(fontSize: 11, color: AppTheme.ink400),
                          ),
                        ),
                        if (productCount != null)
                          Text(
                            '$productCount art.',
                            style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w700, color: AppTheme.accent600),
                          ),
                      ],
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _placeholder() {
    return Container(
      color: AppTheme.ink50,
      child: const Center(child: Icon(Icons.store_outlined, color: AppTheme.ink300)),
    );
  }
}
