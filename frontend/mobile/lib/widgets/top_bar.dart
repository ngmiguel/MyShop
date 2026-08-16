import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../core/theme/app_theme.dart';

class TopBar extends StatelessWidget implements PreferredSizeWidget {
  const TopBar({
    super.key,
    required this.title,
    this.subtitle,
    this.showBack = true,
    this.action,
    this.onBack,
    this.fallbackRoute = '/client',
  });

  final String title;
  final String? subtitle;
  final bool showBack;
  final Widget? action;
  final VoidCallback? onBack;
  /// Utilisé si la pile de navigation est vide (ex. arrivée via `go`).
  final String fallbackRoute;

  @override
  Size get preferredSize => Size.fromHeight(subtitle != null ? 72 : 56);

  void _handleBack(BuildContext context) {
    if (onBack != null) {
      onBack!();
      return;
    }
    if (context.canPop()) {
      context.pop();
      return;
    }
    context.go(fallbackRoute);
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    return Material(
      color: isDark ? const Color(0xFF161B22).withValues(alpha: 0.95) : Colors.white.withValues(alpha: 0.95),
      child: SafeArea(
        bottom: false,
        child: Padding(
          padding: const EdgeInsets.fromLTRB(8, 8, 16, 12),
          child: Row(
            children: [
              if (showBack)
                IconButton(
                  icon: const Icon(Icons.chevron_left, size: 28),
                  tooltip: 'Retour',
                  onPressed: () => _handleBack(context),
                )
              else
                const SizedBox(width: 8),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Text(title, style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w800)),
                    if (subtitle != null)
                      Text(subtitle!, style: const TextStyle(fontSize: 12, color: AppTheme.ink400)),
                  ],
                ),
              ),
              if (action != null) action!,
            ],
          ),
        ),
      ),
    );
  }
}
