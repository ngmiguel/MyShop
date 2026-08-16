import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

import '../../core/theme/app_theme.dart';
import '../../providers/auth_provider.dart';
import '../../providers/favorites_provider.dart';
import '../../providers/orders_provider.dart';
import '../../providers/preferences_provider.dart';
import '../../widgets/app_layout.dart';
import '../../widgets/google_sign_in_sheet.dart';
import '../../widgets/top_bar.dart';

class _SyncItem {
  const _SyncItem(this.label, this.detail);

  final String label;
  final String detail;
}

class _SyncGroup {
  const _SyncGroup({required this.title, this.description, required this.items});

  final String title;
  final String? description;
  final List<_SyncItem> items;
}

const _syncGroups = [
  _SyncGroup(
    title: 'Données d\'achat',
    description: 'Sauvegardées dans le dossier applicatif de votre Google Drive.',
    items: [
      _SyncItem('Tickets de caisse', 'Reçus des paiements confirmés, restaurés sur tout appareil'),
      _SyncItem('Codes QR actifs', 'Retrouvez un code en attente depuis un autre téléphone'),
      _SyncItem('Panier en cours', 'Reprendre un panier commencé ailleurs'),
      _SyncItem('Adresses de livraison', 'Carnet d\'adresses prérempli au paiement'),
      _SyncItem('Moyens de paiement', 'Jetons chiffrés, jamais les numéros complets'),
    ],
  ),
  _SyncGroup(
    title: 'Personnalisation',
    items: [
      _SyncItem('Préférences d\'affichage', 'Univers, rayons, budget, ville et rayon de recherche'),
      _SyncItem('Favoris', 'Articles enregistrés'),
      _SyncItem('Boutiques suivies', 'Alertes de nouveautés et de promotions'),
      _SyncItem('Historique de recherche', 'Améliore les suggestions du flux'),
      _SyncItem('Apparence', 'Thème clair, sombre ou système'),
      _SyncItem('Réglages de notification', 'Push, e-mail et SMS'),
    ],
  ),
  _SyncGroup(
    title: 'Services Google',
    items: [
      _SyncItem('Reçus par Gmail', 'Chaque paiement confirmé arrive dans votre boîte'),
      _SyncItem('Rappels dans Google Agenda', 'Créneau de retrait ou de livraison'),
      _SyncItem('Contacts Google', 'Préremplir nom et téléphone au paiement'),
    ],
  ),
];

class CompteScreen extends StatefulWidget {
  const CompteScreen({super.key});

  @override
  State<CompteScreen> createState() => _CompteScreenState();
}

class _CompteScreenState extends State<CompteScreen> {
  bool _autoSync = true;
  bool _wifiOnly = true;

  Future<void> _openGoogleSheet() async {
    await GoogleSignInSheet.show(context);
  }

  Future<void> _logout() async {
    await context.read<AuthProvider>().logout();
    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Compte Google déconnecté. Vos données locales restent disponibles.')),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();
    final favorites = context.watch<FavoritesProvider>();
    final orders = context.watch<OrdersProvider>();
    final prefs = context.watch<PreferencesProvider>().preferences;
    final tickets = orders.orders.where((o) => o.status == 'redeemed').length;
    final syncedCount = tickets + favorites.count + prefs.domains.length + prefs.subcategories.length;
    final storageKo = 12 + syncedCount * 3;

    if (!auth.isGoogleClient) {
      return Scaffold(
        backgroundColor: Colors.white,
        appBar: TopBar(
          title: 'Compte & synchronisation',
          fallbackRoute: '/client/parametres',
          onBack: () {
            if (context.canPop()) {
              context.pop();
            } else {
              context.go('/client/parametres');
            }
          },
        ),
        body: ListView(
          padding: const EdgeInsets.fromLTRB(20, 0, 20, 32),
          children: [
            Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                color: AppTheme.ink900,
                borderRadius: BorderRadius.circular(24),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Container(
                    width: 48,
                    height: 48,
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(16),
                    ),
                    alignment: Alignment.center,
                    child: const GoogleLogo(size: 24),
                  ),
                  const SizedBox(height: 16),
                  const Text(
                    'Gardez vos tickets\net vos préférences.',
                    style: TextStyle(
                      color: Colors.white,
                      fontSize: 22,
                      fontWeight: FontWeight.w800,
                      height: 1.15,
                      letterSpacing: -0.3,
                    ),
                  ),
                  const SizedBox(height: 8),
                  const Text(
                    'Connectez votre compte Gmail pour retrouver vos reçus, votre panier et votre flux personnalisé sur tous vos appareils — sans créer de mot de passe supplémentaire.',
                    style: TextStyle(color: AppTheme.ink300, fontSize: 13, height: 1.5),
                  ),
                  const SizedBox(height: 20),
                  SizedBox(
                    width: double.infinity,
                    child: FilledButton.icon(
                      onPressed: auth.loading ? null : _openGoogleSheet,
                      style: FilledButton.styleFrom(
                        backgroundColor: Colors.white,
                        foregroundColor: AppTheme.ink900,
                        minimumSize: const Size.fromHeight(48),
                      ),
                      icon: const GoogleLogo(size: 18),
                      label: const Text('Se connecter avec Google', style: TextStyle(fontWeight: FontWeight.w800)),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 24),
            const Text(
              'CE QUI EST SYNCHRONISÉ',
              style: TextStyle(
                fontSize: 11,
                fontWeight: FontWeight.w800,
                letterSpacing: 1.2,
                color: AppTheme.ink400,
              ),
            ),
            const SizedBox(height: 8),
            Container(
              decoration: AppTheme.cardDecoration(context),
              clipBehavior: Clip.antiAlias,
              child: Column(
                children: [
                  for (var i = 0; i < _syncGroups.expand((g) => g.items).length; i++) ...[
                    if (i > 0) const Divider(height: 1),
                    _SyncListTile(item: _syncGroups.expand((g) => g.items).elementAt(i)),
                  ],
                ],
              ),
            ),
            const SizedBox(height: 16),
            Container(
              padding: const EdgeInsets.all(14),
              decoration: BoxDecoration(
                color: AppTheme.sand100,
                borderRadius: BorderRadius.circular(16),
              ),
              child: const Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Icon(Icons.shield_outlined, size: 16, color: AppTheme.accent600),
                  SizedBox(width: 10),
                  Expanded(
                    child: Text(
                      'Autorisations demandées : profil, e-mail, Drive applicatif. Rien n\'est publié en votre nom et l\'accès est révocable en un geste.',
                      style: TextStyle(fontSize: 12, height: 1.5, color: AppTheme.ink600),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 16),
            OutlinedButton(
              onPressed: () => context.go('/client/parametres'),
              style: OutlinedButton.styleFrom(minimumSize: const Size.fromHeight(48)),
              child: const Text('Continuer sans compte'),
            ),
          ],
        ),
      );
    }

    final user = auth.user!;

    return Scaffold(
      backgroundColor: AppTheme.contentBackground(context),
      appBar: TopBar(
        title: 'Compte Google',
        subtitle: user.email,
        fallbackRoute: '/client/parametres',
        onBack: () {
          if (context.canPop()) {
            context.pop();
          } else {
            context.go('/client/parametres');
          }
        },
      ),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          Container(
            decoration: AppTheme.cardDecoration(context),
            padding: const EdgeInsets.all(16),
            child: Column(
              children: [
                Row(
                  children: [
                    CircleAvatar(
                      radius: 24,
                      backgroundColor: AppTheme.ink900,
                      child: Text(
                        user.initials,
                        style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w800, fontSize: 14),
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(user.displayName, style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 16)),
                          Text(user.email, style: const TextStyle(color: AppTheme.ink400, fontSize: 12)),
                        ],
                      ),
                    ),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                      decoration: BoxDecoration(
                        color: AppTheme.emerald600.withValues(alpha: 0.12),
                        borderRadius: BorderRadius.circular(999),
                      ),
                      child: const Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Icon(Icons.cloud_done_outlined, size: 11, color: AppTheme.emerald600),
                          SizedBox(width: 4),
                          Text(
                            'Synchronisé',
                            style: TextStyle(color: AppTheme.emerald600, fontSize: 11, fontWeight: FontWeight.w700),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
                const Divider(height: 24),
                Row(
                  children: [
                    _StatColumn(label: 'Tickets', value: '$tickets'),
                    _StatColumn(label: 'Favoris', value: '${favorites.count}'),
                    _StatColumn(label: 'Sur Drive', value: '$storageKo Ko'),
                  ],
                ),
                const SizedBox(height: 12),
                Row(
                  children: [
                    Expanded(
                      child: OutlinedButton.icon(
                        onPressed: () {
                          ScaffoldMessenger.of(context).showSnackBar(
                            SnackBar(content: Text('$syncedCount élément(s) synchronisé(s)')),
                          );
                        },
                        icon: const Icon(Icons.sync, size: 16),
                        label: const Text('Synchroniser'),
                      ),
                    ),
                    const SizedBox(width: 8),
                    Expanded(
                      child: OutlinedButton.icon(
                        onPressed: () => context.push('/client/tickets'),
                        icon: const Icon(Icons.receipt_long_outlined, size: 16),
                        label: const Text('Mes tickets'),
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
          SettingsSection(
            title: 'Synchronisation',
            children: [
              SwitchListTile(
                title: const Text('Synchronisation automatique', style: TextStyle(fontWeight: FontWeight.w700, fontSize: 14)),
                subtitle: const Text('Envoie les changements dès qu\'ils se produisent', style: TextStyle(fontSize: 12)),
                value: _autoSync,
                onChanged: (v) => setState(() => _autoSync = v),
              ),
              const Divider(height: 1, indent: 16),
              SwitchListTile(
                title: const Text('Wi-Fi uniquement', style: TextStyle(fontWeight: FontWeight.w700, fontSize: 14)),
                subtitle: const Text('Économise vos données mobiles', style: TextStyle(fontSize: 12)),
                value: _wifiOnly,
                onChanged: (v) => setState(() => _wifiOnly = v),
              ),
            ],
          ),
          for (final group in _syncGroups)
            SettingsSection(
              title: group.title,
              children: [
                for (var i = 0; i < group.items.length; i++) ...[
                  if (i > 0) const Divider(height: 1, indent: 16),
                  SwitchListTile(
                    title: Text(group.items[i].label, style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 14)),
                    subtitle: Text(group.items[i].detail, style: const TextStyle(fontSize: 12)),
                    value: true,
                    onChanged: (_) {},
                  ),
                ],
              ],
            ),
          SettingsSection(
            title: 'Appareils connectés',
            children: const [
              SettingsTile(
                icon: Icons.smartphone_outlined,
                title: 'iPhone 15 Pro',
                subtitle: 'Cet appareil',
                showDivider: true,
              ),
              SettingsTile(
                icon: Icons.laptop_outlined,
                title: 'Chrome — Windows',
                subtitle: 'Il y a 2 jours',
                showDivider: false,
              ),
            ],
          ),
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 24, 16, 0),
            child: OutlinedButton.icon(
              onPressed: _logout,
              style: OutlinedButton.styleFrom(
                foregroundColor: Colors.red,
                minimumSize: const Size.fromHeight(48),
              ),
              icon: const Icon(Icons.logout, size: 18),
              label: const Text('Révoquer l\'accès Google'),
            ),
          ),
        ],
      ),
    );
  }
}

class _SyncListTile extends StatelessWidget {
  const _SyncListTile({required this.item});

  final _SyncItem item;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.all(14),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Icon(Icons.check_circle_outline, size: 15, color: AppTheme.emerald600),
          const SizedBox(width: 10),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(item.label, style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 13)),
                const SizedBox(height: 2),
                Text(item.detail, style: const TextStyle(fontSize: 11, color: AppTheme.ink400, height: 1.4)),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _StatColumn extends StatelessWidget {
  const _StatColumn({required this.label, required this.value});

  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: Column(
        children: [
          Text(value, style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 16)),
          const SizedBox(height: 2),
          Text(
            label.toUpperCase(),
            style: const TextStyle(fontSize: 10, fontWeight: FontWeight.w700, letterSpacing: 0.4, color: AppTheme.ink400),
          ),
        ],
      ),
    );
  }
}
