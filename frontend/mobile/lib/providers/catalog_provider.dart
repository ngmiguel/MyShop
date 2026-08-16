import 'dart:math';

import 'package:flutter/foundation.dart';

import '../data/demo/demo_accounts.dart';
import '../data/demo/demo_catalog.dart';
import '../data/demo/demo_images.dart';
import '../data/models/product.dart';
import '../data/models/store.dart';
import '../data/services/catalog_service.dart';
import '../data/services/store_service.dart';

class CatalogProvider extends ChangeNotifier {
  CatalogProvider(this._catalogService, this._storeService);

  final CatalogService _catalogService;
  final StoreService _storeService;

  List<ProductModel> _products = [];
  List<StoreModel> _stores = [];
  final Map<String, String> _accessCodes = {};
  bool _loading = false;
  String? _error;
  String _search = '';
  bool _demoMode = false;

  List<ProductModel> get products => _products;
  List<StoreModel> get stores => _stores;
  bool get loading => _loading;
  String? get error => _error;
  String get search => _search;
  bool get demoMode => _demoMode;

  StoreModel? storeById(String id) {
    try {
      return _stores.firstWhere((s) => s.id == id);
    } catch (_) {
      return demoStoreById(id);
    }
  }

  ProductModel? productById(String id) {
    try {
      return _products.firstWhere((p) => p.id == id);
    } catch (_) {
      return demoProductById(id);
    }
  }

  Future<void> loadFeed({String? city, String? search}) async {
    _loading = true;
    _error = null;
    _search = search ?? _search;
    notifyListeners();

    try {
      final productResponse = await _catalogService.getProducts(
        search: _search.isEmpty ? null : _search,
        limit: 80,
      );
      final storeList = await _storeService.getStores(city: city);

      if (productResponse.items.isEmpty && storeList.isEmpty) {
        _applyDemoFeed(city: city, search: _search);
      } else {
        _products = productResponse.items.map(enrichProduct).toList();
        _stores = storeList.map(enrichStore).toList();
        _demoMode = false;
        _error = null;
      }
    } catch (_) {
      _applyDemoFeed(city: city, search: _search);
    }

    _loading = false;
    notifyListeners();
  }

  void _applyDemoFeed({String? city, String? search}) {
    _stores = filterDemoStores(city: city);
    _products = filterDemoProducts(city: city, search: search);
    _demoMode = true;
    _error = null;
  }

  Future<ProductModel?> getProduct(String id) async {
    final cached = productById(id);
    if (cached != null) return cached;

    try {
      final product = await _catalogService.getProduct(id);
      return enrichProduct(product);
    } catch (_) {
      return demoProductById(id);
    }
  }

  Future<StoreModel?> getStore(String id) async {
    final cached = storeById(id);
    if (cached != null && _stores.any((s) => s.id == id)) return cached;

    try {
      final store = await _storeService.getStore(id);
      return enrichStore(store);
    } catch (_) {
      return demoStoreById(id);
    }
  }

  List<ProductModel> productsForStore(String storeId) {
    return _products.where((p) => p.storeId == storeId && p.isActive).toList();
  }

  String accessCodeFor(String storeId) {
    final cached = _accessCodes[storeId];
    if (cached != null && cached.isNotEmpty) return cached;
    final fromStore = storeById(storeId)?.accessCode;
    if (fromStore != null && fromStore.isNotEmpty) return fromStore;
    return storeAccessCode(storeId) ?? _generateAccessCode(storeById(storeId)?.name ?? 'BOUTIK');
  }

  void upsertStore(StoreModel store, {String? accessCode}) {
    final enriched = enrichStore(store);
    final idx = _stores.indexWhere((s) => s.id == enriched.id);
    if (idx >= 0) {
      _stores = [..._stores]..[idx] = enriched;
    } else {
      _stores = [enriched, ..._stores];
    }
    if (accessCode != null && accessCode.isNotEmpty) {
      _accessCodes[enriched.id] = accessCode.toUpperCase();
    }
    notifyListeners();
  }

  Future<bool> updateStoreStatus(String storeId, String status) async {
    final current = storeById(storeId);
    if (current == null) return false;
    try {
      if (!_demoMode) {
        final updated = await _storeService.updateStore(storeId, {'status': status});
        upsertStore(enrichStore(updated));
        return true;
      }
    } catch (_) {
      // fallback local
    }
    upsertStore(current.copyWith(status: status));
    return true;
  }

  Future<String> regenerateAccessCode(String storeId) async {
    try {
      if (!_demoMode) {
        final code = await _storeService.regenerateAccessCode(storeId);
        if (code.isNotEmpty) {
          _accessCodes[storeId] = code;
          notifyListeners();
          return code;
        }
      }
    } catch (_) {
      // fallback local
    }
    final store = storeById(storeId);
    final code = _generateAccessCode(store?.name ?? 'BOUTIK');
    _accessCodes[storeId] = code;
    if (store != null) upsertStore(store.copyWith(accessCode: code));
    notifyListeners();
    return code;
  }

  Future<bool> deleteStore(String storeId) async {
    try {
      if (!_demoMode) {
        await _storeService.updateStore(storeId, {'status': 'deleted'});
      }
    } catch (_) {
      // local delete anyway in demo / offline
    }
    _stores = _stores.where((s) => s.id != storeId).toList();
    _accessCodes.remove(storeId);
    notifyListeners();
    return true;
  }

  Future<bool> patchStore(String storeId, StoreModel Function(StoreModel) patch) async {
    final current = storeById(storeId);
    if (current == null) return false;
    final next = patch(current);
    try {
      if (!_demoMode) {
        final updated = await _storeService.updateStore(storeId, {
          'name': next.name,
          'tagline': next.tagline,
          'description': next.description,
          'address': next.address,
          'city': next.city,
          'country': next.country,
          'phone': next.phone,
          'email': next.email,
          'whatsapp': next.whatsapp,
          'status': next.status,
          'mainCategory': next.mainCategory,
          'categories': next.categories,
          'tags': next.tags,
          'delivery': next.delivery,
          'pickup': next.pickup,
          'lat': next.lat,
          'lng': next.lng,
          'serviceRadiusKm': next.serviceRadiusKm,
          'deliveryFee': next.deliveryFee,
          'paymentMethods': next.paymentMethods,
          'currency': next.currency,
          'photos': next.photos,
          'openingHours': next.openingHours.map((h) => h.toJson()).toList(),
        });
        upsertStore(enrichStore(updated));
        return true;
      }
    } catch (_) {}
    upsertStore(next);
    return true;
  }

  Future<StoreModel> createStoreLocally(Map<String, dynamic> payload, {String? accessCode}) async {
    try {
      if (!_demoMode) {
        final created = await _storeService.createStore(payload);
        final enriched = enrichStore(created);
        upsertStore(enriched, accessCode: accessCode ?? created.accessCode);
        return enriched;
      }
    } catch (_) {
      // demo create below
    }

    final name = (payload['name'] as String?)?.trim() ?? 'Nouvelle boutique';
    final id = 'local-store-${DateTime.now().millisecondsSinceEpoch}';
    final code = (accessCode ?? payload['accessCode'] as String? ?? _generateAccessCode(name)).toUpperCase();
    final hoursRaw = payload['openingHours'];
    final hours = hoursRaw is List
        ? hoursRaw.map((e) => OpeningHoursDay.fromJson(Map<String, dynamic>.from(e as Map))).toList()
        : defaultOpeningHours();
    final photos = (payload['photos'] as List?)?.cast<String>() ?? <String>[];

    final store = enrichStore(
      StoreModel(
        id: id,
        name: name,
        city: payload['city'] as String? ?? 'Douala',
        tagline: payload['tagline'] as String?,
        description: payload['description'] as String?,
        address: payload['address'] as String?,
        phone: payload['phone'] as String?,
        email: payload['email'] as String?,
        whatsapp: payload['whatsapp'] as String?,
        status: payload['status'] as String? ?? 'active',
        mainCategory: payload['mainCategory'] as String? ?? 'agro',
        categories: (payload['categories'] as List?)?.cast<String>() ?? const [],
        tags: (payload['tags'] as List?)?.cast<String>() ?? const [],
        delivery: payload['delivery'] as bool? ?? false,
        pickup: payload['pickup'] as bool? ?? true,
        lat: (payload['lat'] as num?)?.toDouble(),
        lng: (payload['lng'] as num?)?.toDouble(),
        serviceRadiusKm: (payload['serviceRadiusKm'] as num?)?.toDouble(),
        deliveryFee: (payload['deliveryFee'] as num?)?.toDouble(),
        country: payload['country'] as String? ?? 'Cameroun',
        createdAt: DateTime.now(),
        accessCode: code,
        paymentMethods: (payload['paymentMethods'] as List?)?.cast<String>() ??
            const ['Espèces', 'Mobile Money'],
        currency: payload['currency'] as String? ?? 'FCFA',
        photos: photos,
        logoUrl: photos.isNotEmpty ? photos.first : null,
        openingHours: hours,
      ),
    );
    _demoMode = true;
    upsertStore(store, accessCode: code);
    return store;
  }

  String _generateAccessCode(String name) {
    final base = name.replaceAll(RegExp(r'[^a-zA-Z]'), '').toUpperCase();
    final prefix = (base.isEmpty ? 'BOUTIK' : base).substring(0, base.isEmpty ? 6 : min(6, base.length));
    final n = 1000 + Random().nextInt(9000);
    return '$prefix-$n';
  }
}
