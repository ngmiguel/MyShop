import 'package:flutter/foundation.dart';
import 'package:uuid/uuid.dart';

import '../data/demo/demo_accounts.dart';
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
        _error = 'Ce compte n\'a pas le rôle attendu.';
        _loading = false;
        notifyListeners();
        return false;
      }
      await _persistAuth(response);
      _loading = false;
      notifyListeners();
      return true;
    } catch (_) {
      return _loginDemo(email, password, expectedRole: expectedRole);
    }
  }

  Future<bool> loginDemoGoogle({
    String email = 'awa.kone@gmail.com',
    String? firstName,
    String? lastName,
  }) async {
    _loading = true;
    _error = null;
    notifyListeners();
    final user = demoGoogleUser(email: email, firstName: firstName, lastName: lastName);
    await _storage.saveTokens(accessToken: 'demo-token', refreshToken: 'demo-refresh');
    await _storage.saveUser(user.toJson());
    _user = user;
    _loading = false;
    notifyListeners();
    return true;
  }

  bool get isGoogleClient => _user?.role == 'client';

  Future<bool> loginDemoSeller({
    required String storeId,
    required String email,
    required String password,
  }) async {
    _loading = true;
    _error = null;
    notifyListeners();
    final seller = findDemoSeller(storeId: storeId, email: email);
    if (seller == null) {
      _error = 'Aucun compte vendeur ne correspond à cette boutique.';
      _loading = false;
      notifyListeners();
      return false;
    }
    if (password.length < 4) {
      _error = 'Mot de passe trop court.';
      _loading = false;
      notifyListeners();
      return false;
    }
    if (password != seller.password) {
      _error = 'Mot de passe incorrect.';
      _loading = false;
      notifyListeners();
      return false;
    }
    if (seller.status == 'pending') {
      _error = 'Votre inscription est en attente de validation par le manageur.';
      _loading = false;
      notifyListeners();
      return false;
    }
    if (seller.status == 'suspended') {
      _error = 'Ce compte est suspendu. Contactez votre manageur.';
      _loading = false;
      notifyListeners();
      return false;
    }
    final user = UserModel(
      id: 'demo-seller-${seller.email.hashCode}',
      email: seller.email,
      role: 'vendeur',
      firstName: seller.firstName,
      lastName: seller.lastName,
      storeId: seller.storeId,
    );
    await _storage.saveTokens(accessToken: 'demo-token', refreshToken: 'demo-refresh');
    await _storage.saveUser(user.toJson());
    _user = user;
    _loading = false;
    notifyListeners();
    return true;
  }

  Future<String?> registerDemoSeller({
    required String storeId,
    required String accessCode,
    required String firstName,
    required String lastName,
    required String phone,
    required String email,
    required String password,
    String jobTitle = 'Vendeur',
    bool requireManagerValidation = true,
  }) async {
    final expected = storeAccessCode(storeId);
    if (expected == null || expected.toUpperCase() != accessCode.trim().toUpperCase()) {
      return 'Mot de passe boutique invalide. Demandez-le à votre manageur.';
    }
    if (emailAlreadyUsed(email)) {
      return 'Un compte utilise déjà cet e-mail.';
    }
    final seller = DemoSellerAccount(
      email: email.trim(),
      password: password,
      storeId: storeId,
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      status: requireManagerValidation ? 'pending' : 'active',
    );
    addRegisteredDemoSeller(seller);
    if (!requireManagerValidation) {
      await loginDemoSeller(storeId: storeId, email: email, password: password);
      return null;
    }
    return 'pending';
  }

  Future<bool> _loginDemo(String email, String password, {String? expectedRole}) async {
    if (expectedRole == 'manager') {
      final user = demoManagerUser(email, password);
      if (user == null) {
        _error = 'Identifiants administrateur incorrects.';
        _loading = false;
        notifyListeners();
        return false;
      }
      await _storage.saveTokens(accessToken: 'demo-token', refreshToken: 'demo-refresh');
      await _storage.saveUser(user.toJson());
      _user = user;
      _loading = false;
      notifyListeners();
      return true;
    }
    if (expectedRole == 'vendeur') {
      _error = 'Connexion impossible. Utilisez un compte vendeur de démonstration.';
      _loading = false;
      notifyListeners();
      return false;
    }
    _error = 'Connexion impossible. Vérifiez vos identifiants ou utilisez le mode démo.';
    _loading = false;
    notifyListeners();
    return false;
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
