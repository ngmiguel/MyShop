import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';

import '../data/demo/demo_analytics.dart';

/// Hypothèses de calcul partagées (Profit manager ↔ Équipe ↔ Vendeur).
class ProfitSettingsProvider extends ChangeNotifier {
  ManagerProfitAssumptions _assumptions = const ManagerProfitAssumptions(
    chargesFixesMensuelles: 1850000,
    commissionVendeur: 3,
    tva: 18,
    objectifCaMensuel: 9000000,
  );

  ManagerProfitAssumptions get assumptions => _assumptions;
  double get chargesFixesMensuelles => _assumptions.chargesFixesMensuelles;
  int get commissionVendeur => _assumptions.commissionVendeur;
  int get tva => _assumptions.tva;
  double get objectifCaMensuel => _assumptions.objectifCaMensuel;

  Future<void> init() async {
    final prefs = await SharedPreferences.getInstance();
    _assumptions = ManagerProfitAssumptions(
      chargesFixesMensuelles: prefs.getDouble('profit_charges') ?? 1850000,
      commissionVendeur: prefs.getInt('profit_commission') ?? 3,
      tva: prefs.getInt('profit_tva') ?? 18,
      objectifCaMensuel: prefs.getDouble('profit_objectif') ?? 9000000,
    );
    notifyListeners();
  }

  Future<void> update(ManagerProfitAssumptions next) async {
    _assumptions = next;
    notifyListeners();
    final prefs = await SharedPreferences.getInstance();
    await prefs.setDouble('profit_charges', next.chargesFixesMensuelles);
    await prefs.setInt('profit_commission', next.commissionVendeur);
    await prefs.setInt('profit_tva', next.tva);
    await prefs.setDouble('profit_objectif', next.objectifCaMensuel);
  }

  Future<void> setCharges(double v) => update(_assumptions.copyWith(chargesFixesMensuelles: v));
  Future<void> setCommission(int v) => update(_assumptions.copyWith(commissionVendeur: v));
  Future<void> setTva(int v) => update(_assumptions.copyWith(tva: v));
  Future<void> setObjectif(double v) => update(_assumptions.copyWith(objectifCaMensuel: v));
}
