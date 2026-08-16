import 'package:flutter/foundation.dart';

import '../data/demo/demo_images.dart';
import '../data/models/order.dart';
import '../data/models/product.dart';
import '../data/services/order_service.dart';
import 'auth_provider.dart';

class CartProvider extends ChangeNotifier {
  CartProvider(this._orderService, this._authProvider);

  final OrderService _orderService;
  final AuthProvider _authProvider;

  CartModel _cart = const CartModel(id: 'local-cart', items: []);
  bool _loading = false;
  String? _error;
  bool _localMode = false;

  CartModel get cart => _cart;
  bool get loading => _loading;
  String? get error => _error;
  bool get localMode => _localMode;
  int get itemCount => _cart.itemCount;
  double get subtotal => _cart.subtotal;

  Future<void> loadCart() async {
    if (_localMode) {
      return;
    }
    try {
      _cart = await _orderService.getCart(
        userId: _authProvider.user?.id,
        sessionId: _authProvider.sessionId,
      );
      _localMode = false;
      _error = null;
      notifyListeners();
    } catch (_) {
      _localMode = true;
      _error = null;
      notifyListeners();
    }
  }

  Future<void> addProduct(ProductModel product, {int quantity = 1}) async {
    _loading = true;
    notifyListeners();
    final item = CartItemModel(
      productId: product.id,
      storeId: product.storeId,
      name: product.name,
      price: product.displayPrice,
      quantity: quantity,
      imageUrl: product.imageUrl ?? productImageUrl(productId: product.id, categoryId: product.categoryId),
    );

    if (_localMode) {
      _addLocalItem(item);
      _loading = false;
      notifyListeners();
      return;
    }

    try {
      _cart = await _orderService.addItem(
        userId: _authProvider.user?.id,
        sessionId: _authProvider.sessionId,
        item: item,
      );
      _error = null;
    } catch (_) {
      _localMode = true;
      _addLocalItem(item);
      _error = null;
    }
    _loading = false;
    notifyListeners();
  }

  void _addLocalItem(CartItemModel item) {
    final items = [..._cart.items];
    final index = items.indexWhere((i) => i.productId == item.productId);
    if (index >= 0) {
      final existing = items[index];
      items[index] = CartItemModel(
        productId: existing.productId,
        storeId: existing.storeId,
        name: existing.name,
        price: existing.price,
        quantity: existing.quantity + item.quantity,
        imageUrl: existing.imageUrl ?? item.imageUrl,
      );
    } else {
      items.add(item);
    }
    _cart = CartModel(id: 'local-cart', items: items);
  }

  Future<void> updateQuantity(String productId, int quantity) async {
    if (quantity <= 0) {
      await removeItem(productId);
      return;
    }

    if (_localMode) {
      final items = _cart.items.map((item) {
        if (item.productId != productId) return item;
        return CartItemModel(
          productId: item.productId,
          storeId: item.storeId,
          name: item.name,
          price: item.price,
          quantity: quantity,
          imageUrl: item.imageUrl,
        );
      }).toList();
      _cart = CartModel(id: _cart.id, items: items);
      notifyListeners();
      return;
    }

    try {
      _cart = await _orderService.updateItem(
        userId: _authProvider.user?.id,
        sessionId: _authProvider.sessionId,
        productId: productId,
        quantity: quantity,
      );
    } catch (_) {
      _localMode = true;
      await updateQuantity(productId, quantity);
      return;
    }
    notifyListeners();
  }

  Future<void> removeItem(String productId) async {
    if (_localMode) {
      _cart = CartModel(
        id: _cart.id,
        items: _cart.items.where((i) => i.productId != productId).toList(),
      );
      notifyListeners();
      return;
    }

    try {
      _cart = await _orderService.removeItem(
        userId: _authProvider.user?.id,
        sessionId: _authProvider.sessionId,
        productId: productId,
      );
    } catch (_) {
      _localMode = true;
      await removeItem(productId);
      return;
    }
    notifyListeners();
  }

  Future<void> clear() async {
    if (!_localMode) {
      try {
        await _orderService.clearCart(
          userId: _authProvider.user?.id,
          sessionId: _authProvider.sessionId,
        );
      } catch (_) {
        _localMode = true;
      }
    }
    _cart = const CartModel(id: 'local-cart', items: []);
    notifyListeners();
  }
}
