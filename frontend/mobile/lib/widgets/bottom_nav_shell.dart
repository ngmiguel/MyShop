import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

import '../core/theme/app_theme.dart';
import '../providers/cart_provider.dart';
import '../providers/orders_provider.dart';

class NavItem {
  const NavItem({
    required this.path,
    required this.label,
    required this.icon,
    this.badge,
  });

  final String path;
  final String label;
  final IconData icon;
  final int? badge;
}

List<NavItem> clientNavItems(BuildContext context) {
  final cartCount = context.watch<CartProvider>().itemCount;
  final pending = context.watch<OrdersProvider>().pendingCount;
  return [
    NavItem(path: '/client', label: 'Explorer', icon: Icons.home_outlined),
    NavItem(
      path: '/client/panier',
      label: 'Panier',
      icon: Icons.shopping_bag_outlined,
      badge: cartCount,
    ),
    NavItem(
      path: '/client/codes',
      label: 'Mes codes',
      icon: Icons.qr_code_2_outlined,
      badge: pending,
    ),
    NavItem(path: '/client/gains', label: 'Gains', icon: Icons.savings_outlined),
    NavItem(path: '/client/parametres', label: 'Reglages', icon: Icons.settings_outlined),
  ];
}

List<NavItem> vendeurNavItems(BuildContext context) {
  final pending = context.watch<OrdersProvider>().pendingCount;
  return [
    NavItem(path: '/vendeur', label: 'Accueil', icon: Icons.home_outlined),
    NavItem(path: '/vendeur/scanner', label: 'Scanner', icon: Icons.qr_code_scanner_outlined),
    NavItem(
      path: '/vendeur/file',
      label: 'A encaisser',
      icon: Icons.qr_code_outlined,
      badge: pending,
    ),
    NavItem(path: '/vendeur/profit', label: 'Profit', icon: Icons.account_balance_wallet_outlined),
    NavItem(path: '/vendeur/parametres', label: 'Reglages', icon: Icons.settings_outlined),
  ];
}

List<NavItem> managerNavItems() {
  return const [
    NavItem(path: '/manager', label: 'Pilotage', icon: Icons.bar_chart_outlined),
    NavItem(path: '/manager/boutiques', label: 'Boutiques', icon: Icons.store_outlined),
    NavItem(path: '/manager/profit', label: 'Profit', icon: Icons.account_balance_wallet_outlined),
    NavItem(path: '/manager/equipe', label: 'Equipe', icon: Icons.groups_outlined),
    NavItem(path: '/manager/parametres', label: 'Reglages', icon: Icons.settings_outlined),
  ];
}

class BottomNavShell extends StatelessWidget {
  const BottomNavShell({
    super.key,
    required this.items,
    required this.child,
    required this.currentPath,
  });

  final List<NavItem> items;
  final Widget child;
  final String currentPath;

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    return Scaffold(
      body: child,
      bottomNavigationBar: Container(
        decoration: BoxDecoration(
          color: isDark
              ? const Color(0xFF161B22).withValues(alpha: 0.95)
              : Colors.white.withValues(alpha: 0.95),
          border: Border(top: BorderSide(color: isDark ? AppTheme.ink700 : AppTheme.ink100)),
        ),
        child: SafeArea(
          top: false,
          child: Row(
            children: List.generate(items.length, (index) {
              final item = items[index];
              final active = _isActive(item.path);
              return Expanded(
                child: InkWell(
                  onTap: () {
                    if (item.path != currentPath) context.go(item.path);
                  },
                  child: Padding(
                    padding: const EdgeInsets.symmetric(vertical: 10),
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Stack(
                          clipBehavior: Clip.none,
                          children: [
                            Icon(
                              item.icon,
                              size: 20,
                              color: active
                                  ? (isDark ? Colors.white : AppTheme.ink900)
                                  : AppTheme.ink300,
                            ),
                            if ((item.badge ?? 0) > 0)
                              Positioned(
                                right: -8,
                                top: -6,
                                child: Container(
                                  constraints: const BoxConstraints(minWidth: 16, minHeight: 16),
                                  padding: const EdgeInsets.symmetric(horizontal: 4),
                                  decoration: BoxDecoration(
                                    color: AppTheme.accent500,
                                    borderRadius: BorderRadius.circular(999),
                                  ),
                                  alignment: Alignment.center,
                                  child: Text(
                                    (item.badge! > 9) ? '9+' : '${item.badge}',
                                    style: const TextStyle(
                                      color: Colors.white,
                                      fontSize: 9,
                                      fontWeight: FontWeight.w800,
                                    ),
                                  ),
                                ),
                              ),
                          ],
                        ),
                        const SizedBox(height: 4),
                        Text(
                          item.label,
                          style: TextStyle(
                            fontSize: 10,
                            fontWeight: FontWeight.w700,
                            color: active
                                ? (isDark ? Colors.white : AppTheme.ink900)
                                : AppTheme.ink300,
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              );
            }),
          ),
        ),
      ),
    );
  }

  bool _isActive(String path) {
    if (currentPath == path) return true;
    if (path != '/client' && path != '/vendeur' && path != '/manager') {
      return currentPath.startsWith(path);
    }
    return false;
  }
}
