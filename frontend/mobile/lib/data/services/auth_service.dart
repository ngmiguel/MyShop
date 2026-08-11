import '../../config/api_config.dart';
import '../models/user.dart';
import 'api_client.dart';

class AuthService {
  AuthService(this._client);

  final ApiClient _client;

  Future<AuthResponse> login({
    required String email,
    required String password,
  }) async {
    final response = await _client.dio.post(
      '${ApiConfig.authPath}/login',
      data: {'email': email, 'password': password},
    );
    return AuthResponse.fromJson(response.data as Map<String, dynamic>);
  }

  Future<AuthResponse> register({
    required String email,
    required String password,
    required String role,
    String? firstName,
    String? lastName,
    String? phone,
    String? storeId,
  }) async {
    final response = await _client.dio.post(
      '${ApiConfig.authPath}/register',
      data: {
        'email': email,
        'password': password,
        'role': role,
        if (firstName != null) 'firstName': firstName,
        if (lastName != null) 'lastName': lastName,
        if (phone != null) 'phone': phone,
        if (storeId != null) 'storeId': storeId,
      },
    );
    return AuthResponse.fromJson(response.data as Map<String, dynamic>);
  }

  Future<AuthResponse> refresh(String refreshToken) async {
    final response = await _client.dio.post(
      '${ApiConfig.authPath}/refresh',
      data: {'refreshToken': refreshToken},
    );
    return AuthResponse.fromJson(response.data as Map<String, dynamic>);
  }

  Future<UserModel> me() async {
    final response = await _client.dio.get('${ApiConfig.authPath}/me');
    return UserModel.fromJson(response.data as Map<String, dynamic>);
  }

  Future<AuthResponse> loginSeller({
    required String email,
    required String password,
  }) async {
    final response = await _client.dio.post(
      '${ApiConfig.sellersPath}/login',
      data: {'email': email, 'password': password},
    );
    return AuthResponse.fromJson(response.data as Map<String, dynamic>);
  }

  Future<AuthResponse> registerSeller({
    required String email,
    required String password,
    required String accessCode,
    String? firstName,
    String? lastName,
    String? phone,
  }) async {
    final response = await _client.dio.post(
      '${ApiConfig.sellersPath}/register',
      data: {
        'email': email,
        'password': password,
        'accessCode': accessCode,
        if (firstName != null) 'firstName': firstName,
        if (lastName != null) 'lastName': lastName,
        if (phone != null) 'phone': phone,
      },
    );
    return AuthResponse.fromJson(response.data as Map<String, dynamic>);
  }
}
