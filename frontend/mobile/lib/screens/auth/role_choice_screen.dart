import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../core/theme/app_theme.dart';

class RoleChoiceScreen extends StatelessWidget {
  const RoleChoiceScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const SizedBox(height: 24),
              const Text(
                'MyShop',
                style: TextStyle(fontSize: 32, fontWeight: FontWeight.w900, color: AppTheme.accent500),
              ),
              const SizedBox(height: 8),
              const Text(
                'Choisissez votre espace de connexion',
                style: TextStyle(fontSize: 16, color: AppTheme.ink700),
              ),
              const SizedBox(height: 32),
              _RoleCard(
                icon: Icons.shopping_bag_outlined,
                title: 'Client',
                subtitle: 'Explorer, acheter et recuperer vos codes QR',
                onTap: () => context.go('/auth/login?role=client'),
              ),
              const SizedBox(height: 12),
              _RoleCard(
                icon: Icons.point_of_sale_outlined,
                title: 'Vendeur',
                subtitle: 'Scanner les codes et encaisser les commandes',
                onTap: () => context.go('/auth/login?role=vendeur'),
              ),
              const SizedBox(height: 12),
              _RoleCard(
                icon: Icons.dashboard_outlined,
                title: 'Manager',
                subtitle: 'Piloter les boutiques et l\'equipe',
                onTap: () => context.go('/auth/login?role=manager'),
              ),
              const Spacer(),
              OutlinedButton(
                onPressed: () => context.go('/onboarding'),
                child: const Text('Continuer sans compte'),
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
    required this.onTap,
  });

  final IconData icon;
  final String title;
  final String subtitle;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Card(
      child: InkWell(
        borderRadius: BorderRadius.circular(16),
        onTap: onTap,
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Row(
            children: [
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: AppTheme.accent500.withValues(alpha: 0.12),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Icon(icon, color: AppTheme.accent500),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(title, style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 16)),
                    const SizedBox(height: 4),
                    Text(subtitle, style: const TextStyle(color: AppTheme.ink700, fontSize: 13)),
                  ],
                ),
              ),
              const Icon(Icons.chevron_right),
            ],
          ),
        ),
      ),
    );
  }
}
