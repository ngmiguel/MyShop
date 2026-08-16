import 'package:flutter/foundation.dart';
import 'package:uuid/uuid.dart';

import '../core/utils/qr_util.dart';
import '../data/demo/demo_catalog.dart';
import '../data/demo/demo_orders.dart';
import '../data/models/order.dart';
import '../data/services/order_service.dart';
import 'auth_provider.dart';

class OrdersProvider extends ChangeNotifier {
  OrdersProvider(this._orderService, this._authProvider);

  final OrderService _orderService;
  final AuthProvider _authProvider;
  final _uuid = const Uuid();

  List<OrderModel> _orders = [];
  bool _loading = false;
  String? _error;
  bool _localMode = false;
  bool _seeded = false;

  List<OrderModel> get orders => _orders;
  bool get loading => _loading;
  String? get error => _error;
  bool get localMode => _localMode;

  List<OrderModel> get pendingOrders =>
      _orders.where((o) => o.status == 'pending').toList();

  int get pendingCount => pendingOrders.length;

  void _ensureDemoSeed() {
    if (_seeded && _orders.isNotEmpty) return;
    _orders = buildDemoOrders(clientUserId: _authProvider.user?.id ?? 'demo-client-1');
    _localMode = true;
    _seeded = true;
  }

  Future<void> loadOrders({String? storeId, String? status}) async {
    if (_localMode && _seeded && _orders.isNotEmpty) {
      return;
    }

    // Afficher la démo immédiatement, puis tenter l'API en arrière-plan.
    if (_orders.isEmpty) {
      _ensureDemoSeed();
      notifyListeners();
    }

    try {
      final remote = await _orderService.getOrders(
        storeId: storeId ?? _authProvider.user?.storeId,
        status: status,
        userId: _authProvider.role == 'client' ? _authProvider.user?.id : null,
      );
      if (remote.isNotEmpty) {
        _orders = remote;
        _localMode = false;
        _seeded = true;
        _error = null;
        notifyListeners();
      }
    } catch (_) {
      if (!_seeded || _orders.isEmpty) {
        _ensureDemoSeed();
        notifyListeners();
      }
      _error = null;
    }
  }

  /// Génération QR locale (1 code par boutique) — flux prototype Boutika.
  List<OrderModel> generatePaymentCodes({
    required List<CartItemModel> items,
    required String fulfillmentMode,
    String? contactName,
    String? contactPhone,
    String? contactEmail,
    String? paymentMethod,
    int expirationMinutes = 30,
    double deliveryFeePerStore = 2000,
  }) {
    if (items.isEmpty) return const [];

    final byStore = <String, List<CartItemModel>>{};
    for (final item in items) {
      byStore.putIfAbsent(item.storeId, () => []).add(item);
    }

    final now = DateTime.now();
    final created = <OrderModel>[];

    byStore.forEach((storeId, storeItems) {
      final subtotal = storeItems.fold<double>(0, (s, i) => s + i.lineTotal);
      final delivery = fulfillmentMode == 'delivery' ? deliveryFeePerStore : 0.0;
      final discount = 0.0;
      final tax = 0.0;
      final total = subtotal - discount + tax + delivery;
      final reference = generatePaymentCode();
      final store = demoStoreById(storeId);

      var order = OrderModel(
        id: 'local-${_uuid.v4()}',
        reference: reference,
        userId: _authProvider.user?.id,
        storeId: storeId,
        items: storeItems,
        subtotal: subtotal,
        tax: tax,
        discount: discount,
        total: total,
        status: 'pending',
        fulfillmentMode: fulfillmentMode,
        contactName: contactName,
        contactPhone: contactPhone,
        contactEmail: contactEmail,
        paymentMethod: paymentMethod,
        expiresAt: now.add(Duration(minutes: expirationMinutes)),
        createdAt: now,
      );
      order = order.copyWith(qrPayload: encodeQrPayload(order, storeName: store?.name));
      created.add(order);
    });

    _localMode = true;
    _seeded = true;
    _orders = [...created, ..._orders];
    _error = null;
    notifyListeners();
    return created;
  }

  Future<List<OrderModel>> checkout({
    required String fulfillmentMode,
    String? contactName,
    String? contactPhone,
    String? contactEmail,
    String? paymentMethod,
    List<CartItemModel>? localItems,
    int expirationMinutes = 30,
    double deliveryFeePerStore = 2000,
  }) async {
    _loading = true;
    notifyListeners();

    if (localItems != null && localItems.isNotEmpty) {
      final created = generatePaymentCodes(
        items: localItems,
        fulfillmentMode: fulfillmentMode,
        contactName: contactName,
        contactPhone: contactPhone,
        contactEmail: contactEmail,
        paymentMethod: paymentMethod,
        expirationMinutes: expirationMinutes,
        deliveryFeePerStore: deliveryFeePerStore,
      );
      _loading = false;
      notifyListeners();
      return created;
    }

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
      final withQr = created.map((o) {
        if (o.qrPayload != null && o.qrPayload!.isNotEmpty) return o;
        final store = demoStoreById(o.storeId);
        return o.copyWith(qrPayload: encodeQrPayload(o, storeName: store?.name));
      }).toList();
      _orders = [...withQr, ..._orders];
      _error = null;
      _loading = false;
      notifyListeners();
      return withQr;
    } catch (e) {
      if (localItems != null && localItems.isNotEmpty) {
        final created = generatePaymentCodes(
          items: localItems,
          fulfillmentMode: fulfillmentMode,
          contactName: contactName,
          contactPhone: contactPhone,
          contactEmail: contactEmail,
          paymentMethod: paymentMethod,
          expirationMinutes: expirationMinutes,
          deliveryFeePerStore: deliveryFeePerStore,
        );
        _loading = false;
        notifyListeners();
        return created;
      }
      _error = e.toString();
      _loading = false;
      notifyListeners();
      rethrow;
    }
  }

  Future<OrderModel?> redeemByReference(String reference) async {
    final ref = readPaymentReference(reference) ?? reference.trim().toUpperCase();
    OrderModel? match;
    for (final order in _orders) {
      if (order.reference.toUpperCase() == ref && order.status == 'pending') {
        match = order;
        break;
      }
    }
    if (match == null) {
      _error = 'Commande introuvable';
      notifyListeners();
      return null;
    }
    return redeemOrder(match.id);
  }

  Future<OrderModel?> redeemOrder(String orderId) async {
    if (_localMode) {
      final index = _orders.indexWhere((o) => o.id == orderId);
      if (index < 0) {
        _error = 'Commande introuvable';
        notifyListeners();
        return null;
      }
      final current = _orders[index];
      if (current.status != 'pending') {
        _error = 'Ce code a déjà été traité.';
        notifyListeners();
        return null;
      }
      if (current.expiresAt.isBefore(DateTime.now())) {
        _orders[index] = current.copyWith(status: 'expired');
        _error = 'Ce code est expiré.';
        notifyListeners();
        return null;
      }
      final updated = current.copyWith(status: 'redeemed', redeemedAt: DateTime.now());
      _orders = [..._orders]..[index] = updated;
      _error = null;
      notifyListeners();
      return updated;
    }

    try {
      final updated = await _orderService.redeemOrder(orderId);
      _orders = _orders.map((o) => o.id == updated.id ? updated : o).toList();
      notifyListeners();
      return updated;
    } catch (e) {
      // Fallback local si l'API échoue mais la commande est en mémoire
      final index = _orders.indexWhere((o) => o.id == orderId);
      if (index >= 0 && _orders[index].status == 'pending') {
        final updated = _orders[index].copyWith(status: 'redeemed', redeemedAt: DateTime.now());
        _orders = [..._orders]..[index] = updated;
        _localMode = true;
        _error = null;
        notifyListeners();
        return updated;
      }
      _error = e.toString();
      notifyListeners();
      return null;
    }
  }

  Future<void> cancelOrder(String orderId) async {
    if (_localMode) {
      _orders = _orders.map((o) {
        if (o.id != orderId) return o;
        return o.copyWith(status: 'cancelled');
      }).toList();
      notifyListeners();
      return;
    }

    try {
      final updated = await _orderService.cancelOrder(orderId);
      _orders = _orders.map((o) => o.id == updated.id ? updated : o).toList();
      notifyListeners();
    } catch (_) {
      _orders = _orders.map((o) {
        if (o.id != orderId) return o;
        return o.copyWith(status: 'cancelled');
      }).toList();
      _localMode = true;
      notifyListeners();
    }
  }

  OrderModel? orderById(String id) {
    try {
      return _orders.firstWhere((o) => o.id == id);
    } catch (_) {
      return null;
    }
  }

  List<OrderModel> ordersForStore(String storeId) {
    return _orders.where((o) => o.storeId == storeId).toList();
  }
}
