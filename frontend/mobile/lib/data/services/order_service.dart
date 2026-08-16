import '../../config/api_config.dart';
import '../models/order.dart';
import 'api_client.dart';

class OrderService {
  OrderService(this._client);

  final ApiClient _client;

  Map<String, dynamic> _cartQuery({String? userId, String? sessionId}) {
    return {
      if (userId != null) 'userId': userId,
      if (sessionId != null) 'sessionId': sessionId,
    };
  }

  Future<CartModel> getCart({String? userId, String? sessionId}) async {
    final response = await _client.dio.get(
      '${ApiConfig.ordersPath}/cart',
      queryParameters: _cartQuery(userId: userId, sessionId: sessionId),
    );
    return CartModel.fromJson(response.data as Map<String, dynamic>);
  }

  Future<CartModel> addItem({
    required String? userId,
    required String? sessionId,
    required CartItemModel item,
  }) async {
    final response = await _client.dio.post(
      '${ApiConfig.ordersPath}/cart/items',
      queryParameters: _cartQuery(userId: userId, sessionId: sessionId),
      data: item.toJson(),
    );
    return CartModel.fromJson(response.data as Map<String, dynamic>);
  }

  Future<CartModel> updateItem({
    required String? userId,
    required String? sessionId,
    required String productId,
    required int quantity,
  }) async {
    final response = await _client.dio.patch(
      '${ApiConfig.ordersPath}/cart/items',
      queryParameters: _cartQuery(userId: userId, sessionId: sessionId),
      data: {'productId': productId, 'quantity': quantity},
    );
    return CartModel.fromJson(response.data as Map<String, dynamic>);
  }

  Future<CartModel> removeItem({
    required String? userId,
    required String? sessionId,
    required String productId,
  }) async {
    final response = await _client.dio.delete(
      '${ApiConfig.ordersPath}/cart/items',
      queryParameters: _cartQuery(userId: userId, sessionId: sessionId),
      data: {'productId': productId},
    );
    return CartModel.fromJson(response.data as Map<String, dynamic>);
  }

  Future<void> clearCart({String? userId, String? sessionId}) async {
    await _client.dio.delete(
      '${ApiConfig.ordersPath}/cart',
      queryParameters: _cartQuery(userId: userId, sessionId: sessionId),
    );
  }

  Future<List<OrderModel>> checkout({
    String? userId,
    String? sessionId,
    String fulfillmentMode = 'pickup',
    String? contactName,
    String? contactPhone,
    String? contactEmail,
    String? paymentMethod,
  }) async {
    final response = await _client.dio.post(
      '${ApiConfig.ordersPath}/orders/checkout',
      data: {
        if (userId != null) 'userId': userId,
        if (sessionId != null) 'sessionId': sessionId,
        'fulfillmentMode': fulfillmentMode,
        if (contactName != null) 'contactName': contactName,
        if (contactPhone != null) 'contactPhone': contactPhone,
        if (contactEmail != null) 'contactEmail': contactEmail,
        if (paymentMethod != null) 'paymentMethod': paymentMethod,
      },
    );
    final data = response.data;
    if (data is List) {
      return data
          .map((e) => OrderModel.fromJson(e as Map<String, dynamic>))
          .toList();
    }
    return [OrderModel.fromJson(data as Map<String, dynamic>)];
  }

  Future<List<OrderModel>> getOrders({
    String? storeId,
    String? status,
    String? userId,
  }) async {
    final response = await _client.dio.get(
      '${ApiConfig.ordersPath}/orders',
      queryParameters: {
        if (storeId != null) 'storeId': storeId,
        if (status != null) 'status': status,
        if (userId != null) 'userId': userId,
      },
    );
    final data = response.data;
    if (data is List) {
      return data
          .map((e) => OrderModel.fromJson(e as Map<String, dynamic>))
          .toList();
    }
    return [];
  }

  Future<OrderModel> getOrder(String id) async {
    final response = await _client.dio.get(
      '${ApiConfig.ordersPath}/orders/$id',
    );
    return OrderModel.fromJson(response.data as Map<String, dynamic>);
  }

  Future<OrderModel> redeemOrder(String id) async {
    final response = await _client.dio.post(
      '${ApiConfig.ordersPath}/orders/$id/redeem',
    );
    return OrderModel.fromJson(response.data as Map<String, dynamic>);
  }

  Future<OrderModel> cancelOrder(String id) async {
    final response = await _client.dio.post(
      '${ApiConfig.ordersPath}/orders/$id/cancel',
    );
    return OrderModel.fromJson(response.data as Map<String, dynamic>);
  }

  Future<OrderModel> rateOrder(String id, {required int rating, String? comment}) async {
    final response = await _client.dio.post(
      '${ApiConfig.ordersPath}/orders/$id/rate',
      data: {
        'rating': rating,
        if (comment != null) 'comment': comment,
      },
    );
    return OrderModel.fromJson(response.data as Map<String, dynamic>);
  }
}

class SellerApiService {
  SellerApiService(this._client);

  final ApiClient _client;

  Future<List<SellerModel>> getSellers({String? storeId, String? status}) async {
    final response = await _client.dio.get(
      '${ApiConfig.sellersPath}/sellers',
      queryParameters: {
        if (storeId != null) 'storeId': storeId,
        if (status != null) 'status': status,
      },
    );
    final data = response.data;
    if (data is List) {
      return data
          .map((e) => SellerModel.fromJson(e as Map<String, dynamic>))
          .toList();
    }
    if (data is Map) {
      final items = data['data'] ?? data['items'] ?? data['sellers'] ?? [];
      if (items is List) {
        return items
            .map((e) => SellerModel.fromJson(Map<String, dynamic>.from(e as Map)))
            .toList();
      }
    }
    return [];
  }

  Future<void> approveSeller(String id) async {
    await _client.dio.patch('${ApiConfig.sellersPath}/sellers/$id/approve');
  }

  Future<void> suspendSeller(String id) async {
    await _client.dio.patch('${ApiConfig.sellersPath}/sellers/$id/suspend');
  }

  Future<void> activateSeller(String id) async {
    await _client.dio.patch('${ApiConfig.sellersPath}/sellers/$id/activate');
  }

  Future<Map<String, dynamic>?> getSellerPerformance(String id) async {
    try {
      final response = await _client.dio.get('${ApiConfig.sellersPath}/sellers/$id/performance');
      final data = response.data;
      if (data is Map<String, dynamic>) return data;
      if (data is Map) return Map<String, dynamic>.from(data);
    } catch (_) {}
    return null;
  }
}
