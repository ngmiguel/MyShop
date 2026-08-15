import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../core/theme/app_theme.dart';
import '../../providers/catalog_provider.dart';
import '../../providers/favorites_provider.dart';
import '../../widgets/common_widgets.dart';
import '../../widgets/product_card.dart';
import '../../widgets/top_bar.dart';

class FavoritesScreen extends StatelessWidget {
  const FavoritesScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final favorites = context.watch<FavoritesProvider>();
    final catalog = context.watch<CatalogProvider>();
    final products = catalog.products.where((p) => favorites.isFavorite(p.id)).toList();

    return Scaffold(
      backgroundColor: AppTheme.contentBackground(context),
      appBar: const TopBar(
        title: 'Favoris',
        subtitle: 'Articles enregistres',
        showBack: false,
      ),
      body: products.isEmpty
          ? const EmptyState(
              icon: Icons.favorite_border,
              title: 'Aucun favori',
              subtitle: 'Appuyez sur le coeur d\'un article pour l\'ajouter ici.',
            )
          : GridView.builder(
              padding: const EdgeInsets.all(16),
              gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                crossAxisCount: 2,
                crossAxisSpacing: 12,
                mainAxisSpacing: 12,
                childAspectRatio: 0.58,
              ),
              itemCount: products.length,
              itemBuilder: (context, index) => ProductCard(product: products[index]),
            ),
    );
  }
}
