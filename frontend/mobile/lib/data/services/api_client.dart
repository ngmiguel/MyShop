import 'package:dio/dio.dart';

import '../../config/api_config.dart';
import 'storage_service.dart';

typedef TokenRefreshCallback = Future<String?> Function();

class ApiClient {
  ApiClient(this._storage) {
    _dio = Dio(
      BaseOptions(
        baseUrl: ApiConfig.baseUrl,
        connectTimeout: const Duration(seconds: 2),
        receiveTimeout: const Duration(seconds: 3),
        sendTimeout: const Duration(seconds: 3),
        headers: {'Content-Type': 'application/json'},
      ),
    );

    _dio.interceptors.add(
      InterceptorsWrapper(
        onRequest: (options, handler) async {
          final token = await _storage.getAccessToken();
          if (token != null && token.isNotEmpty) {
            options.headers['Authorization'] = 'Bearer $token';
          }
          final sessionId = await _storage.getSessionId();
          if (sessionId != null && sessionId.isNotEmpty) {
            options.headers['X-Session-Id'] = sessionId;
          }
          handler.next(options);
        },
        onError: (error, handler) async {
          if (error.response?.statusCode == 401 &&
              _onTokenRefresh != null &&
              error.requestOptions.extra['retried'] != true) {
            final newToken = await _onTokenRefresh!.call();
            if (newToken != null) {
              final opts = error.requestOptions;
              opts.headers['Authorization'] = 'Bearer $newToken';
              opts.extra['retried'] = true;
              try {
                final response = await _dio.fetch(opts);
                return handler.resolve(response);
              } catch (e) {
                return handler.next(error);
              }
            }
          }
          handler.next(error);
        },
      ),
    );
  }

  final StorageService _storage;
  late final Dio _dio;
  TokenRefreshCallback? _onTokenRefresh;

  Dio get dio => _dio;

  void setTokenRefreshCallback(TokenRefreshCallback callback) {
    _onTokenRefresh = callback;
  }

  String messageFromError(DioException error) {
    final data = error.response?.data;
    if (data is Map && data['message'] != null) {
      final msg = data['message'];
      if (msg is List) return msg.join(', ');
      return msg.toString();
    }
    if (error.type == DioExceptionType.connectionError) {
      return 'Impossible de joindre le serveur. Verifiez que le backend est demarre.';
    }
    return error.message ?? 'Erreur reseau';
  }
}
