import 'dart:convert';

import 'package:shared_preferences/shared_preferences.dart';

class StorageService {
  static const _accessTokenKey = 'access_token';
  static const _refreshTokenKey = 'refresh_token';
  static const _sessionIdKey = 'session_id';
  static const _userKey = 'user';
  static const _preferencesKey = 'preferences';
  static const _favoritesKey = 'favorites_local';

  Future<SharedPreferences> get _prefs async =>
      SharedPreferences.getInstance();

  Future<String?> getAccessToken() async {
    return (await _prefs).getString(_accessTokenKey);
  }

  Future<String?> getRefreshToken() async {
    return (await _prefs).getString(_refreshTokenKey);
  }

  Future<String?> getSessionId() async {
    return (await _prefs).getString(_sessionIdKey);
  }

  Future<void> saveSessionId(String sessionId) async {
    await (await _prefs).setString(_sessionIdKey, sessionId);
  }

  Future<void> saveTokens({
    required String accessToken,
    required String refreshToken,
  }) async {
    final prefs = await _prefs;
    await prefs.setString(_accessTokenKey, accessToken);
    await prefs.setString(_refreshTokenKey, refreshToken);
  }

  Future<void> saveUser(Map<String, dynamic> user) async {
    await (await _prefs).setString(_userKey, jsonEncode(user));
  }

  Future<Map<String, dynamic>?> getUser() async {
    final raw = (await _prefs).getString(_userKey);
    if (raw == null) return null;
    return jsonDecode(raw) as Map<String, dynamic>;
  }

  Future<void> savePreferences(Map<String, dynamic> prefs) async {
    await (await _prefs).setString(_preferencesKey, jsonEncode(prefs));
  }

  Future<Map<String, dynamic>?> getPreferences() async {
    final raw = (await _prefs).getString(_preferencesKey);
    if (raw == null) return null;
    return jsonDecode(raw) as Map<String, dynamic>;
  }

  Future<void> clearAuth() async {
    final prefs = await _prefs;
    await prefs.remove(_accessTokenKey);
    await prefs.remove(_refreshTokenKey);
    await prefs.remove(_userKey);
  }

  Future<void> clearAll() async {
    await (await _prefs).clear();
  }

  Future<List<String>> getLocalFavorites() async {
    return (await _prefs).getStringList(_favoritesKey) ?? [];
  }

  Future<void> saveLocalFavorites(List<String> ids) async {
    await (await _prefs).setStringList(_favoritesKey, ids);
  }
}
