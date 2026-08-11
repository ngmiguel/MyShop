import 'package:flutter/foundation.dart';

import '../data/models/order.dart';
import '../data/services/order_service.dart';
import 'auth_provider.dart';

class OrdersProvider extends ChangeNotifier {
  OrdersProvider(this._orderService, this._authProvider);

  final OrderService _orderService;
  final AuthProvider _authProvider;

  List<OrderModel> _orders = [];
  bool _loading = false;
  String? _error;

  List<OrderModel> get orders => _orders;
  bool get loading => _loading;
  String? get error => _error;

  List<OrderModel> get pendingOrders =>
      _orders.where((o) => o.status == 'pending').toList();

  int get pendingCount => pendingOrders.length;

  Future<void> loadOrders({String? storeId, String? status}) async {
    _loading = true;
    notifyListeners();
    try {
      _orders = await _orderService.getOrders(
        storeId: storeId ?? _authProvider.user?.storeId,
        status: status,
        userId: _authProvider.role == 'client' ? _authProvider.user?.id : null,
      );
      _error = null;
    } catch (e) {
      _error = e.toString();
    }
    _loading = false;
    notifyListeners();
  }

  Future<List<OrderModel>> checkout({
    required String fulfillmentMode,
    String? contactName,
    String? contactPhone,
    String? contactEmail,
    String? paymentMethod,
  }) async {
    _loading = true;
    notifyListeners();
    try {
      final created = await _orderService.checkout(
        userId: _authProvider.user?.id,
        sessionId: _authProvider.sessionId,
        fulfillmentMode: fulfillmentMode,
        contactName: contactName,
        contactPhone: contactPhone,
        contactEmail: contactEmail,
        paymentMethod: paymentMethod,
      );
      _orders = [...created, ..._orders];
      _error = null;
      _loading = false;
      notifyListeners();
      return created;
    } catch (e) {
      _error = e.toString();
      _loading = false;
      notifyListeners();
      rethrow;
    }
  }

  Future<OrderModel?> redeemByReference(String reference) async {
    final match = _orders.firstWhere(
      (o) => o.reference.toUpperCase() == reference.toUpperCase(),
      orElse: () => throw Exception('Commande introuvable'),
    );
    return redeemOrder(match.id);
  }

  Future<OrderModel?> redeemOrder(String orderId) async {
    try {
      final updated = await _orderService.redeemOrder(orderId);
      _orders = _orders.map((o) => o.id == updated.id ? updated : o).toList();
      notifyListeners();
      return updated;
    } catch (e) {
      _error = e.toString();
      notifyListeners();
      return null;
    }
  }

  Future<void> cancelOrder(String orderId) async {
    final updated = await _orderService.cancelOrder(orderId);
    _orders = _orders.map((o) => o.id == updated.id ? updated : o).toList();
    notifyListeners();
  }

  OrderModel? orderById(String id) {
    try {
      return _orders.firstWhere((o) => o.id == id);
    } catch (_) {
      return null;
    }
  }
}
