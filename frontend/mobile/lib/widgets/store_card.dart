import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../core/theme/app_theme.dart';
import '../data/demo/demo_images.dart';
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
        child: IntrinsicHeight(
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              SizedBox(
                width: 88,
                child: _cover(),
              ),
              Expanded(
                child: Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                  child: _info(context),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _cover() {
    final url = store.coverUrl ?? storeCoverUrl(storeId: store.id, mainCategory: store.mainCategory);
    return CachedNetworkImage(
      imageUrl: url,
      fit: BoxFit.cover,
      width: double.infinity,
      height: double.infinity,
      placeholder: (_, _) => _placeholder(),
      errorWidget: (_, _, _) => _placeholder(),
    );
  }

  Widget _placeholder() {
    return Container(
      color: AppTheme.ink50,
      child: const Icon(Icons.store_outlined, color: AppTheme.ink300),
    );
  }

  Widget _info(BuildContext context) {
    return Column(
      mainAxisSize: MainAxisSize.min,
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          store.name,
          maxLines: 1,
          overflow: TextOverflow.ellipsis,
          style: const TextStyle(fontWeight: FontWeight.w800),
        ),
        if (store.tagline != null) ...[
          const SizedBox(height: 2),
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
            Expanded(
              child: Text(
                store.city,
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style: const TextStyle(fontSize: 12),
              ),
            ),
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
    // Remplit la hauteur du parent (ex. ListView horizontale à hauteur fixe)
    // pour éviter l’overflow AspectRatio + textes.
    return SizedBox(
      width: 220,
      child: Container(
        decoration: AppTheme.cardDecoration(context),
        clipBehavior: Clip.antiAlias,
        child: InkWell(
          onTap: () => context.push('/client/boutique/${store.id}'),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Expanded(
                child: CachedNetworkImage(
                  imageUrl: store.coverUrl ?? storeCoverUrl(storeId: store.id, mainCategory: store.mainCategory),
                  fit: BoxFit.cover,
                  width: double.infinity,
                  placeholder: (_, _) => _placeholder(),
                  errorWidget: (_, _, _) => _placeholder(),
                ),
              ),
              Padding(
                padding: const EdgeInsets.fromLTRB(10, 8, 10, 10),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      store.name,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 13),
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
                    const SizedBox(height: 6),
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
                            style: const TextStyle(
                              fontSize: 11,
                              fontWeight: FontWeight.w700,
                              color: AppTheme.accent600,
                            ),
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
