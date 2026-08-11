import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:mobile_scanner/mobile_scanner.dart';
import 'package:provider/provider.dart';

import '../../core/theme/app_theme.dart';
import '../../core/utils/formatters.dart';
import '../../data/models/order.dart';
import '../../providers/auth_provider.dart';
import '../../providers/orders_provider.dart';
import '../../widgets/common_widgets.dart';

class VendeurHomeScreen extends StatefulWidget {
  const VendeurHomeScreen({super.key});

  @override
  State<VendeurHomeScreen> createState() => _VendeurHomeScreenState();
}

class _VendeurHomeScreenState extends State<VendeurHomeScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<OrdersProvider>().loadOrders(status: 'pending');
    });
  }

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();
    final orders = context.watch<OrdersProvider>();

    return Scaffold(
      appBar: AppBar(title: const Text('Accueil vendeur')),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          Card(
            color: AppTheme.ink900,
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Bonjour ${auth.user?.displayName ?? 'Vendeur'}',
                    style: const TextStyle(color: Colors.white, fontSize: 20, fontWeight: FontWeight.w800),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    '${orders.pendingCount} commande(s) en attente d\'encaissement',
                    style: const TextStyle(color: Colors.white70),
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 16),
          _StatTile(
            icon: Icons.qr_code_scanner_outlined,
            title: 'Scanner un code',
            subtitle: 'Valider un paiement client',
          ),
          _StatTile(
            icon: Icons.pending_actions_outlined,
            title: 'File d\'attente',
            subtitle: '${orders.pendingCount} code(s) a encaisser',
          ),
        ],
      ),
    );
  }
}

class _StatTile extends StatelessWidget {
  const _StatTile({required this.icon, required this.title, required this.subtitle});

  final IconData icon;
  final String title;
  final String subtitle;

  @override
  Widget build(BuildContext context) {
    return Card(
      child: ListTile(
        leading: Icon(icon),
        title: Text(title, style: const TextStyle(fontWeight: FontWeight.w700)),
        subtitle: Text(subtitle),
      ),
    );
  }
}

class VendeurScannerScreen extends StatefulWidget {
  const VendeurScannerScreen({super.key});

  @override
  State<VendeurScannerScreen> createState() => _VendeurScannerScreenState();
}

class _VendeurScannerScreenState extends State<VendeurScannerScreen> {
  final _codeController = TextEditingController();
  OrderModel? _success;
  String? _error;
  bool _scanning = false;

  @override
  void dispose() {
    _codeController.dispose();
    super.dispose();
  }

  Future<void> _validate(String raw) async {
    setState(() {
      _error = null;
      _success = null;
    });

    var reference = raw.trim().toUpperCase();
    try {
      final decoded = jsonDecode(raw);
      if (decoded is Map && decoded['reference'] != null) {
        reference = decoded['reference'].toString().toUpperCase();
      }
    } catch (_) {}

    final orders = context.read<OrdersProvider>();
    await orders.loadOrders(status: 'pending');
    OrderModel? match;
    for (final order in orders.pendingOrders) {
      if (order.reference.toUpperCase() == reference) {
        match = order;
        break;
      }
    }

    if (match == null) {
      setState(() => _error = 'Code introuvable, deja encaisse ou expire.');
      return;
    }

    final storeId = context.read<AuthProvider>().user?.storeId;
    if (storeId != null && match.storeId != storeId) {
      setState(() => _error = 'Ce code appartient a une autre boutique.');
      return;
    }

    final updated = await orders.redeemOrder(match.id);
    if (updated != null) {
      setState(() => _success = updated);
    } else {
      setState(() => _error = orders.error ?? 'Validation echouee.');
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_success != null) {
      final order = _success!;
      return Scaffold(
        backgroundColor: AppTheme.emerald600,
        body: SafeArea(
          child: Padding(
            padding: const EdgeInsets.all(24),
            child: Column(
              children: [
                const Spacer(),
                const Icon(Icons.check_circle_outline, color: Colors.white, size: 72),
                const SizedBox(height: 16),
                const Text(
                  'Paiement confirme',
                  style: TextStyle(color: Colors.white, fontSize: 24, fontWeight: FontWeight.w800),
                ),
                Text(
                  '${order.contactName ?? 'Client'} - ${order.contactPhone ?? ''}',
                  style: const TextStyle(color: Colors.white70),
                ),
                const SizedBox(height: 16),
                Text(
                  formatPrix(order.total),
                  style: const TextStyle(color: Colors.white, fontSize: 36, fontWeight: FontWeight.w900),
                ),
                const Spacer(),
                ElevatedButton(
                  onPressed: () => setState(() => _success = null),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: Colors.white,
                    foregroundColor: AppTheme.emerald600,
                  ),
                  child: const Text('Scanner un autre code'),
                ),
              ],
            ),
          ),
        ),
      );
    }

    return Scaffold(
      appBar: AppBar(title: const Text('Scanner')),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          if (_scanning)
            ClipRRect(
              borderRadius: BorderRadius.circular(16),
              child: SizedBox(
                height: 260,
                child: MobileScanner(
                  onDetect: (capture) {
                    final value = capture.barcodes.firstOrNull?.rawValue;
                    if (value != null) {
                      setState(() => _scanning = false);
                      _validate(value);
                    }
                  },
                ),
              ),
            )
          else
            OutlinedButton.icon(
              onPressed: () => setState(() => _scanning = true),
              icon: const Icon(Icons.qr_code_scanner_outlined),
              label: const Text('Activer la camera'),
            ),
          const SizedBox(height: 16),
          TextField(
            controller: _codeController,
            textCapitalization: TextCapitalization.characters,
            decoration: const InputDecoration(
              labelText: 'Saisir le code manuellement',
              hintText: 'PAY-XXXX-XXXX',
            ),
          ),
          if (_error != null) ...[
            const SizedBox(height: 12),
            Text(_error!, style: const TextStyle(color: Colors.red)),
          ],
          const SizedBox(height: 16),
          ElevatedButton.icon(
            onPressed: () => _validate(_codeController.text),
            icon: const Icon(Icons.verified_outlined),
            label: const Text('Valider le code'),
          ),
        ],
      ),
    );
  }
}

class VendeurQueueScreen extends StatefulWidget {
  const VendeurQueueScreen({super.key});

  @override
  State<VendeurQueueScreen> createState() => _VendeurQueueScreenState();
}

class _VendeurQueueScreenState extends State<VendeurQueueScreen> {
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
      appBar: AppBar(title: const Text('A encaisser')),
      body: orders.loading
          ? const LoadingView()
          : orders.pendingOrders.isEmpty
              ? const EmptyState(
                  icon: Icons.qr_code_outlined,
                  title: 'Aucun code en attente',
                )
              : ListView.separated(
                  padding: const EdgeInsets.all(16),
                  itemCount: orders.pendingOrders.length,
                  separatorBuilder: (_, __) => const SizedBox(height: 8),
                  itemBuilder: (context, index) {
                    final order = orders.pendingOrders[index];
                    return Card(
                      child: ListTile(
                        title: Text(order.reference),
                        subtitle: Text('${order.contactName ?? 'Client'} - ${formatPrix(order.total)}'),
                        trailing: IconButton(
                          icon: const Icon(Icons.check_circle_outline),
                          onPressed: () => context.read<OrdersProvider>().redeemOrder(order.id),
                        ),
                      ),
                    );
                  },
                ),
    );
  }
}

class VendeurProfitScreen extends StatelessWidget {
  const VendeurProfitScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Profit')),
      body: const EmptyState(
        icon: Icons.account_balance_wallet_outlined,
        title: 'Indicateurs de profit',
        subtitle: 'Les KPIs vendeur seront disponibles via l\'API performance.',
      ),
    );
  }
}

class VendeurSettingsScreen extends StatelessWidget {
  const VendeurSettingsScreen({super.key});

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
            leading: const Icon(Icons.logout),
            title: const Text('Se deconnecter'),
            onTap: () async {
              await auth.logout();
            },
          ),
        ],
      ),
    );
  }
}
