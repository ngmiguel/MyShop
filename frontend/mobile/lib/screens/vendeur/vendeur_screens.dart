import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:go_router/go_router.dart';
import 'package:mobile_scanner/mobile_scanner.dart';
import 'package:provider/provider.dart';

import '../../core/theme/app_theme.dart';
import '../../core/utils/formatters.dart';
import '../../core/utils/qr_util.dart';
import '../../data/demo/demo_orders.dart';
import '../../data/models/order.dart';
import '../../providers/auth_provider.dart';
import '../../providers/orders_provider.dart';
import '../../providers/preferences_provider.dart';
import '../../widgets/common_widgets.dart';
import '../../widgets/stat_card.dart';

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
      context.read<OrdersProvider>().loadOrders();
    });
  }

  List<OrderModel> _storePending(OrdersProvider orders, String? storeId) {
    return orders.pendingOrders.where((o) => storeId == null || o.storeId == storeId).toList();
  }

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();
    final orders = context.watch<OrdersProvider>();
    final storeId = auth.user?.storeId;
    final pending = _storePending(orders, storeId);

    return Scaffold(
      backgroundColor: AppTheme.contentBackground(context),
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
                  const SizedBox(height: 4),
                  const Row(
                    children: [
                      Icon(Icons.waving_hand_outlined, color: AppTheme.accent300, size: 18),
                      SizedBox(width: 6),
                      Expanded(
                        child: Text(
                          'Prêt à encaisser vos clients',
                          style: TextStyle(color: AppTheme.accent300, fontWeight: FontWeight.w600),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 8),
                  Text(
                    '${pending.length} commande(s) en attente d\'encaissement',
                    style: const TextStyle(color: Colors.white70),
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 16),
          _NavTile(
            icon: Icons.qr_code_scanner_outlined,
            title: 'Scanner un code',
            subtitle: 'Valider un paiement client',
            onTap: () => context.go('/vendeur/scanner'),
          ),
          _NavTile(
            icon: Icons.pending_actions_outlined,
            title: 'File d\'attente',
            subtitle: '${pending.length} code(s) à encaisser',
            onTap: () => context.go('/vendeur/file'),
          ),
          _NavTile(
            icon: Icons.bar_chart_outlined,
            title: 'Ma performance',
            subtitle: 'Ventes, objectif et notes clients',
            onTap: () => context.push('/vendeur/performance'),
          ),
          _NavTile(
            icon: Icons.inventory_2_outlined,
            title: 'Stock & caisse',
            subtitle: 'Ruptures, écarts et clôture',
            onTap: () => context.push('/vendeur/stock'),
          ),
          const SizedBox(height: 12),
          Text(
            'Derniers codes en attente',
            style: Theme.of(context).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w800),
          ),
          const SizedBox(height: 8),
          if (pending.isEmpty)
            const EmptyState(
              icon: Icons.qr_code_outlined,
              title: 'Aucun code à encaisser',
              subtitle: 'Les codes générés par les clients de votre boutique apparaîtront ici.',
            )
          else
            ...pending.take(5).map(
              (order) => Card(
                child: ListTile(
                  leading: const Icon(Icons.qr_code_2),
                  title: Text(order.reference, style: const TextStyle(fontFamily: 'monospace', fontWeight: FontWeight.w700)),
                  subtitle: Text('${order.contactName ?? 'Client'} · ${formatPrix(order.total)}'),
                  trailing: IconButton(
                    icon: const Icon(Icons.check_circle_outline, color: AppTheme.emerald600),
                    onPressed: () => context.read<OrdersProvider>().redeemOrder(order.id),
                  ),
                ),
              ),
            ),
        ],
      ),
    );
  }
}

class _NavTile extends StatelessWidget {
  const _NavTile({
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
      child: ListTile(
        leading: Icon(icon),
        title: Text(title, style: const TextStyle(fontWeight: FontWeight.w700)),
        subtitle: Text(subtitle),
        trailing: const Icon(Icons.chevron_right),
        onTap: onTap,
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
  OrderModel? _pendingConfirm;
  String? _error;
  bool _scanning = false;
  bool _busy = false;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<OrdersProvider>().loadOrders();
    });
  }

  @override
  void dispose() {
    _codeController.dispose();
    super.dispose();
  }

  Future<void> _playFeedback() async {
    final prefs = context.read<PreferencesProvider>().preferences;
    if (prefs.scannerVibrate) {
      await HapticFeedback.mediumImpact();
    }
    if (prefs.scannerSound) {
      await SystemSound.play(SystemSoundType.click);
    }
  }

  OrderModel? _findMatch(String raw) {
    final reference = readPaymentReference(raw);
    if (reference == null || reference.isEmpty) return null;

    final storeId = context.read<AuthProvider>().user?.storeId;
    for (final order in context.read<OrdersProvider>().pendingOrders) {
      if (order.reference.toUpperCase() != reference) continue;
      if (storeId != null && order.storeId != storeId) return null;
      return order;
    }
    return null;
  }

  Future<void> _onDetected(String raw) async {
    if (_busy) return;
    setState(() {
      _error = null;
      _success = null;
      _pendingConfirm = null;
      _scanning = false;
    });

    if (context.read<OrdersProvider>().orders.isEmpty) {
      await context.read<OrdersProvider>().loadOrders();
    }
    if (!mounted) return;

    final match = _findMatch(raw);
    if (match == null) {
      setState(() => _error = 'Code introuvable, déjà encaissé ou expiré.');
      return;
    }

    await _playFeedback();
    if (!mounted) return;

    final auto = context.read<PreferencesProvider>().preferences.scannerAutoConfirm;
    if (auto) {
      await _redeem(match, auto: true);
    } else {
      setState(() => _pendingConfirm = match);
    }
  }

  Future<void> _validate(String raw) async {
    if (_busy) return;
    setState(() {
      _error = null;
      _success = null;
      _pendingConfirm = null;
    });

    final reference = readPaymentReference(raw);
    if (reference == null || reference.isEmpty) {
      setState(() => _error = 'Code invalide.');
      return;
    }

    if (context.read<OrdersProvider>().orders.isEmpty) {
      await context.read<OrdersProvider>().loadOrders();
    }
    if (!mounted) return;

    final match = _findMatch(raw);
    if (match == null) {
      setState(() => _error = 'Code introuvable, déjà encaissé ou expiré.');
      return;
    }

    await _redeem(match);
  }

  Future<void> _redeem(OrderModel match, {bool auto = false}) async {
    setState(() => _busy = true);
    final orders = context.read<OrdersProvider>();
    final updated = await orders.redeemOrder(match.id);
    if (!mounted) return;
    setState(() => _busy = false);

    if (updated != null) {
      await _playFeedback();
      if (!mounted) return;
      setState(() {
        _success = updated;
        _pendingConfirm = null;
      });
      if (auto) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Retrait confirmé automatiquement · ${updated.reference}')),
        );
      }
    } else {
      setState(() {
        _error = orders.error ?? 'Validation échouée.';
        _pendingConfirm = null;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final storeId = context.watch<AuthProvider>().user?.storeId;
    final pending = context
        .watch<OrdersProvider>()
        .pendingOrders
        .where((o) => storeId == null || o.storeId == storeId)
        .toList();

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
                  'Paiement confirmé',
                  style: TextStyle(color: Colors.white, fontSize: 24, fontWeight: FontWeight.w800),
                ),
                Text(
                  '${order.contactName ?? 'Client'} — ${order.contactPhone ?? ''}',
                  style: const TextStyle(color: Colors.white70),
                ),
                const SizedBox(height: 8),
                Text(
                  order.reference,
                  style: const TextStyle(color: Colors.white70, fontFamily: 'monospace'),
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
                    minimumSize: const Size.fromHeight(48),
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
      backgroundColor: AppTheme.contentBackground(context),
      appBar: AppBar(title: const Text('Scanner')),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: AppTheme.sand100,
              borderRadius: BorderRadius.circular(12),
            ),
            child: const Text(
              'Alignez le code QR du client dans le cadre. Détection automatique.',
              style: TextStyle(fontSize: 13, color: AppTheme.ink600),
            ),
          ),
          const SizedBox(height: 12),
          if (_scanning)
            ClipRRect(
              borderRadius: BorderRadius.circular(16),
              child: SizedBox(
                height: 260,
                child: MobileScanner(
                  onDetect: (capture) {
                    final value = capture.barcodes.firstOrNull?.rawValue;
                    if (value != null) _onDetected(value);
                  },
                ),
              ),
            )
          else
            OutlinedButton.icon(
              onPressed: () => setState(() => _scanning = true),
              icon: const Icon(Icons.qr_code_scanner_outlined),
              label: const Text('Activer la caméra'),
            ),
          if (_pendingConfirm != null) ...[
            const SizedBox(height: 16),
            Card(
              color: AppTheme.emerald600.withValues(alpha: 0.08),
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text('Code détecté — confirmez le retrait', style: TextStyle(fontWeight: FontWeight.w800)),
                    const SizedBox(height: 8),
                    Text(_pendingConfirm!.reference, style: const TextStyle(fontFamily: 'monospace')),
                    Text(
                      '${_pendingConfirm!.contactName ?? 'Client'} · ${formatPrix(_pendingConfirm!.total)}',
                      style: const TextStyle(color: AppTheme.ink600),
                    ),
                    const SizedBox(height: 12),
                    Row(
                      children: [
                        Expanded(
                          child: OutlinedButton(
                            onPressed: () => setState(() => _pendingConfirm = null),
                            child: const Text('Annuler'),
                          ),
                        ),
                        const SizedBox(width: 8),
                        Expanded(
                          child: FilledButton(
                            onPressed: _busy ? null : () => _redeem(_pendingConfirm!),
                            child: const Text('Confirmer'),
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ),
          ],
          const SizedBox(height: 16),
          TextField(
            controller: _codeController,
            textCapitalization: TextCapitalization.characters,
            decoration: const InputDecoration(
              labelText: 'Saisie manuelle du code',
              hintText: 'PAY-XXXX-XXXX',
              helperText: 'Si la caméra ne parvient pas à lire le code',
            ),
          ),
          if (_error != null) ...[
            const SizedBox(height: 12),
            Text(_error!, style: const TextStyle(color: Colors.red)),
          ],
          const SizedBox(height: 16),
          ElevatedButton.icon(
            onPressed: _busy ? null : () => _validate(_codeController.text),
            icon: const Icon(Icons.verified_outlined),
            label: const Text('Valider le code'),
          ),
          const SizedBox(height: 24),
          Text(
            'À encaisser rapidement (${pending.length})',
            style: const TextStyle(fontWeight: FontWeight.w800),
          ),
          const SizedBox(height: 8),
          if (pending.isEmpty)
            const Text(
              'Aucun code à encaisser. Ils apparaîtront dès qu’un client validera son panier.',
              style: TextStyle(color: AppTheme.ink400, fontSize: 13),
            )
          else
            ...pending.map(
              (order) => Card(
                child: ListTile(
                  title: Text(formatPrix(order.total), style: const TextStyle(fontWeight: FontWeight.w800)),
                  subtitle: Text(
                    '${order.contactName ?? 'Client'}\n${order.reference}',
                    style: const TextStyle(fontFamily: 'monospace', fontSize: 11),
                  ),
                  isThreeLine: true,
                  trailing: FilledButton(
                    onPressed: _busy ? null : () => _validate(order.reference),
                    child: const Text('OK'),
                  ),
                ),
              ),
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
  String _tab = 'pending';

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<OrdersProvider>().loadOrders();
    });
  }

  @override
  Widget build(BuildContext context) {
    final storeId = context.watch<AuthProvider>().user?.storeId;
    final orders = context.watch<OrdersProvider>();
    final mine = orders.orders.where((o) => storeId == null || o.storeId == storeId).toList();
    final list = mine.where((o) {
      if (_tab == 'pending') return o.status == 'pending';
      return o.status == 'redeemed' || o.status == 'confirmed';
    }).toList();
    final potential = list.fold<double>(0, (s, o) => s + o.total);

    return Scaffold(
      backgroundColor: AppTheme.contentBackground(context),
      appBar: AppBar(title: const Text('À encaisser')),
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 12, 16, 0),
            child: Row(
              children: [
                ChoiceChip(
                  label: const Text('Attente'),
                  selected: _tab == 'pending',
                  onSelected: (_) => setState(() => _tab = 'pending'),
                ),
                const SizedBox(width: 8),
                ChoiceChip(
                  label: const Text('Confirmés'),
                  selected: _tab == 'done',
                  onSelected: (_) => setState(() => _tab = 'done'),
                ),
              ],
            ),
          ),
          Padding(
            padding: const EdgeInsets.all(16),
            child: Text(
              '${list.length} code(s) · ${_tab == 'pending' ? 'montant potentiel' : 'montant'} ${formatPrix(potential)}',
              style: const TextStyle(fontSize: 13, color: AppTheme.ink500, fontWeight: FontWeight.w600),
            ),
          ),
          Expanded(
            child: orders.loading
                ? const LoadingView()
                : list.isEmpty
                    ? const EmptyState(
                        icon: Icons.qr_code_outlined,
                        title: 'Aucun code en attente',
                        subtitle:
                            'Cette file se met à jour dès qu’un client de votre boutique génère un code.',
                      )
                    : ListView.separated(
                        padding: const EdgeInsets.fromLTRB(16, 0, 16, 16),
                        itemCount: list.length,
                        separatorBuilder: (_, __) => const SizedBox(height: 8),
                        itemBuilder: (context, index) {
                          final order = list[index];
                          return Card(
                            child: ListTile(
                              title: Text(formatPrix(order.total), style: const TextStyle(fontWeight: FontWeight.w800)),
                              subtitle: Text(
                                '${order.contactName ?? 'Client'}\n${order.reference}',
                                style: const TextStyle(fontFamily: 'monospace', fontSize: 11),
                              ),
                              isThreeLine: true,
                              trailing: order.status == 'pending'
                                  ? IconButton(
                                      icon: const Icon(Icons.check_circle_outline, color: AppTheme.emerald600),
                                      onPressed: () => context.read<OrdersProvider>().redeemOrder(order.id),
                                    )
                                  : const Icon(Icons.verified, color: AppTheme.emerald600),
                            ),
                          );
                        },
                      ),
          ),
        ],
      ),
    );
  }
}

class VendeurProfitScreen extends StatelessWidget {
  const VendeurProfitScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final storeId = context.watch<AuthProvider>().user?.storeId;
    final orders = context.watch<OrdersProvider>();
    final confirmed = orders.orders
        .where((o) =>
            (storeId == null || o.storeId == storeId) &&
            (o.status == 'redeemed' || o.status == 'confirmed'))
        .toList();
    final ca = confirmed.fold<double>(0, (s, o) => s + o.total);
    final last = demoMonthlyRevenue.last;
    final monthCa = (last['ca'] as double?) ?? ca;
    final monthCosts = (last['couts'] as double?) ?? monthCa * 0.65;
    final margin = monthCa - monthCosts;

    return Scaffold(
      backgroundColor: AppTheme.contentBackground(context),
      appBar: AppBar(title: const Text('Profit')),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          Row(
            children: [
              Expanded(child: StatCard(label: 'CA du mois', value: formatPrix(monthCa), icon: Icons.trending_up)),
              const SizedBox(width: 8),
              Expanded(child: StatCard(label: 'Marge', value: formatPrix(margin), icon: Icons.savings_outlined)),
            ],
          ),
          const SizedBox(height: 8),
          Row(
            children: [
              Expanded(
                child: StatCard(
                  label: 'Scans confirmés',
                  value: '${confirmed.length}',
                  icon: Icons.qr_code_scanner_outlined,
                ),
              ),
              const SizedBox(width: 8),
              Expanded(
                child: StatCard(
                  label: 'Commandes (série)',
                  value: '${last['commandes']}',
                  icon: Icons.receipt_long_outlined,
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          Text('Évolution mensuelle', style: Theme.of(context).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w800)),
          const SizedBox(height: 8),
          ...demoMonthlyRevenue.map((row) {
            final mCa = row['ca'] as double;
            final mCosts = row['couts'] as double;
            return Card(
              child: ListTile(
                title: Text('${row['mois']}', style: const TextStyle(fontWeight: FontWeight.w700)),
                subtitle: Text('${row['commandes']} commandes · coûts ${formatPrix(mCosts)}'),
                trailing: Text(formatPrix(mCa), style: const TextStyle(fontWeight: FontWeight.w800)),
              ),
            );
          }),
        ],
      ),
    );
  }
}

class VendeurSettingsScreen extends StatelessWidget {
  const VendeurSettingsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();
    final prefsProvider = context.watch<PreferencesProvider>();
    final prefs = prefsProvider.preferences;

    return Scaffold(
      appBar: AppBar(title: const Text('Réglages')),
      body: ListView(
        children: [
          if (auth.user != null)
            ListTile(
              leading: CircleAvatar(child: Text(auth.user!.initials)),
              title: Text(auth.user!.displayName),
              subtitle: Text(auth.user!.email),
            ),
          const Padding(
            padding: EdgeInsets.fromLTRB(16, 16, 16, 4),
            child: Text('Scanner', style: TextStyle(fontWeight: FontWeight.w800, fontSize: 13)),
          ),
          SwitchListTile(
            secondary: const Icon(Icons.volume_up_outlined),
            title: const Text('Son à la détection'),
            value: prefs.scannerSound,
            onChanged: (v) => prefsProvider.update(prefs.copyWith(scannerSound: v)),
          ),
          SwitchListTile(
            secondary: const Icon(Icons.vibration),
            title: const Text('Vibration'),
            value: prefs.scannerVibrate,
            onChanged: (v) => prefsProvider.update(prefs.copyWith(scannerVibrate: v)),
          ),
          SwitchListTile(
            secondary: const Icon(Icons.flash_on_outlined),
            title: const Text('Confirmation automatique'),
            subtitle: const Text('Encaisser dès qu’un code valide est détecté'),
            value: prefs.scannerAutoConfirm,
            onChanged: (v) => prefsProvider.update(prefs.copyWith(scannerAutoConfirm: v)),
          ),
          const Divider(),
          ListTile(
            leading: const Icon(Icons.bar_chart_outlined),
            title: const Text('Ma performance'),
            subtitle: const Text('KPIs, classement et avis'),
            onTap: () => context.push('/vendeur/performance'),
          ),
          ListTile(
            leading: const Icon(Icons.inventory_2_outlined),
            title: const Text('Stock & caisse'),
            subtitle: const Text('Inventaire et clôture du service'),
            onTap: () => context.push('/vendeur/stock'),
          ),
          ListTile(
            leading: const Icon(Icons.storefront_outlined),
            title: const Text('Espace client'),
            subtitle: const Text('Explorer le catalogue et commander'),
            onTap: () async {
              await auth.logout();
              if (context.mounted) context.go('/client');
            },
          ),
          ListTile(
            leading: const Icon(Icons.logout),
            title: const Text('Se déconnecter'),
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
