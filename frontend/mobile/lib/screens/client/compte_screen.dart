import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

import '../../core/theme/app_theme.dart';
import '../../providers/auth_provider.dart';
import '../../providers/favorites_provider.dart';
import '../../providers/orders_provider.dart';
import '../../widgets/app_layout.dart';
import '../../widgets/stat_card.dart';
import '../../widgets/top_bar.dart';

class CompteScreen extends StatelessWidget {
  const CompteScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();
    final favorites = context.watch<FavoritesProvider>();
    final orders = context.watch<OrdersProvider>();
    final confirmed = orders.orders.where((o) => o.status == 'redeemed').length;

    return Scaffold(
      backgroundColor: AppTheme.contentBackground(context),
      appBar: const TopBar(title: 'Mon compte', subtitle: 'Synchronisation & profil'),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          if (auth.isAuthenticated && auth.user != null)
            Container(
              decoration: AppTheme.cardDecoration(context),
              padding: const EdgeInsets.all(16),
              child: Row(
                children: [
                  CircleAvatar(
                    radius: 28,
                    backgroundColor: AppTheme.ink900,
                    child: Text(auth.user!.initials, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w800)),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(auth.user!.displayName, style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 16)),
                        Text(auth.user!.email, style: const TextStyle(color: AppTheme.ink400, fontSize: 12)),
                        const SizedBox(height: 4),
                        const Row(
                          children: [
                            Icon(Icons.cloud_done_outlined, size: 14, color: AppTheme.emerald600),
                            SizedBox(width: 4),
                            Text('Compte synchronise', style: TextStyle(color: AppTheme.emerald600, fontSize: 11, fontWeight: FontWeight.w700)),
                          ],
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            )
          else
            Container(
              decoration: BoxDecoration(color: AppTheme.ink900, borderRadius: BorderRadius.circular(16)),
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Row(
                    children: [
                      Icon(Icons.mail_outline, color: Colors.white),
                      SizedBox(width: 8),
                      Text('Connecter Gmail', style: TextStyle(color: Colors.white, fontWeight: FontWeight.w800)),
                    ],
                  ),
                  const SizedBox(height: 8),
                  const Text(
                    'Synchronisez tickets, favoris, preferences et panier.',
                    style: TextStyle(color: AppTheme.ink300, fontSize: 13),
                  ),
                  const SizedBox(height: 12),
                  FilledButton(
                    onPressed: () => context.go('/auth/login?role=client'),
                    child: const Text('Se connecter'),
                  ),
                ],
              ),
            ),
          const SizedBox(height: 16),
          GridView.count(
            crossAxisCount: 2,
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            crossAxisSpacing: 12,
            mainAxisSpacing: 12,
            childAspectRatio: 1.4,
            children: [
              StatCard(label: 'Tickets', value: '$confirmed', icon: Icons.receipt_long_outlined, onTap: () => context.push('/client/tickets')),
              StatCard(label: 'Favoris', value: '${favorites.count}', icon: Icons.favorite_border, onTap: () => context.push('/client/favoris')),
            ],
          ),
          const SizedBox(height: 16),
          SettingsSection(
            title: 'Synchronisation',
            children: [
              SettingsTile(
                icon: Icons.sync_outlined,
                title: 'Synchroniser maintenant',
                subtitle: 'Preferences, favoris et historique',
                onTap: () {
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(content: Text('Synchronisation effectuee')),
                  );
                },
              ),
              SettingsTile(
                icon: Icons.devices_outlined,
                title: 'Appareils connectes',
                subtitle: '1 appareil actif',
                showDivider: false,
              ),
            ],
          ),
          if (auth.isAuthenticated)
            Padding(
              padding: const EdgeInsets.only(top: 16),
              child: OutlinedButton.icon(
                onPressed: () async {
                  await auth.logout();
                  if (context.mounted) context.go('/client');
                },
                icon: const Icon(Icons.logout),
                label: const Text('Se deconnecter'),
              ),
            ),
        ],
      ),
    );
  }
}
