import 'package:flutter/foundation.dart';
import 'package:uuid/uuid.dart';

import '../data/models/user.dart';
import '../data/services/api_client.dart';
import '../data/services/auth_service.dart';
import '../data/services/storage_service.dart';

class AuthProvider extends ChangeNotifier {
  AuthProvider({
    required StorageService storage,
    required ApiClient apiClient,
    required AuthService authService,
  })  : _storage = storage,
        _authService = authService {
    apiClient.setTokenRefreshCallback(_refreshToken);
  }

  final StorageService _storage;
  final AuthService _authService;

  UserModel? _user;
  bool _loading = true;
  String? _error;
  String? _sessionId;

  UserModel? get user => _user;
  bool get loading => _loading;
  String? get error => _error;
  String? get sessionId => _sessionId;
  bool get isAuthenticated => _user != null;
  String get role => _user?.role ?? 'client';

  Future<void> init() async {
    _loading = true;
    notifyListeners();

    _sessionId = await _storage.getSessionId();
    if (_sessionId == null) {
      _sessionId = const Uuid().v4();
      await _storage.saveSessionId(_sessionId!);
    }

    final savedUser = await _storage.getUser();
    final token = await _storage.getAccessToken();
    if (savedUser != null && token != null) {
      _user = UserModel.fromJson(savedUser);
      try {
        _user = await _authService.me();
        await _storage.saveUser(_user!.toJson());
      } catch (_) {
        await logout();
      }
    }

    _loading = false;
    notifyListeners();
  }

  Future<String?> _refreshToken() async {
    final refresh = await _storage.getRefreshToken();
    if (refresh == null) return null;
    try {
      final response = await _authService.refresh(refresh);
      await _persistAuth(response);
      return response.accessToken;
    } catch (_) {
      await logout();
      return null;
    }
  }

  Future<void> _persistAuth(AuthResponse response) async {
    await _storage.saveTokens(
      accessToken: response.accessToken,
      refreshToken: response.refreshToken,
    );
    await _storage.saveUser(response.user.toJson());
    _user = response.user;
    _error = null;
    notifyListeners();
  }

  Future<bool> login(String email, String password, {String? expectedRole}) async {
    _loading = true;
    _error = null;
    notifyListeners();
    try {
      AuthResponse response;
      if (expectedRole == 'vendeur') {
        response = await _authService.loginSeller(email: email, password: password);
      } else {
        response = await _authService.login(email: email, password: password);
      }
      if (expectedRole != null && response.user.role != expectedRole) {
        _error = 'Ce compte n\'a pas le role attendu.';
        _loading = false;
        notifyListeners();
        return false;
      }
      await _persistAuth(response);
      _loading = false;
      notifyListeners();
      return true;
    } catch (e) {
      _error = e.toString();
      _loading = false;
      notifyListeners();
      return false;
    }
  }

  Future<bool> register({
    required String email,
    required String password,
    required String role,
    String? firstName,
    String? lastName,
    String? phone,
    String? accessCode,
  }) async {
    _loading = true;
    _error = null;
    notifyListeners();
    try {
      final AuthResponse response;
      if (role == 'vendeur') {
        response = await _authService.registerSeller(
          email: email,
          password: password,
          accessCode: accessCode ?? '',
          firstName: firstName,
          lastName: lastName,
          phone: phone,
        );
      } else {
        response = await _authService.register(
          email: email,
          password: password,
          role: role,
          firstName: firstName,
          lastName: lastName,
          phone: phone,
        );
      }
      await _persistAuth(response);
      _loading = false;
      notifyListeners();
      return true;
    } catch (e) {
      _error = e.toString();
      _loading = false;
      notifyListeners();
      return false;
    }
  }

  Future<void> logout() async {
    await _storage.clearAuth();
    _user = null;
    notifyListeners();
  }
}
