import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

import '../../core/theme/app_theme.dart';
import '../../data/models/preferences.dart';
import '../../data/models/product.dart';
import '../../data/models/store.dart';
import '../../providers/auth_provider.dart';
import '../../providers/cart_provider.dart';
import '../../providers/catalog_provider.dart';
import '../../providers/preferences_provider.dart';
import '../../widgets/app_layout.dart';
import '../../widgets/common_widgets.dart';
import '../../widgets/product_card.dart';
import '../../widgets/store_card.dart';

enum _SortMode { pourVous, popularite, note, prixAsc, prixDesc }

class ExplorerScreen extends StatefulWidget {
  const ExplorerScreen({super.key});

  @override
  State<ExplorerScreen> createState() => _ExplorerScreenState();
}

class _ExplorerScreenState extends State<ExplorerScreen> {
  final _searchController = TextEditingController();
  String _domainFilter = 'pour-vous';
  String? _subcategoryFilter;
  bool _filtersOpen = false;
  bool _stockOnly = false;
  bool _promoOnly = false;
  bool _respectBudget = true;
  _SortMode _sort = _SortMode.pourVous;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) => _load());
  }

  Future<void> _load() async {
    final prefs = context.read<PreferencesProvider>().preferences;
    await context.read<CatalogProvider>().loadFeed(city: prefs.city);
    await context.read<CartProvider>().loadCart();
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  List<StoreModel> _filteredStores(UserPreferences prefs, CatalogProvider catalog) {
    var stores = catalog.stores.where((s) => s.status != 'draft').toList();
    if (prefs.localOnly) {
      stores = stores.where((s) => s.city == prefs.city).toList();
    }
    if (prefs.domains.isNotEmpty) {
      final preferred = stores
          .where((s) => s.mainCategory != null && prefs.domains.contains(s.mainCategory))
          .toList();
      if (preferred.isNotEmpty) return preferred;
    }
    return stores;
  }

  List<String> _orderedDomains(UserPreferences prefs, List<ProductModel> products) {
    final present = products.map((p) => p.categoryId).whereType<String>().toSet();
    final preferred = prefs.domains.where(present.contains).toList();
    final others = domainCategories
        .map((d) => d.id)
        .where((id) => present.contains(id) && !preferred.contains(id))
        .toList();
    return [...preferred, ...others];
  }

  List<String> _availableSubcategories(String domainId, List<ProductModel> products) {
    final domain = domainById(domainId);
    if (domain == null) return [];
    final present = products
        .where((p) => p.categoryId == domainId)
        .map((p) => p.subcategoryId)
        .whereType<String>()
        .toSet();
    return domain.subcategories.where(present.contains).toList();
  }

  List<ProductModel> _filteredProducts(UserPreferences prefs, CatalogProvider catalog) {
    final visibleStores = catalog.stores.where((s) => s.status != 'draft').map((s) => s.id).toSet();
    var list = catalog.products.where((p) => visibleStores.contains(p.storeId) && p.isActive).toList();
    final query = _searchController.text.trim().toLowerCase();

    if (query.isNotEmpty) {
      list = list.where((p) {
        final store = catalog.storeById(p.storeId);
        return p.name.toLowerCase().contains(query) ||
            (p.description?.toLowerCase().contains(query) ?? false) ||
            (store?.name.toLowerCase().contains(query) ?? false);
      }).toList();
    }

    if (_domainFilter == 'pour-vous') {
      if (prefs.subcategories.isNotEmpty) {
        list = list.where((p) {
          return (p.subcategoryId != null && prefs.subcategories.contains(p.subcategoryId)) ||
              (p.categoryId != null && prefs.domains.contains(p.categoryId));
        }).toList();
      } else if (prefs.domains.isNotEmpty) {
        list = list.where((p) => p.categoryId != null && prefs.domains.contains(p.categoryId)).toList();
      }
    } else if (_domainFilter != 'tout') {
      list = list.where((p) => p.categoryId == _domainFilter).toList();
      if (_subcategoryFilter != null) {
        list = list.where((p) => p.subcategoryId == _subcategoryFilter).toList();
      }
    }

    if (_stockOnly) list = list.where((p) => p.inStock).toList();
    if (_promoOnly || prefs.promosOnly) list = list.where((p) => p.onPromo).toList();
    if (_respectBudget) {
      final max = budgetMax(prefs.budget);
      list = list.where((p) => p.displayPrice <= max).toList();
    }

    switch (_sort) {
      case _SortMode.prixAsc:
        list.sort((a, b) => a.displayPrice.compareTo(b.displayPrice));
      case _SortMode.prixDesc:
        list.sort((a, b) => b.displayPrice.compareTo(a.displayPrice));
      case _SortMode.note:
      case _SortMode.popularite:
        list.sort((a, b) => b.stock.compareTo(a.stock));
      case _SortMode.pourVous:
        break;
    }
    return list;
  }

  @override
  Widget build(BuildContext context) {
    final catalog = context.watch<CatalogProvider>();
    final prefs = context.watch<PreferencesProvider>().preferences;
    final auth = context.watch<AuthProvider>();
    final stores = _filteredStores(prefs, catalog);
    final products = _filteredProducts(prefs, catalog);
    final domainIds = _orderedDomains(prefs, catalog.products);
    final subcategories = _domainFilter != 'pour-vous' && _domainFilter != 'tout'
        ? _availableSubcategories(_domainFilter, catalog.products)
        : <String>[];

    return RefreshIndicator(
      onRefresh: _load,
      color: AppTheme.accent500,
      child: CustomScrollView(
        slivers: [
          SliverToBoxAdapter(child: _buildHeader(context, prefs, auth)),
          if (catalog.loading)
            const SliverFillRemaining(child: LoadingView(message: 'Chargement du catalogue...'))
          else if (catalog.error != null)
            SliverFillRemaining(
              child: EmptyState(
                icon: Icons.cloud_off_outlined,
                title: 'Impossible de charger le catalogue',
                subtitle: catalog.error,
                action: ElevatedButton(onPressed: _load, child: const Text('Reessayer')),
              ),
            )
          else
            SliverToBoxAdapter(
              child: ContentSheet(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const SizedBox(height: 16),
                    HorizontalChipList(
                      children: [
                        AppChip(
                          active: _domainFilter == 'pour-vous',
                          onTap: () => setState(() {
                            _domainFilter = 'pour-vous';
                            _subcategoryFilter = null;
                            _sort = _SortMode.pourVous;
                          }),
                          leading: const Icon(Icons.auto_awesome_outlined, size: 14, color: AppTheme.accent500),
                          label: const Text('Pour vous'),
                        ),
                        AppChip(
                          active: _domainFilter == 'tout',
                          onTap: () => setState(() {
                            _domainFilter = 'tout';
                            _subcategoryFilter = null;
                          }),
                          label: const Text('Tout le catalogue'),
                        ),
                        ...domainIds.map((id) {
                          final domain = domainById(id);
                          if (domain == null) return const SizedBox.shrink();
                          final preferred = prefs.domains.contains(id);
                          return AppChip(
                            active: _domainFilter == id,
                            bold: preferred,
                            onTap: () => setState(() {
                              _domainFilter = id;
                              _subcategoryFilter = null;
                              if (_sort == _SortMode.pourVous) _sort = _SortMode.popularite;
                            }),
                            leading: Icon(domain.icon, size: 14, color: preferred ? AppTheme.accent500 : AppTheme.ink400),
                            label: Text(domain.name),
                          );
                        }),
                      ],
                    ),
                    if (subcategories.isNotEmpty) ...[
                      const SizedBox(height: 12),
                      HorizontalChipList(
                        children: [
                          AppChip(
                            active: _subcategoryFilter == null,
                            onTap: () => setState(() => _subcategoryFilter = null),
                            label: const Text('Tous les rayons'),
                          ),
                          ...subcategories.map(
                            (sub) => AppChip(
                              active: _subcategoryFilter == sub,
                              onTap: () => setState(() => _subcategoryFilter = sub),
                              label: Text(sub),
                            ),
                          ),
                        ],
                      ),
                    ],
                    SectionHeader(
                      title: 'Boutiques pour vous',
                      action: TextButton(
                        onPressed: () => context.go('/onboarding'),
                        child: const Text('Personnaliser', style: TextStyle(fontSize: 11, fontWeight: FontWeight.w700)),
                      ),
                    ),
                    SizedBox(
                      height: 210,
                      child: ListView.separated(
                        scrollDirection: Axis.horizontal,
                        padding: const EdgeInsets.symmetric(horizontal: 16),
                        itemCount: stores.length,
                        separatorBuilder: (_, __) => const SizedBox(width: 12),
                        itemBuilder: (context, index) {
                          final store = stores[index];
                          return StoreCard(
                            store: store,
                            compact: true,
                            productCount: catalog.productsForStore(store.id).length,
                          );
                        },
                      ),
                    ),
                    SectionHeader(
                      title: _domainFilter == 'pour-vous'
                          ? 'Selection pour vous - ${products.length}'
                          : '${products.length} article${products.length > 1 ? 's' : ''}',
                      subtitle: _domainFilter == 'tout'
                          ? 'Tous les univers'
                          : _domainFilter == 'pour-vous'
                              ? '${prefs.domains.length} univers suivis'
                              : _subcategoryFilter ?? domainById(_domainFilter)?.name,
                    ),
                    if (products.isEmpty)
                      const Padding(
                        padding: EdgeInsets.all(24),
                        child: EmptyState(
                          icon: Icons.search_outlined,
                          title: 'Aucun resultat',
                          subtitle: 'Elargissez vos filtres ou modifiez vos preferences.',
                        ),
                      )
                    else
                      Padding(
                        padding: const EdgeInsets.symmetric(horizontal: 16),
                        child: GridView.builder(
                          shrinkWrap: true,
                          physics: const NeverScrollableScrollPhysics(),
                          gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                            crossAxisCount: 2,
                            crossAxisSpacing: 12,
                            mainAxisSpacing: 12,
                            childAspectRatio: 0.58,
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
                      ),
                    const SizedBox(height: 24),
                  ],
                ),
              ),
            ),
        ],
      ),
    );
  }

  Widget _buildHeader(BuildContext context, UserPreferences prefs, AuthProvider auth) {
    return HeroHeader(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        const Icon(Icons.location_on_outlined, size: 12, color: AppTheme.accent300),
                        const SizedBox(width: 4),
                        Text(
                          '${prefs.city} - ${prefs.radiusKm} km',
                          style: const TextStyle(
                            fontSize: 11,
                            fontWeight: FontWeight.w600,
                            letterSpacing: 1,
                            color: AppTheme.accent300,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 4),
                    const Text(
                      '18 univers de vente,\nfiltres pour vous.',
                      style: TextStyle(fontSize: 22, fontWeight: FontWeight.w800, height: 1.15),
                    ),
                  ],
                ),
              ),
              if (auth.isAuthenticated)
                Material(
                  color: AppTheme.ink800,
                  borderRadius: BorderRadius.circular(999),
                  child: InkWell(
                    onTap: () => context.go('/client/parametres'),
                    borderRadius: BorderRadius.circular(999),
                    child: Padding(
                      padding: const EdgeInsets.fromLTRB(4, 4, 12, 4),
                      child: Row(
                        children: [
                          CircleAvatar(
                            radius: 16,
                            backgroundColor: Colors.white,
                            child: Text(
                              auth.user!.initials,
                              style: const TextStyle(color: AppTheme.ink900, fontSize: 11, fontWeight: FontWeight.w800),
                            ),
                          ),
                          const SizedBox(width: 6),
                          const Icon(Icons.cloud_done_outlined, size: 14, color: AppTheme.emerald400),
                        ],
                      ),
                    ),
                  ),
                )
              else
                Material(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(999),
                  child: InkWell(
                    onTap: () => context.go('/auth'),
                    borderRadius: BorderRadius.circular(999),
                    child: const Padding(
                      padding: EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Icon(Icons.login, size: 14, color: AppTheme.ink900),
                          SizedBox(width: 6),
                          Text(
                            'Se connecter',
                            style: TextStyle(color: AppTheme.ink900, fontWeight: FontWeight.w700, fontSize: 13),
                          ),
                        ],
                      ),
                    ),
                  ),
                ),
            ],
          ),
          const SizedBox(height: 16),
          Row(
            children: [
              Expanded(
                child: TextField(
                  controller: _searchController,
                  style: const TextStyle(color: AppTheme.ink900),
                  decoration: InputDecoration(
                    hintText: 'Ciment, scooter, cafe, collier...',
                    hintStyle: const TextStyle(color: AppTheme.ink300),
                    filled: true,
                    fillColor: Colors.white,
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(12),
                      borderSide: BorderSide.none,
                    ),
                    contentPadding: const EdgeInsets.symmetric(vertical: 12),
                    prefixIcon: const Icon(Icons.search, color: AppTheme.ink400, size: 20),
                  ),
                  onSubmitted: (_) => setState(() {}),
                ),
              ),
              const SizedBox(width: 8),
              Material(
                color: AppTheme.ink700,
                borderRadius: BorderRadius.circular(12),
                child: InkWell(
                  onTap: () => setState(() => _filtersOpen = !_filtersOpen),
                  borderRadius: BorderRadius.circular(12),
                  child: SizedBox(
                    width: 40,
                    height: 40,
                    child: Icon(
                      _filtersOpen ? Icons.close : Icons.tune,
                      color: Colors.white,
                      size: 18,
                    ),
                  ),
                ),
              ),
            ],
          ),
          if (!auth.isAuthenticated) ...[
            const SizedBox(height: 12),
            Material(
              color: Colors.white,
              borderRadius: BorderRadius.circular(12),
              child: InkWell(
                onTap: () => context.go('/auth'),
                borderRadius: BorderRadius.circular(12),
                child: Padding(
                  padding: const EdgeInsets.all(10),
                  child: Row(
                    children: [
                      Container(
                        width: 32,
                        height: 32,
                        decoration: BoxDecoration(
                          color: AppTheme.sand100,
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: const Icon(Icons.mail_outline, size: 16, color: AppTheme.ink700),
                      ),
                      const SizedBox(width: 10),
                      const Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              'Connecter mon compte Gmail',
                              style: TextStyle(fontSize: 12, fontWeight: FontWeight.w800, color: AppTheme.ink900),
                            ),
                            Text(
                              'Tickets, preferences, favoris et panier synchronises',
                              style: TextStyle(fontSize: 11, color: AppTheme.ink400),
                            ),
                          ],
                        ),
                      ),
                      Text(
                        'Activer',
                        style: TextStyle(fontSize: 11, fontWeight: FontWeight.w800, color: AppTheme.accent600),
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ],
          AnimatedCrossFade(
            firstChild: const SizedBox.shrink(),
            secondChild: _buildFilterPanel(prefs),
            crossFadeState: _filtersOpen ? CrossFadeState.showSecond : CrossFadeState.showFirst,
            duration: const Duration(milliseconds: 220),
          ),
        ],
      ),
    );
  }

  Widget _buildFilterPanel(UserPreferences prefs) {
    return Container(
      margin: const EdgeInsets.only(top: 12),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: AppTheme.ink800,
        borderRadius: BorderRadius.circular(12),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'TRIER PAR',
            style: TextStyle(fontSize: 11, fontWeight: FontWeight.w700, letterSpacing: 1, color: AppTheme.ink300),
          ),
          const SizedBox(height: 8),
          Wrap(
            spacing: 6,
            runSpacing: 6,
            children: [
              _sortChip('Recommande', _SortMode.pourVous),
              _sortChip('Popularite', _SortMode.popularite),
              _sortChip('Mieux notes', _SortMode.note),
              _sortChip('Prix croissant', _SortMode.prixAsc),
              _sortChip('Prix decroissant', _SortMode.prixDesc),
            ],
          ),
          const SizedBox(height: 12),
          Wrap(
            spacing: 6,
            runSpacing: 6,
            children: [
              _toggleChip('En stock', _stockOnly, () => setState(() => _stockOnly = !_stockOnly)),
              _toggleChip('En promotion', _promoOnly, () => setState(() => _promoOnly = !_promoOnly)),
              _toggleChip('Dans mon budget', _respectBudget, () => setState(() => _respectBudget = !_respectBudget)),
            ],
          ),
          const SizedBox(height: 8),
          TextButton.icon(
            onPressed: () => context.go('/onboarding'),
            icon: const Icon(Icons.auto_awesome_outlined, size: 14, color: AppTheme.ink100),
            label: const Text('Modifier mes preferences', style: TextStyle(color: AppTheme.ink100, fontWeight: FontWeight.w700)),
          ),
        ],
      ),
    );
  }

  Widget _sortChip(String label, _SortMode mode) {
    final active = _sort == mode;
    return ActionChip(
      label: Text(label),
      onPressed: () => setState(() => _sort = mode),
      backgroundColor: active ? AppTheme.accent500 : AppTheme.ink700,
      labelStyle: TextStyle(
        color: active ? Colors.white : AppTheme.ink200,
        fontWeight: FontWeight.w700,
        fontSize: 12,
      ),
      side: BorderSide.none,
      padding: const EdgeInsets.symmetric(horizontal: 4),
    );
  }

  Widget _toggleChip(String label, bool active, VoidCallback onTap) {
    return ActionChip(
      label: Text(label),
      onPressed: onTap,
      backgroundColor: active ? Colors.white : AppTheme.ink700,
      labelStyle: TextStyle(
        color: active ? AppTheme.ink900 : AppTheme.ink200,
        fontWeight: FontWeight.w700,
        fontSize: 12,
      ),
      side: BorderSide.none,
      padding: const EdgeInsets.symmetric(horizontal: 4),
    );
  }
}
