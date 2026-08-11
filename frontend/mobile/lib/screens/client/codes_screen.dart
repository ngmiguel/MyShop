import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import 'package:qr_flutter/qr_flutter.dart';

import '../../core/theme/app_theme.dart';
import '../../core/utils/formatters.dart';
import '../../data/models/order.dart';
import '../../providers/auth_provider.dart';
import '../../providers/catalog_provider.dart';
import '../../providers/orders_provider.dart';
import '../../widgets/common_widgets.dart';

class MyCodesScreen extends StatefulWidget {
  const MyCodesScreen({super.key});

  @override
  State<MyCodesScreen> createState() => _MyCodesScreenState();
}

class _MyCodesScreenState extends State<MyCodesScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<OrdersProvider>().loadOrders(status: 'pending');
    });
  }

  @override
  Widget build(BuildContext context) {
    final orders = context.watch<OrdersProvider>();

    return Scaffold(
      appBar: AppBar(title: const Text('Mes codes')),
      body: orders.loading
          ? const LoadingView()
          : orders.pendingOrders.isEmpty
              ? const EmptyState(
                  icon: Icons.qr_code_2_outlined,
                  title: 'Aucun code en attente',
                  subtitle: 'Vos codes QR apparaitront ici apres un paiement.',
                )
              : RefreshIndicator(
                  onRefresh: () => orders.loadOrders(status: 'pending'),
                  child: ListView.separated(
                    padding: const EdgeInsets.all(16),
                    itemCount: orders.pendingOrders.length,
                    separatorBuilder: (_, __) => const SizedBox(height: 12),
                    itemBuilder: (context, index) {
                      final order = orders.pendingOrders[index];
                      return _OrderTile(order: order);
                    },
                  ),
                ),
    );
  }
}

class _OrderTile extends StatelessWidget {
  const _OrderTile({required this.order});

  final OrderModel order;

  @override
  Widget build(BuildContext context) {
    final store = context.watch<CatalogProvider>().storeById(order.storeId);

    return Card(
      child: ListTile(
        leading: const Icon(Icons.qr_code_2_outlined),
        title: Text(order.reference),
        subtitle: Text('${store?.name ?? 'Boutique'} - ${formatPrix(order.total)}'),
        trailing: const Icon(Icons.chevron_right),
        onTap: () => context.push('/client/codes/${order.id}'),
      ),
    );
  }
}

class CodeDetailScreen extends StatelessWidget {
  const CodeDetailScreen({super.key, required this.orderId});

  final String orderId;

  String _qrData(OrderModel order) {
    if (order.qrPayload != null && order.qrPayload!.isNotEmpty) {
      return order.qrPayload!;
    }
    return jsonEncode({
      'reference': order.reference,
      'storeId': order.storeId,
      'total': order.total,
    });
  }

  @override
  Widget build(BuildContext context) {
    final order = context.watch<OrdersProvider>().orderById(orderId);

    if (order == null) {
      return Scaffold(
        appBar: AppBar(),
        body: const EmptyState(icon: Icons.qr_code_2_outlined, title: 'Code introuvable'),
      );
    }

    final store = context.watch<CatalogProvider>().storeById(order.storeId);

    return Scaffold(
      appBar: AppBar(title: const Text('Code de paiement')),
      body: ListView(
        padding: const EdgeInsets.all(24),
        children: [
          Center(
            child: Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: Colors.grey.shade200),
              ),
              child: QrImageView(
                data: _qrData(order),
                version: QrVersions.auto,
                size: 220,
              ),
            ),
          ),
          const SizedBox(height: 16),
          Text(
            order.reference,
            textAlign: TextAlign.center,
            style: const TextStyle(fontSize: 20, fontWeight: FontWeight.w800, letterSpacing: 1.2),
          ),
          const SizedBox(height: 8),
          Text(
            formatPrix(order.total),
            textAlign: TextAlign.center,
            style: const TextStyle(fontSize: 28, fontWeight: FontWeight.w900, color: AppTheme.accent500),
          ),
          const SizedBox(height: 16),
          Card(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(store?.name ?? 'Boutique', style: const TextStyle(fontWeight: FontWeight.w800)),
                  const SizedBox(height: 8),
                  Text('Statut: ${statutCommande(order.status)}'),
                  Text('Mode: ${modeRetrait(order.fulfillmentMode)}'),
                  Text('Expire: ${formatDate(order.expiresAt)}'),
                  const Divider(),
                  ...order.items.map(
                    (item) => Padding(
                      padding: const EdgeInsets.symmetric(vertical: 4),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Expanded(child: Text('${item.quantity} x ${item.name}')),
                          Text(formatPrix(item.lineTotal)),
                        ],
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
          if (order.isPending) ...[
            const SizedBox(height: 16),
            OutlinedButton.icon(
              onPressed: () async {
                await context.read<OrdersProvider>().cancelOrder(order.id);
                if (context.mounted) context.pop();
              },
              icon: const Icon(Icons.cancel_outlined),
              label: const Text('Annuler la commande'),
            ),
          ],
        ],
      ),
    );
  }
}

class GainsScreen extends StatelessWidget {
  const GainsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Mes gains')),
      body: const EmptyState(
        icon: Icons.savings_outlined,
        title: 'Programme de fidelite',
        subtitle: 'Vos gains et avantages seront affiches ici prochainement.',
      ),
    );
  }
}

class ClientSettingsScreen extends StatelessWidget {
  const ClientSettingsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();

    return Scaffold(
      appBar: AppBar(title: const Text('Reglages')),
      body: ListView(
        children: [
          if (auth.user != null)
            ListTile(
              leading: CircleAvatar(child: Text(auth.user!.initials)),
              title: Text(auth.user!.displayName),
              subtitle: Text(auth.user!.email),
            ),
          ListTile(
            leading: const Icon(Icons.tune),
            title: const Text('Preferences d\'onboarding'),
            onTap: () => context.go('/onboarding'),
          ),
          ListTile(
            leading: const Icon(Icons.login_outlined),
            title: const Text('Se connecter'),
            onTap: () => context.go('/auth'),
          ),
          if (auth.isAuthenticated)
            ListTile(
              leading: const Icon(Icons.logout),
              title: const Text('Se deconnecter'),
              onTap: () async {
                await auth.logout();
                if (context.mounted) context.go('/client');
              },
            ),
        ],
      ),
    );
  }
}
