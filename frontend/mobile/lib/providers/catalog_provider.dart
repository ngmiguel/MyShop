import 'package:flutter/foundation.dart';

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
  bool _loading = false;
  String? _error;
  String _search = '';

  List<ProductModel> get products => _products;
  List<StoreModel> get stores => _stores;
  bool get loading => _loading;
  String? get error => _error;
  String get search => _search;

  StoreModel? storeById(String id) {
    try {
      return _stores.firstWhere((s) => s.id == id);
    } catch (_) {
      return null;
    }
  }

  Future<void> loadFeed({String? city, String? search}) async {
    _loading = true;
    _search = search ?? _search;
    notifyListeners();
    try {
      final productResponse = await _catalogService.getProducts(
        search: _search.isEmpty ? null : _search,
      );
      final storeList = await _storeService.getStores(city: city);
      _products = productResponse.items;
      _stores = storeList;
      _error = null;
    } catch (e) {
      _error = e.toString();
    }
    _loading = false;
    notifyListeners();
  }

  Future<ProductModel?> getProduct(String id) async {
    try {
      return await _catalogService.getProduct(id);
    } catch (_) {
      return null;
    }
  }

  Future<StoreModel?> getStore(String id) async {
    final cached = storeById(id);
    if (cached != null) return cached;
    try {
      return await _storeService.getStore(id);
    } catch (_) {
      return null;
    }
  }

  List<ProductModel> productsForStore(String storeId) {
    return _products.where((p) => p.storeId == storeId && p.isActive).toList();
  }
}
