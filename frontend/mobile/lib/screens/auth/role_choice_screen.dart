import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

import '../../core/theme/app_theme.dart';
import '../../providers/auth_provider.dart';
import '../../widgets/google_sign_in_sheet.dart';

class RoleChoiceScreen extends StatelessWidget {
  const RoleChoiceScreen({super.key});

  Future<void> _goClient(BuildContext context) async {
    final auth = context.read<AuthProvider>();
    if (auth.role == 'vendeur' || auth.role == 'manager') {
      await auth.logout();
    }
    if (context.mounted) context.go('/client');
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.ink900,
      body: SafeArea(
        child: Column(
          children: [
            Expanded(
              child: SingleChildScrollView(
                padding: const EdgeInsets.fromLTRB(20, 20, 20, 16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Material(
                      color: AppTheme.ink800,
                      shape: const CircleBorder(),
                      child: InkWell(
                        customBorder: const CircleBorder(),
                        onTap: () => _goClient(context),
                        child: const Padding(
                          padding: EdgeInsets.all(10),
                          child: Icon(Icons.chevron_left, color: AppTheme.ink200, size: 20),
                        ),
                      ),
                    ),
                    const SizedBox(height: 28),
                    const Text(
                      'Choisissez votre\nespace de travail.',
                      style: TextStyle(
                        color: Colors.white,
                        fontSize: 26,
                        fontWeight: FontWeight.w800,
                        height: 1.15,
                        letterSpacing: -0.3,
                      ),
                    ),
                    const SizedBox(height: 8),
                    const Text(
                      'La navigation et l\'achat restent accessibles sans compte. Un compte est requis uniquement pour encaisser ou piloter des boutiques.',
                      style: TextStyle(color: AppTheme.ink300, height: 1.5, fontSize: 14),
                    ),
                    const SizedBox(height: 28),
                    _RoleCard(
                      iconWidget: const GoogleLogo(size: 22),
                      title: 'Client — compte Google',
                      subtitle:
                          'Synchronisez vos tickets de caisse, vos préférences, vos favoris et votre panier avec votre compte Gmail.',
                      badge: 'Aucun mot de passe à créer',
                      lightIcon: true,
                      onTap: () async {
                        final auth = context.read<AuthProvider>();
                        if (auth.role == 'vendeur' || auth.role == 'manager') {
                          await auth.logout();
                        }
                        if (context.mounted) context.go('/client/compte');
                      },
                    ),
                    const SizedBox(height: 12),
                    _RoleCard(
                      icon: Icons.qr_code_scanner_outlined,
                      title: 'Vendeur',
                      subtitle: 'Scanner les codes QR clients, suivre vos encaissements et vos évaluations.',
                      badge: 'Mot de passe boutique requis',
                      onTap: () => context.go('/auth/vendeur'),
                    ),
                    const SizedBox(height: 12),
                    _RoleCard(
                      icon: Icons.verified_user_outlined,
                      title: 'Manageur',
                      subtitle:
                          'Créer des boutiques, analyser le chiffre d\'affaires et superviser toute l\'application.',
                      badge: 'Accès administrateur',
                      onTap: () => context.go('/auth/manager'),
                    ),
                  ],
                ),
              ),
            ),
            Padding(
              padding: const EdgeInsets.fromLTRB(20, 0, 20, 24),
              child: OutlinedButton.icon(
                onPressed: () => _goClient(context),
                style: OutlinedButton.styleFrom(
                  foregroundColor: AppTheme.ink200,
                  side: const BorderSide(color: AppTheme.ink700),
                  minimumSize: const Size.fromHeight(48),
                ),
                icon: const Icon(Icons.storefront_outlined, size: 18),
                label: const Text('Continuer en tant que client'),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _RoleCard extends StatelessWidget {
  const _RoleCard({
    this.icon,
    this.iconWidget,
    required this.title,
    required this.subtitle,
    required this.badge,
    required this.onTap,
    this.lightIcon = false,
  });

  final IconData? icon;
  final Widget? iconWidget;
  final String title;
  final String subtitle;
  final String badge;
  final VoidCallback onTap;
  final bool lightIcon;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.white,
      borderRadius: BorderRadius.circular(16),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(16),
        child: Padding(
          padding: const EdgeInsets.all(14),
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Container(
                width: 44,
                height: 44,
                decoration: BoxDecoration(
                  color: lightIcon ? Colors.white : AppTheme.ink900,
                  borderRadius: BorderRadius.circular(12),
                  border: lightIcon ? Border.all(color: AppTheme.ink100) : null,
                ),
                child: Center(
                  child: iconWidget ??
                      Icon(icon, color: lightIcon ? AppTheme.ink900 : Colors.white, size: 22),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      title,
                      style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 15, color: AppTheme.ink900),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      subtitle,
                      style: const TextStyle(color: AppTheme.ink500, fontSize: 12.5, height: 1.4),
                    ),
                    const SizedBox(height: 8),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                      decoration: BoxDecoration(
                        color: AppTheme.sand100,
                        borderRadius: BorderRadius.circular(999),
                      ),
                      child: Text(
                        badge.toUpperCase(),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: const TextStyle(
                          fontSize: 10,
                          fontWeight: FontWeight.w800,
                          color: AppTheme.accent600,
                          letterSpacing: 0.4,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
