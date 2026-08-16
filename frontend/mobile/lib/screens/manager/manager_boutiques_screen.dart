import 'dart:io';

import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

import '../../core/theme/app_theme.dart';
import '../../core/utils/formatters.dart';
import '../../data/demo/demo_accounts.dart';
import '../../data/demo/demo_analytics.dart';
import '../../data/demo/demo_images.dart';
import '../../data/models/product.dart';
import '../../data/models/preferences.dart';
import '../../data/models/store.dart';
import '../../providers/catalog_provider.dart';
import '../../providers/orders_provider.dart';
import '../../widgets/app_layout.dart';
import '../../widgets/common_widgets.dart';
import '../../widgets/opening_hours_editor.dart';
import '../../widgets/stat_card.dart';
import '../../widgets/top_bar.dart';

class ManagerStoresScreen extends StatefulWidget {
  const ManagerStoresScreen({super.key});

  @override
  State<ManagerStoresScreen> createState() => _ManagerStoresScreenState();
}

class _ManagerStoresScreenState extends State<ManagerStoresScreen> {
  String _filtre = 'tous';
  String _query = '';
  final _searchController = TextEditingController();

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<CatalogProvider>().loadFeed();
      context.read<OrdersProvider>().loadOrders();
    });
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  List<StoreModel> _filtered(List<StoreModel> stores) {
    final q = _query.trim().toLowerCase();
    return stores.where((b) {
      final statusOk = _filtre == 'tous' || b.status == _filtre;
      if (!statusOk) return false;
      if (q.isEmpty) return true;
      return b.name.toLowerCase().contains(q) ||
          b.city.toLowerCase().contains(q) ||
          (b.address?.toLowerCase().contains(q) ?? false);
    }).toList();
  }

  @override
  Widget build(BuildContext context) {
    final catalog = context.watch<CatalogProvider>();
    final orders = context.watch<OrdersProvider>();
    final liste = _filtered(catalog.stores);

    return Scaffold(
      backgroundColor: AppTheme.contentBackground(context),
      appBar: TopBar(
        title: 'Mes boutiques',
        subtitle: '${catalog.stores.length} point(s) de vente',
        showBack: false,
        fallbackRoute: '/manager',
        action: TextButton.icon(
          onPressed: () => context.push('/manager/boutiques/nouvelle'),
          icon: const Icon(Icons.add, size: 18),
          label: const Text('Créer'),
        ),
      ),
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 8, 16, 0),
            child: TextField(
              controller: _searchController,
              onChanged: (v) => setState(() => _query = v),
              decoration: InputDecoration(
                hintText: 'Rechercher une boutique ou une ville',
                prefixIcon: const Icon(Icons.search, size: 20),
                suffixIcon: _query.isEmpty
                    ? null
                    : IconButton(
                        icon: const Icon(Icons.clear, size: 18),
                        onPressed: () {
                          _searchController.clear();
                          setState(() => _query = '');
                        },
                      ),
              ),
            ),
          ),
          const SizedBox(height: 10),
          SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            padding: const EdgeInsets.symmetric(horizontal: 16),
            child: Row(
              children: [
                for (final f in const [
                  ('tous', 'Toutes'),
                  ('active', 'Actives'),
                  ('pause', 'En pause'),
                  ('brouillon', 'Brouillons'),
                ]) ...[
                  Padding(
                    padding: const EdgeInsets.only(right: 8),
                    child: AppChip(
                      label: Text(f.$2),
                      active: _filtre == f.$1,
                      bold: true,
                      onTap: () => setState(() => _filtre = f.$1),
                    ),
                  ),
                ],
              ],
            ),
          ),
          const SizedBox(height: 8),
          Expanded(
            child: catalog.loading && catalog.stores.isEmpty
                ? const LoadingView()
                : liste.isEmpty
                    ? EmptyState(
                        icon: Icons.store_outlined,
                        title: 'Aucune boutique',
                        subtitle: _query.isNotEmpty || _filtre != 'tous'
                            ? 'Aucun résultat pour ce filtre.'
                            : 'Créez votre première boutique pour commencer à vendre.',
                        action: FilledButton(
                          onPressed: () => context.push('/manager/boutiques/nouvelle'),
                          child: const Text('Créer une boutique'),
                        ),
                      )
                    : RefreshIndicator(
                        onRefresh: () async {
                          await catalog.loadFeed();
                          await orders.loadOrders();
                        },
                        child: ListView.separated(
                          padding: const EdgeInsets.fromLTRB(16, 8, 16, 24),
                          itemCount: liste.length,
                          separatorBuilder: (_, _) => const SizedBox(height: 10),
                          itemBuilder: (context, index) {
                            final store = liste[index];
                            final products = catalog.productsForStore(store.id);
                            final team = demoSellers.where((s) => s.storeId == store.id).length;
                            final ca = products.fold<double>(
                              0,
                              (s, p) => s + p.displayPrice * estimatedSales(p, orders.orders),
                            );
                            return _ManagerStoreListTile(
                              store: store,
                              productCount: products.length,
                              teamCount: team,
                              ca: ca,
                              onTap: () => context.push('/manager/boutiques/${store.id}'),
                            );
                          },
                        ),
                      ),
          ),
        ],
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () => context.push('/manager/boutiques/nouvelle'),
        icon: const Icon(Icons.add_business_outlined),
        label: const Text('Nouvelle'),
        backgroundColor: AppTheme.accent500,
      ),
    );
  }
}

class _ManagerStoreListTile extends StatelessWidget {
  const _ManagerStoreListTile({
    required this.store,
    required this.productCount,
    required this.teamCount,
    required this.ca,
    required this.onTap,
  });

  final StoreModel store;
  final int productCount;
  final int teamCount;
  final double ca;
  final VoidCallback onTap;

  Color get _badgeBg {
    if (store.isActive) return const Color(0xFFECFDF5);
    if (store.isPaused) return const Color(0xFFFFFBEB);
    return AppTheme.ink50;
  }

  Color get _badgeFg {
    if (store.isActive) return AppTheme.emerald600;
    if (store.isPaused) return const Color(0xFFD97706);
    return AppTheme.ink500;
  }

  @override
  Widget build(BuildContext context) {
    final cover = store.coverUrl ?? storeCoverUrl(storeId: store.id, mainCategory: store.mainCategory);
    final domain = domainById(store.mainCategory ?? '');

    return Material(
      color: Theme.of(context).cardColor,
      borderRadius: BorderRadius.circular(16),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(16),
        child: Container(
          decoration: AppTheme.cardDecoration(context),
          padding: const EdgeInsets.all(12),
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              ClipRRect(
                borderRadius: BorderRadius.circular(12),
                child: SizedBox(
                  width: 80,
                  height: 80,
                  child: CachedNetworkImage(
                    imageUrl: cover,
                    fit: BoxFit.cover,
                    placeholder: (_, _) => Container(color: AppTheme.ink50),
                    errorWidget: (_, _, _) => Container(
                      color: AppTheme.ink50,
                      child: const Icon(Icons.store_outlined, color: AppTheme.ink300),
                    ),
                  ),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Expanded(
                          child: Text(
                            store.name,
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                            style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w800),
                          ),
                        ),
                        const SizedBox(width: 6),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                          decoration: BoxDecoration(color: _badgeBg, borderRadius: BorderRadius.circular(999)),
                          child: Text(
                            store.statusLabel,
                            style: TextStyle(fontSize: 10, fontWeight: FontWeight.w800, color: _badgeFg),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 4),
                    Row(
                      children: [
                        const Icon(Icons.location_on_outlined, size: 12, color: AppTheme.ink400),
                        const SizedBox(width: 2),
                        Expanded(
                          child: Text(
                            '${store.address ?? ''}${store.address != null ? ', ' : ''}${store.city}',
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                            style: const TextStyle(fontSize: 11, color: AppTheme.ink400),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 4),
                    Row(
                      children: [
                        StarRating(rating: store.note, size: 13),
                        Text(
                          ' (${store.avis})',
                          style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w600, color: AppTheme.ink400),
                        ),
                      ],
                    ),
                    const SizedBox(height: 4),
                    Text(
                      '${domain?.name ?? store.mainCategory ?? 'Commerce'} · ${store.categories.length}/7 cat. · ${store.categories.take(2).join(', ')}${store.categories.length > 2 ? '…' : ''}',
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w700, color: AppTheme.accent600),
                    ),
                    const SizedBox(height: 6),
                    Row(
                      children: [
                        Flexible(
                          child: Text(
                            '$productCount articles',
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                            style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w600, color: AppTheme.ink500),
                          ),
                        ),
                        const SizedBox(width: 8),
                        const Icon(Icons.groups_outlined, size: 12, color: AppTheme.ink400),
                        const SizedBox(width: 2),
                        Text('$teamCount', style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w600, color: AppTheme.ink500)),
                        const SizedBox(width: 8),
                        Flexible(
                          child: Text(
                            '${formatMontantCourt(ca)} F',
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                            textAlign: TextAlign.right,
                            style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w800),
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
}

class ManagerStoreDetailScreen extends StatefulWidget {
  const ManagerStoreDetailScreen({super.key, required this.storeId});

  final String storeId;

  @override
  State<ManagerStoreDetailScreen> createState() => _ManagerStoreDetailScreenState();
}

class _ManagerStoreDetailScreenState extends State<ManagerStoreDetailScreen> {
  bool _mdpVisible = false;
  bool _busy = false;
  String _catalogFilter = 'tous';

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<CatalogProvider>().loadFeed();
      context.read<OrdersProvider>().loadOrders();
    });
  }

  Future<void> _regenerer(CatalogProvider catalog, StoreModel store) async {
    setState(() => _busy = true);
    final code = await catalog.regenerateAccessCode(store.id);
    if (!mounted) return;
    setState(() {
      _busy = false;
      _mdpVisible = true;
    });
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text('Nouveau code généré : $code')),
    );
  }

  Future<void> _changerStatut(CatalogProvider catalog, String status) async {
    setState(() => _busy = true);
    await catalog.updateStoreStatus(widget.storeId, status);
    if (!mounted) return;
    setState(() => _busy = false);
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('Statut mis à jour.')),
    );
  }

  Future<void> _supprimer(CatalogProvider catalog, StoreModel store) async {
    final ok = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Supprimer la boutique ?'),
        content: Text('« ${store.name} » sera retirée de votre réseau. Cette action est irréversible en démo.'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Annuler')),
          FilledButton(
            onPressed: () => Navigator.pop(ctx, true),
            style: FilledButton.styleFrom(backgroundColor: const Color(0xFFDC2626)),
            child: const Text('Supprimer'),
          ),
        ],
      ),
    );
    if (ok != true) return;
    await catalog.deleteStore(store.id);
    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('Boutique supprimée.')),
    );
    context.go('/manager/boutiques');
  }

  Future<void> _ajouterPhotosDemo(CatalogProvider catalog, StoreModel store) async {
    final extras = storePhotoUrls(storeId: store.id, mainCategory: store.mainCategory);
    final merged = [...store.photos];
    for (final u in extras) {
      if (merged.length >= 5) break;
      if (!merged.contains(u)) merged.add(u);
    }
    await catalog.patchStore(store.id, (s) => s.copyWith(photos: merged, logoUrl: merged.isNotEmpty ? merged.first : s.logoUrl));
    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Photos mises à jour.')));
    }
  }

  Future<void> _editerHoraires(CatalogProvider catalog, StoreModel store) async {
    var draft = List<OpeningHoursDay>.from(store.horaires);
    final ok = await showModalBottomSheet<bool>(
      context: context,
      isScrollControlled: true,
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setModal) => Padding(
          padding: EdgeInsets.only(bottom: MediaQuery.viewInsetsOf(ctx).bottom),
          child: SafeArea(
            child: SingleChildScrollView(
              padding: const EdgeInsets.all(16),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  const Text('Horaires', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w800)),
                  const SizedBox(height: 12),
                  OpeningHoursEditor(
                    hours: draft,
                    onChanged: (h) => setModal(() => draft = h),
                  ),
                  const SizedBox(height: 16),
                  FilledButton(
                    onPressed: () => Navigator.pop(ctx, true),
                    child: const Text('Enregistrer'),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
    if (ok == true) {
      await catalog.patchStore(store.id, (s) => s.copyWith(openingHours: draft));
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Horaires mis à jour.')));
      }
    }
  }

  Future<void> _editerInfos(CatalogProvider catalog, StoreModel store) async {
    final phone = TextEditingController(text: store.phone ?? '');
    final email = TextEditingController(text: store.email ?? '');
    final address = TextEditingController(text: store.address ?? '');
    final cats = TextEditingController(text: store.categories.join(', '));
    final ok = await showModalBottomSheet<bool>(
      context: context,
      isScrollControlled: true,
      builder: (ctx) => Padding(
        padding: EdgeInsets.only(bottom: MediaQuery.viewInsetsOf(ctx).bottom),
        child: SafeArea(
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(16),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                const Text('Coordonnées & catégories', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w800)),
                const SizedBox(height: 12),
                TextField(controller: address, decoration: const InputDecoration(labelText: 'Adresse')),
                const SizedBox(height: 8),
                TextField(controller: phone, decoration: const InputDecoration(labelText: 'Téléphone')),
                const SizedBox(height: 8),
                TextField(controller: email, decoration: const InputDecoration(labelText: 'E-mail')),
                const SizedBox(height: 8),
                TextField(
                  controller: cats,
                  decoration: const InputDecoration(
                    labelText: 'Catégories',
                    helperText: 'Séparées par des virgules (max 7)',
                  ),
                ),
                const SizedBox(height: 16),
                FilledButton(onPressed: () => Navigator.pop(ctx, true), child: const Text('Enregistrer')),
              ],
            ),
          ),
        ),
      ),
    );
    if (ok == true) {
      final categories = cats.text
          .split(',')
          .map((e) => e.trim())
          .where((e) => e.isNotEmpty)
          .take(7)
          .toList();
      await catalog.patchStore(
        store.id,
        (s) => s.copyWith(
          address: address.text.trim(),
          phone: phone.text.trim(),
          email: email.text.trim(),
          categories: categories.isEmpty ? s.categories : categories,
        ),
      );
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Boutique mise à jour.')));
      }
    }
    phone.dispose();
    email.dispose();
    address.dispose();
    cats.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final catalog = context.watch<CatalogProvider>();
    final orders = context.watch<OrdersProvider>();
    final store = catalog.storeById(widget.storeId);

    if (store == null) {
      return Scaffold(
        appBar: const TopBar(title: 'Boutique', fallbackRoute: '/manager/boutiques'),
        body: EmptyState(
          icon: Icons.store_outlined,
          title: 'Boutique introuvable',
          action: FilledButton(
            onPressed: () => context.go('/manager/boutiques'),
            child: const Text('Retour'),
          ),
        ),
      );
    }

    final products = catalog.productsForStore(store.id);
    final equipe = demoSellers.where((s) => s.storeId == store.id).toList();
    final marge = margeGlobale(products: products, orders: orders.orders);
    final encaisse = orders.orders
        .where((o) => o.storeId == store.id && (o.status == 'redeemed' || o.status == 'confirmed'))
        .fold<double>(0, (s, o) => s + o.total);
    final stockBas = products.where((p) => p.stock <= 5).toList();
    final code = catalog.accessCodeFor(store.id);
    final cover = store.coverUrl ?? storeCoverUrl(storeId: store.id, mainCategory: store.mainCategory);
    final domain = domainById(store.mainCategory ?? '');
    final created = store.createdAt ?? DateTime(2025, 11, 1).add(Duration(days: store.id.hashCode.abs() % 200));

    final filteredProducts = products.where((p) {
      if (_catalogFilter == 'critique') return p.stock <= 5;
      if (_catalogFilter == 'rupture') return p.stock == 0;
      return true;
    }).toList();

    return Scaffold(
      backgroundColor: AppTheme.contentBackground(context),
      appBar: TopBar(
        title: store.name,
        subtitle: 'Créée le ${formatDate(created)}',
        fallbackRoute: '/manager/boutiques',
        action: IconButton(
          tooltip: 'Voir côté client',
          icon: const Icon(Icons.visibility_outlined),
          onPressed: () => context.push('/client/boutique/${store.id}'),
        ),
      ),
      body: ListView(
        children: [
          SizedBox(
            height: 148,
            width: double.infinity,
            child: CachedNetworkImage(
              imageUrl: cover,
              fit: BoxFit.cover,
              placeholder: (_, _) => Container(color: AppTheme.ink100),
              errorWidget: (_, _, _) => Container(color: AppTheme.ink100, child: const Icon(Icons.store)),
            ),
          ),
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 16, 16, 32),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Row(
                  children: [
                    Expanded(child: StarRating(rating: store.note)),
                    Text('(${store.avis} avis)', style: const TextStyle(fontSize: 11, color: AppTheme.ink400)),
                    const SizedBox(width: 8),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                      decoration: BoxDecoration(
                        color: store.isActive
                            ? const Color(0xFFECFDF5)
                            : store.isPaused
                                ? const Color(0xFFFFFBEB)
                                : AppTheme.ink50,
                        borderRadius: BorderRadius.circular(999),
                      ),
                      child: Text(
                        store.statusLabel,
                        style: TextStyle(
                          fontSize: 11,
                          fontWeight: FontWeight.w800,
                          color: store.isActive
                              ? AppTheme.emerald600
                              : store.isPaused
                                  ? const Color(0xFFD97706)
                                  : AppTheme.ink500,
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 14),
                GridView.count(
                  crossAxisCount: 2,
                  shrinkWrap: true,
                  physics: const NeverScrollableScrollPhysics(),
                  crossAxisSpacing: 10,
                  mainAxisSpacing: 10,
                  childAspectRatio: 1.45,
                  children: [
                    StatCard(
                      label: 'CA cumulé',
                      value: '${formatMontantCourt(marge.ca)} F',
                      icon: Icons.payments_outlined,
                      tone: StatTone.success,
                    ),
                    StatCard(
                      label: 'Marge brute',
                      value: '${formatMontantCourt(marge.marge)} F',
                      delta: '${marge.tauxMarge} % du CA',
                      icon: Icons.trending_up,
                      tone: StatTone.success,
                    ),
                    StatCard(
                      label: 'Encaissé via QR',
                      value: '${formatMontantCourt(encaisse)} F',
                      icon: Icons.qr_code_2_outlined,
                      tone: StatTone.info,
                    ),
                    StatCard(
                      label: 'Articles',
                      value: '${products.length}',
                      icon: Icons.inventory_2_outlined,
                    ),
                    StatCard(
                      label: 'Vendeurs',
                      value: '${equipe.length}',
                      icon: Icons.groups_outlined,
                      onTap: () => context.go('/manager/equipe'),
                    ),
                    StatCard(
                      label: 'Stock critique',
                      value: '${stockBas.length}',
                      icon: Icons.warning_amber_outlined,
                      tone: stockBas.isEmpty ? StatTone.neutral : StatTone.warning,
                      onTap: () => setState(() => _catalogFilter = 'critique'),
                    ),
                  ],
                ),
                const SizedBox(height: 18),
                _SectionCard(
                  title: 'Accès vendeurs',
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
                        decoration: BoxDecoration(
                          color: AppTheme.ink900,
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: Row(
                          children: [
                            const Icon(Icons.key_outlined, color: AppTheme.accent300, size: 18),
                            const SizedBox(width: 10),
                            Expanded(
                              child: Text(
                                _mdpVisible ? code : '•••••••••••',
                                style: const TextStyle(
                                  color: Colors.white,
                                  fontFamily: 'monospace',
                                  fontWeight: FontWeight.w800,
                                  letterSpacing: 2,
                                  fontSize: 14,
                                ),
                              ),
                            ),
                            IconButton(
                              tooltip: _mdpVisible ? 'Masquer' : 'Afficher',
                              onPressed: () => setState(() => _mdpVisible = !_mdpVisible),
                              icon: Icon(
                                _mdpVisible ? Icons.visibility_off_outlined : Icons.visibility_outlined,
                                color: AppTheme.ink300,
                                size: 18,
                              ),
                            ),
                            IconButton(
                              tooltip: 'Copier',
                              onPressed: () async {
                                await Clipboard.setData(ClipboardData(text: code));
                                if (context.mounted) {
                                  ScaffoldMessenger.of(context).showSnackBar(
                                    const SnackBar(content: Text('Mot de passe copié')),
                                  );
                                }
                              },
                              icon: const Icon(Icons.copy_outlined, color: AppTheme.ink300, size: 18),
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(height: 10),
                      OutlinedButton.icon(
                        onPressed: _busy ? null : () => _regenerer(catalog, store),
                        icon: const Icon(Icons.refresh, size: 18),
                        label: const Text('Régénérer le mot de passe'),
                      ),
                      const SizedBox(height: 8),
                      const Text(
                        'La régénération n’affecte pas les vendeurs déjà affiliés ; elle bloque uniquement les nouvelles inscriptions avec l’ancien code.',
                        style: TextStyle(fontSize: 11, color: AppTheme.ink400, height: 1.35),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 14),
                _SectionCard(
                  title: 'Statut de la boutique',
                  child: DropdownButtonFormField<String>(
                    key: ValueKey('status-${store.status}'),
                    initialValue: store.isDraft
                        ? 'brouillon'
                        : store.isPaused
                            ? 'pause'
                            : 'active',
                    decoration: const InputDecoration(labelText: 'Visibilité'),
                    items: const [
                      DropdownMenuItem(value: 'active', child: Text('Active — visible par les clients')),
                      DropdownMenuItem(value: 'pause', child: Text('En pause — catalogue consultable, ventes suspendues')),
                      DropdownMenuItem(value: 'brouillon', child: Text('Brouillon — masquée du catalogue')),
                    ],
                    onChanged: _busy
                        ? null
                        : (v) {
                            if (v != null) _changerStatut(catalog, v);
                          },
                  ),
                ),
                const SizedBox(height: 14),
                _SectionCard(
                  title: 'Catégories vendues (${store.categories.length}/7)',
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Univers principal : ${domain?.name ?? store.mainCategory ?? '—'}',
                        style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w700, color: AppTheme.accent600),
                      ),
                      const SizedBox(height: 10),
                      Wrap(
                        spacing: 6,
                        runSpacing: 6,
                        children: [
                          for (var i = 0; i < store.categories.length; i++)
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                              decoration: BoxDecoration(
                                color: i == 0 ? AppTheme.ink900 : AppTheme.ink50,
                                borderRadius: BorderRadius.circular(999),
                              ),
                              child: Text(
                                store.categories[i],
                                style: TextStyle(
                                  fontSize: 11,
                                  fontWeight: FontWeight.w700,
                                  color: i == 0 ? Colors.white : AppTheme.ink600,
                                ),
                              ),
                            ),
                        ],
                      ),
                      const SizedBox(height: 10),
                      Text(
                        'Marge brute du catalogue : ${formatPrix(marge.marge)} (${marge.tauxMarge} % du CA)',
                        style: const TextStyle(fontSize: 11, color: AppTheme.ink400),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 14),
                const SectionHeader(title: 'Localisation', padding: EdgeInsets.zero),
                const SizedBox(height: 8),
                _StaticMap(lat: store.lat, lng: store.lng),
                const SizedBox(height: 8),
                Text(
                  '${store.address ?? ''}${store.address != null ? ', ' : ''}${store.city}, ${store.country}',
                  style: const TextStyle(fontSize: 12, color: AppTheme.ink500),
                ),
                if (store.phone != null || store.email != null) ...[
                  const SizedBox(height: 6),
                  Text(
                    [if (store.phone != null) store.phone, if (store.email != null) store.email].join(' · '),
                    style: const TextStyle(fontSize: 12, color: AppTheme.ink400),
                  ),
                ],
                if (store.photos.isNotEmpty) ...[
                  const SizedBox(height: 18),
                  SectionHeader(
                    title: 'Photos (${store.photos.length}/5)',
                    padding: EdgeInsets.zero,
                    action: TextButton(
                      onPressed: () => _ajouterPhotosDemo(catalog, store),
                      child: const Text('Ajouter'),
                    ),
                  ),
                  const SizedBox(height: 8),
                  SizedBox(
                    height: 96,
                    child: ListView.separated(
                      scrollDirection: Axis.horizontal,
                      itemCount: store.photos.length.clamp(0, 5),
                      separatorBuilder: (_, _) => const SizedBox(width: 8),
                      itemBuilder: (context, i) => Stack(
                        children: [
                          ClipRRect(
                            borderRadius: BorderRadius.circular(12),
                            child: store.photos[i].startsWith('http')
                                ? CachedNetworkImage(
                                    imageUrl: store.photos[i],
                                    width: 96,
                                    height: 96,
                                    fit: BoxFit.cover,
                                  )
                                : Image.file(
                                    File(store.photos[i]),
                                    width: 96,
                                    height: 96,
                                    fit: BoxFit.cover,
                                  ),
                          ),
                          if (i == 0)
                            Positioned(
                              left: 4,
                              bottom: 4,
                              child: Container(
                                padding: const EdgeInsets.symmetric(horizontal: 5, vertical: 2),
                                decoration: BoxDecoration(color: Colors.black87, borderRadius: BorderRadius.circular(4)),
                                child: const Text('Couverture', style: TextStyle(color: Colors.white, fontSize: 8, fontWeight: FontWeight.w800)),
                              ),
                            ),
                        ],
                      ),
                    ),
                  ),
                ] else ...[
                  const SizedBox(height: 18),
                  OutlinedButton.icon(
                    onPressed: () => _ajouterPhotosDemo(catalog, store),
                    icon: const Icon(Icons.add_photo_alternate_outlined),
                    label: const Text('Ajouter des photos (démo)'),
                  ),
                ],
                const SizedBox(height: 18),
                const SectionHeader(title: 'Horaires d’ouverture', padding: EdgeInsets.zero),
                const SizedBox(height: 8),
                OpeningHoursView(hours: store.horaires),
                TextButton(
                  onPressed: () => _editerHoraires(catalog, store),
                  child: const Text('Modifier les horaires'),
                ),
                const SizedBox(height: 8),
                SectionHeader(
                  title: 'Équipe (${equipe.length})',
                  padding: EdgeInsets.zero,
                  action: TextButton(
                    onPressed: () => context.go('/manager/equipe'),
                    child: const Text('Gérer'),
                  ),
                ),
                const SizedBox(height: 8),
                Container(
                  decoration: AppTheme.cardDecoration(context),
                  child: equipe.isEmpty
                      ? const Padding(
                          padding: EdgeInsets.all(20),
                          child: Text('Aucun vendeur affilié.', textAlign: TextAlign.center, style: TextStyle(color: AppTheme.ink400)),
                        )
                      : Column(
                          children: [
                            for (var i = 0; i < equipe.length; i++) ...[
                              if (i > 0) const Divider(height: 1),
                              ListTile(
                                leading: CircleAvatar(
                                  backgroundColor: AppTheme.ink900,
                                  child: Text(
                                    equipe[i].initials,
                                    style: const TextStyle(color: Colors.white, fontSize: 12, fontWeight: FontWeight.w800),
                                  ),
                                ),
                                title: Text(
                                  '${equipe[i].firstName} ${equipe[i].lastName}',
                                  style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 13),
                                ),
                                subtitle: Row(
                                  children: [
                                    StarRating(rating: equipe[i].note, size: 11),
                                    const SizedBox(width: 6),
                                    Text(
                                      '${equipe[i].scansConfirmes} scans',
                                      style: const TextStyle(fontSize: 10, color: AppTheme.ink400),
                                    ),
                                  ],
                                ),
                                trailing: Text(
                                  equipe[i].statusLabel,
                                  style: TextStyle(
                                    fontSize: 11,
                                    fontWeight: FontWeight.w800,
                                    color: equipe[i].isActive
                                        ? AppTheme.emerald600
                                        : equipe[i].isPending
                                            ? const Color(0xFFD97706)
                                            : const Color(0xFFDC2626),
                                  ),
                                ),
                              ),
                            ],
                          ],
                        ),
                ),
                TextButton(
                  onPressed: () => _editerInfos(catalog, store),
                  child: const Text('Modifier coordonnées & catégories'),
                ),
                const SizedBox(height: 18),
                SectionHeader(title: 'Catalogue (${products.length})', padding: EdgeInsets.zero),
                const SizedBox(height: 8),
                SingleChildScrollView(
                  scrollDirection: Axis.horizontal,
                  child: Row(
                    children: [
                      for (final f in const [
                        ('tous', 'Tous'),
                        ('critique', 'Stock bas'),
                        ('rupture', 'Rupture'),
                      ])
                        Padding(
                          padding: const EdgeInsets.only(right: 8),
                          child: AppChip(
                            label: Text(f.$2),
                            active: _catalogFilter == f.$1,
                            bold: true,
                            onTap: () => setState(() => _catalogFilter = f.$1),
                          ),
                        ),
                    ],
                  ),
                ),
                const SizedBox(height: 8),
                Container(
                  decoration: AppTheme.cardDecoration(context),
                  child: filteredProducts.isEmpty
                      ? const Padding(
                          padding: EdgeInsets.all(20),
                          child: Text('Aucun article.', textAlign: TextAlign.center, style: TextStyle(color: AppTheme.ink400)),
                        )
                      : Column(
                          children: [
                            for (var i = 0; i < filteredProducts.length; i++) ...[
                              if (i > 0) const Divider(height: 1, indent: 56),
                              _CatalogProductTile(
                                product: filteredProducts[i],
                                ventes: estimatedSales(filteredProducts[i], orders.orders),
                              ),
                            ],
                          ],
                        ),
                ),
                if (stockBas.isNotEmpty) ...[
                  const SizedBox(height: 10),
                  Text(
                    '${stockBas.length} article(s) nécessitent un réapprovisionnement.',
                    style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: Color(0xFFB45309)),
                  ),
                ],
                const SizedBox(height: 18),
                Wrap(
                  spacing: 8,
                  runSpacing: 8,
                  children: [
                    if (store.pickup)
                      const Chip(avatar: Icon(Icons.storefront_outlined, size: 16), label: Text('Retrait')),
                    if (store.delivery)
                      Chip(
                        avatar: const Icon(Icons.local_shipping_outlined, size: 16),
                        label: Text('Livraison${store.serviceRadiusKm != null ? ' · ${store.serviceRadiusKm!.round()} km' : ''}'),
                      ),
                    for (final m in store.paymentMethods.take(3)) Chip(label: Text(m)),
                  ],
                ),
                const SizedBox(height: 20),
                OutlinedButton.icon(
                  onPressed: _busy ? null : () => _supprimer(catalog, store),
                  icon: const Icon(Icons.delete_outline, color: Color(0xFFDC2626)),
                  label: const Text('Supprimer la boutique', style: TextStyle(color: Color(0xFFDC2626), fontWeight: FontWeight.w700)),
                  style: OutlinedButton.styleFrom(
                    minimumSize: const Size.fromHeight(52),
                    side: const BorderSide(color: Color(0xFFFECACA)),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _SectionCard extends StatelessWidget {
  const _SectionCard({required this.title, required this.child});

  final String title;
  final Widget child;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: AppTheme.cardDecoration(context),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Text(title, style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w800)),
          const SizedBox(height: 12),
          child,
        ],
      ),
    );
  }
}

class _StaticMap extends StatelessWidget {
  const _StaticMap({this.lat, this.lng});

  final double? lat;
  final double? lng;

  @override
  Widget build(BuildContext context) {
    if (lat == null || lng == null) {
      return Container(
        height: 140,
        decoration: BoxDecoration(color: AppTheme.ink100, borderRadius: BorderRadius.circular(16)),
        child: const Center(child: Text('Localisation non renseignée', style: TextStyle(color: AppTheme.ink400))),
      );
    }
    final url =
        'https://staticmap.openstreetmap.de/staticmap.php?center=$lat,$lng&zoom=14&size=640x240&maptype=mapnik&markers=$lat,$lng,red-pushpin';
    return ClipRRect(
      borderRadius: BorderRadius.circular(16),
      child: Stack(
        children: [
          CachedNetworkImage(
            imageUrl: url,
            height: 140,
            width: double.infinity,
            fit: BoxFit.cover,
            errorWidget: (_, _, _) => Container(
              height: 140,
              color: AppTheme.ink100,
              child: Center(
                child: Text(
                  '${lat!.toStringAsFixed(4)}, ${lng!.toStringAsFixed(4)}',
                  style: const TextStyle(fontWeight: FontWeight.w700),
                ),
              ),
            ),
          ),
          Positioned(
            right: 8,
            bottom: 8,
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
              decoration: BoxDecoration(color: Colors.black54, borderRadius: BorderRadius.circular(8)),
              child: Text(
                '${lat!.toStringAsFixed(3)}, ${lng!.toStringAsFixed(3)}',
                style: const TextStyle(color: Colors.white, fontSize: 10, fontWeight: FontWeight.w700),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _CatalogProductTile extends StatelessWidget {
  const _CatalogProductTile({required this.product, required this.ventes});

  final ProductModel product;
  final int ventes;

  @override
  Widget build(BuildContext context) {
    final stock = product.stock;
    final badge = stock == 0
        ? ('Rupture', const Color(0xFFFEF2F2), const Color(0xFFDC2626))
        : stock <= 5
            ? ('$stock en stock', const Color(0xFFFFFBEB), const Color(0xFFD97706))
            : ('$stock en stock', AppTheme.ink50, AppTheme.ink500);

    return ListTile(
      contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 2),
      leading: ClipRRect(
        borderRadius: BorderRadius.circular(8),
        child: SizedBox(
          width: 40,
          height: 40,
          child: product.imageUrl != null
              ? CachedNetworkImage(imageUrl: product.imageUrl!, fit: BoxFit.cover)
              : Container(color: AppTheme.ink50, child: const Icon(Icons.image_outlined, size: 18)),
        ),
      ),
      title: Text(product.name, maxLines: 1, overflow: TextOverflow.ellipsis, style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w700)),
      subtitle: Text(
        '${formatPrix(product.displayPrice)} · $ventes ventes',
        style: const TextStyle(fontSize: 11, color: AppTheme.ink400),
      ),
      trailing: Container(
        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
        decoration: BoxDecoration(color: badge.$2, borderRadius: BorderRadius.circular(999)),
        child: Text(badge.$1, style: TextStyle(fontSize: 10, fontWeight: FontWeight.w800, color: badge.$3)),
      ),
      onTap: () => context.push('/client/produit/${product.id}'),
    );
  }
}
