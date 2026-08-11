import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

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
    return Scaffold(
      body: child,
      bottomNavigationBar: NavigationBar(
        selectedIndex: _selectedIndex(),
        onDestinationSelected: (index) {
          final target = items[index].path;
          if (target != currentPath) {
            context.go(target);
          }
        },
        destinations: items
            .map(
              (item) => NavigationDestination(
                icon: Badge(
                  isLabelVisible: (item.badge ?? 0) > 0,
                  label: Text('${item.badge ?? 0}'),
                  child: Icon(item.icon),
                ),
                label: item.label,
              ),
            )
            .toList(),
      ),
    );
  }

  int _selectedIndex() {
    var index = items.indexWhere((item) => currentPath == item.path);
    if (index >= 0) return index;
    index = items.indexWhere(
      (item) => currentPath.startsWith(item.path) && item.path != '/',
    );
    return index >= 0 ? index : 0;
  }
}
