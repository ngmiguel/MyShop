import 'package:flutter/material.dart';

import '../core/theme/app_theme.dart';

enum StatTone { neutral, success, warning, danger, info }

class StatCard extends StatelessWidget {
  const StatCard({
    super.key,
    required this.label,
    required this.value,
    required this.icon,
    this.tone = StatTone.neutral,
    this.onTap,
  });

  final String label;
  final String value;
  final IconData icon;
  final StatTone tone;
  final VoidCallback? onTap;

  Color get _iconBg {
    return switch (tone) {
      StatTone.success => const Color(0xFFECFDF5),
      StatTone.warning => const Color(0xFFFFFBEB),
      StatTone.danger => const Color(0xFFFEF2F2),
      StatTone.info => const Color(0xFFF0F9FF),
      StatTone.neutral => AppTheme.ink50,
    };
  }

  Color get _iconColor {
    return switch (tone) {
      StatTone.success => AppTheme.emerald600,
      StatTone.warning => const Color(0xFFD97706),
      StatTone.danger => const Color(0xFFDC2626),
      StatTone.info => const Color(0xFF0284C7),
      StatTone.neutral => AppTheme.ink500,
    };
  }

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Theme.of(context).cardColor,
      borderRadius: BorderRadius.circular(16),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(16),
        child: Container(
          decoration: AppTheme.cardDecoration(context),
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Container(
                width: 32,
                height: 32,
                decoration: BoxDecoration(color: _iconBg, borderRadius: BorderRadius.circular(10)),
                child: Icon(icon, size: 16, color: _iconColor),
              ),
              const Spacer(),
              Text(label, style: const TextStyle(fontSize: 12, color: AppTheme.ink500)),
              const SizedBox(height: 4),
              Text(value, style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w800)),
            ],
          ),
        ),
      ),
    );
  }
}
