import '../../config/api_config.dart';
import '../models/store.dart';
import 'api_client.dart';

class StoreService {
  StoreService(this._client);

  final ApiClient _client;

  Future<List<StoreModel>> getStores({
    String? city,
    String? status,
  }) async {
    final response = await _client.dio.get(
      '${ApiConfig.storesPath}/stores',
      queryParameters: {
        if (city != null) 'city': city,
        if (status != null) 'status': status,
      },
    );
    final data = response.data;
    if (data is List) {
      return data
          .map((e) => StoreModel.fromJson(e as Map<String, dynamic>))
          .toList();
    }
    final items = (data as Map<String, dynamic>)['data'] ?? data['items'] ?? [];
    return (items as List)
        .map((e) => StoreModel.fromJson(e as Map<String, dynamic>))
        .toList();
  }

  Future<StoreModel> getStore(String id) async {
    final response = await _client.dio.get(
      '${ApiConfig.storesPath}/stores/$id',
    );
    return StoreModel.fromJson(response.data as Map<String, dynamic>);
  }

  Future<Map<String, dynamic>> validateAccessCode(String code, {String? storeId}) async {
    final response = await _client.dio.get(
      '${ApiConfig.storesPath}/stores/validate-code/$code',
      queryParameters: {if (storeId != null) 'storeId': storeId},
    );
    return response.data as Map<String, dynamic>;
  }

  Future<StoreModel> createStore(Map<String, dynamic> payload) async {
    final response = await _client.dio.post(
      '${ApiConfig.storesPath}/stores',
      data: payload,
    );
    return StoreModel.fromJson(response.data as Map<String, dynamic>);
  }

  Future<StoreModel> updateStore(String id, Map<String, dynamic> payload) async {
    final response = await _client.dio.patch(
      '${ApiConfig.storesPath}/stores/$id',
      data: payload,
    );
    return StoreModel.fromJson(response.data as Map<String, dynamic>);
  }

  Future<String> regenerateAccessCode(String id) async {
    final response = await _client.dio.post(
      '${ApiConfig.storesPath}/stores/$id/regenerate-access-code',
      data: {},
    );
    final data = response.data as Map<String, dynamic>;
    return data['accessCode']?.toString() ?? data['code']?.toString() ?? '';
  }
}
