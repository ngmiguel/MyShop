import 'package:flutter/foundation.dart';
import 'package:uuid/uuid.dart';

import '../data/services/storage_service.dart';
import '../data/services/user_service.dart';
import 'auth_provider.dart';

class FavoritesProvider extends ChangeNotifier {
  FavoritesProvider(this._storage, this._userService, this._auth);

  final StorageService _storage;
  final UserService _userService;
  final AuthProvider _auth;

  final Set<String> _ids = {};
  bool _ready = false;

  bool get ready => _ready;
  Set<String> get ids => Set.unmodifiable(_ids);
  int get count => _ids.length;

  bool isFavorite(String productId) => _ids.contains(productId);

  Future<void> init() async {
    await _load();
    _ready = true;
    notifyListeners();
  }

  Future<void> _load() async {
    _ids.clear();
    if (_auth.isAuthenticated && _auth.user != null) {
      try {
        final remote = await _userService.getFavorites(userId: _auth.user!.id);
        _ids.addAll(remote);
        return;
      } catch (_) {}
    }
    final local = await _storage.getLocalFavorites();
    _ids.addAll(local);
  }

  Future<void> clear() async {
    _ids.clear();
    await _storage.saveLocalFavorites([]);
    notifyListeners();
  }

  Future<void> toggle(String productId) async {
    final wasFavorite = _ids.contains(productId);
    if (wasFavorite) {
      _ids.remove(productId);
    } else {
      _ids.add(productId);
    }
    notifyListeners();

    try {
      if (_auth.isAuthenticated && _auth.user != null) {
        final added = await _userService.toggleFavorite(
          productId,
          userId: _auth.user!.id,
        );
        if (added) {
          _ids.add(productId);
        } else {
          _ids.remove(productId);
        }
      } else {
        var sessionId = await _storage.getSessionId();
        sessionId ??= const Uuid().v4();
        await _storage.saveSessionId(sessionId);
        await _userService.toggleFavorite(productId, sessionId: sessionId);
        await _storage.saveLocalFavorites(_ids.toList());
      }
    } catch (_) {
      if (wasFavorite) {
        _ids.add(productId);
      } else {
        _ids.remove(productId);
      }
      await _storage.saveLocalFavorites(_ids.toList());
    }
    notifyListeners();
  }
}
