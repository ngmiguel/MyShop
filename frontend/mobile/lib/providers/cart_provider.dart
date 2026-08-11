import 'package:flutter/foundation.dart';

import '../data/models/order.dart';
import '../data/models/product.dart';
import '../data/services/order_service.dart';
import 'auth_provider.dart';

class CartProvider extends ChangeNotifier {
  CartProvider(this._orderService, this._authProvider);

  final OrderService _orderService;
  final AuthProvider _authProvider;

  CartModel _cart = const CartModel(id: '', items: []);
  bool _loading = false;
  String? _error;

  CartModel get cart => _cart;
  bool get loading => _loading;
  String? get error => _error;
  int get itemCount => _cart.itemCount;
  double get subtotal => _cart.subtotal;

  Future<void> loadCart() async {
    _loading = true;
    notifyListeners();
    try {
      _cart = await _orderService.getCart(
        userId: _authProvider.user?.id,
        sessionId: _authProvider.sessionId,
      );
      _error = null;
    } catch (e) {
      _error = e.toString();
    }
    _loading = false;
    notifyListeners();
  }

  Future<void> addProduct(ProductModel product, {int quantity = 1}) async {
    _loading = true;
    notifyListeners();
    try {
      _cart = await _orderService.addItem(
        userId: _authProvider.user?.id,
        sessionId: _authProvider.sessionId,
        item: CartItemModel(
          productId: product.id,
          storeId: product.storeId,
          name: product.name,
          price: product.displayPrice,
          quantity: quantity,
          imageUrl: product.imageUrl,
        ),
      );
      _error = null;
    } catch (e) {
      _error = e.toString();
    }
    _loading = false;
    notifyListeners();
  }

  Future<void> updateQuantity(String productId, int quantity) async {
    if (quantity <= 0) {
      await removeItem(productId);
      return;
    }
    _cart = await _orderService.updateItem(
      userId: _authProvider.user?.id,
      sessionId: _authProvider.sessionId,
      productId: productId,
      quantity: quantity,
    );
    notifyListeners();
  }

  Future<void> removeItem(String productId) async {
    _cart = await _orderService.removeItem(
      userId: _authProvider.user?.id,
      sessionId: _authProvider.sessionId,
      productId: productId,
    );
    notifyListeners();
  }

  Future<void> clear() async {
    await _orderService.clearCart(
      userId: _authProvider.user?.id,
      sessionId: _authProvider.sessionId,
    );
    _cart = const CartModel(id: '', items: []);
    notifyListeners();
  }
}
