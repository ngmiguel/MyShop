import 'package:flutter/material.dart';

import '../core/theme/app_theme.dart';

enum StatTone { neutral, success, warning, danger, info }

class StatCard extends StatelessWidget {
  const StatCard({
    super.key,
    required this.label,
    required this.value,
    required this.icon,
    this.delta,
    this.tone = StatTone.neutral,
    this.onTap,
  });

  final String label;
  final String value;
  final IconData icon;
  final String? delta;
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
          padding: const EdgeInsets.fromLTRB(12, 12, 12, 12),
          child: LayoutBuilder(
            builder: (context, constraints) {
              final expand = constraints.maxHeight.isFinite;
              return Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisSize: expand ? MainAxisSize.max : MainAxisSize.min,
                children: [
                  Container(
                    width: 28,
                    height: 28,
                    decoration: BoxDecoration(color: _iconBg, borderRadius: BorderRadius.circular(8)),
                    child: Icon(icon, size: 14, color: _iconColor),
                  ),
                  if (expand) const Spacer() else const SizedBox(height: 10),
                  Text(
                    label,
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(fontSize: 11, color: AppTheme.ink500, height: 1.2),
                  ),
                  const SizedBox(height: 4),
                  FittedBox(
                    fit: BoxFit.scaleDown,
                    alignment: Alignment.centerLeft,
                    child: Text(
                      value,
                      maxLines: 1,
                      style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w800),
                    ),
                  ),
                  if (delta != null) ...[
                    const SizedBox(height: 2),
                    Text(
                      delta!,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: TextStyle(fontSize: 10, fontWeight: FontWeight.w600, color: _iconColor),
                    ),
                  ],
                ],
              );
            },
          ),
        ),
      ),
    );
  }
}
