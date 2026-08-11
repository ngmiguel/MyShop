import 'package:flutter/foundation.dart';

import '../data/models/preferences.dart';
import '../data/services/storage_service.dart';

class PreferencesProvider extends ChangeNotifier {
  PreferencesProvider(this._storage);

  final StorageService _storage;
  UserPreferences _preferences = const UserPreferences();

  UserPreferences get preferences => _preferences;
  bool get onboardingDone => _preferences.onboardingDone;

  Future<void> init() async {
    final raw = await _storage.getPreferences();
    if (raw != null) {
      _preferences = UserPreferences.fromJson(raw);
      notifyListeners();
    }
  }

  Future<void> update(UserPreferences prefs) async {
    _preferences = prefs;
    await _storage.savePreferences(prefs.toJson());
    notifyListeners();
  }

  Future<void> completeOnboarding(UserPreferences prefs) async {
    await update(prefs.copyWith(onboardingDone: true));
  }
}
