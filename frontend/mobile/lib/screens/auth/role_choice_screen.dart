import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../core/theme/app_theme.dart';

class RoleChoiceScreen extends StatelessWidget {
  const RoleChoiceScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.ink900,
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.fromLTRB(20, 20, 20, 32),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Material(
                color: AppTheme.ink800,
                shape: const CircleBorder(),
                child: InkWell(
                  customBorder: const CircleBorder(),
                  onTap: () => context.go('/client'),
                  child: const Padding(
                    padding: EdgeInsets.all(10),
                    child: Icon(Icons.arrow_back, color: AppTheme.ink300, size: 20),
                  ),
                ),
              ),
              const SizedBox(height: 32),
              const Text(
                'Choisissez votre\nespace de travail.',
                style: TextStyle(
                  color: Colors.white,
                  fontSize: 26,
                  fontWeight: FontWeight.w800,
                  height: 1.15,
                ),
              ),
              const SizedBox(height: 8),
              const Text(
                'La navigation et l\'achat restent accessibles sans compte. Un compte est requis uniquement pour encaisser ou piloter des boutiques.',
                style: TextStyle(color: AppTheme.ink300, height: 1.5, fontSize: 14),
              ),
              const SizedBox(height: 32),
              _RoleCard(
                icon: Icons.mail_outline,
                title: 'Client — compte Google',
                subtitle: 'Synchronisez vos tickets, preferences, favoris et panier avec votre compte Gmail.',
                badge: 'Aucun mot de passe a creer',
                light: true,
                onTap: () => context.go('/auth/login?role=client'),
              ),
              const SizedBox(height: 12),
              _RoleCard(
                icon: Icons.qr_code_scanner_outlined,
                title: 'Vendeur',
                subtitle: 'Scanner les codes QR clients, suivre vos encaissements et vos evaluations.',
                badge: 'Mot de passe boutique requis',
                onTap: () => context.go('/auth/login?role=vendeur'),
              ),
              const SizedBox(height: 12),
              _RoleCard(
                icon: Icons.shield_outlined,
                title: 'Manager',
                subtitle: 'Creer des boutiques, analyser le chiffre d\'affaires et superviser l\'application.',
                badge: 'Acces administrateur',
                onTap: () => context.go('/auth/login?role=manager'),
              ),
              const Spacer(),
              OutlinedButton.icon(
                onPressed: () => context.go('/client'),
                style: OutlinedButton.styleFrom(
                  foregroundColor: AppTheme.ink200,
                  side: const BorderSide(color: AppTheme.ink700),
                  minimumSize: const Size.fromHeight(48),
                ),
                icon: const Icon(Icons.storefront_outlined, size: 18),
                label: const Text('Continuer en tant que client'),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _RoleCard extends StatelessWidget {
  const _RoleCard({
    required this.icon,
    required this.title,
    required this.subtitle,
    required this.badge,
    required this.onTap,
    this.light = false,
  });

  final IconData icon;
  final String title;
  final String subtitle;
  final String badge;
  final VoidCallback onTap;
  final bool light;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: light ? Colors.white : AppTheme.ink800,
      borderRadius: BorderRadius.circular(16),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(16),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: light ? AppTheme.sand100 : AppTheme.ink700,
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Icon(icon, color: light ? AppTheme.ink900 : Colors.white, size: 22),
              ),
              const SizedBox(width: 14),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      title,
                      style: TextStyle(
                        fontWeight: FontWeight.w800,
                        fontSize: 15,
                        color: light ? AppTheme.ink900 : Colors.white,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      subtitle,
                      style: TextStyle(
                        color: light ? AppTheme.ink500 : AppTheme.ink300,
                        fontSize: 13,
                        height: 1.4,
                      ),
                    ),
                    const SizedBox(height: 8),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                      decoration: BoxDecoration(
                        color: light ? AppTheme.accent500.withValues(alpha: 0.12) : AppTheme.ink700,
                        borderRadius: BorderRadius.circular(6),
                      ),
                      child: Text(
                        badge,
                        style: TextStyle(
                          fontSize: 10,
                          fontWeight: FontWeight.w700,
                          color: light ? AppTheme.accent600 : AppTheme.accent300,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
              Icon(Icons.chevron_right, color: light ? AppTheme.ink300 : AppTheme.ink400),
            ],
          ),
        ),
      ),
    );
  }
}
