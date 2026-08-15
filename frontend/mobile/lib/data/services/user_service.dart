import '../../config/api_config.dart';
import 'api_client.dart';

class UserService {
  UserService(this._client);

  final ApiClient _client;

  Future<List<String>> getFavorites({String? userId, String? sessionId}) async {
    final response = await _client.dio.get(
      '${ApiConfig.usersPath}/favorites',
      queryParameters: {
        if (userId != null) 'userId': userId,
        if (sessionId != null) 'sessionId': sessionId,
      },
    );
    final data = response.data;
    final items = data is Map ? (data['data'] as List? ?? []) : (data as List? ?? []);
    return items
        .map((e) => (e is Map ? e['productId'] : e).toString())
        .toList();
  }

  Future<bool> toggleFavorite(String productId, {String? userId, String? sessionId}) async {
    final response = await _client.dio.post(
      '${ApiConfig.usersPath}/favorites/toggle',
      queryParameters: {
        if (userId != null) 'userId': userId,
        if (sessionId != null) 'sessionId': sessionId,
      },
      data: {'productId': productId},
    );
    final data = response.data as Map<String, dynamic>;
    return data['added'] as bool? ?? data['isFavorite'] as bool? ?? false;
  }
}
