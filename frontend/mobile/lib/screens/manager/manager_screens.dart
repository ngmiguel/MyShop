import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import 'package:shared_preferences/shared_preferences.dart';

import '../../core/theme/app_theme.dart';
import '../../providers/auth_provider.dart';
import '../../providers/preferences_provider.dart';
import '../../widgets/app_layout.dart';

export 'manager_pilotage_screen.dart';
export 'manager_boutiques_screen.dart';
export 'manager_profit_screen.dart';
export 'manager_equipe_screen.dart';
export 'manager_analytics_screen.dart';
export 'manager_models_screen.dart';

class ManagerSettingsScreen extends StatefulWidget {
  const ManagerSettingsScreen({super.key});

  @override
  State<ManagerSettingsScreen> createState() => _ManagerSettingsScreenState();
}

class _ManagerSettingsScreenState extends State<ManagerSettingsScreen> {
  double _taxRate = 19.25;
  int _accessCodeLength = 8;
  int _qrExpiryHours = 48;
  int _modelRefreshHours = 6;
  int _latencyThreshold = 800;
  int _errorThreshold = 5;
  bool _autoApprove = false;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    final prefs = await SharedPreferences.getInstance();
    if (!mounted) return;
    setState(() {
      _taxRate = prefs.getDouble('mgr_tax') ?? 19.25;
      _accessCodeLength = prefs.getInt('mgr_code_len') ?? 8;
      _qrExpiryHours = prefs.getInt('mgr_qr_expiry') ?? 48;
      _modelRefreshHours = prefs.getInt('mgr_model_refresh') ?? 6;
      _latencyThreshold = prefs.getInt('mgr_latency') ?? 800;
      _errorThreshold = prefs.getInt('mgr_errors') ?? 5;
      _autoApprove = prefs.getBool('mgr_auto_approve') ?? false;
    });
  }

  Future<void> _save() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setDouble('mgr_tax', _taxRate);
    await prefs.setInt('mgr_code_len', _accessCodeLength);
    await prefs.setInt('mgr_qr_expiry', _qrExpiryHours);
    await prefs.setInt('mgr_model_refresh', _modelRefreshHours);
    await prefs.setInt('mgr_latency', _latencyThreshold);
    await prefs.setInt('mgr_errors', _errorThreshold);
    await prefs.setBool('mgr_auto_approve', _autoApprove);
    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Politiques enregistrées')));
    }
  }

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();
    final prefsProvider = context.watch<PreferencesProvider>();
    final prefs = prefsProvider.preferences;

    return Scaffold(
      backgroundColor: AppTheme.contentBackground(context),
      appBar: AppBar(title: const Text('Réglages')),
      body: ListView(
        padding: const EdgeInsets.only(bottom: 32),
        children: [
          if (auth.user != null)
            ListTile(
              leading: CircleAvatar(child: Text(auth.user!.initials)),
              title: Text(auth.user!.displayName),
              subtitle: Text(auth.user!.email),
            ),
          SettingsSection(
            title: 'Apparence',
            children: [
              Padding(
                padding: const EdgeInsets.all(16),
                child: ThemeSelector(
                  value: prefs.themeMode,
                  onChanged: (mode) => prefsProvider.update(prefs.copyWith(themeMode: mode)),
                ),
              ),
              ListTile(
                title: const Text('Taille du texte'),
                subtitle: Text(switch (prefs.textScale) {
                  'compact' => 'Compact',
                  'large' => 'Grand',
                  _ => 'Normal',
                }),
                trailing: DropdownButton<String>(
                  value: prefs.textScale,
                  underline: const SizedBox.shrink(),
                  items: const [
                    DropdownMenuItem(value: 'compact', child: Text('Compact')),
                    DropdownMenuItem(value: 'normal', child: Text('Normal')),
                    DropdownMenuItem(value: 'large', child: Text('Grand')),
                  ],
                  onChanged: (v) {
                    if (v != null) prefsProvider.update(prefs.copyWith(textScale: v));
                  },
                ),
              ),
              ListTile(
                title: const Text('Densité'),
                subtitle: Text(prefs.density == 'compact' ? 'Compacte' : 'Confortable'),
                trailing: DropdownButton<String>(
                  value: prefs.density,
                  underline: const SizedBox.shrink(),
                  items: const [
                    DropdownMenuItem(value: 'compact', child: Text('Compacte')),
                    DropdownMenuItem(value: 'confortable', child: Text('Confortable')),
                  ],
                  onChanged: (v) {
                    if (v != null) prefsProvider.update(prefs.copyWith(density: v));
                  },
                ),
              ),
              SwitchListTile(
                title: const Text('Réduire les animations'),
                value: prefs.reduceMotion,
                onChanged: (v) => prefsProvider.update(prefs.copyWith(reduceMotion: v)),
              ),
            ],
          ),
          SettingsSection(
            title: 'Navigation',
            children: [
              SettingsTile(
                icon: Icons.analytics_outlined,
                title: 'Analyses',
                subtitle: 'KPI, ABC, RFM, anomalies',
                onTap: () => context.push('/manager/analytics'),
              ),
              SettingsTile(
                icon: Icons.psychology_outlined,
                title: 'Modèles prédictifs',
                subtitle: 'Prévisions, rupture, attrition',
                onTap: () => context.push('/manager/models'),
              ),
              SettingsTile(
                icon: Icons.monitor_heart_outlined,
                title: 'Monitoring système',
                onTap: () => context.push('/manager/monitoring'),
              ),
              SettingsTile(
                icon: Icons.account_balance_wallet_outlined,
                title: 'Profit & rentabilité',
                onTap: () => context.go('/manager/profit'),
                showDivider: false,
              ),
            ],
          ),
          SettingsSection(
            title: 'Politiques enseigne',
            children: [
              SettingsTile(
                icon: Icons.percent,
                title: 'TVA par défaut',
                subtitle: '${_taxRate.toStringAsFixed(2)} %',
                onTap: () async {
                  const options = [0.0, 5.5, 18.0, 19.25, 20.0];
                  final v = await _pick(options.map((o) => (o, '${o.toStringAsFixed(2)} %')).toList());
                  if (v != null) setState(() => _taxRate = v);
                },
              ),
              SettingsTile(
                icon: Icons.password_outlined,
                title: 'Longueur code d’accès',
                subtitle: '$_accessCodeLength caractères',
                onTap: () async {
                  final v = await _pick([6, 8, 10, 12].map((o) => (o, '$o caractères')).toList());
                  if (v != null) setState(() => _accessCodeLength = v);
                },
              ),
              SettingsTile(
                icon: Icons.schedule_outlined,
                title: 'Expiration QR',
                subtitle: '$_qrExpiryHours h',
                onTap: () async {
                  final v = await _pick([24, 48, 72, 96].map((o) => (o, '$o heures')).toList());
                  if (v != null) setState(() => _qrExpiryHours = v);
                },
              ),
              SettingsTile(
                icon: Icons.autorenew,
                title: 'Refresh modèles',
                subtitle: 'Toutes les $_modelRefreshHours h',
                onTap: () async {
                  final v = await _pick([3, 6, 12, 24].map((o) => (o, '$o heures')).toList());
                  if (v != null) setState(() => _modelRefreshHours = v);
                },
                showDivider: false,
              ),
            ],
          ),
          SettingsSection(
            title: 'Seuils d’alerte',
            children: [
              SettingsTile(
                icon: Icons.speed_outlined,
                title: 'Latence max',
                subtitle: '$_latencyThreshold ms',
                onTap: () async {
                  final v = await _pick([400, 800, 1200, 2000].map((o) => (o, '$o ms')).toList());
                  if (v != null) setState(() => _latencyThreshold = v);
                },
              ),
              SettingsTile(
                icon: Icons.error_outline,
                title: 'Erreurs / fenêtre',
                subtitle: '$_errorThreshold',
                onTap: () async {
                  final v = await _pick([3, 5, 10, 20].map((o) => (o, '$o erreurs')).toList());
                  if (v != null) setState(() => _errorThreshold = v);
                },
                showDivider: false,
              ),
            ],
          ),
          SwitchListTile(
            contentPadding: const EdgeInsets.symmetric(horizontal: 16),
            secondary: const Icon(Icons.how_to_reg_outlined),
            title: const Text('Auto-approuver les vendeurs', style: TextStyle(fontWeight: FontWeight.w700, fontSize: 14)),
            subtitle: const Text('Valide automatiquement les inscriptions boutique'),
            value: _autoApprove,
            onChanged: (v) => setState(() => _autoApprove = v),
          ),
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 8, 16, 16),
            child: FilledButton(
              onPressed: _save,
              style: FilledButton.styleFrom(backgroundColor: AppTheme.ink900, minimumSize: const Size.fromHeight(44)),
              child: const Text('Enregistrer les politiques'),
            ),
          ),
          ListTile(
            leading: const Icon(Icons.storefront_outlined),
            title: const Text('Espace client'),
            onTap: () async {
              await auth.logout();
              if (context.mounted) context.go('/client');
            },
          ),
          ListTile(
            leading: const Icon(Icons.logout),
            title: const Text('Se déconnecter'),
            onTap: () async {
              await auth.logout();
              if (context.mounted) context.go('/client');
            },
          ),
        ],
      ),
    );
  }

  Future<T?> _pick<T>(List<(T, String)> options) {
    return showModalBottomSheet<T>(
      context: context,
      builder: (ctx) => SafeArea(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            for (final o in options) ListTile(title: Text(o.$2), onTap: () => Navigator.pop(ctx, o.$1)),
          ],
        ),
      ),
    );
  }
}
